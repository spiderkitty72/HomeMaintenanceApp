"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getSystemSetting(key: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const role = (session.user as any).role;
    // Allow non-admins to read safe UI configurations, restrict secrets to ADMIN
    if (role !== "ADMIN" && key !== "reminder_schedule") {
        throw new Error("Unauthorized");
    }

    const setting = await prisma.systemSetting.findUnique({
        where: { key },
    });

    if (!setting) return null;

    try {
        return JSON.parse(setting.value);
    } catch {
        return setting.value;
    }
}

export async function setSystemSetting(key: string, value: any) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const stringValue = typeof value === "string" ? value : JSON.stringify(value);

    await prisma.systemSetting.upsert({
        where: { key },
        update: { value: stringValue },
        create: { key, value: stringValue },
    });

    return { success: true };
}
