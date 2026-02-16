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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Settings2, KeyRound, Lock, UserCog } from "lucide-react";
import { updateUser, adminResetPassword } from "@/lib/actions/users";
import { toast } from "sonner";

const userSchema = z.object({
    email: z.string().email("Invalid email"),
    name: z.string().min(2, "Name is required"),
    role: z.enum(["ADMIN", "USER"]),
});

type UserFormValues = z.infer<typeof userSchema>;

interface EditUserDialogProps {
    user: {
        id: string;
        email: string;
        name: string;
        role: "ADMIN" | "USER";
    };
}

export function EditUserDialog({ user }: EditUserDialogProps) {
    const [open, setOpen] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [isResetting, setIsResetting] = useState(false);

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            email: user.email,
            name: user.name || "",
            role: user.role,
        },
    });

    async function handleResetPassword() {
        if (!newPassword || newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setIsResetting(true);
        try {
            await adminResetPassword(user.id, newPassword);
            toast.success("Password reset successfully");
            setNewPassword("");
        } catch (error: any) {
            toast.error(error.message || "Failed to reset password");
        } finally {
            setIsResetting(false);
        }
    }

    async function onSubmit(values: UserFormValues) {
        try {
            await updateUser(user.id, values);
            toast.success("User updated successfully");
            setOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to update user");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit User: {user.name}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="john@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>System Role</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="USER">User (Standard Access)</SelectItem>
                                            <SelectItem value="ADMIN">Admin (Full Control)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </form>
                </Form>

                <div className="my-4 border-t" />

                <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-primary">
                        <KeyRound className="h-4 w-4" />
                        <h3 className="text-sm font-semibold">Administrative Reset</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Reset this user's password. They will need to use this new password for their next sign-in.
                    </p>
                    <div className="flex space-x-2">
                        <Input
                            type="password"
                            placeholder="New password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <Button
                            variant="outline"
                            onClick={handleResetPassword}
                            disabled={isResetting || !newPassword}
                        >
                            {isResetting ? "Resetting..." : "Reset"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
