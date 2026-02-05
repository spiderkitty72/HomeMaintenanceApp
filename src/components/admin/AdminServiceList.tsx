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
import { Badge } from "@/components/ui/badge";
import { AddServiceDialog } from "@/components/service/AddServiceDialog";
import { deleteServiceRecord } from "@/lib/actions/service";
import { toast } from "sonner";
import { Wrench, Trash2, Search, Calendar, User, Hammer, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface AdminServiceListProps {
    records: any[];
}

export function AdminServiceList({ records }: AdminServiceListProps) {
    const [search, setSearch] = useState("");

    const filteredRecords = records.filter(record =>
        record.summary.toLowerCase().includes(search.toLowerCase()) ||
        record.asset?.name.toLowerCase().includes(search.toLowerCase()) ||
        record.asset?.owner?.name?.toLowerCase().includes(search.toLowerCase()) ||
        record.asset?.owner?.email?.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this service record? Inventory for parts used will be refunded.")) return;

        try {
            await deleteServiceRecord(id);
            toast.success("Service record deleted");
        } catch (error: any) {
            toast.error(error.message || "Failed to delete record");
        }
    };

    return (
        <div className="space-y-4">
            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search summary, asset, or owner..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Service / Asset</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>Parts Used</TableHead>
                            <TableHead>Total Cost</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRecords.map((record) => (
                            <TableRow key={record.id}>
                                <TableCell>
                                    <div className="flex flex-col text-sm">
                                        <span className="font-medium">{format(new Date(record.date), "MMM d, yyyy")}</span>
                                        <span className="text-xs text-muted-foreground">{record.vendor || "No Vendor"}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium flex items-center gap-1 italic">
                                            <Hammer className="h-3 w-3" />
                                            {record.summary}
                                        </span>
                                        <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{record.asset?.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{record.asset?.owner?.name || "Unknown"}</span>
                                        <span className="text-xs text-muted-foreground">{record.asset?.owner?.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {record.parts?.length > 0 ? (
                                            record.parts.map((p: any) => (
                                                <Badge key={p.id} variant="outline" className="text-[10px] px-1 h-5">
                                                    {p.part?.name} (x{p.quantity})
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">No parts</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-semibold text-green-600 dark:text-green-400">
                                        ${record.totalCost.toFixed(2)}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <AddServiceDialog
                                            assetId={record.assetId}
                                            trackingMethod={record.asset.trackingMethod}
                                            serviceRecord={record}
                                            trigger={
                                                <Button size="icon" variant="ghost" className="h-8 w-8" title="Edit Record">
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            }
                                        />
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDelete(record.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredRecords.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No service records found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
