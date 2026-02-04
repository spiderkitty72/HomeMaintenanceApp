import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Paperclip, Wrench } from "lucide-react";

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
}

export function ServiceList({ records, trackingMethod }: ServiceListProps) {
    const usageUnit = trackingMethod === "Mileage" ? "mi" : trackingMethod === "Hours" ? "hrs" : "";

    if (records.length === 0) {
        return (
            <div className="text-center py-12 border rounded-lg bg-muted/20">
                <Wrench className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground italic">No service records found for this asset.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Summary</TableHead>
                        <TableHead>Parts</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {records.map((record) => (
                        <TableRow key={record.id}>
                            <TableCell className="font-medium">
                                {format(new Date(record.date), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                                {record.usageAtService.toLocaleString()} {usageUnit}
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
                            <TableCell>
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
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
