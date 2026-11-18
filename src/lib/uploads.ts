import { join } from "path";

export const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

// Maximum size of a single uploaded file
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

// File types the app accepts (images, receipts and documents), mapped to the
// Content-Type they are served with. SVG is only served, never accepted, so
// files uploaded before this list existed still display.
const CONTENT_TYPES: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    heic: "image/heic",
    heif: "image/heif",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    txt: "text/plain",
};

export function getExtension(fileName: string): string {
    const dot = fileName.lastIndexOf(".");
    return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

export function isAllowedUploadExtension(extension: string): boolean {
    return extension in CONTENT_TYPES;
}

export function getServedContentType(extension: string): string {
    if (extension === "svg") return "image/svg+xml";
    return CONTENT_TYPES[extension] ?? "application/octet-stream";
}

/**
 * Stored upload names are "<uuid>.<ext>". Anything else (path separators, "..",
 * other characters) is rejected so a request can't reach files outside UPLOAD_DIR.
 */
export function isSafeUploadName(fileName: string): boolean {
    return /^[A-Za-z0-9_-]+(\.[A-Za-z0-9]+)?$/.test(fileName);
}
