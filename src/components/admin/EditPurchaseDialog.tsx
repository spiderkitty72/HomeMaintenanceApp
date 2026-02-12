"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2 } from "lucide-react";
import { toast } from "sonner";
import { updatePartPurchase } from "@/lib/actions/inventory";
import { format } from "date-fns";

interface EditPurchaseDialogProps {
    purchase: any;
}

export function EditPurchaseDialog({ purchase }: EditPurchaseDialogProps) {
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState(format(new Date(purchase.date), "yyyy-MM-dd"));
    const [vendor, setVendor] = useState(purchase.vendor || "");
    const [isPending, setIsPending] = useState(false);

    async function handleSubmit() {
        setIsPending(true);
        try {
            await updatePartPurchase(purchase.id, {
                date: new Date(date),
                vendor: vendor || undefined,
            });
            toast.success("Purchase updated successfully");
            setOpen(false);
        } catch (error) {
            toast.error("Failed to update purchase");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Edit2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Purchase Record</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">Date</div>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">Vendor</div>
                        <Input
                            placeholder="e.g. Amazon, AutoZone"
                            value={vendor}
                            onChange={(e) => setVendor(e.target.value)}
                        />
                    </div>

                    <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1">
                        <div className="font-bold uppercase tracking-tight text-muted-foreground mb-1">Items (Read Only)</div>
                        {purchase.items.map((item: any) => (
                            <div key={item.id} className="flex justify-between">
                                <span>{item.part.name} x{item.quantity}</span>
                                <span className="font-mono">${(item.quantity * item.costPerUnit).toFixed(2)}</span>
                            </div>
                        ))}
                        <div className="pt-2 border-t mt-2 flex justify-between font-bold">
                            <span>Total</span>
                            <span>${purchase.totalCost.toFixed(2)}</span>
                        </div>
                    </div>

                    <Button className="w-full" onClick={handleSubmit} disabled={isPending}>
                        {isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
