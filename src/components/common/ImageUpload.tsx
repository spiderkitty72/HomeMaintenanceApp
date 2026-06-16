"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface ImageUploadProps {
    onUpload: (url: string) => void;
    value?: string;
    label?: string;
    disabled?: boolean;
    accept?: string;
}

const isImageUrl = (url: string) => {
    if (!url) return false;
    const ext = url.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext || "");
};

const getFileDisplayLabel = (url: string) => {
    if (!url) return "";
    const fileName = url.split("/").pop() || "";
    const ext = fileName.split(".").pop()?.toUpperCase() || "";
    return ext ? `${ext} Document` : "Document";
};

export function ImageUpload({ onUpload, value, label, disabled, accept = "image/*" }: ImageUploadProps) {
    const [loading, setLoading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();
            onUpload(data.url);
            toast.success("File uploaded successfully");
        } catch (error) {
            toast.error("Failed to upload file");
        } finally {
            setLoading(false);
        }
    };

    const removeImage = () => {
        onUpload("");
    };

    const isImage = isImageUrl(value || "");
    
    // Build standard message for supported formats
    const isImageOnly = accept === "image/*";
    const formatsMessage = isImageOnly 
        ? "PNG, JPG or WEBP (MAX. 5MB)" 
        : "PNG, JPG, WEBP, PDF, DOCX, etc. (MAX. 5MB)";

    return (
        <div className="space-y-2">
            {label && <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>}

            <div className="flex flex-col items-center justify-center gap-4">
                {value ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted flex flex-col items-center justify-center">
                        {isImage ? (
                            <a 
                                href={value} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="w-full h-full relative block cursor-pointer"
                            >
                                <Image
                                    src={value}
                                    alt="Uploaded image"
                                    fill
                                    className="object-cover"
                                />
                            </a>
                        ) : (
                            <a 
                                href={value} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-full h-full flex flex-col items-center justify-center text-center p-4 cursor-pointer hover:bg-muted/80 transition-colors"
                            >
                                <div className="p-3 bg-primary/10 rounded-full mb-2">
                                    <FileText className="h-8 w-8 text-primary" />
                                </div>
                                <span className="text-sm font-semibold text-foreground max-w-[200px] truncate">
                                    {getFileDisplayLabel(value)}
                                </span>
                                <span className="text-xs text-muted-foreground mt-1 underline">
                                    Click to Open
                                </span>
                            </a>
                        )}
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-lg z-10"
                            onClick={removeImage}
                            disabled={disabled}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="w-full">
                        <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 border-muted-foreground/20 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {loading ? (
                                    <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                                ) : (
                                    <>
                                        <div className="p-3 bg-primary/10 rounded-full mb-3">
                                            <Upload className="h-6 w-6 text-primary" />
                                        </div>
                                        <p className="mb-2 text-sm text-muted-foreground">
                                            <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-xs text-muted-foreground">{formatsMessage}</p>
                                    </>
                                )}
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept={accept}
                                onChange={handleUpload}
                                disabled={disabled || loading}
                            />
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
}

