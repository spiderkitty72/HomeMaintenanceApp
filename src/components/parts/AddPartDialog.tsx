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
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Edit2 } from "lucide-react";
import { createPart, updatePart } from "@/lib/actions/parts";
import { toast } from "sonner";
import { ASSET_TYPES } from "@/lib/constants";
import { ImageUpload } from "@/components/common/ImageUpload";

const partSchema = z.object({
    name: z.string().min(2, "Name is required"),
    partNumber: z.string().optional(),
    manufacturer: z.string().optional(),
    compatibleType: z.string().optional(),
    assetIds: z.array(z.string()),
    defaultCost: z.coerce.number().min(0).default(0),
    unitOfMeasure: z.string().min(1, "Unit of measure is required").default("pcs"),
    quantityOnHand: z.coerce.number().default(0),
    image: z.string().optional(),
});

type PartFormValues = z.infer<typeof partSchema>;

interface AddPartDialogProps {
    mode?: "add" | "edit";
    part?: any;
    assets: any[];
}

export function AddPartDialog({ mode = "add", part, assets }: AddPartDialogProps) {
    const [open, setOpen] = useState(false);

    const form = useForm<PartFormValues>({
        resolver: zodResolver(partSchema) as any,
        defaultValues: {
            name: part?.name || "",
            partNumber: part?.partNumber || "",
            manufacturer: part?.manufacturer || "",
            compatibleType: part?.compatibleType || "",
            assetIds: part?.compatibilities?.map((c: any) => c.assetId) || [],
            defaultCost: part?.defaultCost || 0,
            unitOfMeasure: part?.unitOfMeasure || "pcs",
            quantityOnHand: part?.quantityOnHand || 0,
            image: part?.image || "",
        },
    });

    async function onSubmit(values: PartFormValues) {
        try {
            const submissionValues = {
                ...values,
                compatibleType: values.compatibleType === "ALL" ? "" : values.compatibleType,
            };

            if (mode === "edit" && part) {
                await updatePart(part.id, submissionValues);
                toast.success("Part updated");
            } else {
                await createPart(submissionValues);
                toast.success("Part added to catalog");
            }
            setOpen(false);
            if (mode === "add") form.reset();
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {mode === "edit" ? (
                    <Button variant="ghost" size="icon">
                        <Edit2 className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" /> Add Part
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{mode === "edit" ? "Edit Part" : "Add New Part"}</DialogTitle>
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
                                    <FormLabel>Part Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Oil Filter, Brake Pad" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="manufacturer"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Manufacturer</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Bosch, Fram" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="partNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Part Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. PH7317" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="defaultCost"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Default Cost per Unit ($)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Auto-fills when logging service.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="unitOfMeasure"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unit of Measure</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. quarts, pcs, pkg" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="quantityOnHand"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantity on Hand</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="any" placeholder="0" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="assetIds"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Compatible Assets</FormLabel>
                                    <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-md">
                                        {assets.map((asset) => (
                                            <div key={asset.id} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`asset-${asset.id}`}
                                                    checked={field.value.includes(asset.id)}
                                                    onChange={(e) => {
                                                        const newValue = e.target.checked
                                                            ? [...field.value, asset.id]
                                                            : field.value.filter((id) => id !== asset.id);
                                                        field.onChange(newValue);
                                                    }}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                />
                                                <label
                                                    htmlFor={`asset-${asset.id}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    {asset.name}
                                                </label>
                                            </div>
                                        ))}
                                        {assets.length === 0 && (
                                            <div className="col-span-2 text-xs text-muted-foreground italic text-center py-2">
                                                No assets found to assign.
                                            </div>
                                        )}
                                    </div>
                                    <FormDescription>
                                        Alternatively, select a system type below.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="compatibleType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Broad System Compatibility</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type (Optional)" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.values(ASSET_TYPES).map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value="ALL">All / Generic</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? "Saving..." : mode === "edit" ? "Save Changes" : "Add to Catalog"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
