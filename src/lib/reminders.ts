import { prisma } from "./prisma";
import { getSmtpTransport } from "./email";
import { addDays, differenceInDays } from "date-fns";
import { isScheduleDue } from "./predictions";
import { getDynamicAssetUsage } from "./utils";
import { sendPushToUser } from "./push";

export async function processServiceReminders() {
    try {
        // Email is optional: without SMTP settings, reminders still go out as push notifications.
        let smtp: Awaited<ReturnType<typeof getSmtpTransport>> | null = null;
        try {
            smtp = await getSmtpTransport();
        } catch {
            smtp = null;
        }

        // 1. Fetch assets and evaluate their schedules
        const assets = await prisma.asset.findMany({
            where: { isArchived: false },
            include: {
                owner: true,
                sharedWith: {
                    include: {
                        user: true
                    }
                },
                schedules: true
            }
        });

        const settingRecord = await prisma.systemSetting.findUnique({
            where: { key: "reminder_schedule" }
        });

        let reminderSettings = null;
        if (settingRecord) {
            try { reminderSettings = JSON.parse(settingRecord.value); }
            catch { reminderSettings = settingRecord.value as any; }
        }

        const maxDaysToEstimate = reminderSettings?.maxDaysToEstimate ?? 30;

        const targetDate = addDays(new Date(), 7); // Exactly 7 days from now

        // Keyed by user id so each person gets one digest, by email and on their devices.
        const emailsToSend: Record<string, {
            user: { id: string; name: string | null; email: string | null };
            dueSchedules: { assetId: string; assetName: string; scheduleName: string; reason: string }[]
        }> = {};

        for (const asset of assets) {
            asset.currentUsage = getDynamicAssetUsage(asset);
            const currentUsage = asset.currentUsage;
            let dailyUsage = (asset as any).dailyUsage || 0;
            const usageUpdatedAt = (asset as any).usageUpdatedAt;

            // Stop estimating if the asset hasn't had an update within the max limit
            if (usageUpdatedAt && differenceInDays(new Date(), new Date(usageUpdatedAt)) > maxDaysToEstimate) {
                dailyUsage = 0;
            }

            const estimatedUsageIn7Days = currentUsage + (dailyUsage * 7);

            const dueSchedules = [];

            for (const schedule of asset.schedules) {
                const { isDue, reason } = isScheduleDue(schedule, targetDate, estimatedUsageIn7Days);

                if (isDue) {
                    dueSchedules.push({
                        assetId: asset.id,
                        assetName: asset.name,
                        scheduleName: schedule.name,
                        reason
                    });
                }
            }

            if (dueSchedules.length > 0) {
                // Owner and everyone the asset is shared with
                for (const person of [asset.owner, ...asset.sharedWith.map((share) => share.user)]) {
                    if (!emailsToSend[person.id]) {
                        emailsToSend[person.id] = {
                            user: { id: person.id, name: person.name, email: person.email },
                            dueSchedules: []
                        };
                    }
                    emailsToSend[person.id].dueSchedules.push(...dueSchedules);
                }
            }
        }

        // 3. Send emails and push notifications
        let emailsSent = 0;
        let pushesSent = 0;
        for (const userId of Object.keys(emailsToSend)) {
            const data = emailsToSend[userId];

            const count = data.dueSchedules.length;
            const first = data.dueSchedules[0];
            try {
                const devices = await sendPushToUser(userId, {
                    title: count === 1 ? `${first.assetName}: ${first.scheduleName} is due` : `${count} maintenance items are due`,
                    body: count === 1 ? first.reason : data.dueSchedules.slice(0, 3).map((ds) => `${ds.assetName}: ${ds.scheduleName}`).join(", ") + (count > 3 ? ` and ${count - 3} more` : ""),
                    url: count === 1 ? `/dashboard/asset/${first.assetId}` : "/dashboard",
                    tag: "maintenance-reminders",
                });
                if (devices > 0) pushesSent++;
            } catch (err) {
                console.error(`Failed to send push reminder to user ${userId}`, err);
            }

            if (!smtp || !data.user.email) continue;
            const { transporter, smtpSettings } = smtp;
            const userEmail = data.user.email;

            // Build HTML
            const htmlMessage = `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #0ea5e9;">Asset Maintenance Reminder</h2>
                    <p>Hello ${data.user.name || 'User'},</p>
                    <p>This is an automated reminder that the following services are due (or estimated to be due) within the next 7 days based on your asset's daily usage average and schedules:</p>
                    
                    <ul style="border: 1px solid #ddd; padding: 15px; border-radius: 5px; background: #f9fafb;">
                        ${data.dueSchedules.map(ds => `
                            <li style="margin-bottom: 10px;">
                                <strong>${ds.assetName}</strong> - ${ds.scheduleName}<br/>
                                <span style="color: #666; font-size: 0.9em;">Reason: ${ds.reason}</span>
                            </li>
                        `).join('')}
                    </ul>
                    
                    <p style="margin-top: 20px;">Please login to the Maintenance App to log these services and clear the reminders.</p>
                    <p>Best regards,<br/>Your Maintenance App</p>
                </div>
            `;

            try {
                await transporter.sendMail({
                    from: smtpSettings.fromAddress || smtpSettings.username,
                    to: userEmail,
                    subject: "Action Required: Upcoming Maintenance Reminders",
                    html: htmlMessage,
                });
                emailsSent++;
            } catch (err) {
                console.error(`Failed to send reminder to ${userEmail}`, err);
            }
        }

        return { success: true, emailsSent, pushesSent, emailConfigured: !!smtp };

    } catch (error) {
        console.error("Error processing service reminders:", error);
        return { success: false, error: String(error) };
    }
}
