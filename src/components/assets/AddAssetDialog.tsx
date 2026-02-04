"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ASSET_TYPES, TRACKING_METHODS } from "@/lib/constants";
import { createAsset } from "@/lib/actions/assets";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/common/ImageUpload";

const formSchema = z.object({
    name: z.string().min(2, "Name is required"),
    type: z.string(),
    trackingMethod: z.string(),
    currentUsage: z.coerce.number().min(0),
    image: z.string().optional(),
});

export function AddAssetDialog() {
    const [open, setOpen] = useState(false);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            type: ASSET_TYPES.CAR,
            trackingMethod: TRACKING_METHODS.MILEAGE,
            currentUsage: 0,
        },
    });

    const assetType = form.watch("type");

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            await createAsset(values);
            toast.success("Asset created successfully");
            setOpen(false);
            form.reset();
        } catch (error: any) {
            toast.error(error.message || "Failed to create asset");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" /> Add Asset
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Asset</DialogTitle>
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
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Asset Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. My Truck" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.values(ASSET_TYPES).map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {type}
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
                                name="trackingMethod"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tracking</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Tracking method" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.values(TRACKING_METHODS).map((method) => (
                                                    <SelectItem key={method} value={method}>
                                                        {method}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Dynamic Fields Section */}
                        <div className="p-4 bg-muted/50 rounded-lg space-y-4 border border-dashed">
                            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                                {assetType} Details
                            </p>
                            {assetType === ASSET_TYPES.CAR && (
                                <div className="grid grid-cols-2 gap-4">
                                    <Input placeholder="Make" />
                                    <Input placeholder="Model" />
                                    <Input placeholder="Year" type="number" />
                                    <Input placeholder="VIN" />
                                </div>
                            )}
                            {assetType === ASSET_TYPES.HOUSE && (
                                <div className="space-y-4">
                                    <Input placeholder="Address" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input placeholder="Year Built" type="number" />
                                        <Input placeholder="Sq Ft" type="number" />
                                    </div>
                                </div>
                            )}
                            {assetType === ASSET_TYPES.UTILITY && (
                                <div className="grid grid-cols-2 gap-4">
                                    <Input placeholder="Manufacturer" />
                                    <Input placeholder="Serial Number" />
                                </div>
                            )}
                        </div>

                        <FormField
                            control={form.control}
                            name="currentUsage"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Starting Usage (Odometer/Hours)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full">
                            Create Asset
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
