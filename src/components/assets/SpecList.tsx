"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
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

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Asset Specifications</CardTitle>
                <AddSpecDialog assetId={assetId} />
            </CardHeader>
            <CardContent>
                {specs.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg bg-muted/10 border-dashed">
                        <p className="text-muted-foreground italic">No specifications added yet.</p>
                    </div>
                ) : (
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Specification</TableHead>
                                    <TableHead>Value</TableHead>
                                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {specs.map((spec) => (
                                    <TableRow key={spec.id}>
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
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
