import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { backupFileName, backupTimestamp, getBackupDir, isBackupName, listBackups, pruneBackups } from "@/lib/backup";

let tmp: string;
const original = process.env.DATABASE_URL;

beforeAll(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "backup-test-"));
    process.env.DATABASE_URL = `file:${path.join(tmp, "dev.db")}`;
});

afterAll(() => {
    process.env.DATABASE_URL = original;
    fs.rmSync(tmp, { recursive: true, force: true });
});

describe("backup names", () => {
    it("include the date and time in the chosen time zone", () => {
        const at = new Date("2026-11-19T09:15:30Z");
        expect(backupTimestamp(at, "UTC")).toBe("2026-11-19_091530");
        expect(backupTimestamp(at, "America/Chicago")).toBe("2026-11-19_031530");
        expect(backupFileName("daily", at, "UTC")).toBe("maintenance-2026-11-19_091530-daily.db");
    });

    it("only accept names this app creates", () => {
        expect(isBackupName("maintenance-2026-11-19_091530-daily.db")).toBe(true);
        expect(isBackupName("maintenance-2026-11-19_091530-pre-migrate.db")).toBe(true);
        expect(isBackupName("../dev.db")).toBe(false);
        expect(isBackupName("maintenance-2026-11-19_091530-daily.db/../../dev.db")).toBe(false);
        expect(isBackupName("dev.db")).toBe(false);
    });
});

describe("backup folder", () => {
    it("sits next to the database", () => {
        expect(getBackupDir()).toBe(path.join(tmp, "backups"));
    });

    it("keeps the newest daily and manual backups, all pre-migrate backups, and other files", () => {
        const dir = getBackupDir();
        fs.mkdirSync(dir, { recursive: true });
        const names = [
            "maintenance-2026-11-01_030000-daily.db",
            "maintenance-2026-11-02_030000-daily.db",
            "maintenance-2026-11-02_120000-manual.db",
            "maintenance-2026-11-03_030000-daily.db",
            "maintenance-2026-10-01_080000-pre-migrate.db",
            "my-own-copy.db",
        ];
        for (const n of names) fs.writeFileSync(path.join(dir, n), "x");

        pruneBackups(2);

        expect(fs.readdirSync(dir).sort()).toEqual([
            "maintenance-2026-10-01_080000-pre-migrate.db",
            "maintenance-2026-11-02_120000-manual.db",
            "maintenance-2026-11-03_030000-daily.db",
            "my-own-copy.db",
        ]);
        expect(listBackups().map((b) => b.name)[0]).toBe("maintenance-2026-11-03_030000-daily.db");
    });
});
