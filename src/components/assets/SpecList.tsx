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
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Specification</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {specs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">
                                    No specifications added yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            specs.map((spec) => (
                                <TableRow key={spec.id}>
                                    <TableCell className="font-medium">{spec.specType.name}</TableCell>
                                    <TableCell>{spec.value}</TableCell>
                                    <TableCell className="text-muted-foreground">{spec.specType.unit || "-"}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDelete(spec.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
