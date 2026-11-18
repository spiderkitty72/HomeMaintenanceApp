import { describe, expect, it } from "vitest";
import { formatMoney, getPartStock, getPartUnitCost, getSystemItem, NO_SYSTEM } from "@/lib/inventory";

const part = {
    defaultCost: 8.5,
    inventoryItems: [
        { inventorySystemId: "garage", quantityOnHand: 3, unitCost: 7.25 },
        { inventorySystemId: "shop", quantityOnHand: 0, unitCost: null },
    ],
};

describe("inventory helpers", () => {
    it("reads stock from the selected system only", () => {
        expect(getPartStock(part, "garage")).toBe(3);
        expect(getPartStock(part, "shop")).toBe(0);
        expect(getPartStock(part, "other")).toBe(0);
    });

    it("treats no system as not tracked", () => {
        expect(getSystemItem(part, NO_SYSTEM)).toBeUndefined();
        expect(getSystemItem(part, undefined)).toBeUndefined();
    });

    it("uses the system's unit cost, falling back to the part's default", () => {
        expect(getPartUnitCost(part, "garage")).toBe(7.25);
        expect(getPartUnitCost(part, "shop")).toBe(8.5);
        expect(getPartUnitCost(part, "other")).toBe(8.5);
        expect(getPartUnitCost({ inventoryItems: [] }, "garage")).toBe(0);
    });

    it("formats money with two decimals", () => {
        expect(formatMoney(6)).toBe("$6.00");
        expect(formatMoney(8.499)).toBe("$8.50");
    });
});
