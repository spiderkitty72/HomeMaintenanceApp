import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params;
    const filePath = join(process.cwd(), "public", "uploads", filename);

    if (!existsSync(filePath)) {
        return new NextResponse("Image not found", { status: 404 });
    }

    try {
        const fileBuffer = await readFile(filePath);

        // Determine content type based on extension
        const ext = filename.split(".").pop()?.toLowerCase();
        let contentType = "image/jpeg";
        if (ext === "png") contentType = "image/png";
        if (ext === "webp") contentType = "image/webp";
        if (ext === "gif") contentType = "image/gif";
        if (ext === "svg") contentType = "image/svg+xml";

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        console.error("Error serving image:", error);
        return new NextResponse("Error serving image", { status: 500 });
    }
}
