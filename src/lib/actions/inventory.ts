"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ensurePermission } from "@/lib/permissions";

const PurchaseItemSchema = z.object({
    partId: z.string(),
    quantity: z.coerce.number().min(0.001, "Quantity must be greater than 0"),
    costPerUnit: z.coerce.number().min(0),
});

const PurchaseSchema = z.object({
    items: z.array(PurchaseItemSchema).min(1, "At least one item is required"),
    date: z.coerce.date().default(new Date()),
    vendor: z.string().optional(),
    image: z.string().optional(),
});

export async function createPartPurchase(data: z.infer<typeof PurchaseSchema>) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");

    await ensurePermission("EDIT", "PART");

    const totalCost = data.items.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);

    const result = await prisma.$transaction(async (tx) => {
        const purchase = await tx.partPurchase.create({
            data: {
                date: data.date,
                userId: userId,
                vendor: data.vendor,
                totalCost,
                items: {
                    create: data.items.map(item => ({
                        partId: item.partId,
                        quantity: item.quantity,
                        costPerUnit: item.costPerUnit,
                    }))
                }
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

        // Update quantities on hand for all parts
        for (const item of data.items) {
            await tx.part.update({
                where: { id: item.partId },
                data: {
                    quantityOnHand: {
                        increment: item.quantity,
                    },
                },
            });
        }

        return purchase;
    });

    revalidatePath("/dashboard/parts");
    return result;
}

export async function getPartPurchases(partId: string) {
    const session = await auth();
    if (!session?.user?.id) return [];

    // Return line items for this specific part
    return await prisma.partPurchaseItem.findMany({
        where: { partId },
        include: {
            partPurchase: {
                include: {
                    attachments: true,
                    user: {
                        select: { name: true }
                    }
                }
            },
        },
        orderBy: {
            partPurchase: {
                date: "desc",
            }
        },
    });
}

export async function adjustInventory(partId: string, newQuantity: number) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

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
