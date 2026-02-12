"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingBag, Calendar, User, Store } from "lucide-react";
import { deletePartPurchase } from "@/lib/actions/inventory";
import { toast } from "sonner";
import { format } from "date-fns";
import { EditPurchaseDialog } from "./EditPurchaseDialog";

interface AdminPurchaseListProps {
    purchases: any[];
}

export function AdminPurchaseList({ purchases }: AdminPurchaseListProps) {
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this purchase? This will also remove the items from inventory stock. This action cannot be undone.")) {
            return;
        }

        setIsDeleting(id);
        try {
            await deletePartPurchase(id);
            toast.success("Purchase deleted and inventory adjusted");
        } catch (error) {
            toast.error("Failed to delete purchase");
        } finally {
            setIsDeleting(null);
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Purchased By</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Total Cost</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {purchases.map((purchase) => (
                        <TableRow key={purchase.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    {format(new Date(purchase.date), "MMM d, yyyy")}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Store className="h-4 w-4 text-muted-foreground" />
                                    {purchase.vendor || "N/A"}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="flex items-center gap-1">
                                        <User className="h-3 w-3 text-muted-foreground" />
                                        {purchase.user.name}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground ml-4">{purchase.user.email}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-0.5">
                                    {purchase.items.map((item: any) => (
                                        <div key={item.id} className="text-xs">
                                            <span className="font-semibold">{item.quantity}</span> x {item.part.name}
                                        </div>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold">
                                ${purchase.totalCost.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                                <EditPurchaseDialog purchase={purchase} />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(purchase.id)}
                                    disabled={isDeleting === purchase.id}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {purchases.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                No purchase records found in the system.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
