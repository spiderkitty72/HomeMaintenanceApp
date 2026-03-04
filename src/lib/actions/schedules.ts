"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { calculateDailyUsage, predictNextDueDate } from "@/lib/predictions";
import { ensurePermission } from "@/lib/permissions";

const ScheduleSchema = z.object({
    assetId: z.string(),
    name: z.string().min(2),
    frequencyType: z.enum(["Date", "Mileage", "Hours"]),
    frequencyValue: z.number().min(1),
    lastPerformedDate: z.date().optional().nullable(),
    lastPerformedUsage: z.number().optional().nullable(),
});

export async function createSchedule(data: z.infer<typeof ScheduleSchema>) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await ensurePermission("CREATE", "SERVICE");

    const asset = await prisma.asset.findUnique({
        where: { id: data.assetId },
        include: { fuelRecords: true }
    });

    if (!asset) throw new Error("Asset not found");

    const dailyUsage = calculateDailyUsage(asset.fuelRecords);

    // Calculate initial prediction
    const tempSchedule = { ...data, id: "temp", nextDueUsage: null, nextDueDate: null } as any;
    if (data.frequencyType !== "Date") {
        tempSchedule.nextDueUsage = (data.lastPerformedUsage ?? 0) + data.frequencyValue;
    }
    const nextDueDate = predictNextDueDate(tempSchedule, asset.currentUsage, dailyUsage);

    const schedule = await prisma.serviceSchedule.create({
        data: {
            ...data,
            nextDueDate,
            nextDueUsage: tempSchedule.nextDueUsage,
        },
    });

    revalidatePath(`/dashboard/asset/${data.assetId}`);
    return schedule;
}

export async function getSchedules(assetId: string) {
    return await prisma.serviceSchedule.findMany({
        where: { assetId },
        orderBy: {
            nextDueDate: "asc",
        },
    });
}

export async function refreshPredictions(assetId: string) {
    const asset = await prisma.asset.findUnique({
        where: { id: assetId },
        include: {
            fuelRecords: true,
            schedules: true
        }
    });

    if (!asset) return;

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

export async function deleteSchedule(id: string, assetId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await ensurePermission("DELETE", "SERVICE");

    await prisma.serviceSchedule.delete({
        where: { id },
    });

    revalidatePath(`/dashboard/asset/${assetId}`);
}

export async function dismissReminder(id: string, assetId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await ensurePermission("EDIT", "SERVICE");

    await (prisma.serviceSchedule as any).update({
        where: { id },
        data: { isReminderDismissed: true },
    });

    revalidatePath(`/dashboard/asset/${assetId}`);
}
