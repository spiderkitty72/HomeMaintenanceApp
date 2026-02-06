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
import { Settings2, Trash2 } from "lucide-react";
import { updateGroup, deleteGroup } from "@/lib/actions/groups";
import { toast } from "sonner";

const groupSchema = z.object({
    name: z.string().min(2, "Name is required"),
    description: z.string().optional(),
});

type GroupFormValues = z.infer<typeof groupSchema>;

interface EditGroupDialogProps {
    group: {
        id: string;
        name: string;
        description?: string | null;
    };
}

export function EditGroupDialog({ group }: EditGroupDialogProps) {
    const [open, setOpen] = useState(false);

    const form = useForm<GroupFormValues>({
        resolver: zodResolver(groupSchema),
        defaultValues: {
            name: group.name,
            description: group.description || "",
        },
    });

    async function onSubmit(values: GroupFormValues) {
        try {
            await updateGroup(group.id, values);
            toast.success("Group updated successfully");
            setOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to update group");
        }
    }

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this group?")) return;
        try {
            await deleteGroup(group.id);
            toast.success("Group deleted");
            setOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to delete group");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Group: {group.name}</DialogTitle>
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

                        <div className="flex gap-2 pt-2">
                            <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
                            </Button>
                            <Button type="button" variant="destructive" size="icon" onClick={handleDelete}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
