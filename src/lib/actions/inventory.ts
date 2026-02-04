"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ensurePermission } from "@/lib/permissions";

const PurchaseSchema = z.object({
    partId: z.string(),
    quantity: z.coerce.number().min(0.001, "Quantity must be greater than 0"),
    costPerUnit: z.coerce.number().min(0),
    date: z.date().default(new Date()),
    image: z.string().optional(),
});

export async function createPartPurchase(data: z.infer<typeof PurchaseSchema>) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await ensurePermission("EDIT", "PART"); // Or separate INVENTORY permission if added

    const result = await prisma.$transaction(async (tx) => {
        const purchase = await tx.partPurchase.create({
            data: {
                partId: data.partId,
                quantity: data.quantity,
                costPerUnit: data.costPerUnit,
                date: data.date,
                userId: session.user.id,
            },
        });

        if (data.image) {
            await tx.attachment.create({
                data: {
                    url: data.image,
                    fileType: "RECEIPT",
                    partPurchaseId: purchase.id,
                },
            });
        }

        // Add to inventory
        await tx.part.update({
            where: { id: data.partId },
            data: {
                quantityOnHand: {
                    increment: data.quantity,
                },
            },
        });

        return purchase;
    });

    revalidatePath("/dashboard/parts");
    return result;
}

export async function getPartPurchases(partId: string) {
    const session = await auth();
    if (!session?.user?.id) return [];

    return await prisma.partPurchase.findMany({
        where: { partId },
        include: {
            attachments: true,
        },
        orderBy: {
            date: "desc",
        },
    });
}

export async function adjustInventory(partId: string, newQuantity: number) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Only Admins or higher for manual adjustment usually
    await ensurePermission("EDIT", "PART");

    const part = await prisma.part.update({
        where: { id: partId },
        data: {
            quantityOnHand: newQuantity,
        },
    });

    revalidatePath("/dashboard/parts");
    return part;
}
