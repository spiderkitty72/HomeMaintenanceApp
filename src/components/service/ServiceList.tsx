import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Paperclip, Wrench, ChevronRight, Calculator, Calendar } from "lucide-react";
import Link from "next/link";
import { formatHouseUsage } from "@/lib/utils";

interface ServiceRecordWithParts {
    id: string;
    date: Date;
    usageAtService: number;
    summary: string;
    totalCost: number;
    vendor: string | null;
    parts: {
        id: string;
        quantity: number;
        part: {
            name: string;
        };
    }[];
    attachments?: {
        url: string;
    }[];
}

interface ServiceListProps {
    records: ServiceRecordWithParts[];
    trackingMethod: string;
    assetType?: string;
}

export function ServiceList({ records, trackingMethod, assetType }: ServiceListProps) {
    const isHouse = assetType === "House";
    const usageUnit = isHouse ? "" : trackingMethod === "Mileage" ? "mi" : trackingMethod === "Hours" ? "hrs" : "";

    if (records.length === 0) {
        return (
            <div className="text-center py-12 border rounded-lg bg-muted/20">
                <Wrench className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground italic">No service records found for this asset.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Mobile View: 2-Row Layout */}
            <div className="md:hidden space-y-3">
                {records.map((record) => (
                    <Link
                        key={record.id}
                        href={`/dashboard/service/${record.id}`}
                        className="block p-4 border rounded-xl bg-card hover:bg-muted/30 transition-colors active:scale-[0.98]"
                    >
                        <div className="flex flex-col space-y-3">
                            {/* Row 1: Date and Usage */}
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                    {format(new Date(record.date), "MMM d, yyyy")}
                                </div>
                                <div className="flex items-center font-medium">
                                    <Calculator className="h-3.5 w-3.5 mr-1.5 text-primary" />
                                    {isHouse ? formatHouseUsage(record.usageAtService) : record.usageAtService.toLocaleString()} {usageUnit}
                                </div>
                            </div>

                            {/* Row 2: Summary and Cost */}
                            <div className="flex justify-between items-end">
                                <div className="flex-1 min-w-0 pr-4">
                                    <p className="font-semibold text-base truncate">{record.summary}</p>
                                    {record.vendor && <p className="text-xs text-muted-foreground truncate">at {record.vendor}</p>}
                                </div>
                                <div className="text-right">
                                    <p className="font-mono font-bold text-lg">${record.totalCost.toFixed(2)}</p>
                                    <div className="flex items-center justify-end text-[10px] text-primary mt-1">
                                        View Details <ChevronRight className="h-3 w-3 ml-0.5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Desktop View: Standard Table */}
            <div className="hidden md:block rounded-md border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Usage</TableHead>
                            <TableHead>Summary</TableHead>
                            <TableHead>Parts</TableHead>
                            <TableHead className="text-right">Cost</TableHead>
                            <TableHead className="w-[100px] text-center">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {records.map((record) => (
                            <TableRow key={record.id}>
                                <TableCell className="font-medium">
                                    {format(new Date(record.date), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell>
                                    {isHouse ? formatHouseUsage(record.usageAtService) : record.usageAtService.toLocaleString()} {usageUnit}
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <p className="font-medium">{record.summary}</p>
                                        {record.vendor && <p className="text-xs text-muted-foreground">at {record.vendor}</p>}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {record.parts.map((p) => (
                                            <span
                                                key={p.id}
                                                className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary border border-primary/20"
                                            >
                                                {p.part.name} (x{p.quantity})
                                            </span>
                                        ))}
                                        {record.parts.length === 0 && <span className="text-xs text-muted-foreground italic">None</span>}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                    ${record.totalCost.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex items-center justify-center space-x-2">
                                        {record.attachments && record.attachments.length > 0 && (
                                            <a
                                                href={record.attachments[0].url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                <Paperclip className="h-4 w-4" />
                                            </a>
                                        )}
                                        <Link
                                            href={`/dashboard/service/${record.id}`}
                                            className="text-xs text-primary hover:underline font-medium"
                                        >
                                            View
                                        </Link>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
