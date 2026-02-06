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
import { FolderPlus } from "lucide-react";
import { createGroup } from "@/lib/actions/groups";
import { toast } from "sonner";

const groupSchema = z.object({
    name: z.string().min(2, "Name is required"),
    description: z.string().optional(),
});

type GroupFormValues = z.infer<typeof groupSchema>;

export function AddGroupDialog() {
    const [open, setOpen] = useState(false);

    const form = useForm<GroupFormValues>({
        resolver: zodResolver(groupSchema) as any,
        defaultValues: {
            name: "",
            description: "",
        },
    });

    async function onSubmit(values: GroupFormValues) {
        try {
            await createGroup(values);
            toast.success("Group created successfully");
            setOpen(false);
            form.reset();
        } catch (error: any) {
            toast.error(error.message || "Failed to create group");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <FolderPlus className="h-4 w-4" /> New Group
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Permission Group</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Group Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Mechanics, Family" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Input placeholder="What is this group for?" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? "Creating..." : "Create Group"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
