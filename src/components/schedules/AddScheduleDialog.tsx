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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarClock, Plus } from "lucide-react";
import { createSchedule } from "@/lib/actions/schedules";
import { toast } from "sonner";

const scheduleSchema = z.object({
    name: z.string().min(2, "Name is required"),
    frequencyType: z.enum(["Date", "Mileage", "Hours"]),
    frequencyValue: z.coerce.number().min(1, "Frequency must be positive"),
    lastPerformedDate: z.string().optional(),
    lastPerformedUsage: z.coerce.number().optional(),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

interface AddScheduleDialogProps {
    assetId: string;
    trackingMethod: string;
    currentUsage: number;
}

export function AddScheduleDialog({ assetId, trackingMethod, currentUsage }: AddScheduleDialogProps) {
    const [open, setOpen] = useState(false);

    const form = useForm<ScheduleFormValues>({
        resolver: zodResolver(scheduleSchema) as any,
        defaultValues: {
            name: "",
            frequencyType: (trackingMethod === "DateOnly" ? "Date" : trackingMethod) as any,
            frequencyValue: trackingMethod === "Mileage" ? 5000 : 365,
            lastPerformedDate: new Date().toISOString().split("T")[0],
            lastPerformedUsage: currentUsage,
        },
    });

    async function onSubmit(values: ScheduleFormValues) {
        try {
            await createSchedule({
                ...values,
                assetId,
                lastPerformedDate: values.lastPerformedDate ? new Date(values.lastPerformedDate) : null,
            });
            toast.success("Schedule created");
            setOpen(false);
            form.reset();
        } catch (error) {
            toast.error("Failed to create schedule");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <CalendarClock className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Schedule</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Maintenance Schedule</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reminder Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Oil Change, Filter Swap" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="frequencyType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Track By</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Date">Date (Days)</SelectItem>
                                                <SelectItem value="Mileage">Mileage</SelectItem>
                                                <SelectItem value="Hours">Hours</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="frequencyValue"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Every...</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="border-t pt-4 space-y-4">
                            <h4 className="text-sm font-medium">Last Performed</h4>
                            <FormField
                                control={form.control}
                                name="lastPerformedDate"
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

                            {form.watch("frequencyType") !== "Date" && (
                                <FormField
                                    control={form.control}
                                    name="lastPerformedUsage"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Usage ({trackingMethod === "Mileage" ? "mi" : "hrs"})</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? "Saving..." : "Create Schedule"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
