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
import { Fuel, Paperclip } from "lucide-react";

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

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Fuel History</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>{trackingMethod}</TableHead>
                                <TableHead>Gallons</TableHead>
                                <TableHead>Price/Gal</TableHead>
                                <TableHead>MPG</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {records.map((record, index) => {
                                // Calculate MPG: (Difference in Usage) / Gallons at Current Fill
                                // Only possible if current AND previous (next in list) were full tanks
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
                                        <TableCell>
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
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
