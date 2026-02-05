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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {specs.map((spec) => (
                            <div
                                key={spec.id}
                                className="flex items-center justify-between p-4 border rounded-xl bg-card hover:border-primary/30 transition-all group"
                            >
                                <div className="flex flex-col min-w-0">
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
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                                    onClick={() => handleDelete(spec.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
