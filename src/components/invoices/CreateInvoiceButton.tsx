"use client";

import { useState } from "react";
import { createInvoice } from "@/lib/actions/invoices";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FileText, ExternalLink } from "lucide-react";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface CreateInvoiceButtonProps {
    serviceRecordId: string;
    inventorySystemId: string;
    inventorySystemName: string;
    existingInvoice: { id: string; invoiceNumber: string; status: string } | null;
}

export function CreateInvoiceButton({
    serviceRecordId,
    inventorySystemId,
    inventorySystemName,
    existingInvoice,
}: CreateInvoiceButtonProps) {
    const [open, setOpen] = useState(false);
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    if (existingInvoice) {
        return (
            <Link href={`/dashboard/invoices/${existingInvoice.id}`}>
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                    <FileText className="h-3.5 w-3.5" />
                    {existingInvoice.invoiceNumber}
                    <ExternalLink className="h-3 w-3 opacity-60" />
                </Button>
            </Link>
        );
    }

    async function handleCreate() {
        setLoading(true);
        try {
            await createInvoice(serviceRecordId, inventorySystemId, notes || undefined);
            toast.success("Invoice created");
            setOpen(false);
            setNotes("");
        } catch (e: any) {
            toast.error(e?.message || "Failed to create invoice");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                    <FileText className="h-3.5 w-3.5" /> Create Invoice — {inventorySystemName}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Create Invoice</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                    Creates an invoice for parts from <span className="font-medium text-foreground">{inventorySystemName}</span> used in this service record.
                </p>
                <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                        id="notes"
                        placeholder="Payment terms, reference number, etc."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="resize-none"
                        rows={3}
                    />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={loading}>
                        {loading ? "Creating..." : "Create Invoice"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
