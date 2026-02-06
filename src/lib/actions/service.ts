"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { refreshPredictions } from "./schedules";
import { ensurePermission, checkPermission } from "@/lib/permissions";

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

export async function getAllServiceRecordsSystem() {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    return await prisma.serviceRecord.findMany({
        include: {
            asset: {
                select: {
                    name: true,
                    owner: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                },
            },
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

export async function updateServiceRecord(id: string, data: z.infer<typeof ServiceRecordSchema>) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const existing = await prisma.serviceRecord.findUnique({
        where: { id },
        include: { asset: true, parts: true },
    });

    if (!existing) throw new Error("Record not found");

    const isAdmin = (session.user as any).role === "ADMIN";
    const isOwner = existing.asset.userId === session.user.id;
    const hasPermission = await checkPermission("EDIT", "SERVICE");

    if (!isAdmin && !isOwner && !hasPermission) {
        throw new Error("Unauthorized to update this record");
    }

    const { image, parts, ...serviceData } = data;

    const result = await prisma.$transaction(async (tx) => {
        // 1. Revert current inventory changes
        for (const p of existing.parts) {
            await tx.part.update({
                where: { id: p.partId },
                data: {
                    quantityOnHand: {
                        increment: p.quantity,
                    },
                },
            });
        }

        // 2. Clear old parts links
        await tx.servicePart.deleteMany({
            where: { serviceRecordId: id },
        });

        // 3. Update service record data
        const updated = await tx.serviceRecord.update({
            where: { id },
            data: {
                ...serviceData,
                date: new Date(serviceData.date),
                parts: {
                    create: parts.map(p => ({
                        partId: p.partId,
                        quantity: p.quantity,
                        costPerUnit: p.costPerUnit,
                    })),
                },
            },
        });

        // 4. Apply new inventory changes
        for (const p of parts) {
            await tx.part.update({
                where: { id: p.partId },
                data: {
                    quantityOnHand: {
                        decrement: p.quantity,
                    },
                },
            });
        }

        if (image !== undefined) {
            await tx.attachment.deleteMany({
                where: { serviceRecordId: id },
            });
            if (image) {
                await tx.attachment.create({
                    data: {
                        url: image,
                        fileType: "IMAGE",
                        serviceRecordId: id,
                    },
                });
            }
        }

        // Update asset current usage
        const latestRecord = await tx.serviceRecord.findFirst({
            where: { assetId: existing.assetId },
            orderBy: { usageAtService: "desc" },
        });

        if (latestRecord && latestRecord.usageAtService > existing.asset.currentUsage) {
            await tx.asset.update({
                where: { id: existing.assetId },
                data: { currentUsage: latestRecord.usageAtService },
            });
        }

        return updated;
    });

    revalidatePath(`/dashboard/asset/${existing.assetId}`);
    revalidatePath(`/dashboard/service/${id}`);
    revalidatePath("/dashboard/admin");
    await refreshPredictions(existing.assetId);

    return result;
}

export async function deleteServiceRecord(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const existing = await prisma.serviceRecord.findUnique({
        where: { id },
        include: { asset: true, parts: true },
    });

    if (!existing) throw new Error("Record not found");

    const isAdmin = (session.user as any).role === "ADMIN";
    const isOwner = existing.asset.userId === session.user.id;
    const hasPermission = await checkPermission("DELETE", "SERVICE");

    if (!isAdmin && !isOwner && !hasPermission) {
        throw new Error("Unauthorized to delete this record");
    }

    await prisma.$transaction(async (tx) => {
        // Revert inventory changes
        for (const p of existing.parts) {
            await tx.part.update({
                where: { id: p.partId },
                data: {
                    quantityOnHand: {
                        increment: p.quantity,
                    },
                },
            });
        }

        // Delete the record (cascade will handle servicePart and attachments)
        await tx.serviceRecord.delete({
            where: { id },
        });
    });

    revalidatePath(`/dashboard/asset/${existing.assetId}`);
    revalidatePath("/dashboard/admin");
    await refreshPredictions(existing.assetId);
}

