"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { refreshPredictions } from "./schedules";
import { ensurePermission } from "@/lib/permissions";

const ServiceRecordSchema = z.object({
    assetId: z.string(),
    date: z.date(),
    usageAtService: z.number(),
    summary: z.string().min(2),
    notes: z.string().optional(),
    totalCost: z.number(),
    vendor: z.string().optional(),
    image: z.string().optional(),
    parts: z.array(z.object({
        partId: z.string(),
        quantity: z.number(),
        costPerUnit: z.number(),
    })),
});

export async function createServiceRecord(data: z.infer<typeof ServiceRecordSchema>) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await ensurePermission("CREATE", "SERVICE");

    const result = await prisma.$transaction(async (tx) => {
        const serviceRecord = await tx.serviceRecord.create({
            data: {
                assetId: data.assetId,
                date: data.date,
                usageAtService: data.usageAtService,
                summary: data.summary,
                notes: data.notes,
                totalCost: data.totalCost,
                vendor: data.vendor,
                parts: {
                    create: data.parts.map(p => ({
                        partId: p.partId,
                        quantity: p.quantity,
                        costPerUnit: p.costPerUnit,
                    })),
                },
            },
        });

        if (data.image) {
            await tx.attachment.create({
                data: {
                    url: data.image,
                    fileType: "IMAGE",
                    serviceRecordId: serviceRecord.id,
                },
            });
        }

        // Update asset current usage
        await tx.asset.update({
            where: { id: data.assetId },
            data: { currentUsage: data.usageAtService },
        });

        // Deduct from inventory
        for (const p of data.parts) {
            await tx.part.update({
                where: { id: p.partId },
                data: {
                    quantityOnHand: {
                        decrement: p.quantity,
                    },
                },
            });
        }

        return serviceRecord;
    });

    revalidatePath(`/dashboard/asset/${data.assetId}`);

    // Update maintenance predictions
    await refreshPredictions(data.assetId);

    return result;
}

export async function getServiceRecords(assetId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    return await prisma.serviceRecord.findMany({
        where: { assetId },
        include: {
            parts: {
                include: {
                    part: true,
                },
            },
            attachments: true,
        },
        orderBy: {
            date: "desc",
        },
    });
}

export async function getServiceRecord(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    return await prisma.serviceRecord.findUnique({
        where: { id },
        include: {
            asset: true,
            parts: {
                include: {
                    part: true,
                },
            },
            attachments: true,
        },
    });
}

