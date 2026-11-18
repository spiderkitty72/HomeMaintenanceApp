import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/auth";
import { UPLOAD_DIR, MAX_UPLOAD_BYTES, getExtension, isAllowedUploadExtension } from "@/lib/uploads";

export async function POST(request: NextRequest) {
    // /api routes are outside the auth middleware, so check the session here
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as Blob | null;

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        if (file.size > MAX_UPLOAD_BYTES) {
            return NextResponse.json(
                { error: "File is too large (25 MB max)" },
                { status: 413 }
            );
        }

        const originalName = (file as any).name || "image.jpg";
        const extension = getExtension(originalName);
        if (!isAllowedUploadExtension(extension)) {
            return NextResponse.json(
                { error: "File type not allowed. Use an image, PDF, Word, Excel or text file." },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${uuidv4()}.${extension}`;

        // In a production app, we would use a cloud storage provider
        // For this local app, we'll store in public/uploads
        const relativePath = `/uploads/${fileName}`;
        const absolutePath = join(UPLOAD_DIR, fileName);

        await writeFile(absolutePath, buffer);

        return NextResponse.json({
            url: relativePath,
            name: originalName
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
