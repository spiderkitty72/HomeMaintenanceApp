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
        let contentType = "application/octet-stream";
        if (ext === "pdf") contentType = "application/pdf";
        else if (ext === "docx") contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        else if (ext === "doc") contentType = "application/msword";
        else if (ext === "xlsx") contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        else if (ext === "xls") contentType = "application/vnd.ms-excel";
        else if (ext === "txt") contentType = "text/plain";
        else if (ext === "png") contentType = "image/png";
        else if (ext === "webp") contentType = "image/webp";
        else if (ext === "gif") contentType = "image/gif";
        else if (ext === "svg") contentType = "image/svg+xml";
        else if (["jpg", "jpeg"].includes(ext || "")) contentType = "image/jpeg";

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
