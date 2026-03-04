"use server";

import { getSystemSetting } from "./settings";
import nodemailer from "nodemailer";

export async function testSmtpConnection(testEmailAddress: string) {
    try {
        // 1. Get the SMTP settings from the database
        const smtpSettings = await getSystemSetting("smtp_config");

        if (!smtpSettings) {
            throw new Error("SMTP Configuration not found. Please save your settings first.");
        }

        // 2. Configure NodeMailer Transport
        const transporter = nodemailer.createTransport({
            host: smtpSettings.host,
            port: Number(smtpSettings.port),
            secure: smtpSettings.secure === "true" || smtpSettings.secure === true,
            auth: {
                user: smtpSettings.username,
                pass: smtpSettings.password,
            },
        });

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
    } catch (error: any) {
        console.error("SMTP_TEST_ERROR:", error);
        throw new Error(error.message || "Failed to send test email. Check your SMTP settings and ensure the mail server is accessible.");
    }
}
