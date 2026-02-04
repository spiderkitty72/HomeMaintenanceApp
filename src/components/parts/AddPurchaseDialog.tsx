"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { ShoppingCart, Plus, Loader2 } from "lucide-react";
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

const purchaseSchema = z.object({
    partId: z.string().min(1, "Please select a part"),
    quantity: z.coerce.number().min(0.001, "Quantity must be greater than 0"),
    costPerUnit: z.coerce.number().min(0, "Cost must be 0 or greater"),
    date: z.string().min(1, "Date is required"),
    image: z.string().optional(),
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
            partId: "",
            quantity: 1,
            costPerUnit: 0,
            date: new Date().toISOString().split("T")[0],
            image: "",
        },
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

    const selectedPartId = form.watch("partId");
    const selectedPart = parts.find(p => p.id === selectedPartId);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <ShoppingCart className="h-4 w-4" /> Log Purchase
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Log Part Purchase</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="partId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Part</FormLabel>
                                    <Select
                                        onValueChange={(val) => {
                                            field.onChange(val);
                                            const p = parts.find(x => x.id === val);
                                            if (p) {
                                                form.setValue("costPerUnit", p.defaultCost);
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

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantity {selectedPart ? `(${selectedPart.unitOfMeasure})` : ""}</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="any" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="costPerUnit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cost per Unit ($)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

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
                                        Optional photo of the receipt.
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
