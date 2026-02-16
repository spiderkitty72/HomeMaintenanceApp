"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Lock, Save } from "lucide-react";
import { updateSelf, changePassword } from "@/lib/actions/users";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

interface SettingsFormProps {
    user: {
        name: string | null;
        email: string | null;
    };
}

export function SettingsForm({ user }: SettingsFormProps) {
    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user.name || "",
            email: user.email || "",
        },
    });

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    async function onProfileSubmit(values: z.infer<typeof profileSchema>) {
        try {
            await updateSelf(values);
            toast.success("Profile updated successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to update profile");
        }
    }

    async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
        try {
            await changePassword({
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
            });
            toast.success("Password changed successfully");
            passwordForm.reset();
        } catch (error: any) {
            toast.error(error.message || "Failed to change password");
        }
    }

    return (
        <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" /> Profile
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" /> Security
                </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>
                            Update your name and email address. This information is visible within the application.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={profileForm.control}
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
                                        control={profileForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email Address</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="john@example.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit" className="gap-2" disabled={profileForm.formState.isSubmitting}>
                                        <Save className="h-4 w-4" />
                                        {profileForm.formState.isSubmitting ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Security</CardTitle>
                        <CardDescription>
                            Change your password. We recommend using a strong password that you don't use elsewhere.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6 max-w-md">
                                <FormField
                                    control={passwordForm.control}
                                    name="currentPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Current Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>New Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm New Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex justify-end">
                                    <Button type="submit" className="gap-2" disabled={passwordForm.formState.isSubmitting}>
                                        <Lock className="h-4 w-4" />
                                        {passwordForm.formState.isSubmitting ? "Changing..." : "Update Password"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
