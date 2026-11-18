import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { calculateDailyUsage, predictNextDueDate } from "@/lib/predictions";
import { getDynamicAssetUsage } from "@/lib/utils";

/**
 * Recomputes predicted due dates for an asset's schedules.
 * Kept out of the "use server" action modules so it can't be called directly from a browser;
 * callers must check access to the asset first.
 */
export async function refreshPredictions(assetId: string) {
    const asset = await prisma.asset.findUnique({
        where: { id: assetId },
        include: {
            fuelRecords: true,
            schedules: true
        }
    });

    if (!asset) return;
    asset.currentUsage = getDynamicAssetUsage(asset);

    const dailyUsage = calculateDailyUsage(asset.fuelRecords);

    for (const schedule of asset.schedules) {
        const nextDueDate = predictNextDueDate(schedule, asset.currentUsage, dailyUsage);

        await prisma.serviceSchedule.update({
            where: { id: schedule.id },
            data: { nextDueDate },
        });
    }

    revalidatePath(`/dashboard/asset/${assetId}`);
}
