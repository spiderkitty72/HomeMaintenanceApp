export function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        console.log("Starting Maintenance App Background Scheduler...");

        setInterval(async () => {
            try {
                // Dynamically import to prevent Webpack from failing in the Edge runtime
                const { prisma } = await import("./lib/prisma");
                const { processServiceReminders } = await import("./lib/reminders");

                const setting = await prisma.systemSetting.findUnique({
                    where: { key: "reminder_schedule" }
                });

                if (!setting) return;

                let schedule;
                try {
                    schedule = JSON.parse(setting.value);
                } catch {
                    return;
                }

                if (!schedule.enabled) return;

                const { dayOfWeek, time, date } = getZonedNow(schedule.timeZone);

                // Run once on the scheduled day at or after the scheduled time. Comparing with >=
                // (instead of an exact minute match) means a delayed tick or a restart doesn't skip the week.
                if (Number(schedule.dayOfWeek) === dayOfWeek && time >= normalizeTime(schedule.time)) {

                    // Check if already run today
                    const lastRunSetting = await prisma.systemSetting.findUnique({
                        where: { key: "last_reminder_run" }
                    });

                    if (lastRunSetting && lastRunSetting.value === date) {
                        return; // Already ran today
                    }

                    console.log("Triggering scheduled automated reminders...", { time, dayOfWeek, timeZone: schedule.timeZone });

                    const result = await processServiceReminders();
                    console.log("Reminder run complete. Result:", result);

                    // Mark as run
                    await prisma.systemSetting.upsert({
                        where: { key: "last_reminder_run" },
                        update: { value: date },
                        create: { key: "last_reminder_run", value: date }
                    });
                }
            } catch (error) {
                console.error("Scheduler tick error:", error);
            }
        }, 60000); // Check every minute
    }
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Current day of week (0 = Sunday), "HH:MM" time and "yyyy-MM-dd" date in the given
 * time zone. Falls back to the server's local time zone when none is saved.
 */
function getZonedNow(timeZone?: string): { dayOfWeek: number; time: string; date: string } {
    let parts: Intl.DateTimeFormatPart[];
    try {
        parts = new Intl.DateTimeFormat("en-US", {
            timeZone,
            weekday: "short",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
        }).formatToParts(new Date());
    } catch {
        // Unknown time zone name: use server local time
        return getZonedNow(undefined);
    }
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    return {
        dayOfWeek: WEEKDAYS.indexOf(get("weekday")),
        time: `${get("hour")}:${get("minute")}`,
        date: `${get("year")}-${get("month")}-${get("day")}`,
    };
}

/** Pads "8:05" to "08:05" so times compare correctly as strings. */
function normalizeTime(time: string) {
    const [hour = "0", minute = "0"] = String(time).split(":");
    return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}
