/// <reference lib="webworker" />
// Custom service worker code; @ducanh2912/next-pwa bundles this into the generated sw.js.

declare const self: ServiceWorkerGlobalScope;

type PushPayload = { title?: string; body?: string; url?: string; tag?: string };

self.addEventListener("push", (event) => {
    let data: PushPayload = {};
    try {
        data = event.data?.json() ?? {};
    } catch {
        data = { body: event.data?.text() };
    }

    event.waitUntil(
        self.registration.showNotification(data.title || "MaintenanceApp", {
            body: data.body || "",
            icon: "/icons/icon-192x192.svg",
            badge: "/icons/icon-192x192.svg",
            tag: data.tag,
            data: { url: data.url || "/dashboard" },
        })
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = new URL((event.notification.data?.url as string) || "/dashboard", self.location.origin).href;

    event.waitUntil(
        (async () => {
            const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
            for (const client of windows) {
                if (client.url.startsWith(self.location.origin) && "focus" in client) {
                    await client.focus();
                    if ("navigate" in client) await (client as WindowClient).navigate(url);
                    return;
                }
            }
            await self.clients.openWindow(url);
        })()
    );
});

export {};
