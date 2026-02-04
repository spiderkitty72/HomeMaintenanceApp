"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { getSpecTypes, addSpecType, upsertAssetSpec } from "@/lib/actions/specs";
import { AssetSpecType } from "@prisma/client";

interface AddSpecDialogProps {
    assetId: string;
}

export function AddSpecDialog({ assetId }: AddSpecDialogProps) {
    const [open, setOpen] = useState(false);
    const [specTypes, setSpecTypes] = useState<AssetSpecType[]>([]);
    const [selectedTypeId, setSelectedTypeId] = useState<string>("");
    const [value, setValue] = useState<string>("");
    const [isAddingNewType, setIsAddingNewType] = useState(false);
    const [newTypeName, setNewTypeName] = useState("");
    const [newTypeUnit, setNewTypeUnit] = useState("");

    useEffect(() => {
        if (open) {
            loadSpecTypes();
        }
    }, [open]);

    async function loadSpecTypes() {
        try {
            const types = await getSpecTypes();
            setSpecTypes(types as any);
        } catch (error) {
            toast.error("Failed to load specification types");
        }
    }

    async function handleAddType() {
        if (!newTypeName) {
            toast.error("Type name is required");
            return;
        }
        try {
            const newType = await addSpecType(newTypeName, newTypeUnit || null);
            setSpecTypes([...specTypes, newType as any]);
            setSelectedTypeId(newType.id);
            setIsAddingNewType(false);
            setNewTypeName("");
            setNewTypeUnit("");
            toast.success("Type added successfully");
        } catch (error) {
            toast.error("Failed to add specification type");
        }
    }

    async function handleSubmit() {
        if (!selectedTypeId || !value) {
            toast.error("Please select a type and enter a value");
            return;
        }

        try {
            await upsertAssetSpec(assetId, selectedTypeId, value);
            toast.success("Specification added successfully");
            setOpen(false);
            resetForm();
        } catch (error) {
            toast.error("Failed to save specification");
        }
    }

    function resetForm() {
        setSelectedTypeId("");
        setValue("");
        setIsAddingNewType(false);
    }

    const selectedType = specTypes.find(t => t.id === selectedTypeId);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" /> Add Spec
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Asset Specification</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {isAddingNewType ? (
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                            <div className="text-sm font-semibold mb-2">New Specification Type</div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase font-bold text-muted-foreground">Label</div>
                                    <Input
                                        placeholder="e.g. Tire Pressure"
                                        value={newTypeName}
                                        onChange={(e) => setNewTypeName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase font-bold text-muted-foreground">Unit</div>
                                    <Input
                                        placeholder="e.g. PSI"
                                        value={newTypeUnit}
                                        onChange={(e) => setNewTypeUnit(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingNewType(false)}>Cancel</Button>
                                <Button type="button" size="sm" onClick={handleAddType}>Create Type</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <div className="text-[10px] uppercase font-bold text-muted-foreground">Specification Type</div>
                            <div className="flex gap-2">
                                <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {specTypes.map((type) => (
                                            <SelectItem key={type.id} value={type.id}>
                                                {type.name} {type.unit ? `(${type.unit})` : ""}
                                            </SelectItem>
                                        ))}
                                        {specTypes.length === 0 && (
                                            <div className="p-2 text-xs text-muted-foreground text-center">No types created yet</div>
                                        )}
                                    </SelectContent>
                                </Select>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsAddingNewType(true);
                                    }}
                                    title="Add new type"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">Value {selectedType?.unit ? `(${selectedType.unit})` : ""}</div>
                        <Input
                            placeholder="Enter value"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                        />
                    </div>

                    <Button className="w-full" onClick={handleSubmit}>
                        Save Specification
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
