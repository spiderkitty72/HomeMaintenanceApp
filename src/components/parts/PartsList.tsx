"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Cog, Trash2, Link as LinkIcon, Plus } from "lucide-react";
import { deletePart } from "@/lib/actions/parts";
import { toast } from "sonner";
import { AddPartDialog } from "@/components/parts/AddPartDialog";
import { AssignAssetDialog } from "@/components/parts/AssignAssetDialog";

interface PartsListProps {
    parts: any[];
    assets: any[];
}

export function PartsList({ parts, assets }: PartsListProps) {
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this part?")) return;
        try {
            await deletePart(id);
            toast.success("Part deleted");
        } catch (error) {
            toast.error("Failed to delete part");
        }
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Part Name</TableHead>
                        <TableHead>Manufacturer / #</TableHead>
                        <TableHead>System Type</TableHead>
                        <TableHead>Assigned Assets</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {parts.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">
                                No parts found in your inventory.
                            </TableCell>
                        </TableRow>
                    )}
                    {parts.map((part) => (
                        <TableRow key={part.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                    {part.name}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="text-sm">
                                    {part.manufacturer || "---"}
                                </div>
                                <div className="text-xs text-muted-foreground uppercase">
                                    {part.partNumber || "No Part #"}
                                </div>
                            </TableCell>
                            <TableCell>
                                {part.compatibleType ? (
                                    <Badge variant="outline">{part.compatibleType}</Badge>
                                ) : (
                                    <span className="text-muted-foreground text-xs italic">Multi-purpose</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {part.compatibilities.map((c: any) => (
                                        <Badge key={c.id} variant="secondary" className="text-[10px] px-1">
                                            {c.asset.name}
                                        </Badge>
                                    ))}
                                    {part.compatibilities.length === 0 && (
                                        <span className="text-muted-foreground text-xs italic">Unassigned</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="text-sm font-medium">
                                    {part.quantityOnHand} {part.unitOfMeasure}
                                </div>
                                {part.quantityOnHand <= 0 && (
                                    <div className="text-[10px] text-destructive font-bold uppercase">Out of Stock</div>
                                )}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                                ${part.defaultCost?.toFixed(2) || "0.00"}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                    <AssignAssetDialog part={part} assets={assets} />
                                    <AddPartDialog mode="edit" part={part} assets={assets} />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDelete(part.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
