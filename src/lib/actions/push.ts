"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getVapidKeys, sendPushToUser } from "@/lib/push";

const SubscriptionSchema = z.object({
    endpoint: z.string().url().max(2000),
    keys: z.object({
        p256dh: z.string().min(1).max(500),
        auth: z.string().min(1).max(500),
    }),
});

async function requireUserId() {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");
    return userId;
}

export async function getPushPublicKey() {
    await requireUserId();
    const { publicKey } = await getVapidKeys();
    return publicKey;
}

export async function subscribePush(subscription: unknown, userAgent?: string) {
    const userId = await requireUserId();
    const { endpoint, keys } = SubscriptionSchema.parse(subscription);

    // An endpoint belongs to one browser; if someone else signs in on it, it moves to them.
    await prisma.pushSubscription.upsert({
        where: { endpoint },
        update: { userId, p256dh: keys.p256dh, auth: keys.auth, userAgent: userAgent?.slice(0, 300) },
        create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent: userAgent?.slice(0, 300) },
    });
}

export async function unsubscribePush(endpoint: string) {
    const userId = await requireUserId();
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId } });
}

export async function getPushDeviceCount() {
    const userId = await requireUserId();
    return prisma.pushSubscription.count({ where: { userId } });
}

export async function sendTestPush() {
    const userId = await requireUserId();
    const delivered = await sendPushToUser(userId, {
        title: "MaintenanceApp",
        body: "Push notifications are working on this device.",
        url: "/dashboard",
        tag: "test",
    });
    return { delivered };
}
