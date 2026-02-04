"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { refreshPredictions } from "./schedules";
import { ensurePermission } from "@/lib/permissions";

const FuelRecordSchema = z.object({
    assetId: z.string(),
    date: z.string(),
    usageAtFill: z.number(),
    gallons: z.number(),
    pricePerGallon: z.number(),
    totalCost: z.number(),
    isFullTank: z.boolean(),
    image: z.string().optional(),
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
            },
        });

        if (data.image) {
            await tx.attachment.create({
                data: {
                    url: data.image,
                    fileType: "IMAGE",
                    fuelRecordId: fuelRecord.id,
                },
            });
        }

        // Update asset current usage
        await tx.asset.update({
            where: { id: data.assetId },
            data: { currentUsage: data.usageAtFill },
        });

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

    // Basic MPG calculation for the last few fill-ups
    // (Latest Odometer - Oldest Odometer in batch) / (Total Gallons excluding latest if latest is full tank)
    // This is a simplified version.

    const newest = records[0];
    const oldest = records[records.length - 1];

    const distance = newest.usageAtFill - oldest.usageAtFill;
    const totalGallons = records.slice(0, -1).reduce((acc, r) => acc + r.gallons, 0);

    if (totalGallons <= 0 || distance <= 0) return null;

    const avgMpg = distance / totalGallons;
    const avgCostPerGal = records.reduce((acc, r) => acc + r.pricePerGallon, 0) / records.length;
    const totalSpent = records.reduce((acc, r) => acc + r.totalCost, 0);

    return {
        avgMpg,
        avgCostPerGal,
        totalSpent,
        recordCount: records.length,
    };
}
