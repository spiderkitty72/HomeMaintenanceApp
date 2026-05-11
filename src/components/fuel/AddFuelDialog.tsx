"use client";

import { useState, useRef } from "react";
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
import { Fuel, Plus, AlertTriangle } from "lucide-react";
import { createFuelRecord, updateFuelRecord } from "@/lib/actions/fuel";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const fuelSchema = z.object({
    date: z.string(),
    usageAtFill: z.coerce.number().min(0, "Usage must be positive"),
    gallons: z.coerce.number().min(0.01, "Gallons must be positive"),
    pricePerGallon: z.coerce.number().min(0.01, "Price must be positive"),
    totalCost: z.coerce.number().min(0, "Total cost must be positive"),
    isFullTank: z.boolean().default(true),
    missedPrevious: z.boolean().default(false),
    image: z.string().optional(),
});

type FuelFormValues = z.infer<typeof fuelSchema>;

interface AddFuelDialogProps {
    assetId: string;
    trackingMethod: string;
    lastUsage?: number;
    avgMpg?: number;
    trigger?: React.ReactNode;
    fuelRecord?: any; // To handle existing record for editing
}

export function AddFuelDialog({ assetId, trackingMethod, lastUsage, avgMpg, trigger, fuelRecord }: AddFuelDialogProps) {
    const [open, setOpen] = useState(false);
    const isEditing = !!fuelRecord;

    const form = useForm<FuelFormValues>({
        resolver: zodResolver(fuelSchema) as any,
        values: {
            date: fuelRecord ? new Date(fuelRecord.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            usageAtFill: fuelRecord?.usageAtFill ?? (lastUsage || 0),
            gallons: fuelRecord?.gallons ?? 0,
            pricePerGallon: fuelRecord?.pricePerGallon ?? 0,
            totalCost: fuelRecord?.totalCost ?? 0,
            isFullTank: fuelRecord?.isFullTank ?? true,
            missedPrevious: fuelRecord?.missedPrevious ?? false,
            image: fuelRecord?.attachments?.[0]?.url ?? "",
        },
    });

    const watchedUsage = form.watch("usageAtFill");
    const watchedGallons = form.watch("gallons");
    const watchedMissed = form.watch("missedPrevious");
    const watchedIsFull = form.watch("isFullTank");

    // Anomaly Detection
    let isAnomaly = false;
    let currentMpg = null;
    
    if (!watchedMissed && watchedIsFull && avgMpg && avgMpg > 0 && lastUsage && watchedUsage > lastUsage && watchedGallons > 0) {
        const distance = watchedUsage - lastUsage;
        currentMpg = distance / watchedGallons;
        
        // 50% threshold: e.g. if avg is 30, warning if > 45 or < 15
        if (currentMpg > avgMpg * 1.5 || currentMpg < avgMpg * 0.5) {
            isAnomaly = true;
        }
    }

    const editHistory = useRef<string[]>([]);

    const pushHistory = (field: string) => {
        editHistory.current = editHistory.current.filter((f) => f !== field);
        editHistory.current.push(field);
        if (editHistory.current.length > 3) {
            editHistory.current.shift();
        }
    };

    // Auto-calculate handlers
    const handleGallonsChange = (valStr: string) => {
        pushHistory("gallons");
        const val = parseFloat(valStr);
        if (!isNaN(val) && val > 0) {
            const price = Number(form.getValues("pricePerGallon")) || 0;
            const total = Number(form.getValues("totalCost")) || 0;
            const lastTwo = editHistory.current.slice(-2);

            if (!lastTwo.includes("totalCost") && price > 0) {
                form.setValue("totalCost", Number((val * price).toFixed(2)));
            } else if (!lastTwo.includes("pricePerGallon") && total > 0) {
                form.setValue("pricePerGallon", Number((total / val).toFixed(3)));
            } else if (price > 0) {
                form.setValue("totalCost", Number((val * price).toFixed(2)));
            } else if (total > 0) {
                form.setValue("pricePerGallon", Number((total / val).toFixed(3)));
            }
        }
    };

    const handlePriceChange = (valStr: string) => {
        pushHistory("pricePerGallon");
        const val = parseFloat(valStr);
        if (!isNaN(val) && val > 0) {
            const gallons = Number(form.getValues("gallons")) || 0;
            const total = Number(form.getValues("totalCost")) || 0;
            const lastTwo = editHistory.current.slice(-2);

            if (!lastTwo.includes("totalCost") && gallons > 0) {
                form.setValue("totalCost", Number((val * gallons).toFixed(2)));
            } else if (!lastTwo.includes("gallons") && total > 0) {
                form.setValue("gallons", Number((total / val).toFixed(3)));
            } else if (gallons > 0) {
                form.setValue("totalCost", Number((val * gallons).toFixed(2)));
            } else if (total > 0) {
                form.setValue("gallons", Number((total / val).toFixed(3)));
            }
        }
    };

    const handleTotalChange = (valStr: string) => {
        pushHistory("totalCost");
        const val = parseFloat(valStr);
        if (!isNaN(val) && val > 0) {
            const gallons = Number(form.getValues("gallons")) || 0;
            const price = Number(form.getValues("pricePerGallon")) || 0;
            const lastTwo = editHistory.current.slice(-2);

            if (!lastTwo.includes("pricePerGallon") && gallons > 0) {
                form.setValue("pricePerGallon", Number((val / gallons).toFixed(3)));
            } else if (!lastTwo.includes("gallons") && price > 0) {
                form.setValue("gallons", Number((val / price).toFixed(3)));
            } else if (gallons > 0) {
                form.setValue("pricePerGallon", Number((val / gallons).toFixed(3)));
            } else if (price > 0) {
                form.setValue("gallons", Number((val / price).toFixed(3)));
            }
        }
    };

    const handleZeroFocus = (field: any) => {
        if (field.value === 0 || field.value === "0") {
            field.onChange("");
        }
    };

    async function onSubmit(values: FuelFormValues) {
        try {
            if (isEditing) {
                await updateFuelRecord(fuelRecord.id, { ...values, assetId });
                toast.success("Fuel record updated");
            } else {
                await createFuelRecord({ ...values, assetId });
                toast.success("Fuel record added");
            }
            setOpen(false);
            if (!isEditing) form.reset();
        } catch (error) {
            toast.error(`Failed to ${isEditing ? "update" : "add"} fuel record`);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" className="gap-2">
                        <Fuel className="h-4 w-4" />
                        <span className="hidden sm:inline text-xs font-semibold">Log Fuel</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Fuel Record" : "Log Fuel Usage"}</DialogTitle>
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
                                        <Input 
                                            type="number" 
                                            step="any" 
                                            {...field} 
                                            value={field.value === 0 && !isEditing ? "" : field.value}
                                            onFocus={() => handleZeroFocus(field)}
                                        />
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
                                                value={field.value === 0 && !isEditing ? "" : field.value}
                                                onFocus={() => handleZeroFocus(field)}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    handleGallonsChange(e.target.value);
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
                                                value={field.value === 0 && !isEditing ? "" : field.value}
                                                onFocus={() => handleZeroFocus(field)}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    handlePriceChange(e.target.value);
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
                                        <Input 
                                            type="number" 
                                            step="0.01" 
                                            {...field} 
                                            value={field.value === 0 && !isEditing ? "" : field.value}
                                            onFocus={() => handleZeroFocus(field)}
                                            onChange={(e) => {
                                                field.onChange(e);
                                                handleTotalChange(e.target.value);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
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

                            <FormField
                                control={form.control}
                                name="missedPrevious"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel>Missed Prior Log?</FormLabel>
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
                        </div>

                        {isAnomaly && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Unusual Fuel Economy</AlertTitle>
                                <AlertDescription className="text-xs mt-1">
                                    Your calculated MPG ({currentMpg?.toFixed(1)}) is significantly different from your average ({avgMpg?.toFixed(1)}). Did you miss a previous fuel log? If so, please check the box above.
                                </AlertDescription>
                            </Alert>
                        )}

                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? (isEditing ? "Saving..." : "Logging...") : (isEditing ? "Save Changes" : "Log Fuel")}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
