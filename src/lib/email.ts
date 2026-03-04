import { prisma } from "./prisma";
import nodemailer from "nodemailer";

export async function getSmtpTransport() {
    const setting = await prisma.systemSetting.findUnique({
        where: { key: "smtp_config" },
    });

    if (!setting) {
        throw new Error("SMTP Configuration not found. Please setup email in the admin settings.");
    }

    let smtpSettings;
    try {
        smtpSettings = JSON.parse(setting.value);
    } catch {
        smtpSettings = setting.value as any;
    }

    const transporter = nodemailer.createTransport({
        host: smtpSettings.host,
        port: Number(smtpSettings.port),
        secure: smtpSettings.secure === "true" || smtpSettings.secure === true,
        auth: {
            user: smtpSettings.username,
            pass: smtpSettings.password,
        },
    });

    return { transporter, smtpSettings };
}
