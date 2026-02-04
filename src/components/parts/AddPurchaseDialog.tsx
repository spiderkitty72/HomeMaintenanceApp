"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Plus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createPartPurchase } from "@/lib/actions/inventory";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/common/ImageUpload";

const purchaseItemSchema = z.object({
    partId: z.string().min(1, "Please select a part"),
    quantity: z.coerce.number().min(0.001, "Quantity must be greater than 0"),
    costPerUnit: z.coerce.number().min(0, "Cost must be 0 or greater"),
});

const purchaseSchema = z.object({
    vendor: z.string().optional(),
    date: z.string().min(1, "Date is required"),
    image: z.string().optional(),
    items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

interface AddPurchaseDialogProps {
    parts: any[];
}

export function AddPurchaseDialog({ parts }: AddPurchaseDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<PurchaseFormValues>({
        resolver: zodResolver(purchaseSchema) as any,
        defaultValues: {
            vendor: "",
            date: new Date().toISOString().split("T")[0],
            image: "",
            items: [{ partId: "", quantity: 1, costPerUnit: 0 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    async function onSubmit(values: PurchaseFormValues) {
        setIsSubmitting(true);
        try {
            await createPartPurchase({
                ...values,
                date: new Date(values.date),
            });
            toast.success("Purchase logged and inventory updated");
            setOpen(false);
            form.reset();
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    }

    const addItem = () => {
        append({ partId: "", quantity: 1, costPerUnit: 0 });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <ShoppingCart className="h-4 w-4" /> Log Purchase
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Log Part Purchase</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="vendor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vendor / Store</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Amazon, AutoZone" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Purchase Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <FormLabel>Items</FormLabel>
                                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                    <Plus className="h-3 w-3 mr-1" /> Add Item
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex gap-3 items-end border p-3 rounded-md bg-muted/30">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.partId`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormLabel className={index > 0 ? "sr-only" : ""}>Part</FormLabel>
                                                    <Select
                                                        onValueChange={(val) => {
                                                            field.onChange(val);
                                                            const p = parts.find(x => x.id === val);
                                                            if (p) {
                                                                form.setValue(`items.${index}.costPerUnit`, p.defaultCost);
                                                            }
                                                        }}
                                                        defaultValue={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a part" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {parts.map((part) => (
                                                                <SelectItem key={part.id} value={part.id}>
                                                                    {part.name} {part.partNumber ? `(${part.partNumber})` : ""}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.quantity`}
                                            render={({ field }) => (
                                                <FormItem className="w-24">
                                                    <FormLabel className={index > 0 ? "sr-only" : ""}>Qty</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="any" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.costPerUnit`}
                                            render={({ field }) => (
                                                <FormItem className="w-24">
                                                    <FormLabel className={index > 0 ? "sr-only" : ""}>Price ($)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.01" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="image"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Receipt Photo</FormLabel>
                                    <FormControl>
                                        <ImageUpload
                                            value={field.value}
                                            onUpload={field.onChange}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Shared by all items in this purchase.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                "Record Purchase"
                            )}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
