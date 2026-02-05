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
import { AddFuelDialog } from "@/components/fuel/AddFuelDialog";
import { deleteFuelRecord } from "@/lib/actions/fuel";
import { toast } from "sonner";
import { Fuel, Trash2, Search, Calendar, User, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface AdminFuelListProps {
    records: any[];
}

export function AdminFuelList({ records }: AdminFuelListProps) {
    const [search, setSearch] = useState("");

    const filteredRecords = records.filter(record =>
        record.asset?.name.toLowerCase().includes(search.toLowerCase()) ||
        record.asset?.owner?.name?.toLowerCase().includes(search.toLowerCase()) ||
        record.asset?.owner?.email?.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this fuel record?")) return;

        try {
            await deleteFuelRecord(id);
            toast.success("Fuel record deleted");
        } catch (error: any) {
            toast.error(error.message || "Failed to delete record");
        }
    };

    return (
        <div className="space-y-4">
            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search asset or owner..."
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
                            <TableHead>Asset</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Cost</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRecords.map((record) => (
                            <TableRow key={record.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{format(new Date(record.date), "MMM d, yyyy")}</span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(record.date), "HH:mm")}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium text-blue-600 dark:text-blue-400">
                                        {record.asset?.name}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{record.asset?.owner?.name || "Unknown"}</span>
                                        <span className="text-xs text-muted-foreground">{record.asset?.owner?.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm font-medium">
                                        {record.gallons} gal
                                        {record.isFullTank && (
                                            <Badge variant="secondary" className="ml-1 text-[10px] px-1 h-4">Full</Badge>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">@{record.pricePerGallon.toFixed(3)}/gal</div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-semibold text-green-600 dark:text-green-400">
                                        ${record.totalCost.toFixed(2)}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <AddFuelDialog
                                            assetId={record.assetId}
                                            trackingMethod={record.asset.trackingMethod}
                                            fuelRecord={record}
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
                                    No fuel records found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
