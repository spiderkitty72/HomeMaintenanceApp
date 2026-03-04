"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Mail, Save, Send } from "lucide-react";
import { getSystemSetting, setSystemSetting } from "@/lib/actions/settings";
import { testSmtpConnection } from "@/lib/actions/email";
import { toast } from "sonner";

const smtpSchema = z.object({
    host: z.string().min(1, "SMTP Host is required"),
    port: z.string().min(1, "Port is required"),
    secure: z.boolean(),
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    fromAddress: z.string().email("Invalid 'From' address").min(1, "From address is required"),
});

export function AdminEmailSettings() {
    const [isLoading, setIsLoading] = useState(true);
    const [isTesting, setIsTesting] = useState(false);
    const [testEmail, setTestEmail] = useState("");

    const form = useForm<z.infer<typeof smtpSchema>>({
        resolver: zodResolver(smtpSchema),
        defaultValues: {
            host: "",
            port: "587",
            secure: false,
            username: "",
            password: "",
            fromAddress: "",
        },
    });

    useEffect(() => {
        async function loadSettings() {
            try {
                const settings = await getSystemSetting("smtp_config");
                if (settings) {
                    form.reset({
                        host: settings.host || "",
                        port: settings.port?.toString() || "587",
                        secure: settings.secure === true || String(settings.secure) === "true",
                        username: settings.username || "",
                        password: settings.password || "",
                        fromAddress: settings.fromAddress || "",
                    });
                }
            } catch (error) {
                console.error("Failed to load SMTP settings", error);
                toast.error("Failed to load email settings");
            } finally {
                setIsLoading(false);
            }
        }
        loadSettings();
    }, [form]);

    async function onSubmit(values: z.infer<typeof smtpSchema>) {
        try {
            await setSystemSetting("smtp_config", values);
            toast.success("SMTP Settings saved successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to save settings");
        }
    }

    async function handleTestEmail() {
        if (!testEmail || !/^\S+@\S+\.\S+$/.test(testEmail)) {
            toast.error("Please enter a valid email address to test.");
            return;
        }

        setIsTesting(true);
        try {
            await testSmtpConnection(testEmail);
            toast.success("Test email sent! Please check your inbox.");
        } catch (error: any) {
            toast.error(error.message || "Failed to send test email.");
        } finally {
            setIsTesting(false);
        }
    }

    if (isLoading) {
        return (
            <Card className="border-indigo-200 bg-indigo-50/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-indigo-600" />
                        Email / SMTP Configuration
                    </CardTitle>
                    <CardDescription>Loading settings...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="border-indigo-200 bg-indigo-50/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-indigo-600" />
                    Email / SMTP Configuration
                </CardTitle>
                <CardDescription>
                    Configure the email server used to send notifications and reports.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="host"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SMTP Host</FormLabel>
                                        <FormControl>
                                            <Input placeholder="smtp.gmail.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="port"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SMTP Port</FormLabel>
                                        <FormControl>
                                            <Input placeholder="587" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SMTP Username</FormLabel>
                                        <FormControl>
                                            <Input placeholder="user@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SMTP Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="fromAddress"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Default "From" Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="noreply@mycompany.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="secure"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-indigo-100 bg-white p-3 md:col-span-2 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel>Use Secure Connection (SSL/TLS)</FormLabel>
                                            <CardDescription className="text-xs">
                                                Enable if your mail server requires a secure connection on port 465.
                                            </CardDescription>
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
                        <div className="flex justify-end pt-2">
                            <Button type="submit" disabled={form.formState.isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
                                <Save className="h-4 w-4 mr-2" />
                                {form.formState.isSubmitting ? "Saving..." : "Save Settings"}
                            </Button>
                        </div>
                    </form>
                </Form>

                <div className="pt-6 border-t border-indigo-100 mt-6">
                    <h3 className="text-sm font-medium mb-3 text-indigo-900">Test Connection</h3>
                    <div className="flex gap-2 max-w-md">
                        <Input
                            placeholder="Email address to send test to..."
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                        />
                        <Button
                            variant="secondary"
                            onClick={handleTestEmail}
                            disabled={isTesting}
                            className="bg-white border hover:bg-indigo-50 border-indigo-200 text-indigo-700 whitespace-nowrap"
                        >
                            {isTesting ? (
                                "Sending..."
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Test
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
