"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Trash2, Search, Filter } from "lucide-react";
import { deletePart } from "@/lib/actions/parts";
import { toast } from "sonner";
import { AddPartDialog } from "@/components/parts/AddPartDialog";
import { AssignAssetDialog } from "@/components/parts/AssignAssetDialog";

interface PartsListProps {
    parts: any[];
    assets: any[];
}

export function PartsList({ parts, assets }: PartsListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [assetFilter, setAssetFilter] = useState<string>("ALL");
    const [stockFilter, setStockFilter] = useState<string>("ALL");

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this part?")) return;
        try {
            await deletePart(id);
            toast.success("Part deleted");
        } catch (error) {
            toast.error("Failed to delete part");
        }
    };

    const filteredParts = parts.filter(part => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchesName = part.name.toLowerCase().includes(q) || 
                                (part.partNumber && part.partNumber.toLowerCase().includes(q)) ||
                                (part.manufacturer && part.manufacturer.toLowerCase().includes(q));
            if (!matchesName) return false;
        }

        if (assetFilter !== "ALL") {
            const isAssigned = part.compatibilities.some((c: any) => c.assetId === assetFilter);
            if (!isAssigned) return false;
        }

        if (stockFilter === "IN_STOCK" && part.quantityOnHand <= 0) return false;
        if (stockFilter === "OUT_OF_STOCK" && part.quantityOnHand > 0) return false;

        return true;
    }).sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 bg-muted/30 p-3 rounded-lg border">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, #, or manufacturer..."
                        className="pl-9 bg-background"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 sm:w-auto">
                    <Select value={assetFilter} onValueChange={setAssetFilter}>
                        <SelectTrigger className="w-[160px] bg-background">
                            <SelectValue placeholder="Filter by Asset" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Assets</SelectItem>
                            {assets.map(asset => (
                                <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    
                    <Select value={stockFilter} onValueChange={setStockFilter}>
                        <SelectTrigger className="w-[150px] bg-background">
                            <SelectValue placeholder="Stock Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Stock</SelectItem>
                            <SelectItem value="IN_STOCK">In Stock</SelectItem>
                            <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

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
                    {filteredParts.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground italic">
                                No parts match your filters.
                            </TableCell>
                        </TableRow>
                    )}
                    {filteredParts.map((part) => (
                        <TableRow key={part.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0 border">
                                        {part.image ? (
                                            <img src={part.image} alt={part.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <Package className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </div>
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
        </div>
    );
}
