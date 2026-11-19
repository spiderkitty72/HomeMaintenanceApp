"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BACKUP_SETTING_KEY, createBackup, getBackupDir, getBackupSettings, listBackups, pruneBackups } from "@/lib/backup";

/**
 * Creates a physical backup of the SQLite database file.
 */
export async function createDatabaseBackup() {
    await ensureAdmin();
    try {
        const backup = await createBackup("manual");
        revalidatePath("/dashboard/admin");
        return { success: true, name: backup.name };
    } catch (error) {
        console.error("Backup failed:", error);
        throw new Error("Failed to create database backup");
    }
}

async function ensureAdmin() {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }
}

/** Backup settings and the list of backups on the server, newest first. */
export async function getBackupOverview() {
    await ensureAdmin();
    return { settings: await getBackupSettings(), backups: listBackups(), folder: getBackupDir() };
}

const BackupSettingsSchema = z.object({
    enabled: z.boolean(),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM"),
    keep: z.coerce.number().int().min(1).max(365),
    timeZone: z.string().max(100).optional(),
});

export async function saveBackupSettings(input: z.infer<typeof BackupSettingsSchema>) {
    await ensureAdmin();
    const settings = BackupSettingsSchema.parse(input);
    await prisma.systemSetting.upsert({
        where: { key: BACKUP_SETTING_KEY },
        update: { value: JSON.stringify(settings) },
        create: { key: BACKUP_SETTING_KEY, value: JSON.stringify(settings) },
    });
    pruneBackups(settings.keep);
    revalidatePath("/dashboard/admin");
    return settings;
}

/**
 * Exports all relevant application data to a JSON object.
 */
export async function exportDatabaseJSON() {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const data = {
        users: await prisma.user.findMany(),
        groups: await prisma.group.findMany(),
        groupMembers: await prisma.groupMember.findMany(),
        permissions: await prisma.permission.findMany(),
        assets: await prisma.asset.findMany(),
        assetSpecTypes: await prisma.assetSpecType.findMany(),
        assetSpecs: await prisma.assetSpec.findMany(),
        assetShares: await prisma.assetShare.findMany(),
        parts: await prisma.part.findMany(),
        partPurchases: await prisma.partPurchase.findMany(),
        partPurchaseItems: await prisma.partPurchaseItem.findMany(),
        compatibilities: await prisma.assetPartCompatibility.findMany(),
        serviceRecords: await prisma.serviceRecord.findMany(),
        serviceParts: await prisma.servicePart.findMany(),
        fuelRecords: await prisma.fuelRecord.findMany(),
        schedules: await prisma.serviceSchedule.findMany(),
        attachments: await prisma.attachment.findMany(),
    };

    return data;
}

/**
 * Imports data from a JSON object.
 * WARNING: This is a destructive operation or deep merge based on IDs.
 */
/**
 * Recursively converts ISO date strings back into Date objects.
 */
function parseDates(obj: any): any {
    if (obj === null || typeof obj !== "object") return obj;

    for (const key in obj) {
        const val = obj[key];
        if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
            const date = new Date(val);
            if (!isNaN(date.getTime())) {
                obj[key] = date;
            }
        } else if (typeof val === "object") {
            parseDates(val);
        }
    }
    return obj;
}

export async function importDatabaseJSON(data: any) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    // Convert string dates back to Date objects
    const parsedData = parseDates(data);

    try {
        await prisma.$transaction(async (tx) => {
            const tables = [
                { name: "users", model: tx.user },
                { name: "groups", model: tx.group },
                { name: "groupMembers", model: tx.groupMember },
                { name: "permissions", model: tx.permission },
                { name: "assets", model: tx.asset },
                { name: "assetSpecTypes", model: tx.assetSpecType },
                { name: "assetSpecs", model: tx.assetSpec },
                { name: "assetShares", model: tx.assetShare },
                { name: "parts", model: tx.part },
                { name: "partPurchases", model: tx.partPurchase },
                { name: "partPurchaseItems", model: tx.partPurchaseItem },
                { name: "compatibilities", model: tx.assetPartCompatibility },
                { name: "serviceRecords", model: tx.serviceRecord },
                { name: "serviceParts", model: tx.servicePart },
                { name: "fuelRecords", model: tx.fuelRecord },
                { name: "schedules", model: tx.serviceSchedule },
                { name: "attachments", model: tx.attachment },
            ];

            for (const table of tables) {
                if (parsedData[table.name]) {
                    console.log(`Importing ${parsedData[table.name].length} items into ${table.name}...`);
                    for (const item of parsedData[table.name]) {
                        try {
                            await (table.model as any).upsert({
                                where: { id: item.id },
                                update: item,
                                create: item
                            });
                        } catch (itemError) {
                            console.error(`Failed to import item ${item.id} into ${table.name}:`, itemError);
                            throw itemError;
                        }
                    }
                }
            }
        }, {
            timeout: 30000 // Increase timeout for large imports
        });

        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        console.error("Import failed:", error);
        throw new Error("Failed to import database data");
    }
}
