import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as Blob | null;

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const originalName = (file as any).name || "image.jpg";
        const extension = originalName.split(".").pop();
        const fileName = `${uuidv4()}.${extension}`;

        // In a production app, we would use a cloud storage provider
        // For this local app, we'll store in public/uploads
        const relativePath = `/uploads/${fileName}`;
        const absolutePath = join(process.cwd(), "public", "uploads", fileName);

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
