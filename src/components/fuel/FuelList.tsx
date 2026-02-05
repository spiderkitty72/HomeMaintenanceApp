"use client";

import { FuelRecord } from "@prisma/client";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fuel, Paperclip, ChevronRight, Calendar, Calculator, Banknote, Droplets, Tag, Gauge } from "lucide-react";
import Link from "next/link";

interface FuelListProps {
    records: FuelRecord[];
    trackingMethod: string;
}

export function FuelList({ records, trackingMethod }: FuelListProps) {
    if (records.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Fuel className="h-10 w-10 mb-2 opacity-20" />
                    <p>No fuel records logged yet.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* We can add mini-stats here later if passed from parent */}
            </div>

            <Card className="overflow-hidden border-none md:border md:border-border shadow-none md:shadow-sm">
                <CardHeader className="px-0 md:px-6">
                    <CardTitle className="text-lg font-medium">Fuel History</CardTitle>
                </CardHeader>
                <CardContent className="px-0 md:px-6">
                    {/* Mobile View: 2-Row Layout */}
                    <div className="md:hidden space-y-3">
                        {records.map((record, index) => {
                            let mpg = null;
                            const nextRecord = records[index + 1];
                            if (record.isFullTank && nextRecord && nextRecord.isFullTank) {
                                const distance = record.usageAtFill - nextRecord.usageAtFill;
                                if (distance > 0) {
                                    mpg = distance / record.gallons;
                                }
                            }

                            return (
                                <Link
                                    key={record.id}
                                    href={`/dashboard/fuel/${record.id}`}
                                    className="block p-4 border rounded-xl bg-card hover:bg-muted/30 transition-colors active:scale-[0.98]"
                                >
                                    <div className="flex flex-col space-y-3">
                                        {/* Row 1: Date, Usage, Total Cost */}
                                        <div className="flex justify-between items-center text-sm">
                                            <div className="flex items-center text-muted-foreground">
                                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                                {format(new Date(record.date), "MMM d, yyyy")}
                                            </div>
                                            <div className="flex items-center font-medium">
                                                <Calculator className="h-3.5 w-3.5 mr-1 text-primary" />
                                                {record.usageAtFill.toLocaleString()}
                                            </div>
                                            <div className="flex items-center font-bold text-base">
                                                <Banknote className="h-3.5 w-3.5 mr-1 text-green-600" />
                                                ${record.totalCost.toFixed(2)}
                                            </div>
                                        </div>

                                        {/* Row 2: Gallons, Price/Gal, MPG */}
                                        <div className="flex justify-between items-center pt-2 border-t border-muted">
                                            <div className="flex items-center text-xs text-muted-foreground">
                                                <Droplets className="h-3 w-3 mr-1" />
                                                {record.gallons.toFixed(3)} gal
                                            </div>
                                            <div className="flex items-center text-xs text-muted-foreground">
                                                <Tag className="h-3 w-3 mr-1" />
                                                ${record.pricePerGallon.toFixed(2)}/gal
                                            </div>
                                            <div className="flex items-center">
                                                {mpg ? (
                                                    <div className="flex items-center px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                                        <Gauge className="h-3 w-3 mr-1" />
                                                        <span className="text-xs font-bold">{mpg.toFixed(2)} MPG</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">No MPG</span>
                                                )}
                                                <ChevronRight className="h-4 w-4 ml-2 text-muted-foreground" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Desktop View: Standard Table */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>{trackingMethod}</TableHead>
                                    <TableHead>Gallons</TableHead>
                                    <TableHead>Price/Gal</TableHead>
                                    <TableHead>MPG</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="w-[100px] text-center">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {records.map((record, index) => {
                                    let mpg = null;
                                    const nextRecord = records[index + 1];
                                    if (record.isFullTank && nextRecord && nextRecord.isFullTank) {
                                        const distance = record.usageAtFill - nextRecord.usageAtFill;
                                        if (distance > 0) {
                                            mpg = distance / record.gallons;
                                        }
                                    }

                                    return (
                                        <TableRow key={record.id}>
                                            <TableCell>{format(new Date(record.date), "MMM d, yyyy")}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{record.usageAtFill.toLocaleString()}</div>
                                                {!record.isFullTank && <div className="text-[9px] text-muted-foreground uppercase font-bold">Partial</div>}
                                            </TableCell>
                                            <TableCell>{record.gallons.toFixed(3)} gal</TableCell>
                                            <TableCell>${record.pricePerGallon.toFixed(2)}</TableCell>
                                            <TableCell>
                                                {mpg ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-mono font-bold text-primary">{mpg.toFixed(2)}</span>
                                                        <span className="text-[9px] text-muted-foreground uppercase">avg mpg</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">---</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                ${record.totalCost.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center space-x-2">
                                                    {(record as any).attachments?.length > 0 && (
                                                        <a
                                                            href={(record as any).attachments[0].url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-muted-foreground hover:text-primary transition-colors"
                                                        >
                                                            <Paperclip className="h-4 w-4" />
                                                        </a>
                                                    )}
                                                    <Link
                                                        href={`/dashboard/fuel/${record.id}`}
                                                        className="text-xs text-primary hover:underline font-medium"
                                                    >
                                                        Details
                                                    </Link>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
