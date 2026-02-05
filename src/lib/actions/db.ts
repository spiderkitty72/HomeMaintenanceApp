"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ensurePermission } from "@/lib/permissions";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

/**
 * Creates a physical backup of the SQLite database file.
 */
export async function createDatabaseBackup() {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    const backupDir = path.join(process.cwd(), "prisma", "backups");

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(backupDir, `dev-backup-${timestamp}.db`);

    try {
        fs.copyFileSync(dbPath, backupPath);
        return { success: true, path: backupPath };
    } catch (error) {
        console.error("Backup failed:", error);
        throw new Error("Failed to create database backup");
    }
}

/**
 * Exports all relevant application data to a JSON object.
 */
export async function exportDatabaseJSON() {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
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
export async function importDatabaseJSON(data: any) {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    try {
        // We use a transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
            // Priority 1: Users & Groups
            if (data.users) {
                for (const item of data.users) {
                    await tx.user.upsert({ where: { id: item.id }, update: item, create: item });
                }
            }
            if (data.groups) {
                for (const item of data.groups) {
                    await tx.group.upsert({ where: { id: item.id }, update: item, create: item });
                }
            }

            // Priority 2: Relations dependent on Users/Groups
            if (data.groupMembers) {
                for (const item of data.groupMembers) {
                    await tx.groupMember.upsert({ where: { id: item.id }, update: item, create: item });
                }
            }
            if (data.permissions) {
                for (const item of data.permissions) {
                    await tx.permission.upsert({ where: { id: item.id }, update: item, create: item });
                }
            }

            // Assets
            if (data.assets) {
                for (const item of data.assets) {
                    await tx.asset.upsert({ where: { id: item.id }, update: item, create: item });
                }
            }

            // Data dependent on Assets
            if (data.assetSpecTypes) {
                for (const item of data.assetSpecTypes) {
                    await tx.assetSpecType.upsert({ where: { id: item.id }, update: item, create: item });
                }
            }
            if (data.assetSpecs) {
                for (const item of data.assetSpecs) {
                    await tx.assetSpec.upsert({ where: { id: item.id }, update: item, create: item });
                }
            }
            if (data.assetShares) {
                for (const item of data.assetShares) {
                    await tx.assetShare.upsert({ where: { id: item.id }, update: item, create: item });
                }
            }

            // Parts
            if (data.parts) {
                for (const item of data.parts) {
                    await tx.part.upsert({ where: { id: item.id }, update: item, create: item });
                }
            }
            if (data.partPurchases) {
                for (const item of data.partPurchases) {
                    await tx.partPurchase.upsert({ where: { id: item.id }, update: item, create: item });
                }
            }
            if (data.partPurchaseItems) {
                for (const item of data.partPurchaseItems) {
                    await tx.partPurchaseItem.upsert({ where: { id: item.id }, update: item, create: item });
                }
            }
            if (data.compatibilities) {
                for (const item of data.compatibilities) {
                    await tx.assetPartCompatibility.upsert({ where: { id: item.id }, update: item, create: item });
                }
            }

            // Records
            if (data.serviceRecords) {
                for (const item of data.serviceRecords) {
                    await tx.serviceRecord.upsert({ where: { id: item.id }, update: item, create: item });
                }
            }
            if (data.serviceParts) {
                for (const item of data.serviceParts) {
                    await tx.servicePart.upsert({ where: { id: item.id }, update: item, create: item });
                }
            }
            if (data.fuelRecords) {
                for (const item of data.fuelRecords) {
                    await tx.fuelRecord.upsert({ where: { id: item.id }, update: item, create: item });
                }
            }
            if (data.schedules) {
                for (const item of data.schedules) {
                    await tx.serviceSchedule.upsert({ where: { id: item.id }, update: item, create: item });
                }
            }
            if (data.attachments) {
                for (const item of data.attachments) {
                    await tx.attachment.upsert({ where: { id: item.id }, update: item, create: item });
                }
            }
        });

        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        console.error("Import failed:", error);
        throw new Error("Failed to import database data");
    }
}
