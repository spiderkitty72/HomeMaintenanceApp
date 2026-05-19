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
import { removePartFromSystem } from "@/lib/actions/inventorySystems";
import { toast } from "sonner";
import { Package, Save, Loader2, Power, PowerOff, AlertCircle, LayoutGrid, PackageMinus, Search } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface AdminInventoryProps {
    parts: any[];
    allAssets: any[];
    systems: any[];
    userPermission?: "OWNER" | "MANAGE" | "VIEW" | null;
}

export function AdminInventory({ parts, allAssets, systems, userPermission }: AdminInventoryProps) {
    const [selectedSystemId, setSelectedSystemId] = useState<string>(systems[0]?.id || "none");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<{ [key: string]: number }>({});
    const [search, setSearch] = useState("");

    const canManage = !userPermission || userPermission === "OWNER" || userPermission === "MANAGE";

    const filteredParts = search.trim() === "" ? parts : parts.filter((part) => {
        const q = search.toLowerCase();
        const assetNames = (part.compatibilities ?? []).map((c: any) => c.asset?.name ?? "").join(" ");
        return (
            part.name?.toLowerCase().includes(q) ||
            part.partNumber?.toLowerCase().includes(q) ||
            part.manufacturer?.toLowerCase().includes(q) ||
            part.unitOfMeasure?.toLowerCase().includes(q) ||
            part.compatibleType?.toLowerCase().includes(q) ||
            assetNames.toLowerCase().includes(q)
        );
    });

    const handleLevelChange = (partId: string, value: string) => {
        setEditValues((prev) => ({
            ...prev,
            [partId]: parseFloat(value) || 0,
        }));
    };

    const handleSave = async (partId: string) => {
        const newValue = editValues[partId];
        if (newValue === undefined || selectedSystemId === "none") return;

        setUpdatingId(partId);
        try {
            await adjustInventory(partId, selectedSystemId, newValue);
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

    const handleRemoveFromSystem = async (partId: string) => {
        if (selectedSystemId === "none") return;
        if (!confirm("Stop tracking this part in this inventory system? Its stock data will be removed.")) return;
        try {
            await removePartFromSystem(selectedSystemId, partId);
            toast.success("Part removed from system");
        } catch (error: any) {
            toast.error(error.message || "Failed to remove part");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30 p-4 rounded-lg border">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <LayoutGrid className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Select value={selectedSystemId} onValueChange={setSelectedSystemId}>
                        <SelectTrigger className="w-full sm:w-[250px] bg-background">
                            <SelectValue placeholder="Select Inventory System" />
                        </SelectTrigger>
                        <SelectContent>
                            {systems.length === 0 && <SelectItem value="none">No Systems Available</SelectItem>}
                            {systems.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                    {s.name} ({s.user?.name || s.user?.email})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <div className="relative w-full sm:w-[220px]">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Search parts..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 h-9 bg-background"
                        />
                    </div>
                    <AddPartDialog assets={allAssets} />
                </div>
            </div>

            <div className="text-sm text-muted-foreground italic flex items-center gap-2 px-1">
                <AlertCircle className="h-4 w-4" />
                {selectedSystemId === "none" 
                    ? "Select a system to manage stock levels." 
                    : !canManage
                    ? <span className="flex items-center gap-1.5">Viewing stock for <strong>{systems.find(s => s.id === selectedSystemId)?.name}</strong> — you have <strong>View Only</strong> access.</span>
                    : `Managing stock for ${systems.find(s => s.id === selectedSystemId)?.name}.`}
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Part Name</TableHead>
                            <TableHead>Assets</TableHead>
                            <TableHead>Current Stock</TableHead>
                            <TableHead>UOM</TableHead>
                            {canManage && <TableHead className="w-[150px]">Manual Adjust</TableHead>}
                            {canManage && <TableHead className="text-right w-[120px]">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredParts.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={canManage ? 6 : 4} className="text-center py-8 text-muted-foreground italic">
                                    No parts match your search.
                                </TableCell>
                            </TableRow>
                        )}
                        {filteredParts.map((part) => (
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
                                    {part.compatibilities && part.compatibilities.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {part.compatibilities.map((c: any) => (
                                                <Badge key={c.assetId} variant="outline" className="text-xs font-normal">
                                                    {c.asset?.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : part.compatibleType ? (
                                        <span className="text-xs text-muted-foreground italic">All {part.compatibleType}</span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">Universal</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {(() => {
                                        const systemItem = part.inventoryItems?.find((i: any) => i.inventorySystemId === selectedSystemId);
                                        const stock = systemItem?.quantityOnHand ?? 0;
                                        const isTracked = !!systemItem;

                                        if (!isTracked && selectedSystemId !== "none") {
                                            return <Badge variant="outline" className="text-muted-foreground">Not Tracked</Badge>;
                                        }

                                        return (
                                            <Badge variant={stock <= 0 ? "destructive" : "secondary"}>
                                                {stock}
                                            </Badge>
                                        );
                                    })()}
                                </TableCell>
                                <TableCell className="text-muted-foreground italic text-sm">
                                    {part.unitOfMeasure}
                                </TableCell>
                                {canManage && (
                                    <TableCell>
                                        {(() => {
                                            const systemItem = part.inventoryItems?.find((i: any) => i.inventorySystemId === selectedSystemId);
                                            const stock = systemItem?.quantityOnHand ?? 0;
                                            
                                            return (
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    className="h-8"
                                                    disabled={selectedSystemId === "none"}
                                                    placeholder={stock.toString()}
                                                    value={editValues[part.id] !== undefined ? editValues[part.id] : ""}
                                                    onChange={(e) => handleLevelChange(part.id, e.target.value)}
                                                />
                                            );
                                        })()}
                                    </TableCell>
                                )}
                                {canManage && (
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
                                            {(() => {
                                                const isTracked = !!part.inventoryItems?.find((i: any) => i.inventorySystemId === selectedSystemId);
                                                return isTracked && selectedSystemId !== "none" ? (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleRemoveFromSystem(part.id)}
                                                        className="text-muted-foreground hover:text-destructive"
                                                        title="Stop tracking in this system"
                                                    >
                                                        <PackageMinus className="h-4 w-4" />
                                                    </Button>
                                                ) : null;
                                            })()}
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
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
