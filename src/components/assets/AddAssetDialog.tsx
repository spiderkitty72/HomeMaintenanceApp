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
import { createAsset, updateAsset } from "@/lib/actions/assets";
import { getUsersPublic } from "@/lib/actions/users";
import { Plus, Users, Trash2, FileText } from "lucide-react";
import { useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ImageUpload } from "@/components/common/ImageUpload";
import { Asset } from "@prisma/client";

const formSchema = z.object({
    name: z.string().min(2, "Name is required"),
    type: z.string(),
    trackingMethod: z.string(),
    currentUsage: z.coerce.number().min(0),
    image: z.string().optional(),
    details: z.record(z.string(), z.any()).default({}),
    sharedUserIds: z.array(z.string()).default([]),
    attachments: z.array(z.string()).default([]),
    customSpecs: z.array(z.object({ key: z.string(), value: z.string() })).default([]),
});

type FormValues = z.infer<typeof formSchema>;

interface AddAssetDialogProps {
    asset?: Asset;
    trigger?: React.ReactNode;
}

const PREDEFINED_KEYS = ['make', 'model', 'year', 'vin', 'fuelCapacity', 'address', 'buildDate', 'sqFt', 'manufacturer', 'serialNumber'];

export function AddAssetDialog({ asset, trigger }: AddAssetDialogProps) {
    const [open, setOpen] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            getUsersPublic().then(setAvailableUsers).catch(console.error);
        }
    }, [open]);

    const initialDetails = asset?.details ? JSON.parse(asset.details) : {};
    
    const initialCustomSpecs = Object.entries(initialDetails)
        .filter(([key]) => !PREDEFINED_KEYS.includes(key))
        .map(([key, value]) => ({ key, value: String(value) }));

    const initialAttachments = (asset as any)?.attachments?.map((a: any) => a.url) || [];

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        values: {
            name: asset?.name || "",
            type: asset?.type || ASSET_TYPES.CAR,
            trackingMethod: asset?.trackingMethod || TRACKING_METHODS.MILEAGE,
            currentUsage: asset?.currentUsage || 0,
            image: asset?.image || "",
            details: initialDetails,
            sharedUserIds: (asset as any)?.sharedWith?.map((s: any) => s.userId) || [],
            attachments: initialAttachments,
            customSpecs: initialCustomSpecs,
        },
    });

    const isEditing = !!asset;

    const assetType = form.watch("type");
    const attachments = form.watch("attachments");
    const customSpecs = form.watch("customSpecs");

    async function onSubmit(values: FormValues) {
        try {
            const finalDetails: any = {};
            PREDEFINED_KEYS.forEach(key => {
                if (values.details[key] !== undefined && values.details[key] !== "") {
                    finalDetails[key] = values.details[key];
                }
            });
            values.customSpecs.forEach(spec => {
                if (spec.key.trim()) {
                    finalDetails[spec.key.trim()] = spec.value;
                }
            });

            const dataToSubmit = {
                ...values,
                details: JSON.stringify(finalDetails),
            };
            // @ts-ignore
            delete dataToSubmit.customSpecs;

            if (isEditing && asset) {
                await updateAsset(asset.id, dataToSubmit as any);
                toast.success("Asset updated successfully");
            } else {
                await createAsset(dataToSubmit as any);
                toast.success("Asset created successfully");
            }
            setOpen(false);
            if (!isEditing) form.reset();
        } catch (error: any) {
            toast.error(error.message || `Failed to ${isEditing ? "update" : "create"} asset`);
        }
    }

    const addAttachment = (url: string) => {
        if (url) {
            form.setValue("attachments", [...attachments, url]);
        }
    };

    const removeAttachment = (index: number) => {
        form.setValue("attachments", attachments.filter((_, i) => i !== index));
    };

    const addCustomSpec = () => {
        form.setValue("customSpecs", [...customSpecs, { key: "", value: "" }]);
    };

    const removeCustomSpec = (index: number) => {
        form.setValue("customSpecs", customSpecs.filter((_, i) => i !== index));
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" /> Add Asset
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Asset" : "Add New Asset"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="image"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Main Image (Dashboard & Card Default)</FormLabel>
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
                                    <FormField
                                        control={form.control}
                                        name="details.make"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input placeholder="Make" {...field} value={field.value ?? ""} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="details.model"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input placeholder="Model" {...field} value={field.value ?? ""} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="details.year"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input placeholder="Year" type="number" {...field} value={field.value ?? ""} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="details.vin"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input placeholder="VIN" {...field} value={field.value ?? ""} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="details.fuelCapacity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input placeholder="Fuel Capacity (Gal)" type="number" step="0.1" {...field} value={field.value ?? ""} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}
                            {assetType === ASSET_TYPES.HOUSE && (
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="details.address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input placeholder="Address" {...field} value={field.value ?? ""} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="details.buildDate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input type="date" aria-label="Build Date" title="Build Date" {...field} value={field.value ?? ""} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="details.sqFt"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input placeholder="Sq Ft" type="number" {...field} value={field.value ?? ""} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            )}
                            {assetType === ASSET_TYPES.UTILITY && (
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="details.manufacturer"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input placeholder="Manufacturer" {...field} value={field.value ?? ""} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="details.serialNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input placeholder="Serial Number" {...field} value={field.value ?? ""} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Custom Specifications */}
                        <div className="space-y-4 pt-2 border-t">
                            <div className="flex items-center justify-between">
                                <FormLabel className="flex items-center gap-2">
                                    Custom Specifications
                                </FormLabel>
                                <Button type="button" variant="outline" size="sm" onClick={addCustomSpec}>
                                    <Plus className="h-3 w-3 mr-1" /> Add Spec
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {customSpecs.map((_, index) => (
                                    <div key={index} className="flex gap-2 items-start">
                                        <FormField
                                            control={form.control}
                                            name={`customSpecs.${index}.key`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <Input placeholder="e.g. Insurance Policy" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`customSpecs.${index}.value`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <Input placeholder="Value" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive h-10 w-10 shrink-0"
                                            onClick={() => removeCustomSpec(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {customSpecs.length === 0 && (
                                    <p className="text-xs text-muted-foreground italic border border-dashed rounded-md p-3 text-center">
                                        No custom specifications added.
                                    </p>
                                )}
                            </div>
                        </div>

                        {assetType !== ASSET_TYPES.HOUSE && (
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
                        )}

                        {/* Multiple Pictures Section */}
                        <div className="space-y-4 pt-2 border-t">
                            <FormLabel className="flex items-center gap-2">
                                Photos & Documents
                            </FormLabel>
                            <div className="grid grid-cols-2 gap-4">
                                {attachments.map((url, index) => {
                                    const isImage = (u: string) => {
                                        const ext = u.split(".").pop()?.toLowerCase();
                                        return ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext || "");
                                    };
                                    const getFileDisplayLabel = (u: string) => {
                                        const fileName = u.split("/").pop() || "";
                                        const ext = fileName.split(".").pop()?.toUpperCase() || "";
                                        return ext ? `${ext} Document` : "Document";
                                    };
                                    const isImg = isImage(url);

                                    return (
                                        <div key={index} className="relative aspect-video rounded-lg overflow-hidden border bg-muted flex flex-col items-center justify-center p-3">
                                            {isImg ? (
                                                <img src={url} alt={`Attachment ${index + 1}`} className="w-full h-full object-cover absolute inset-0" />
                                            ) : (
                                                <>
                                                    <FileText className="h-8 w-8 text-primary mb-1" />
                                                    <span className="text-xs font-semibold text-foreground text-center truncate w-full px-2">
                                                        {getFileDisplayLabel(url)}
                                                    </span>
                                                </>
                                            )}
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-1 right-1 h-6 w-6 rounded-full z-10 shadow"
                                                onClick={() => removeAttachment(index)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                            <ImageUpload 
                                onUpload={addAttachment} 
                                label="Upload a photo or document" 
                                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                            />
                        </div>

                        {/* Sharing Section */}
                        <div className="space-y-3 pt-2 border-t">
                            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase">
                                <Users className="h-4 w-4" />
                                Share with Users
                            </div>
                            <FormField
                                control={form.control}
                                name="sharedUserIds"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto p-3 border rounded-md">
                                            {availableUsers.map((user) => (
                                                <div key={user.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`user-${user.id}`}
                                                        checked={field.value.includes(user.id)}
                                                        onCheckedChange={(checked) => {
                                                            const newValue = checked
                                                                ? [...field.value, user.id]
                                                                : field.value.filter((id) => id !== user.id);
                                                            field.onChange(newValue);
                                                        }}
                                                    />
                                                    <label
                                                        htmlFor={`user-${user.id}`}
                                                        className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                        {user.name} <span className="text-xs text-muted-foreground">({user.email})</span>
                                                    </label>
                                                </div>
                                            ))}
                                            {availableUsers.length === 0 && (
                                                <p className="text-xs text-muted-foreground italic text-center py-2">
                                                    No other users found to share with.
                                                </p>
                                            )}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <Button type="submit" className="w-full">
                            {isEditing ? "Save Changes" : "Create Asset"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
