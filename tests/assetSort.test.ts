import { describe, expect, it } from "vitest";
import { sortAssetsForDashboard } from "@/lib/assetSort";

const a = (name: string, isFavorite = false) => ({ name, isFavorite });

describe("sortAssetsForDashboard", () => {
    it("puts favorites first, each group alphabetical", () => {
        const sorted = sortAssetsForDashboard([a("Truck"), a("Zeta Mower", true), a("accord"), a("Boat", true), a("Lake House")]);
        expect(sorted.map((x) => x.name)).toEqual(["Boat", "Zeta Mower", "accord", "Lake House", "Truck"]);
    });

    it("ignores case and orders numbers naturally", () => {
        const sorted = sortAssetsForDashboard([a("Mower 10"), a("mower 2"), a("Mower 1")]);
        expect(sorted.map((x) => x.name)).toEqual(["Mower 1", "mower 2", "Mower 10"]);
    });

    it("does not change the input array", () => {
        const input = [a("b"), a("a")];
        sortAssetsForDashboard(input);
        expect(input.map((x) => x.name)).toEqual(["b", "a"]);
    });
});
