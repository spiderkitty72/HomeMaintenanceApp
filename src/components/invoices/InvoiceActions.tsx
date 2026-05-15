"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markInvoicePaid, markInvoiceUnpaid, deleteInvoice } from "@/lib/actions/invoices";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckCircle2, RotateCcw, Trash2 } from "lucide-react";

interface InvoiceActionsProps {
    invoiceId: string;
    status: string;
}

export function InvoiceActions({ invoiceId, status }: InvoiceActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    async function handleMarkPaid() {
        setLoading(true);
        try {
            await markInvoicePaid(invoiceId);
            toast.success("Invoice marked as paid");
        } catch {
            toast.error("Failed to update invoice");
        } finally {
            setLoading(false);
        }
    }

    async function handleMarkUnpaid() {
        setLoading(true);
        try {
            await markInvoiceUnpaid(invoiceId);
            toast.success("Invoice marked as unpaid");
        } catch {
            toast.error("Failed to update invoice");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        setLoading(true);
        try {
            await deleteInvoice(invoiceId);
            toast.success("Invoice deleted");
            router.push("/dashboard/invoices");
        } catch {
            toast.error("Failed to delete invoice");
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center gap-2">
            {status === "UNPAID" ? (
                <Button size="sm" onClick={handleMarkPaid} disabled={loading} className="gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Mark as Paid
                </Button>
            ) : (
                <Button size="sm" variant="outline" onClick={handleMarkUnpaid} disabled={loading} className="gap-2">
                    <RotateCcw className="h-4 w-4" /> Mark as Unpaid
                </Button>
            )}
            <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={loading}
                onClick={() => setDeleteOpen(true)}
            >
                <Trash2 className="h-4 w-4" />
            </Button>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Invoice?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete the invoice. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={loading}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                            {loading ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
