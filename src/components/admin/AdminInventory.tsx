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
import { Package, Save, Loader2, History } from "lucide-react";
import { adjustInventory } from "@/lib/actions/inventory";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface AdminInventoryProps {
    parts: any[];
}

export function AdminInventory({ parts }: AdminInventoryProps) {
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

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Part Name</TableHead>
                            <TableHead>Current Stock</TableHead>
                            <TableHead>UOM</TableHead>
                            <TableHead className="w-[150px]">Manual Adjust</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {parts.map((part) => (
                            <TableRow key={part.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-muted-foreground" />
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
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        disabled={updatingId === part.id || editValues[part.id] === undefined}
                                        onClick={() => handleSave(part.id)}
                                    >
                                        {updatingId === part.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="h-4 w-4" />
                                        )}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
