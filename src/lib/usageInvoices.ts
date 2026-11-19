import { prisma } from "./prisma";
import { sendPushToUser } from "./push";
import { getSmtpTransport } from "./email";
import { formatMoney } from "./inventory";

/**
 * Automatic invoices for parts taken from someone else's inventory system.
 *
 * When a service record uses parts from an inventory system the person logging it doesn't own,
 * the system's owner bills that person: one invoice per system per service record. The owner is
 * told what was used and that the invoice went out, and the person billed is told they have one.
 * Server-only module.
 */

type Db = Pick<typeof prisma, "invoice" | "invoiceLineItem" | "servicePart" | "serviceRecord">;

type LineItem = { partId: string; partName: string; quantity: number; unitCost: number };

export type UsageInvoiceEvent = {
    kind: "created" | "updated";
    invoiceId: string;
    invoiceNumber: string;
    ownerId: string;
    billedUserId: string;
    systemName: string;
    assetName: string;
    lineItems: LineItem[];
};

/**
 * Next free invoice number. Numbers are unique across the whole app, so this looks at every
 * invoice rather than counting one person's (counting reused numbers after a delete).
 */
export async function nextInvoiceNumber(db: Pick<typeof prisma, "invoice"> = prisma): Promise<string> {
    const rows = await db.invoice.findMany({ select: { invoiceNumber: true } });
    let max = 0;
    for (const { invoiceNumber } of rows) {
        const n = Number(/^INV-(\d+)$/.exec(invoiceNumber)?.[1]);
        if (Number.isFinite(n) && n > max) max = n;
    }
    return `INV-${String(max + 1).padStart(4, "0")}`;
}

export function invoiceTotal(items: { quantity: number; unitCost: number }[]) {
    return items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);
}

function sameItems(a: LineItem[], b: LineItem[]) {
    const key = (i: LineItem) => `${i.partId}|${i.quantity}|${i.unitCost}`;
    return a.map(key).sort().join(",") === b.map(key).sort().join(",");
}

/**
 * Brings the automatic invoices for one service record in line with the parts it uses.
 * - A system whose parts are now used, with no invoice yet, gets a new invoice.
 * - An unpaid invoice is updated if the parts changed, or deleted if none of that system's parts remain.
 * - Paid invoices are never changed.
 * `billedUserId` is who a new invoice goes to; existing invoices keep their recipient.
 * Returns what happened so the caller can notify people after its transaction commits.
 */
export async function syncUsageInvoices(db: Db, serviceRecordId: string, billedUserId: string): Promise<UsageInvoiceEvent[]> {
    const record = await db.serviceRecord.findUnique({
        where: { id: serviceRecordId },
        select: {
            asset: { select: { name: true } },
            parts: {
                where: { inventorySystemId: { not: null } },
                select: {
                    partId: true,
                    quantity: true,
                    costPerUnit: true,
                    part: { select: { name: true } },
                    inventorySystem: { select: { id: true, name: true, userId: true } },
                },
            },
        },
    });
    if (!record) return [];

    // Parts grouped by the system they came from
    const bySystem = new Map<string, { system: { id: string; name: string; userId: string }; items: LineItem[] }>();
    for (const p of record.parts) {
        if (!p.inventorySystem) continue;
        const entry = bySystem.get(p.inventorySystem.id) ?? { system: p.inventorySystem, items: [] };
        entry.items.push({ partId: p.partId, partName: p.part.name, quantity: p.quantity, unitCost: p.costPerUnit });
        bySystem.set(p.inventorySystem.id, entry);
    }

    const existing = await db.invoice.findMany({
        where: { serviceRecordId },
        include: { lineItems: true },
    });

    const events: UsageInvoiceEvent[] = [];

    for (const { system, items } of bySystem.values()) {
        const invoice = existing.find((i) => i.inventorySystemId === system.id && i.fromUserId === system.userId);
        const base = { ownerId: system.userId, systemName: system.name, assetName: record.asset.name, lineItems: items };

        if (!invoice) {
            if (system.userId === billedUserId) continue; // your own parts aren't billed
            const created = await db.invoice.create({
                data: {
                    invoiceNumber: await nextInvoiceNumber(db),
                    fromUserId: system.userId,
                    toUserId: billedUserId,
                    serviceRecordId,
                    inventorySystemId: system.id,
                    notes: "Created automatically for parts used from this inventory system.",
                    lineItems: { create: items },
                },
            });
            events.push({ kind: "created", invoiceId: created.id, invoiceNumber: created.invoiceNumber, billedUserId, ...base });
            continue;
        }

        if (invoice.status === "PAID") continue;
        const current = invoice.lineItems.map((li) => ({ partId: li.partId ?? "", partName: li.partName, quantity: li.quantity, unitCost: li.unitCost }));
        if (sameItems(current, items)) continue;

        await db.invoiceLineItem.deleteMany({ where: { invoiceId: invoice.id } });
        await db.invoice.update({
            where: { id: invoice.id },
            data: { lineItems: { create: items } },
        });
        events.push({ kind: "updated", invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, billedUserId: invoice.toUserId, ...base });
    }

    // Unpaid invoices for systems this record no longer takes parts from
    for (const invoice of existing) {
        if (invoice.status === "PAID") continue;
        const entry = bySystem.get(invoice.inventorySystemId);
        if (entry && entry.system.userId === invoice.fromUserId) continue;
        await db.invoice.delete({ where: { id: invoice.id } });
    }

    return events;
}

function escapeHtml(s: string) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function appLink(path: string) {
    const base = process.env.AUTH_URL?.replace(/\/$/, "");
    return base ? `${base}${path}` : null;
}

/** Tells the owner and the person billed about each invoice, by push and (if SMTP is set up) email. Never throws. */
export async function notifyUsageInvoices(events: UsageInvoiceEvent[]) {
    if (events.length === 0) return;

    let smtp: Awaited<ReturnType<typeof getSmtpTransport>> | null = null;
    try {
        smtp = await getSmtpTransport();
    } catch {
        smtp = null;
    }

    for (const e of events) {
        try {
            const users = await prisma.user.findMany({
                where: { id: { in: [e.ownerId, e.billedUserId] } },
                select: { id: true, name: true, email: true },
            });
            const owner = users.find((u) => u.id === e.ownerId);
            const billed = users.find((u) => u.id === e.billedUserId);
            const ownerName = owner?.name || owner?.email || "The owner";
            const billedName = billed?.name || billed?.email || "Someone";
            const total = formatMoney(invoiceTotal(e.lineItems));
            const count = e.lineItems.reduce((n, i) => n + i.quantity, 0);
            const partsText = e.lineItems.map((i) => `${i.quantity} × ${i.partName}`).join(", ");
            const url = `/dashboard/invoices/${e.invoiceId}`;
            const updated = e.kind === "updated";

            const toOwner = {
                title: updated ? `Invoice ${e.invoiceNumber} updated` : `Parts used from ${e.systemName}`,
                body: updated
                    ? `${billedName} changed the parts used from ${e.systemName} on ${e.assetName}. ${e.invoiceNumber} is now ${total}.`
                    : `${billedName} used ${count} part${count === 1 ? "" : "s"} on ${e.assetName}: ${partsText}. Invoice ${e.invoiceNumber} for ${total} was sent to them.`,
            };
            const toBilled = {
                title: updated ? `Invoice ${e.invoiceNumber} updated` : `New invoice from ${ownerName}`,
                body: updated
                    ? `${e.invoiceNumber} for parts from ${e.systemName} is now ${total}.`
                    : `${e.invoiceNumber} for ${total}, for parts from ${e.systemName} used on ${e.assetName}.`,
            };

            for (const [user, msg] of [[owner, toOwner], [billed, toBilled]] as const) {
                if (!user) continue;
                await sendPushToUser(user.id, { ...msg, url, tag: `invoice-${e.invoiceId}` }).catch((err) =>
                    console.error("Invoice push failed", err)
                );

                if (!smtp || !user.email) continue;
                const link = appLink(url);
                const rows = e.lineItems
                    .map((i) => `<tr><td style="padding:4px 8px">${escapeHtml(i.partName)}</td><td style="padding:4px 8px;text-align:right">${i.quantity}</td><td style="padding:4px 8px;text-align:right">${formatMoney(i.unitCost)}</td></tr>`)
                    .join("");
                const html = `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #0ea5e9;">${escapeHtml(msg.title)}</h2>
                        <p>${escapeHtml(msg.body)}</p>
                        <table style="border-collapse: collapse; border: 1px solid #ddd; margin: 12px 0;">
                            <tr style="background:#f9fafb"><th style="padding:4px 8px;text-align:left">Part</th><th style="padding:4px 8px">Qty</th><th style="padding:4px 8px">Unit cost</th></tr>
                            ${rows}
                            <tr><td colspan="2" style="padding:4px 8px;text-align:right"><strong>Total</strong></td><td style="padding:4px 8px;text-align:right"><strong>${total}</strong></td></tr>
                        </table>
                        ${link ? `<p><a href="${escapeHtml(link)}">View invoice ${escapeHtml(e.invoiceNumber)}</a></p>` : ""}
                    </div>`;
                await smtp.transporter
                    .sendMail({
                        from: smtp.smtpSettings.fromAddress || smtp.smtpSettings.username,
                        to: user.email,
                        subject: msg.title,
                        html,
                    })
                    .catch((err: unknown) => console.error(`Invoice email to ${user.email} failed`, err));
            }
        } catch (err) {
            console.error(`Notifying about invoice ${e.invoiceNumber} failed`, err);
        }
    }
}
