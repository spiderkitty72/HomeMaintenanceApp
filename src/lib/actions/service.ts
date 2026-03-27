"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { refreshPredictions } from "./schedules";
import { ensurePermission, checkPermission } from "@/lib/permissions";
import { recalculateAssetUsage } from "./usage";
import { addDays } from "date-fns";

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
    fulfilledScheduleIds: z.array(z.string()).optional(),
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
        await recalculateAssetUsage(tx as any, data.assetId);

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

        // Fulfill explicitly chosen schedules
        if (data.fulfilledScheduleIds && data.fulfilledScheduleIds.length > 0) {
            for (const scheduleId of data.fulfilledScheduleIds) {
                const schedule = await (tx as any).serviceSchedule.findUnique({ where: { id: scheduleId } });
                if (schedule) {
                    const nextDueUsage = schedule.frequencyType !== "Date"
                        ? (data.usageAtService + schedule.frequencyValue)
                        : null;
                    const nextDueDate = schedule.frequencyType === "Date"
                        ? addDays(new Date(data.date), schedule.frequencyValue)
                        : null;

                    await (tx as any).serviceSchedule.update({
                        where: { id: scheduleId },
                        data: {
                            lastPerformedDate: data.date,
                            lastPerformedUsage: data.usageAtService,
                            isReminderDismissed: false,
                            ...(nextDueUsage !== null ? { nextDueUsage } : {}),
                            ...(nextDueDate !== null ? { nextDueDate } : {}),
                        }
                    });
                }
            }
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
            asset: {
                include: {
                    schedules: true,
                    sharedWith: true,
                },
            },
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
                    trackingMethod: true,
                    schedules: true,
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
        include: { 
            asset: {
                include: { sharedWith: true }
            }, 
            parts: true 
        },
    });

    if (!existing) throw new Error("Record not found");

    const isAdmin = (session.user as any).role === "ADMIN";
    const isOwner = existing.asset.userId === session.user?.id;
    const isShared = existing.asset.sharedWith.some(share => share.userId === session.user?.id);
    const hasPermission = await checkPermission("EDIT", "SERVICE");

    if (!isAdmin && !isOwner && !isShared && !hasPermission) {
        throw new Error("Unauthorized to update this record");
    }

    const { image, parts, fulfilledScheduleIds, ...serviceData } = data;

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

        // Fulfill explicitly chosen schedules during edit
        if (fulfilledScheduleIds && fulfilledScheduleIds.length > 0) {
            for (const scheduleId of fulfilledScheduleIds) {
                const schedule = await (tx as any).serviceSchedule.findUnique({ where: { id: scheduleId } });
                if (schedule) {
                    const nextDueUsage = schedule.frequencyType !== "Date"
                        ? (serviceData.usageAtService + schedule.frequencyValue)
                        : null;
                    const nextDueDate = schedule.frequencyType === "Date"
                        ? addDays(new Date(serviceData.date), schedule.frequencyValue)
                        : null;

                    await (tx as any).serviceSchedule.update({
                        where: { id: scheduleId },
                        data: {
                            lastPerformedDate: new Date(serviceData.date),
                            lastPerformedUsage: serviceData.usageAtService,
                            isReminderDismissed: false,
                            ...(nextDueUsage !== null ? { nextDueUsage } : {}),
                            ...(nextDueDate !== null ? { nextDueDate } : {}),
                        }
                    });
                }
            }
        }

        // Update asset current usage
        await recalculateAssetUsage(tx as any, existing.assetId);

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
        include: { 
            asset: {
                include: { sharedWith: true }
            }, 
            parts: true 
        },
    });

    if (!existing) throw new Error("Record not found");

    const isAdmin = (session.user as any).role === "ADMIN";
    const isOwner = existing.asset.userId === session.user?.id;
    const isShared = existing.asset.sharedWith.some(share => share.userId === session.user?.id);
    const hasPermission = await checkPermission("DELETE", "SERVICE");

    if (!isAdmin && !isOwner && !isShared && !hasPermission) {
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

        // Recalculate usage after delete
        await recalculateAssetUsage(tx as any, existing.assetId);
    });

    revalidatePath(`/dashboard/asset/${existing.assetId}`);
    revalidatePath("/dashboard/admin");
    await refreshPredictions(existing.assetId);
}

