import { describe, expect, it } from "vitest";
import { isActivePath, visibleNavItems } from "@/components/layout/nav-items";

describe("top menu", () => {
    it("shows Admin only to admins", () => {
        expect(visibleNavItems(false).map((i) => i.label)).toEqual(["Dashboard", "Parts", "Invoices"]);
        expect(visibleNavItems(true).map((i) => i.label)).toContain("Admin");
    });

    it("highlights Dashboard on asset, service and fuel pages", () => {
        expect(isActivePath("/dashboard", "/dashboard")).toBe(true);
        expect(isActivePath("/dashboard/asset/abc", "/dashboard")).toBe(true);
        expect(isActivePath("/dashboard/service/abc", "/dashboard")).toBe(true);
        expect(isActivePath("/dashboard/parts", "/dashboard")).toBe(false);
    });

    it("matches a section and its subpages only", () => {
        expect(isActivePath("/dashboard/invoices/123", "/dashboard/invoices")).toBe(true);
        expect(isActivePath("/dashboard/partsx", "/dashboard/parts")).toBe(false);
    });
});
