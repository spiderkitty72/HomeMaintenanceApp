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
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {records.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell>{format(new Date(record.date), "MMM d, yyyy")}</TableCell>
                                    <TableCell>{record.usageAtFill.toLocaleString()}</TableCell>
                                    <TableCell>{record.gallons.toFixed(3)} gal</TableCell>
                                    <TableCell>${record.pricePerGallon.toFixed(2)}</TableCell>
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
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
