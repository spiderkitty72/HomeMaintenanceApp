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

                const now = new Date();
                const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
                const currentHour = String(now.getHours()).padStart(2, '0');
                const currentMinute = String(now.getMinutes()).padStart(2, '0');
                const currentTime = `${currentHour}:${currentMinute}`;
                const todayIsoString = now.toISOString().split('T')[0];

                // Check if current day/time matches preference
                if (Number(schedule.dayOfWeek) === currentDayOfWeek && schedule.time === currentTime) {

                    // Check if already run today
                    const lastRunSetting = await prisma.systemSetting.findUnique({
                        where: { key: "last_reminder_run" }
                    });

                    if (lastRunSetting && lastRunSetting.value === todayIsoString) {
                        return; // Already ran today
                    }

                    console.log("Triggering scheduled automated reminders...", { currentTime, currentDayOfWeek });

                    const result = await processServiceReminders();
                    console.log("Reminder run complete. Result:", result);

                    // Mark as run
                    await prisma.systemSetting.upsert({
                        where: { key: "last_reminder_run" },
                        update: { value: todayIsoString },
                        create: { key: "last_reminder_run", value: todayIsoString }
                    });
                }
            } catch (error) {
                console.error("Scheduler tick error:", error);
            }
        }, 60000); // Check every minute
    }
}
