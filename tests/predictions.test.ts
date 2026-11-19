import { describe, expect, it } from "vitest";
import { addDays, differenceInCalendarDays } from "date-fns";
import { calculateDailyUsage, isScheduleDue, predictNextDueDate } from "@/lib/predictions";

type FuelRecord = Parameters<typeof calculateDailyUsage>[0][number];
type Schedule = Parameters<typeof predictNextDueDate>[0];

const fuel = (date: string, usageAtFill: number) => ({ date: new Date(date), usageAtFill }) as unknown as FuelRecord;
const schedule = (over: Record<string, unknown>) =>
    ({ frequencyType: "Mileage", frequencyValue: 5000, lastPerformedUsage: 10000, lastPerformedDate: null, nextDueUsage: null, ...over }) as unknown as Schedule;

describe("calculateDailyUsage", () => {
    it("is the slope between the oldest and newest fill", () => {
        expect(calculateDailyUsage([fuel("2026-01-11", 1300), fuel("2026-01-01", 1000), fuel("2026-01-05", 1100)])).toBe(30);
    });

    it("is 0 with fewer than two records, no elapsed days, or no added usage", () => {
        expect(calculateDailyUsage([fuel("2026-01-01", 1000)])).toBe(0);
        expect(calculateDailyUsage([fuel("2026-01-01", 1000), fuel("2026-01-01", 1200)])).toBe(0);
        expect(calculateDailyUsage([fuel("2026-01-01", 1000), fuel("2026-01-10", 1000)])).toBe(0);
    });
});

describe("predictNextDueDate", () => {
    it("adds the frequency in days for date schedules", () => {
        const due = predictNextDueDate(schedule({ frequencyType: "Date", frequencyValue: 90, lastPerformedDate: new Date("2026-01-01") }), 0, 0);
        expect(due?.toISOString().slice(0, 10)).toBe(addDays(new Date("2026-01-01"), 90).toISOString().slice(0, 10));
    });

    it("projects usage schedules from daily usage", () => {
        const due = predictNextDueDate(schedule({}), 14000, 50); // 1000 to go at 50/day
        expect(differenceInCalendarDays(due!, new Date())).toBe(20);
    });

    it("returns null without daily usage", () => {
        expect(predictNextDueDate(schedule({}), 14000, 0)).toBeNull();
    });
});

describe("isScheduleDue", () => {
    const target = new Date("2026-06-08");

    it("is due by date or by usage", () => {
        expect(isScheduleDue({ nextDueDate: new Date("2026-06-01") }, target, 0).isDue).toBe(true);
        expect(isScheduleDue({ nextDueUsage: 15000 }, target, 15100).isDue).toBe(true);
        expect(isScheduleDue({ nextDueDate: new Date("2026-07-01"), nextDueUsage: 20000 }, target, 15100).isDue).toBe(false);
    });

    it("is never due once dismissed", () => {
        expect(isScheduleDue({ isReminderDismissed: true, nextDueUsage: 1 }, target, 100).isDue).toBe(false);
    });
});
