"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { createServiceRecord } from "@/lib/actions/service";
import { getCompatibleParts } from "@/lib/actions/parts";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/common/ImageUpload";

const serviceSchema = z.object({
    date: z.string(),
    usageAtService: z.coerce.number().min(0),
    summary: z.string().min(2, "Summary is required"),
    notes: z.string().optional(),
    totalCost: z.coerce.number().min(0),
    vendor: z.string().optional(),
    image: z.string().optional(),
    parts: z.array(z.object({
        partId: z.string().min(1, "Part is required"),
        quantity: z.coerce.number().min(0.001, "Quantity must be greater than 0"),
        costPerUnit: z.coerce.number().min(0),
    })),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface AddServiceDialogProps {
    assetId: string;
    trackingMethod: string;
    trigger?: React.ReactNode;
}

export function AddServiceDialog({ assetId, trackingMethod, trigger }: AddServiceDialogProps) {
    const [open, setOpen] = useState(false);
    const [availableParts, setAvailableParts] = useState<{ id: string; name: string; defaultCost: number; partNumber?: string | null }[]>([]);

    const form = useForm<ServiceFormValues>({
        resolver: zodResolver(serviceSchema) as any,
        defaultValues: {
            date: new Date().toISOString().split("T")[0],
            usageAtService: 0,
            summary: "",
            notes: "",
            totalCost: 0,
            vendor: "",
            parts: [],
        },
    });

    useEffect(() => {
        // @ts-ignore
        getCompatibleParts(assetId).then(setAvailableParts);
    }, [assetId]);

    useEffect(() => {
        const subscription = form.watch((value, { name, type }) => {
            if (name?.startsWith("parts") || name === "parts") {
                const totalPartsCost = value.parts?.reduce((sum, p) => {
                    return sum + (Number(p?.quantity || 0) * Number(p?.costPerUnit || 0));
                }, 0) || 0;

                // We only auto-update totalCost if it matches the previous parts sum 
                // to avoid overwriting manual labor entries, but the user asked to 
                // "add them up and update", so let's be more aggressive:
                form.setValue("totalCost", totalPartsCost);
            }
        });
        return () => subscription.unsubscribe();
    }, [form]);

    async function onSubmit(values: z.infer<typeof serviceSchema>) {
        try {
            await createServiceRecord({
                ...values,
                assetId,
                date: new Date(values.date),
            });
            toast.success("Service record added");
            setOpen(false);
            form.reset();
        } catch (error) {
            toast.error("Failed to add service record");
        }
    }

    const addPart = () => {
        const currentParts = form.getValues("parts");
        form.setValue("parts", [...currentParts, { partId: "", quantity: 1, costPerUnit: 0 }]);
    };

    const removePart = (index: number) => {
        const currentParts = form.getValues("parts");
        form.setValue("parts", currentParts.filter((_, i) => i !== index));
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm">
                        <Plus className="sm:mr-2 h-4 w-4" />
                        <span className="hidden sm:inline text-xs font-semibold">Add Service</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Log Maintenance / Service</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="usageAtService"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Usage ({trackingMethod})</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="any" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="summary"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Service Summary</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Oil Change, Tire Rotation" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="totalCost"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Total Cost ($)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="vendor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vendor / Shop</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Jiffy Lube" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <FormLabel>Parts Used</FormLabel>
                                <Button type="button" variant="outline" size="sm" onClick={addPart}>
                                    <Plus className="h-3 w-3 mr-1" /> Add Part
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {form.watch("parts").map((_, index) => (
                                    <div key={index} className="flex gap-3 items-end border p-3 rounded-md bg-muted/30">
                                        <FormField
                                            control={form.control}
                                            name={`parts.${index}.partId`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <Select
                                                        onValueChange={(value) => {
                                                            field.onChange(value);
                                                            const selectedPart = availableParts.find(p => p.id === value);
                                                            if (selectedPart) {
                                                                form.setValue(`parts.${index}.costPerUnit`, selectedPart.defaultCost);
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
                                                            {availableParts.map((p) => (
                                                                <SelectItem key={p.id} value={p.id}>
                                                                    {p.name} {p.partNumber ? `(${p.partNumber})` : ""}
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
                                            name={`parts.${index}.quantity`}
                                            render={({ field }) => (
                                                <FormItem className="w-20">
                                                    <FormControl>
                                                        <Input type="number" step="any" placeholder="Qty" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`parts.${index}.costPerUnit`}
                                            render={({ field }) => (
                                                <FormItem className="w-24">
                                                    <FormControl>
                                                        <Input type="number" step="0.01" placeholder="Cost" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive h-10 w-10"
                                            onClick={() => removePart(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {form.watch("parts").length === 0 && (
                                    <p className="text-xs text-center text-muted-foreground py-2 italic border border-dashed rounded-md">
                                        No parts logged with this service.
                                    </p>
                                )}
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="image"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Service Receipt / Photo</FormLabel>
                                    <FormControl>
                                        <ImageUpload
                                            onUpload={field.onChange}
                                            value={field.value}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Extra Notes</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Any additional details..." className="resize-none" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full">
                            Save Service Record
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
