import fs from "fs";
import path from "path";
import { prisma } from "./prisma";

/**
 * SQLite backups. Each backup is a consistent copy made with VACUUM INTO, named with its date
 * and time, in a "backups" folder next to the live database. In Docker that is /app/data/backups,
 * which is the bind-mounted ./data folder on the host and is ignored by git. Server-only module.
 */

export const BACKUP_SETTING_KEY = "backup_schedule";
export const LAST_BACKUP_KEY = "last_backup_run";

export type BackupReason = "manual" | "daily" | "pre-migrate";
export type BackupSettings = { enabled: boolean; time: string; keep: number; timeZone?: string };
export type BackupInfo = { name: string; size: number; createdAt: string; reason: string };

export const DEFAULT_BACKUP_SETTINGS: BackupSettings = { enabled: true, time: "03:00", keep: 30 };

const BACKUP_NAME = /^maintenance-\d{4}-\d{2}-\d{2}_\d{6}-(manual|daily|pre-migrate)\.db$/;

export function isBackupName(name: string) {
    return BACKUP_NAME.test(name);
}

/** Path of the live SQLite file. Relative paths in DATABASE_URL are resolved by Prisma against prisma/. */
export function getDatabasePath() {
    const dbFile = (process.env.DATABASE_URL || "file:./dev.db").replace(/^file:/, "").split("?")[0];
    return path.isAbsolute(dbFile) ? dbFile : path.join(process.cwd(), "prisma", dbFile);
}

export function getBackupDir() {
    return path.join(path.dirname(getDatabasePath()), "backups");
}

/** "2026-11-19_031500" in the given time zone (server local time when none is given). */
export function backupTimestamp(date = new Date(), timeZone?: string) {
    let parts: Intl.DateTimeFormatPart[];
    try {
        parts = new Intl.DateTimeFormat("en-US", {
            timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hourCycle: "h23",
        }).formatToParts(date);
    } catch {
        return backupTimestamp(date, undefined);
    }
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
    return `${get("year")}-${get("month")}-${get("day")}_${get("hour")}${get("minute")}${get("second")}`;
}

export function backupFileName(reason: BackupReason, date = new Date(), timeZone?: string) {
    return `maintenance-${backupTimestamp(date, timeZone)}-${reason}.db`;
}

export async function getBackupSettings(): Promise<BackupSettings> {
    const row = await prisma.systemSetting.findUnique({ where: { key: BACKUP_SETTING_KEY } });
    if (!row) return DEFAULT_BACKUP_SETTINGS;
    try {
        return { ...DEFAULT_BACKUP_SETTINGS, ...JSON.parse(row.value) };
    } catch {
        return DEFAULT_BACKUP_SETTINGS;
    }
}

/** Writes a timestamped copy of the database and then deletes the oldest backups beyond the keep limit. */
export async function createBackup(reason: BackupReason): Promise<BackupInfo> {
    const settings = await getBackupSettings();
    const dir = getBackupDir();
    fs.mkdirSync(dir, { recursive: true });

    let name = backupFileName(reason, new Date(), settings.timeZone);
    // Two backups in the same second (e.g. a double click) get a distinct name.
    for (let i = 1; fs.existsSync(path.join(dir, name)); i++) {
        await new Promise((r) => setTimeout(r, 1000));
        name = backupFileName(reason, new Date(), settings.timeZone);
        if (i > 3) throw new Error("Could not pick a unique backup name");
    }
    const target = path.join(dir, name);

    // VACUUM INTO writes a consistent copy even while the app is using the database
    await prisma.$executeRawUnsafe(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
    pruneBackups(settings.keep);

    const stat = fs.statSync(target);
    return { name, size: stat.size, createdAt: stat.mtime.toISOString(), reason };
}

export function listBackups(): BackupInfo[] {
    const dir = getBackupDir();
    if (!fs.existsSync(dir)) return [];
    return fs
        .readdirSync(dir)
        .filter(isBackupName)
        .map((name) => {
            const stat = fs.statSync(path.join(dir, name));
            return { name, size: stat.size, createdAt: stat.mtime.toISOString(), reason: name.match(BACKUP_NAME)![1] };
        })
        .sort((a, b) => b.name.localeCompare(a.name));
}

/**
 * Keeps the newest `keep` daily and manual backups. Pre-migrate backups are rare and are kept
 * until deleted by hand, and files with any other name are never touched.
 */
export function pruneBackups(keep: number) {
    const limit = Math.max(1, Math.floor(keep || DEFAULT_BACKUP_SETTINGS.keep));
    const dir = getBackupDir();
    const rotating = listBackups().filter((b) => b.reason !== "pre-migrate");
    for (const old of rotating.slice(limit)) {
        fs.unlinkSync(path.join(dir, old.name));
    }
}
