"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2 } from "lucide-react";
import { toast } from "sonner";
import { updateSpecType } from "@/lib/actions/specs";

interface EditSpecTypeDialogProps {
    specType: any;
}

export function EditSpecTypeDialog({ specType }: EditSpecTypeDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(specType.name);
    const [unit, setUnit] = useState(specType.unit || "");
    const [isPending, setIsPending] = useState(false);

    async function handleSubmit() {
        if (!name) {
            toast.error("Name is required");
            return;
        }

        setIsPending(true);
        try {
            await updateSpecType(specType.id, name, unit || null);
            toast.success("Specification type updated successfully");
            setOpen(false);
        } catch (error) {
            toast.error("Failed to update specification type");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Edit2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Specification Type</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">Label</div>
                        <Input
                            placeholder="e.g. Tire Pressure"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">Unit</div>
                        <Input
                            placeholder="e.g. PSI"
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                        />
                    </div>
                    <Button className="w-full" onClick={handleSubmit} disabled={isPending}>
                        {isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
