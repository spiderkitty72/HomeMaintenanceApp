import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { auth } from "@/auth";
import { UPLOAD_DIR, getExtension, getServedContentType, isSafeUploadName } from "@/lib/uploads";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    // /api routes are outside the auth middleware, so check the session here
    const session = await auth();
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { filename } = await params;

    // The filename arrives URL-decoded, so "..%2F" becomes "../". Only plain upload names are allowed.
    if (!isSafeUploadName(filename)) {
        return new NextResponse("Image not found", { status: 404 });
    }

    const filePath = join(UPLOAD_DIR, filename);

    if (!existsSync(filePath)) {
        return new NextResponse("Image not found", { status: 404 });
    }

    try {
        const fileBuffer = await readFile(filePath);

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": getServedContentType(getExtension(filename)),
                "Cache-Control": "private, max-age=31536000, immutable",
                "X-Content-Type-Options": "nosniff",
                // Opening an uploaded file directly can't run scripts (e.g. inside an SVG)
                "Content-Security-Policy": "sandbox",
            },
        });
    } catch (error) {
        console.error("Error serving image:", error);
        return new NextResponse("Error serving image", { status: 500 });
    }
}
