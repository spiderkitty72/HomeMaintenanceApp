"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { refreshPredictions } from "./schedules";
import { ensurePermission, checkPermission } from "@/lib/permissions";
import { recalculateAssetUsage } from "./usage";

const FuelRecordSchema = z.object({
    assetId: z.string(),
    date: z.string(),
    usageAtFill: z.number(),
    gallons: z.number(),
    pricePerGallon: z.number(),
    totalCost: z.number(),
    isFullTank: z.boolean(),
    missedPrevious: z.boolean().default(false),
    image: z.string().optional(),
    imageName: z.string().optional(),
});

export async function createFuelRecord(data: z.infer<typeof FuelRecordSchema>) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    await ensurePermission("CREATE", "FUEL");

    const result = await prisma.$transaction(async (tx) => {
        const fuelRecord = await tx.fuelRecord.create({
            data: {
                assetId: data.assetId,
                date: new Date(data.date),
                usageAtFill: data.usageAtFill,
                gallons: data.gallons,
                pricePerGallon: data.pricePerGallon,
                totalCost: data.totalCost,
                isFullTank: data.isFullTank,
                missedPrevious: data.missedPrevious,
            },
        });

        if (data.image) {
            const ext = data.image.split(".").pop()?.toLowerCase();
            const isImage = ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext || "");
            await tx.attachment.create({
                data: {
                    url: data.image,
                    name: data.imageName || "Fuel Receipt",
                    fileType: isImage ? "IMAGE" : "DOCUMENT",
                    fuelRecordId: fuelRecord.id,
                },
            });
        }

        // Update asset current usage
        await recalculateAssetUsage(tx as any, data.assetId);

        return fuelRecord;
    });

    revalidatePath(`/dashboard/asset/${data.assetId}`);

    // Update maintenance predictions based on new usage data
    await refreshPredictions(data.assetId);

    return result;
}

export async function getFuelRecords(assetId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    return await prisma.fuelRecord.findMany({
        where: { assetId },
        include: { attachments: true },
        orderBy: [
            { date: "desc" },
            { usageAtFill: "desc" }
        ],
    });
}

export async function getFuelStats(assetId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return null;
    }

    const records = await prisma.fuelRecord.findMany({
        where: { assetId },
        orderBy: [
            { date: "desc" },
            { usageAtFill: "desc" }
        ],
        take: 10,
    });

    if (records.length < 2) return null;

    // We need to calculate the average MPG over the last N records, excluding those marked as missedPrevious
    // Since a missedPrevious record means the distance covered multiple tanks but gallons only covers one,
    // we should NOT use its distance or gallons in the overall MPG calculation.
    
    let totalValidDistance = 0;
    let totalValidGallons = 0;

    for (let i = 0; i < records.length - 1; i++) {
        const newest = records[i];
        const oldest = records[i + 1];
        
        // Only calculate MPG if both are full tanks and we didn't miss the previous fuel log
        if (newest.isFullTank && oldest.isFullTank && !newest.missedPrevious) {
            const distance = newest.usageAtFill - oldest.usageAtFill;
            if (distance > 0) {
                totalValidDistance += distance;
                totalValidGallons += newest.gallons;
            }
        }
    }

    const avgMpg = totalValidGallons > 0 && totalValidDistance > 0 ? totalValidDistance / totalValidGallons : 0;
    const avgCostPerGal = records.reduce((acc, r) => acc + r.pricePerGallon, 0) / records.length;
    const totalSpent = records.reduce((acc, r) => acc + r.totalCost, 0);

    return {
        avgMpg,
        avgCostPerGal,
        totalSpent,
        recordCount: records.length,
    };
}

export async function getFuelRecord(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    return await prisma.fuelRecord.findUnique({
        where: { id },
        include: {
            asset: true,
            attachments: true,
        },
    });
}

export async function getAllFuelRecordsSystem() {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    return await prisma.fuelRecord.findMany({
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
            attachments: true,
        },
        orderBy: {
            date: "desc",
        },
    });
}

export async function updateFuelRecord(id: string, data: z.infer<typeof FuelRecordSchema>) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const existing = await prisma.fuelRecord.findUnique({
        where: { id },
        include: { asset: true },
    });

    if (!existing) throw new Error("Record not found");

    const isAdmin = (session.user as any).role === "ADMIN";
    const isOwner = existing.asset.userId === session.user.id;
    const hasPermission = await checkPermission("EDIT", "FUEL");

    if (!isAdmin && !isOwner && !hasPermission) {
        throw new Error("Unauthorized to update this record");
    }

    const { image, imageName, ...fuelData } = data;

    const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.fuelRecord.update({
            where: { id },
            data: {
                ...fuelData,
                date: new Date(fuelData.date),
            },
        });

        if (image !== undefined) {
            // Simple sync: delete old and add new if provided
            await tx.attachment.deleteMany({
                where: { fuelRecordId: id },
            });

            if (image) {
                const ext = image.split(".").pop()?.toLowerCase();
                const isImage = ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext || "");
                await tx.attachment.create({
                    data: {
                        url: image,
                        name: imageName || "Fuel Receipt",
                        fileType: isImage ? "IMAGE" : "DOCUMENT",
                        fuelRecordId: id,
                    },
                });
            }
        }

        // Update asset usage
        await recalculateAssetUsage(tx as any, existing.assetId);

        return updated;
    });

    revalidatePath(`/dashboard/asset/${existing.assetId}`);
    revalidatePath(`/dashboard/fuel/${id}`);
    revalidatePath("/dashboard/admin");
    await refreshPredictions(existing.assetId);

    return result;
}

export async function deleteFuelRecord(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const existing = await prisma.fuelRecord.findUnique({
        where: { id },
        include: { asset: true },
    });

    if (!existing) throw new Error("Record not found");

    const isAdmin = (session.user as any).role === "ADMIN";
    const isOwner = existing.asset.userId === session.user.id;
    const hasPermission = await checkPermission("DELETE", "FUEL");

    if (!isAdmin && !isOwner && !hasPermission) {
        throw new Error("Unauthorized to delete this record");
    }

    await prisma.$transaction(async (tx) => {
        await tx.fuelRecord.delete({
            where: { id },
        });

        await recalculateAssetUsage(tx as any, existing.assetId);
    });

    revalidatePath(`/dashboard/asset/${existing.assetId}`);
    revalidatePath("/dashboard/admin");
    await refreshPredictions(existing.assetId);
}
