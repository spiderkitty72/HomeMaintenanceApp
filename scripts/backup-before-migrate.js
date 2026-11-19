// Runs at container start, before `prisma migrate deploy`. If any migration in prisma/migrations
// has not been applied yet, it saves a timestamped copy of the database to <db folder>/backups
// first, so a failed or unwanted migration can be rolled back by restoring that file.
// It never blocks startup: any problem is logged and the app continues.
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

function dbPath() {
    const file = (process.env.DATABASE_URL || "file:./dev.db").replace(/^file:/, "").split("?")[0];
    return path.isAbsolute(file) ? file : path.join(__dirname, "..", "prisma", file);
}

function timestamp(d = new Date()) {
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

async function main() {
    const db = dbPath();
    if (!fs.existsSync(db) || fs.statSync(db).size === 0) {
        console.log("[backup] No existing database yet; nothing to back up.");
        return;
    }

    const migrationsDir = path.join(__dirname, "..", "prisma", "migrations");
    const available = fs.readdirSync(migrationsDir).filter((n) => fs.statSync(path.join(migrationsDir, n)).isDirectory());

    const prisma = new PrismaClient();
    try {
        let applied = [];
        try {
            const rows = await prisma.$queryRawUnsafe(`SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL`);
            applied = rows.map((r) => r.migration_name);
        } catch {
            applied = []; // no migrations table yet
        }
        const pending = available.filter((n) => !applied.includes(n));
        if (pending.length === 0) {
            console.log("[backup] No pending migrations; skipping pre-migrate backup.");
            return;
        }

        const dir = path.join(path.dirname(db), "backups");
        fs.mkdirSync(dir, { recursive: true });
        const target = path.join(dir, `maintenance-${timestamp()}-pre-migrate.db`);
        await prisma.$executeRawUnsafe(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
        console.log(`[backup] ${pending.length} pending migration(s); saved ${target}`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((e) => {
    console.error("[backup] Pre-migrate backup failed (continuing startup):", e);
});
