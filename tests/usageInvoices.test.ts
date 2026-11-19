import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

// Runs against a real SQLite database built from the migrations.
let tmp: string;
let prisma: typeof import("@/lib/prisma").prisma;
let sync: typeof import("@/lib/usageInvoices");
const original = process.env.DATABASE_URL;
let ids: { owner: string; borrower: string; system: string; ownSystem: string; part: string; part2: string; asset: string };

beforeAll(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "invoice-test-"));
    process.env.DATABASE_URL = `file:${path.join(tmp, "test.db")}`;
    execSync("npx prisma migrate deploy", { env: process.env, stdio: "ignore" });
    prisma = (await import("@/lib/prisma")).prisma;
    sync = await import("@/lib/usageInvoices");

    const owner = await prisma.user.create({ data: { email: "owner@test", name: "Josh" } });
    const borrower = await prisma.user.create({ data: { email: "borrower@test", name: "Sam" } });
    const system = await prisma.inventorySystem.create({ data: { name: "Garage Shelf", userId: owner.id } });
    const ownSystem = await prisma.inventorySystem.create({ data: { name: "Sam's Box", userId: borrower.id } });
    const part = await prisma.part.create({ data: { name: "Oil filter", userId: owner.id } });
    const part2 = await prisma.part.create({ data: { name: "Spark plug", userId: owner.id } });
    const asset = await prisma.asset.create({ data: { name: "Truck", type: "Car", trackingMethod: "Mileage", userId: borrower.id } });
    ids = { owner: owner.id, borrower: borrower.id, system: system.id, ownSystem: ownSystem.id, part: part.id, part2: part2.id, asset: asset.id };
}, 60000);

afterAll(async () => {
    await prisma?.$disconnect();
    process.env.DATABASE_URL = original;
    fs.rmSync(tmp, { recursive: true, force: true });
});

async function record(parts: { partId: string; quantity: number; costPerUnit: number; inventorySystemId: string | null }[]) {
    return prisma.serviceRecord.create({
        data: { assetId: ids.asset, date: new Date(), usageAtService: 0, summary: "Oil change", parts: { create: parts } },
    });
}

describe("automatic usage invoices", () => {
    it("bills the person who used parts from someone else's system, and not for their own parts", async () => {
        const r = await record([
            { partId: ids.part, quantity: 2, costPerUnit: 7.5, inventorySystemId: ids.system },
            { partId: ids.part2, quantity: 4, costPerUnit: 3, inventorySystemId: ids.ownSystem },
        ]);
        const events = await sync.syncUsageInvoices(prisma, r.id, ids.borrower);

        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({ kind: "created", ownerId: ids.owner, billedUserId: ids.borrower, systemName: "Garage Shelf", assetName: "Truck" });

        const invoices = await prisma.invoice.findMany({ where: { serviceRecordId: r.id }, include: { lineItems: true } });
        expect(invoices).toHaveLength(1);
        expect(invoices[0]).toMatchObject({ fromUserId: ids.owner, toUserId: ids.borrower, inventorySystemId: ids.system, status: "UNPAID" });
        expect(invoices[0].lineItems.map((l) => [l.partName, l.quantity, l.unitCost])).toEqual([["Oil filter", 2, 7.5]]);
        expect(sync.invoiceTotal(invoices[0].lineItems)).toBe(15);

        // Running it again changes nothing
        expect(await sync.syncUsageInvoices(prisma, r.id, ids.borrower)).toEqual([]);
    });

    it("updates an unpaid invoice when the parts change and removes it when none are left", async () => {
        const r = await record([{ partId: ids.part, quantity: 1, costPerUnit: 7.5, inventorySystemId: ids.system }]);
        await sync.syncUsageInvoices(prisma, r.id, ids.borrower);

        await prisma.servicePart.updateMany({ where: { serviceRecordId: r.id }, data: { quantity: 3 } });
        const events = await sync.syncUsageInvoices(prisma, r.id, ids.borrower);
        expect(events.map((e) => e.kind)).toEqual(["updated"]);
        const inv = await prisma.invoice.findFirstOrThrow({ where: { serviceRecordId: r.id }, include: { lineItems: true } });
        expect(inv.lineItems[0].quantity).toBe(3);

        await prisma.servicePart.deleteMany({ where: { serviceRecordId: r.id } });
        expect(await sync.syncUsageInvoices(prisma, r.id, ids.borrower)).toEqual([]);
        expect(await prisma.invoice.count({ where: { serviceRecordId: r.id } })).toBe(0);
    });

    it("never changes a paid invoice", async () => {
        const r = await record([{ partId: ids.part, quantity: 1, costPerUnit: 7.5, inventorySystemId: ids.system }]);
        await sync.syncUsageInvoices(prisma, r.id, ids.borrower);
        await prisma.invoice.updateMany({ where: { serviceRecordId: r.id }, data: { status: "PAID" } });

        await prisma.servicePart.deleteMany({ where: { serviceRecordId: r.id } });
        expect(await sync.syncUsageInvoices(prisma, r.id, ids.borrower)).toEqual([]);
        const inv = await prisma.invoice.findFirstOrThrow({ where: { serviceRecordId: r.id }, include: { lineItems: true } });
        expect(inv.lineItems).toHaveLength(1);
    });

    it("numbers invoices uniquely across all users, even after one is deleted", async () => {
        const numbers = (await prisma.invoice.findMany({ select: { invoiceNumber: true } })).map((i) => i.invoiceNumber);
        expect(new Set(numbers).size).toBe(numbers.length);
        const next = await sync.nextInvoiceNumber(prisma);
        expect(numbers).not.toContain(next);
        expect(next).toMatch(/^INV-\d{4}$/);
    });
});
