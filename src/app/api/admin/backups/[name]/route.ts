import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { auth } from "@/auth";
import { getBackupDir, isBackupName } from "@/lib/backup";

/** Admin-only download of one database backup, so it can be kept off the server too. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { name } = await params;
    // Only exact backup names this app creates; anything else (including "../") is rejected.
    if (!isBackupName(name)) {
        return new NextResponse("Not found", { status: 404 });
    }

    const filePath = join(getBackupDir(), name);
    if (!existsSync(filePath)) {
        return new NextResponse("Not found", { status: 404 });
    }

    const file = await readFile(filePath);
    return new NextResponse(file, {
        headers: {
            "Content-Type": "application/vnd.sqlite3",
            "Content-Disposition": `attachment; filename="${name}"`,
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
        },
    });
}
