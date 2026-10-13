import { Prisma } from "@prisma/client";
import { calculateDailyUsage } from "@/lib/predictions";
import { ASSET_TYPES } from "@/lib/constants";
import { differenceInDays } from "date-fns";

/**
 * Days since the build date for a House asset, or null for other assets or when no build date is set.
 */
export function getHouseAgeDays(type: string, details: string | null): number | null {
    if (type !== ASSET_TYPES.HOUSE || !details) return null;
    try {
        const { buildDate } = JSON.parse(details);
        if (!buildDate) return null;
        return Math.max(0, differenceInDays(new Date(), new Date(buildDate)));
    } catch {
        return null;
    }
}

/**
 * Recalculates the maximum asset usage and the average daily usage.
 * Should be called inside a Prisma transaction after creating/updating/deleting service or fuel records.
 */
export async function recalculateAssetUsage(tx: Prisma.TransactionClient, assetId: string) {
    // Note: Prisma.TransactionClient is typically the type of `tx` in prisma.$transaction
    // If not exporting this type easily, `any` or explicit typing could replace it.

    const asset = await tx.asset.findUniqueOrThrow({ where: { id: assetId } });

    // 1. Get the max usage from Fuel Records
    const maxFuelRecord = await tx.fuelRecord.findFirst({
        where: { assetId },
        orderBy: { usageAtFill: "desc" },
    });

    // 2. Get the max usage from Service Records
    const maxServiceRecord = await tx.serviceRecord.findFirst({
        where: { assetId },
        orderBy: { usageAtService: "desc" },
    });

    let maxUsage = 0;
    let latestDate = new Date(0); // Epoch

    if (maxFuelRecord && maxFuelRecord.usageAtFill > maxUsage) {
        maxUsage = maxFuelRecord.usageAtFill;
        latestDate = maxFuelRecord.date > latestDate ? maxFuelRecord.date : latestDate;
    }

    if (maxServiceRecord && maxServiceRecord.usageAtService > maxUsage) {
        maxUsage = maxServiceRecord.usageAtService;
        latestDate = maxServiceRecord.date > latestDate ? maxServiceRecord.date : latestDate;
    }

    // If there were no records at all, we might want to just keep current usage or reset to 0.
    // However, usually we might just set it to maxUsage (which is 0 initially).
    // The exact date could just be right now if no records.
    if (maxUsage === 0 && latestDate.getTime() === 0) {
        latestDate = new Date();
    }

    // 3. Optional: to be completely accurate on the date of that specific max usage, 
    // let's specifically find the date of the record that matches the max usage.
    let usageUpdatedAt = latestDate;

    if (maxUsage > 0) {
        if (maxFuelRecord && maxFuelRecord.usageAtFill === maxUsage) {
            usageUpdatedAt = maxFuelRecord.date;
        } else if (maxServiceRecord && maxServiceRecord.usageAtService === maxUsage) {
            usageUpdatedAt = maxServiceRecord.date;
        }
    }

    // The reading entered on the asset is a floor, so logging an older record or
    // deleting the latest one never moves the odometer below it.
    if (asset.manualUsage !== null && asset.manualUsage >= maxUsage) {
        maxUsage = asset.manualUsage;
        usageUpdatedAt = asset.usageUpdatedAt;
    }

    // Houses track age in days since the build date rather than a usage reading
    const houseAgeDays = getHouseAgeDays(asset.type, asset.details);
    if (houseAgeDays !== null) {
        maxUsage = houseAgeDays;
        usageUpdatedAt = new Date();
    }

    // 4. Calculate Daily Usage
    const allFuelRecords = await tx.fuelRecord.findMany({
        where: { assetId },
        orderBy: { date: "desc" },
    });
    const dailyUsage = calculateDailyUsage(allFuelRecords);

    // 5. Update the Asset
    await tx.asset.update({
        where: { id: assetId },
        data: {
            currentUsage: maxUsage,
            usageUpdatedAt,
            dailyUsage,
        },
    });
}
