"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPushPublicKey, sendTestPush, subscribePush, unsubscribePush } from "@/lib/actions/push";

type Status = "loading" | "unsupported" | "denied" | "off" | "on";

function urlBase64ToUint8Array(base64: string) {
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function getRegistration(registerIfMissing = false) {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing || !registerIfMissing) return existing ?? null;
    // next-pwa normally registers /sw.js on load; register it here if that hasn't happened yet.
    // The file only exists in production builds (next-pwa is off in dev).
    try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        return await navigator.serviceWorker.ready;
    } catch {
        return null;
    }
}

export function PushNotificationsCard() {
    const [status, setStatus] = useState<Status>("loading");
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        (async () => {
            if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
                setStatus("unsupported");
                return;
            }
            if (Notification.permission === "denied") {
                setStatus("denied");
                return;
            }
            const registration = await getRegistration();
            const subscription = await registration?.pushManager.getSubscription();
            setStatus(subscription ? "on" : "off");
        })().catch(() => setStatus("unsupported"));
    }, []);

    const enable = () =>
        startTransition(async () => {
            try {
                const permission = await Notification.requestPermission();
                if (permission !== "granted") {
                    setStatus(permission === "denied" ? "denied" : "off");
                    return;
                }
                const registration = await getRegistration(true);
                if (!registration) {
                    toast.error("Notifications need the installed app. Reload the page and try again.");
                    return;
                }
                const publicKey = await getPushPublicKey();
                const subscription =
                    (await registration.pushManager.getSubscription()) ??
                    (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));
                await subscribePush(subscription.toJSON(), navigator.userAgent);
                setStatus("on");
                toast.success("Notifications are on for this device");
            } catch {
                toast.error("Couldn't turn on notifications");
            }
        });

    const disable = () =>
        startTransition(async () => {
            try {
                const registration = await getRegistration();
                const subscription = await registration?.pushManager.getSubscription();
                if (subscription) {
                    await unsubscribePush(subscription.endpoint);
                    await subscription.unsubscribe();
                }
                setStatus("off");
                toast.success("Notifications are off for this device");
            } catch {
                toast.error("Couldn't turn off notifications");
            }
        });

    const test = () =>
        startTransition(async () => {
            try {
                const { delivered } = await sendTestPush();
                if (delivered > 0) toast.success(`Test sent to ${delivered} device${delivered === 1 ? "" : "s"}`);
                else toast.error("No devices accepted the test notification");
            } catch {
                toast.error("Couldn't send a test notification");
            }
        });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notifications
                </CardTitle>
                <CardDescription>
                    Get maintenance reminders as notifications on this device, in addition to email. Turn this on separately on each phone or computer.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {status === "loading" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {status === "unsupported" && (
                    <p className="text-sm text-muted-foreground">
                        This browser can&apos;t receive notifications from the app. On iPhone or iPad, add the app to your Home Screen first, then open it from there.
                    </p>
                )}
                {status === "denied" && (
                    <p className="text-sm text-muted-foreground">Notifications are blocked for this site. Allow them in your browser&apos;s site settings, then reload.</p>
                )}
                {(status === "off" || status === "on") && (
                    <div className="flex flex-wrap items-center gap-2">
                        {status === "off" ? (
                            <Button onClick={enable} disabled={isPending}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                                Turn on for this device
                            </Button>
                        ) : (
                            <>
                                <Button variant="outline" onClick={test} disabled={isPending}>
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    Send a test
                                </Button>
                                <Button variant="ghost" onClick={disable} disabled={isPending}>
                                    <BellOff className="h-4 w-4" />
                                    Turn off for this device
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
