import { FuelRecord, ServiceSchedule, Asset } from "@prisma/client";
import { addDays, differenceInDays } from "date-fns";

/**
 * Calculates the average daily usage (miles or hours) based on fuel records.
 */
export function calculateDailyUsage(records: FuelRecord[]): number {
    if (records.length < 2) return 0;

    // Sort by date ascending to get the range
    const sorted = [...records].sort((a, b) => a.date.getTime() - b.date.getTime());

    const oldest = sorted[0];
    const newest = sorted[sorted.length - 1];

    const daysDiff = differenceInDays(newest.date, oldest.date);
    if (daysDiff <= 0) return 0;

    const usageDiff = newest.usageAtFill - oldest.usageAtFill;
    if (usageDiff <= 0) return 0;

    return usageDiff / daysDiff;
}

/**
 * Predicts the next due date for a usage-based schedule.
 */
export function predictNextDueDate(
    schedule: ServiceSchedule,
    currentUsage: number,
    dailyUsage: number
): Date | null {
    if (schedule.frequencyType === "Date") {
        if (!schedule.lastPerformedDate) return null;
        return addDays(new Date(schedule.lastPerformedDate), schedule.frequencyValue);
    }

    // Mileage or Hours based
    if (!schedule.nextDueUsage) {
        const baseUsage = schedule.lastPerformedUsage ?? 0;
        schedule.nextDueUsage = baseUsage + schedule.frequencyValue;
    }

    if (dailyUsage <= 0) return null;

    const remainingUsage = schedule.nextDueUsage - currentUsage;
    const daysRemaining = Math.max(0, remainingUsage / dailyUsage);

    return addDays(new Date(), Math.round(daysRemaining));
}

/**
 * Evaluates whether a schedule is currently due based on a target date and estimated usage,
 * and whether it has already been dismissed by the user.
 */
export function isScheduleDue(
    schedule: any, // Use any to temporarily bypass Prisma client type lag for new columns
    targetDate: Date,
    estimatedUsage: number
): { isDue: boolean; reason: string } {
    if (schedule.isReminderDismissed) {
        return { isDue: false, reason: "" };
    }

    let isDue = false;
    let reason = "";

    if (schedule.nextDueDate && new Date(schedule.nextDueDate) <= targetDate) {
        isDue = true;
        reason = `Due by Date: ${new Date(schedule.nextDueDate).toLocaleDateString()}`;
    }

    if (schedule.nextDueUsage && schedule.nextDueUsage <= estimatedUsage) {
        isDue = true;
        reason += (reason ? " and " : "") + `Due by Usage: ${schedule.nextDueUsage}`;
    }

    return { isDue, reason };
}
