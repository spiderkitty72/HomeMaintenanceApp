import { prisma } from "./prisma";
import { getSmtpTransport } from "./email";
import { addDays } from "date-fns";

export async function processServiceReminders() {
    try {
        const { transporter, smtpSettings } = await getSmtpTransport();

        // 1. Fetch assets and evaluate their schedules
        const assets = await prisma.asset.findMany({
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

        const targetDate = addDays(new Date(), 7); // Exactly 7 days from now

        const emailsToSend: Record<string, {
            user: { name: string | null; email: string };
            dueSchedules: { assetName: string; scheduleName: string; reason: string }[]
        }> = {};

        for (const asset of assets) {
            const currentUsage = asset.currentUsage;
            const dailyUsage = (asset as any).dailyUsage || 0;
            const estimatedUsageIn7Days = currentUsage + (dailyUsage * 7);

            const dueSchedules = [];

            for (const schedule of asset.schedules) {
                let isDue = false;
                let reason = "";

                if (schedule.nextDueDate && schedule.nextDueDate <= targetDate) {
                    isDue = true;
                    reason = `Due by Date: ${schedule.nextDueDate.toLocaleDateString()}`;
                }

                if (schedule.nextDueUsage && schedule.nextDueUsage <= estimatedUsageIn7Days) {
                    isDue = true;
                    reason += (reason ? " and " : "") + `Due by Usage: ${schedule.nextDueUsage} (Estimated hit within 7 days)`;
                }

                if (isDue) {
                    dueSchedules.push({
                        assetName: asset.name,
                        scheduleName: schedule.name,
                        reason
                    });
                }
            }

            if (dueSchedules.length > 0) {
                // Add owner
                if (asset.owner.email) {
                    if (!emailsToSend[asset.owner.email]) {
                        emailsToSend[asset.owner.email] = {
                            user: { name: asset.owner.name, email: asset.owner.email },
                            dueSchedules: []
                        };
                    }
                    emailsToSend[asset.owner.email].dueSchedules.push(...dueSchedules);
                }

                // Add shared users
                for (const share of asset.sharedWith) {
                    if (share.user.email) {
                        if (!emailsToSend[share.user.email]) {
                            emailsToSend[share.user.email] = {
                                user: { name: share.user.name, email: share.user.email },
                                dueSchedules: []
                            };
                        }
                        emailsToSend[share.user.email].dueSchedules.push(...dueSchedules);
                    }
                }
            }
        }

        // 3. Send emails
        let emailsSent = 0;
        for (const userEmail of Object.keys(emailsToSend)) {
            const data = emailsToSend[userEmail];

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

        return { success: true, emailsSent };

    } catch (error) {
        console.error("Error processing service reminders:", error);
        return { success: false, error: String(error) };
    }
}
