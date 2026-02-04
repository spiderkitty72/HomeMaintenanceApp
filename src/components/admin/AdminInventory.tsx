"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AddPartDialog } from "@/components/parts/AddPartDialog";
import { togglePartStatus } from "@/lib/actions/parts";
import { adjustInventory } from "@/lib/actions/inventory";
import { toast } from "sonner";
import { Package, Save, Loader2, Power, PowerOff, Edit2, AlertCircle } from "lucide-react";

interface AdminInventoryProps {
    parts: any[];
    allAssets: any[];
}

export function AdminInventory({ parts, allAssets }: AdminInventoryProps) {
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<{ [key: string]: number }>({});

    const handleLevelChange = (partId: string, value: string) => {
        setEditValues((prev) => ({
            ...prev,
            [partId]: parseFloat(value) || 0,
        }));
    };

    const handleSave = async (partId: string) => {
        const newValue = editValues[partId];
        if (newValue === undefined) return;

        setUpdatingId(partId);
        try {
            await adjustInventory(partId, newValue);
            toast.success("Inventory level updated");
            // Remove from edit state
            const newEditValues = { ...editValues };
            delete newEditValues[partId];
            setEditValues(newEditValues);
        } catch (error: any) {
            toast.error(error.message || "Failed to update inventory");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleToggleStatus = async (partId: string, currentStatus: boolean) => {
        try {
            await togglePartStatus(partId, !currentStatus);
            toast.success(currentStatus ? "Part deactivated" : "Part activated");
        } catch (error: any) {
            toast.error(error.message || "Failed to update part status");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <div className="text-sm text-muted-foreground italic flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Managing all system parts and global assignments.
                </div>
                <AddPartDialog assets={allAssets} />
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Part Name</TableHead>
                            <TableHead>Current Stock</TableHead>
                            <TableHead>UOM</TableHead>
                            <TableHead className="w-[150px]">Manual Adjust</TableHead>
                            <TableHead className="text-right w-[120px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {parts.map((part) => (
                            <TableRow key={part.id} className={!part.isActive ? "opacity-50 grayscale bg-muted/20" : ""}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0 border">
                                            {part.image ? (
                                                <img src={part.image} alt={part.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <Package className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div>
                                            <div>{part.name}</div>
                                            <div className="text-xs text-muted-foreground uppercase">{part.partNumber || "No Part #"}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={part.quantityOnHand <= 0 ? "destructive" : "secondary"}>
                                        {part.quantityOnHand}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground italic text-sm">
                                    {part.unitOfMeasure}
                                </TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        step="any"
                                        className="h-8"
                                        placeholder={part.quantityOnHand.toString()}
                                        value={editValues[part.id] !== undefined ? editValues[part.id] : ""}
                                        onChange={(e) => handleLevelChange(part.id, e.target.value)}
                                    />
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            disabled={updatingId === part.id || editValues[part.id] === undefined}
                                            onClick={() => handleSave(part.id)}
                                            title="Save adjustment"
                                        >
                                            {updatingId === part.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Save className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <AddPartDialog mode="edit" part={part} assets={allAssets} />
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleToggleStatus(part.id, part.isActive)}
                                            className={part.isActive ? "text-muted-foreground hover:text-destructive" : "text-green-600 hover:text-green-700"}
                                            title={part.isActive ? "Deactivate" : "Activate"}
                                        >
                                            {part.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
