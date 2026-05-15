"use client";

import { useState } from "react";
import { Package, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddPartDialog } from "@/components/parts/AddPartDialog";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface AssetPartsListProps {
    parts: any[];
    assets: any[];
    assetId: string;
    inventorySystems: any[];
}

export function AssetPartsList({ parts, assets, assetId, inventorySystems }: AssetPartsListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSystemId, setSelectedSystemId] = useState<string>(inventorySystems[0]?.id || "none");

    const filteredAndSortedParts = parts
        .filter((part) => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (
                part.name.toLowerCase().includes(q) ||
                (part.partNumber && part.partNumber.toLowerCase().includes(q)) ||
                (part.manufacturer && part.manufacturer.toLowerCase().includes(q))
            );
        })
        .sort((a, b) => a.name.localeCompare(b.name));

    if (parts.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground italic">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No parts assigned to this asset yet.</p>
                    <div className="mt-4 flex flex-col items-center gap-2">
                        <AddPartDialog assets={assets} preselectedAssetId={assetId} />
                        <Link href="/dashboard/parts" className="text-primary hover:underline text-sm font-medium">
                            Or browse Parts Catalog
                        </Link>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Input
                    placeholder="Search parts by name, number, or manufacturer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                />
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={selectedSystemId} onValueChange={setSelectedSystemId}>
                        <SelectTrigger className="w-[180px] bg-background">
                            <SelectValue placeholder="System" />
                        </SelectTrigger>
                        <SelectContent>
                            {inventorySystems.length === 0 && <SelectItem value="none">No Systems</SelectItem>}
                            {inventorySystems.map(system => (
                                <SelectItem key={system.id} value={system.id}>{system.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <AddPartDialog assets={assets} preselectedAssetId={assetId} />
                    <Link href="/dashboard/parts">
                        <Button variant="outline" size="sm" className="hidden sm:flex">
                            Go to Catalog
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Mobile View: Cards */}
            <div className="md:hidden space-y-3">
                {filteredAndSortedParts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-md">
                        No parts match your search.
                    </div>
                ) : (
                    filteredAndSortedParts.map((part) => (
                        <div key={part.id} className="p-4 border rounded-xl bg-card transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center shrink-0 border relative">
                                        {part.image ? (
                                            <img
                                                src={part.image}
                                                alt={part.name}
                                                className="h-full w-full object-cover rounded"
                                            />
                                        ) : (
                                            <Package className="h-5 w-5 text-muted-foreground/50" />
                                        )}
                                        {(() => {
                                            const systemItem = part.inventoryItems?.find((i: any) => i.inventorySystemId === selectedSystemId);
                                            const stock = systemItem?.quantityOnHand ?? 0;
                                            if (stock <= 0) return <AlertCircle className="h-4 w-4 text-destructive" />;
                                            return null;
                                        })()}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm leading-tight">{part.name}</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {part.manufacturer || "Unknown Mfg"} {part.partNumber && `• ${part.partNumber}`}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <AddPartDialog mode="edit" part={part} assets={assets} />
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-muted text-sm">
                                <div className="flex items-center gap-1.5">
                                    {(() => {
                                        const systemItem = part.inventoryItems?.find((i: any) => i.inventorySystemId === selectedSystemId);
                                        const stock = systemItem?.quantityOnHand ?? 0;
                                        const isTracked = !!systemItem;

                                        if (!isTracked && selectedSystemId !== "none") {
                                            return <span className="text-muted-foreground text-[10px] italic">Not tracked</span>;
                                        }

                                        return (
                                            <>
                                                <span className={`font-bold ${stock > 0 ? 'text-foreground' : 'text-destructive'}`}>
                                                    {stock}
                                                </span>
                                                <span className="text-xs text-muted-foreground uppercase">{part.unitOfMeasure}</span>
                                            </>
                                        );
                                    })()}
                                </div>
                                <div className="font-mono font-bold">
                                    ${part.defaultCost?.toFixed(2) || "0.00"}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop View: Standard Table */}
            <div className="hidden md:block rounded-md border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Part Name</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead>Cost</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedParts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No parts match your search.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAndSortedParts.map((part) => (
                                <TableRow key={part.id}>
                                    <TableCell>
                                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center border relative">
                                            {part.image ? (
                                                <img
                                                    src={part.image}
                                                    alt={part.name}
                                                    className="h-full w-full object-cover rounded"
                                                />
                                            ) : (
                                                <Package className="h-4 w-4 text-muted-foreground/50" />
                                            )}
                                            {(() => {
                                                const systemItem = part.inventoryItems?.find((i: any) => i.inventorySystemId === selectedSystemId);
                                                const stock = systemItem?.quantityOnHand ?? 0;
                                                if (stock <= 0) return <AlertCircle className="h-4 w-4 text-destructive" />;
                                                return null;
                                            })()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-bold">{part.name}</div>
                                        {part.compatibleType && (
                                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-muted/50 mt-1">
                                                {part.compatibleType}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-xs text-muted-foreground">
                                            {part.manufacturer || "Unknown Mfg"}
                                            {part.partNumber && <><br/>PN: {part.partNumber}</>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-xs font-mono text-muted-foreground">
                                            ${part.defaultCost?.toFixed(2) || "0.00"} / {part.unitOfMeasure}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            {(() => {
                                                const systemItem = part.inventoryItems?.find((i: any) => i.inventorySystemId === selectedSystemId);
                                                const stock = systemItem?.quantityOnHand ?? 0;
                                                const isTracked = !!systemItem;

                                                if (!isTracked && selectedSystemId !== "none") {
                                                    return <span className="text-muted-foreground text-[10px] italic">Not tracked</span>;
                                                }

                                                return (
                                                    <>
                                                        <span className={`text-sm font-bold ${stock > 0 ? 'text-foreground' : 'text-destructive font-black'}`}>
                                                            {stock}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground uppercase font-medium mt-1">
                                                            {part.unitOfMeasure}
                                                        </span>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <AddPartDialog mode="edit" part={part} assets={assets} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
