import webpush from "web-push";
import { prisma } from "./prisma";

/**
 * Web Push (browser/phone notifications). VAPID keys are generated on first use and kept in
 * SystemSetting "push_vapid_keys", so no extra environment setup is needed. Server-only module.
 */

const VAPID_SETTING_KEY = "push_vapid_keys";

export type PushPayload = { title: string; body: string; url?: string; tag?: string };

type VapidKeys = { publicKey: string; privateKey: string };

let cachedKeys: VapidKeys | null = null;

export async function getVapidKeys(): Promise<VapidKeys> {
    if (cachedKeys) return cachedKeys;

    const existing = await prisma.systemSetting.findUnique({ where: { key: VAPID_SETTING_KEY } });
    if (existing) {
        cachedKeys = JSON.parse(existing.value) as VapidKeys;
        return cachedKeys;
    }

    const generated = webpush.generateVAPIDKeys();
    // upsert so two requests racing on first use end up with one stored pair
    const saved = await prisma.systemSetting.upsert({
        where: { key: VAPID_SETTING_KEY },
        update: {},
        create: { key: VAPID_SETTING_KEY, value: JSON.stringify(generated) },
    });
    cachedKeys = JSON.parse(saved.value) as VapidKeys;
    return cachedKeys;
}

function vapidSubject() {
    const url = process.env.AUTH_URL;
    if (url && url.startsWith("https://")) return url;
    return process.env.PUSH_CONTACT_EMAIL ? `mailto:${process.env.PUSH_CONTACT_EMAIL}` : "mailto:admin@localhost";
}

/** Sends a notification to every device the user enabled. Returns how many devices accepted it. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
    const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
    if (subscriptions.length === 0) return 0;

    const { publicKey, privateKey } = await getVapidKeys();
    const options = { vapidDetails: { subject: vapidSubject(), publicKey, privateKey }, TTL: 60 * 60 * 24 };
    const body = JSON.stringify(payload);

    let delivered = 0;
    await Promise.all(
        subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, body, options);
                delivered++;
            } catch (error) {
                const status = (error as { statusCode?: number }).statusCode;
                if (status === 404 || status === 410) {
                    // The browser dropped this subscription; forget it.
                    await prisma.pushSubscription.deleteMany({ where: { id: sub.id } });
                } else {
                    console.error(`Push to ${sub.endpoint.slice(0, 60)}… failed`, error);
                }
            }
        })
    );
    return delivered;
}
