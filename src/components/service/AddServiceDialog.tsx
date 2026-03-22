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
import { Plus, Trash2, Image as ImageIcon, Wrench, Bell } from "lucide-react";
import { createServiceRecord, updateServiceRecord } from "@/lib/actions/service";
import { getCompatibleParts } from "@/lib/actions/parts";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/common/ImageUpload";
import { Checkbox } from "@/components/ui/checkbox";
import { isScheduleDue } from "@/lib/predictions";

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
    fulfilledScheduleIds: z.array(z.string()).optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface AddServiceDialogProps {
    assetId: string;
    trackingMethod: string;
    assetType?: string;
    trigger?: React.ReactNode;
    serviceRecord?: any; // Existing record for editing
    schedules?: any[]; // For explicitly fulfilling reminders
}

export function AddServiceDialog({ assetId, trackingMethod, assetType, trigger, serviceRecord, schedules }: AddServiceDialogProps) {
    const [open, setOpen] = useState(false);
    const [availableParts, setAvailableParts] = useState<{ id: string; name: string; defaultCost: number; partNumber?: string | null }[]>([]);
    const isEditing = !!serviceRecord;

    const form = useForm<ServiceFormValues>({
        resolver: zodResolver(serviceSchema) as any,
        values: {
            date: serviceRecord ? new Date(serviceRecord.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            usageAtService: serviceRecord?.usageAtService ?? 0,
            summary: serviceRecord?.summary ?? "",
            notes: serviceRecord?.notes ?? "",
            totalCost: serviceRecord?.totalCost ?? 0,
            vendor: serviceRecord?.vendor ?? "",
            parts: serviceRecord?.parts?.map((p: any) => ({
                partId: p.partId,
                quantity: p.quantity,
                costPerUnit: p.costPerUnit,
            })) || [],
            image: serviceRecord?.attachments?.[0]?.url ?? "",
            fulfilledScheduleIds: [],
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
            const dataToSubmit = {
                ...values,
                assetId,
                date: new Date(values.date),
                fulfilledScheduleIds: values.fulfilledScheduleIds || [],
            };

            if (isEditing && serviceRecord) {
                await updateServiceRecord(serviceRecord.id, dataToSubmit);
                toast.success("Service record updated");
            } else {
                await createServiceRecord(dataToSubmit);
                toast.success("Service record added");
            }
            setOpen(false);
            if (!isEditing) form.reset();
        } catch (error) {
            toast.error(`Failed to ${isEditing ? "update" : "save"} service record`);
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

    const dateStr = form.watch("date");
    const usageStr = form.watch("usageAtService");

    // Dynamically calculate the due status of all schedules based on the inputs typed in the modal
    const processedSchedules = schedules?.map((schedule: any) => {
        const { isDue, reason } = isScheduleDue(schedule, new Date(dateStr || new Date()), Number(usageStr || 0));
        return { ...schedule, isDue, reason };
    }).sort((a: any, b: any) => (a.isDue === b.isDue ? 0 : a.isDue ? -1 : 1)) || [];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" className="gap-2">
                        <Wrench className="h-4 w-4" />
                        <span className="hidden sm:inline text-xs font-semibold">Add Service</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Service Record" : "Log Maintenance / Service"}</DialogTitle>
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
                            {assetType !== "House" && (
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
                            )}
                        </div>

                        {processedSchedules.length > 0 && (
                            <div className="p-4 bg-muted/30 border rounded-lg space-y-3">
                                <h4 className="font-medium text-sm flex items-center gap-2">
                                    <Bell className="h-4 w-4 text-primary" /> Fulfill Service Schedules
                                </h4>
                                <p className="text-xs text-muted-foreground leading-tight">
                                    Select the service schedules this record fulfills to automatically restart their next due interval.
                                </p>
                                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2">
                                    {processedSchedules.map((schedule: any) => (
                                        <FormField
                                            key={schedule.id}
                                            control={form.control}
                                            name="fulfilledScheduleIds"
                                            render={({ field }) => {
                                                const checked = field.value?.includes(schedule.id);
                                                return (
                                                    <FormItem className={`flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 ${schedule.isDue ? 'bg-red-50/10 border-red-100' : 'bg-background'}`}>
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={checked}
                                                                onCheckedChange={(isChecked: boolean) => {
                                                                    const current = field.value || [];
                                                                    const updated = isChecked
                                                                        ? [...current, schedule.id]
                                                                        : current.filter((id: string) => id !== schedule.id);
                                                                    field.onChange(updated);
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <div className="space-y-1 leading-none">
                                                            <FormLabel className="font-medium cursor-pointer flex items-center gap-2">
                                                                {schedule.name}
                                                                {schedule.isDue && <span className="text-[10px] text-destructive font-bold px-1.5 py-0.5 rounded-sm bg-red-100 uppercase tracking-wider">Due</span>}
                                                            </FormLabel>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {schedule.isDue ? (
                                                                    <span className="text-destructive font-medium">{schedule.reason}</span>
                                                                ) : (
                                                                    <span>Every {schedule.frequencyValue} {schedule.frequencyType === "Date" ? "days" : trackingMethod === "Mileage" ? "miles" : "hours"}</span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </FormItem>
                                                )
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

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
                            {form.formState.isSubmitting ? "Saving..." : (isEditing ? "Save Changes" : "Save Service Record")}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
