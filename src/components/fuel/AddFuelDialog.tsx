"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/common/ImageUpload";
import { Fuel, Plus } from "lucide-react";
import { createFuelRecord } from "@/lib/actions/fuel";
import { toast } from "sonner";

const fuelSchema = z.object({
    date: z.string(),
    usageAtFill: z.coerce.number().min(0, "Usage must be positive"),
    gallons: z.coerce.number().min(0.01, "Gallons must be positive"),
    pricePerGallon: z.coerce.number().min(0.01, "Price must be positive"),
    totalCost: z.coerce.number().min(0, "Total cost must be positive"),
    isFullTank: z.boolean().default(true),
    image: z.string().optional(),
});

type FuelFormValues = z.infer<typeof fuelSchema>;

interface AddFuelDialogProps {
    assetId: string;
    trackingMethod: string;
    lastUsage?: number;
}

export function AddFuelDialog({ assetId, trackingMethod, lastUsage }: AddFuelDialogProps) {
    const [open, setOpen] = useState(false);

    const form = useForm<FuelFormValues>({
        resolver: zodResolver(fuelSchema) as any,
        defaultValues: {
            date: new Date().toISOString().split("T")[0],
            usageAtFill: lastUsage || 0,
            gallons: 0,
            pricePerGallon: 0,
            totalCost: 0,
            isFullTank: true,
        },
    });

    // Auto-calculate total cost or price per gallon
    const watchedPrice = form.watch("pricePerGallon");
    const watchedGallons = form.watch("gallons");

    async function onSubmit(values: FuelFormValues) {
        try {
            await createFuelRecord({ ...values, assetId });
            toast.success("Fuel record added");
            setOpen(false);
            form.reset();
        } catch (error) {
            toast.error("Failed to add fuel record");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                    <Fuel className="h-4 w-4" />
                    <span className="hidden sm:inline">Log Fuel</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Log Fuel Usage</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="image"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <ImageUpload
                                            onUpload={field.onChange}
                                            value={field.value}
                                            label="Receipt Photo"
                                        />
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
                            name="usageAtFill"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{trackingMethod}</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="any" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="gallons"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Gallons</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.001"
                                                {...field}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    const val = parseFloat(e.target.value);
                                                    if (val && watchedPrice) {
                                                        form.setValue("totalCost", Number((val * watchedPrice).toFixed(2)));
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="pricePerGallon"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price/Gal</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.001"
                                                {...field}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    const val = parseFloat(e.target.value);
                                                    if (val && watchedGallons) {
                                                        form.setValue("totalCost", Number((val * watchedGallons).toFixed(2)));
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="totalCost"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Total Cost</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="isFullTank"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Full Tank?</FormLabel>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? "Logging..." : "Log Fuel"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
