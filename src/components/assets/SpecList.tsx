"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { deleteAssetSpec } from "@/lib/actions/specs";
import { AddSpecDialog } from "./AddSpecDialog";

interface SpecListProps {
    assetId: string;
    specs: any[]; // AssetSpec include specType
}

export function SpecList({ assetId, specs }: SpecListProps) {
    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this specification?")) return;
        try {
            await deleteAssetSpec(id, assetId);
            toast.success("Specification deleted successfully");
        } catch (error) {
            toast.error("Failed to delete specification");
        }
    }

    const [searchQuery, setSearchQuery] = useState("");

    const filteredSpecs = specs.filter((spec) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return spec.specType.name.toLowerCase().includes(q) || spec.value.toLowerCase().includes(q);
    }).sort((a, b) => a.specType.name.localeCompare(b.specType.name));

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Input
                    placeholder="Search specifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                />
                <div className="flex items-center gap-2">
                    <AddSpecDialog assetId={assetId} />
                </div>
            </div>

            {/* Mobile View: Cards */}
            <div className="md:hidden space-y-3">
                {filteredSpecs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-md bg-card">
                        No specifications match your search.
                    </div>
                ) : (
                    filteredSpecs.map((spec) => (
                        <div key={spec.id} className="p-4 border rounded-xl bg-card transition-colors">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center shrink-0 border relative">
                                        <SlidersHorizontal className="h-5 w-5 text-muted-foreground/50" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-black uppercase tracking-widest text-muted-foreground/80 mb-1">
                                            {spec.specType.name}
                                        </span>
                                        <div className="flex items-baseline gap-1.5 overflow-hidden">
                                            <span className="text-lg font-bold font-mono tracking-tight truncate">
                                                {spec.value}
                                            </span>
                                            {spec.specType.unit && (
                                                <span className="text-xs text-muted-foreground font-medium italic">
                                                    {spec.specType.unit}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <AddSpecDialog assetId={assetId} spec={spec} />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive transition-all"
                                        onClick={() => handleDelete(spec.id)}
                                        title="Delete Specification"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
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
                            <TableHead>Specification</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredSpecs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No specifications match your search.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSpecs.map((spec) => (
                                <TableRow key={spec.id}>
                                    <TableCell>
                                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center border relative">
                                            <SlidersHorizontal className="h-4 w-4 text-muted-foreground/50" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {spec.specType.name}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="font-bold font-mono tracking-tight">
                                                {spec.value}
                                            </span>
                                            {spec.specType.unit && (
                                                <span className="text-xs text-muted-foreground italic">
                                                    {spec.specType.unit}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end items-center gap-1">
                                            <AddSpecDialog assetId={assetId} spec={spec} />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-destructive transition-all"
                                                onClick={() => handleDelete(spec.id)}
                                                title="Delete Specification"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
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
