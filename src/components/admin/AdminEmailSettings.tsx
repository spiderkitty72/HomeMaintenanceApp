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
import { testSmtpConnection, triggerManualReminders } from "@/lib/actions/email";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAYS_OF_WEEK = [
    { value: "0", label: "Sunday" },
    { value: "1", label: "Monday" },
    { value: "2", label: "Tuesday" },
    { value: "3", label: "Wednesday" },
    { value: "4", label: "Thursday" },
    { value: "5", label: "Friday" },
    { value: "6", label: "Saturday" },
];

const smtpSchema = z.object({
    host: z.string().min(1, "SMTP Host is required"),
    port: z.string().min(1, "Port is required"),
    secure: z.boolean(),
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    fromAddress: z.string().email("Invalid 'From' address").min(1, "From address is required"),
});

const reminderSchema = z.object({
    enabled: z.boolean(),
    dayOfWeek: z.string(),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    maxDaysToEstimate: z.coerce.number().min(0, "Must be positive"),
});

export function AdminEmailSettings() {
    const [isLoading, setIsLoading] = useState(true);
    const [isTesting, setIsTesting] = useState(false);
    const [isTriggering, setIsTriggering] = useState(false);
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

    const reminderForm = useForm<z.infer<typeof reminderSchema>>({
        resolver: zodResolver(reminderSchema) as any,
        defaultValues: {
            enabled: false,
            dayOfWeek: "1",
            time: "08:00",
            maxDaysToEstimate: 30,
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

                const reminderSettings = await getSystemSetting("reminder_schedule");
                if (reminderSettings) {
                    reminderForm.reset({
                        enabled: reminderSettings.enabled === true || String(reminderSettings.enabled) === "true",
                        dayOfWeek: reminderSettings.dayOfWeek?.toString() || "1",
                        time: reminderSettings.time || "08:00",
                        maxDaysToEstimate: reminderSettings.maxDaysToEstimate ?? 30,
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

    async function onReminderSubmit(values: z.infer<typeof reminderSchema>) {
        try {
            await setSystemSetting("reminder_schedule", {
                ...values,
                dayOfWeek: parseInt(values.dayOfWeek), // Save as number for the backend
            });
            toast.success("Reminder Schedule saved successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to save schedule");
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

    async function handleTriggerReminders() {
        setIsTriggering(true);
        try {
            const result = await triggerManualReminders();
            if (result.success) {
                toast.success(`Successfully ran reminders. Sent ${result.emailsSent} email(s).`);
            } else {
                toast.error(`Error running reminders: ${result.error}`);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to trigger reminders.");
        } finally {
            setIsTriggering(false);
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

                <div className="pt-8 border-t border-indigo-100 mt-8">
                    <h3 className="text-lg font-medium mb-1 text-indigo-900 flex items-center gap-2">
                        <Mail className="h-4 w-4" /> Automated Reminders Setup
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                        Configure when the system should automatically check the database and email users about upcoming (7 days out) or overdue maintenance.
                    </p>

                    <Form {...reminderForm}>
                        <form onSubmit={reminderForm.handleSubmit(onReminderSubmit)} className="space-y-4 max-w-2xl bg-white p-5 rounded-lg border border-indigo-100 shadow-sm">
                            <FormField
                                control={reminderForm.control}
                                name="enabled"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-indigo-50 p-3 bg-indigo-50/20">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-indigo-900">Enable Automated Reminders</FormLabel>
                                            <CardDescription className="text-xs text-indigo-700">
                                                Turn the background scheduling loop on or off.
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

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                <FormField
                                    control={reminderForm.control}
                                    name="dayOfWeek"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Day of the Week</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a day" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {DAYS_OF_WEEK.map(day => (
                                                        <SelectItem key={day.value} value={day.value}>
                                                            {day.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={reminderForm.control}
                                    name="time"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Time of Day (HH:MM)</FormLabel>
                                            <FormControl>
                                                <Input type="time" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={reminderForm.control}
                                    name="maxDaysToEstimate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Max Days to Estimate Usage</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="30" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex justify-between pt-4 mt-2 border-t border-indigo-50 items-center">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleTriggerReminders}
                                    disabled={isTriggering}
                                    className="text-xs h-8"
                                >
                                    {isTriggering ? "Running..." : "Run Reminder Logic Now"}
                                </Button>
                                <Button type="submit" disabled={reminderForm.formState.isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 h-8">
                                    <Save className="h-3 w-3 mr-2" />
                                    {reminderForm.formState.isSubmitting ? "Saving..." : "Save Schedule"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </CardContent>
        </Card>
    );
}
