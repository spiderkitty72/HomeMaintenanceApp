import { describe, expect, it } from "vitest";
import { getHouseAgeDays, recalculateAssetUsage } from "@/lib/actions/usage";
import { formatHouseUsage, formatUtcDate } from "@/lib/utils";

type Rec = { usage: number; date: Date };

/** Minimal stand-in for a Prisma transaction client covering what recalculateAssetUsage reads and writes. */
function fakeTx(asset: Record<string, unknown>, fuel: Rec[], service: Rec[]) {
    let updated: Record<string, unknown> | undefined;
    const top = (rs: Rec[]) => [...rs].sort((a, b) => b.usage - a.usage)[0];
    const tx = {
        asset: {
            findUniqueOrThrow: async () => asset,
            update: async ({ data }: { data: Record<string, unknown> }) => {
                updated = data;
                return { ...asset, ...data };
            },
        },
        fuelRecord: {
            findFirst: async () => {
                const r = top(fuel);
                return r ? { usageAtFill: r.usage, date: r.date } : null;
            },
            findMany: async () => fuel.map((r) => ({ usageAtFill: r.usage, date: r.date })),
        },
        serviceRecord: {
            findFirst: async () => {
                const r = top(service);
                return r ? { usageAtService: r.usage, date: r.date } : null;
            },
        },
    };
    return { tx: tx as unknown as Parameters<typeof recalculateAssetUsage>[0], result: () => updated };
}

const car = { id: "a1", type: "Car", details: null, manualUsage: 50000, usageUpdatedAt: new Date("2026-01-01"), currentUsage: 50000 };

describe("recalculateAssetUsage", () => {
    it("never drops below the reading entered on the asset", async () => {
        const { tx, result } = fakeTx(car, [], [{ usage: 42000, date: new Date("2025-06-01") }]);
        await recalculateAssetUsage(tx, "a1");
        expect(result()?.currentUsage).toBe(50000);
    });

    it("moves up when a record is higher than the entered reading", async () => {
        const { tx, result } = fakeTx(car, [{ usage: 51000, date: new Date("2026-02-01") }], []);
        await recalculateAssetUsage(tx, "a1");
        expect(result()?.currentUsage).toBe(51000);
    });

    it("keeps the entered reading when every record is deleted", async () => {
        const { tx, result } = fakeTx(car, [], []);
        await recalculateAssetUsage(tx, "a1");
        expect(result()?.currentUsage).toBe(50000);
    });
});

describe("house age", () => {
    it("counts days since the build date for houses only", () => {
        const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10);
        expect(getHouseAgeDays("House", JSON.stringify({ buildDate: tenDaysAgo }))).toBeGreaterThanOrEqual(9);
        expect(getHouseAgeDays("Car", JSON.stringify({ buildDate: tenDaysAgo }))).toBeNull();
        expect(getHouseAgeDays("House", "not json")).toBeNull();
    });

    it("formats days as years and days", () => {
        expect(formatHouseUsage(1)).toBe("1 day");
        expect(formatHouseUsage(365)).toBe("1 yr");
        expect(formatHouseUsage(1000)).toBe("2 yrs, 270 days");
    });
});

describe("formatUtcDate", () => {
    it("formats the stored UTC calendar date regardless of local time zone", () => {
        expect(formatUtcDate("2026-10-13T00:00:00.000Z")).toBe("Oct 13, 2026");
        expect(formatUtcDate("2026-10-13T00:00:00.000Z", "yyyy-MM-dd")).toBe("2026-10-13");
        expect(formatUtcDate(null)).toBe("");
        expect(formatUtcDate("garbage")).toBe("");
    });
});
