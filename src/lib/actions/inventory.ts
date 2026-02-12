"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ensurePermission, checkPermission } from "@/lib/permissions";

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

    // Ownership check for all parts in the purchase
    for (const item of data.items) {
        const p = await prisma.part.findUnique({ where: { id: item.partId } });
        if (!p) throw new Error(`Part ${item.partId} not found`);

        const isAdmin = (session.user as any).role === "ADMIN";
        const isOwner = p.userId === userId;
        const hasPermission = await checkPermission("EDIT", "PART");

        if (!isAdmin && !isOwner && !hasPermission) {
            throw new Error(`Unauthorized to add purchase for part: ${p.name}`);
        }
    }

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
                        select: { name: true, email: true }
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

/**
 * System-wide retrieval for Admin management
 */
export async function getAllPurchasesSystem() {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    return await prisma.partPurchase.findMany({
        include: {
            user: {
                select: { name: true, email: true }
            },
            items: {
                include: {
                    part: {
                        select: { name: true, partNumber: true }
                    }
                }
            },
            attachments: true,
        },
        orderBy: {
            date: "desc",
        },
    });
}

export async function deletePartPurchase(id: string) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const purchase = await prisma.partPurchase.findUnique({
        where: { id },
        include: { items: true },
    });

    if (!purchase) throw new Error("Purchase not found");

    await prisma.$transaction(async (tx) => {
        // Roll back inventory quantities
        for (const item of purchase.items) {
            await tx.part.update({
                where: { id: item.partId },
                data: {
                    quantityOnHand: {
                        decrement: item.quantity,
                    },
                },
            });
        }

        // Delete the purchase (cascades to items and attachments)
        await tx.partPurchase.delete({
            where: { id },
        });
    });

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/parts");
}

export async function updatePartPurchase(id: string, data: { date: Date, vendor?: string }) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const updated = await prisma.partPurchase.update({
        where: { id },
        data: {
            date: data.date,
            vendor: data.vendor,
        },
    });

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/parts");
    return updated;
}

export async function adjustInventory(partId: string, newQuantity: number) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const existing = await prisma.part.findUnique({ where: { id: partId } });
    if (!existing) throw new Error("Part not found");

    const isAdmin = (session.user as any).role === "ADMIN";
    const isOwner = existing.userId === session.user.id;
    const hasPermission = await checkPermission("EDIT", "PART");

    if (!isAdmin && !isOwner && !hasPermission) {
        throw new Error("Unauthorized to adjust inventory for this part");
    }

    const part = await prisma.part.update({
        where: { id: partId },
        data: {
            quantityOnHand: newQuantity,
        },
    });

    revalidatePath("/dashboard/parts");
    return part;
}
