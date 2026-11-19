"use server";

import { getSmtpTransport } from "../email";
import { auth } from "@/auth";

async function ensureAdmin() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }
}

export async function testSmtpConnection(testEmailAddress: string) {
    await ensureAdmin();
    try {
        const { transporter, smtpSettings } = await getSmtpTransport();

        // 3. Send the Test Email
        const info = await transporter.sendMail({
            from: smtpSettings.fromAddress || smtpSettings.username,
            to: testEmailAddress,
            subject: "Maintenance App - SMTP Test Successful",
            text: "Hello!\n\nIf you are reading this email, it means your SMTP configuration in the Maintenance App is successfully working.\n\nBest regards,\nYour Maintenance App",
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #0ea5e9;">Maintenance App - SMTP Test Successful</h2>
                    <p>Hello!</p>
                    <p>If you are reading this email, it means your SMTP configuration in the Maintenance App is successfully working.</p>
                    <br/>
                    <p>Best regards,<br/>Your Maintenance App</p>
                </div>
            `,
        });

        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("SMTP_TEST_ERROR:", error);
        throw new Error((error as Error).message || "Failed to send test email. Check your SMTP settings and ensure the mail server is accessible.");
    }
}

import { processServiceReminders } from "../reminders";

export async function triggerManualReminders() {
    await ensureAdmin();
    return await processServiceReminders();
}
