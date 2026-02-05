"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DeleteRecordButtonProps {
    recordId: string;
    onDelete: (id: string) => Promise<void>;
    redirectPath: string;
    recordType: string;
}

export function DeleteRecordButton({ recordId, onDelete, redirectPath, recordType }: DeleteRecordButtonProps) {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete(recordId);
            toast.success(`${recordType} record deleted`);
            router.push(redirectPath);
            router.refresh();
        } catch (error) {
            toast.error(`Failed to delete ${recordType.toLowerCase()} record`);
            console.error(error);
        } finally {
            setIsDeleting(false);
            setOpen(false);
        }
    };

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-2"
                onClick={() => setOpen(true)}
            >
                <Trash2 className="h-4 w-4" />
                Delete
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete this {recordType.toLowerCase()} record. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setOpen(false)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={(e: React.MouseEvent) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
