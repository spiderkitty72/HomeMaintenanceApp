"use client";

import { useState } from "react";
import {
    Database,
    Download,
    Upload,
    FileJson,
    AlertTriangle,
    CheckCircle2,
    Clock,
    ShieldAlert
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createDatabaseBackup, exportDatabaseJSON, importDatabaseJSON } from "@/lib/actions/db";
import { AdminEmailSettings } from "@/components/admin/AdminEmailSettings";

export function AdminSystemTab() {
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const handleBackup = async () => {
        setIsBackingUp(true);
        try {
            const result = await createDatabaseBackup();
            toast.success("Database backup created successfully on the server.");
        } catch (error) {
            toast.error("Failed to create database backup.");
            console.error(error);
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const data = await exportDatabaseJSON();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `maintenance-db-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success("Database exported to JSON.");
        } catch (error) {
            toast.error("Failed to export database.");
            console.error(error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const confirm = window.confirm("Are you sure you want to import this data? This will overwrite or merge with existing records based on ID. It is highly recommended to create a backup first.");
        if (!confirm) {
            e.target.value = "";
            return;
        }

        setIsImporting(true);
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const content = event.target?.result as string;
                    const data = JSON.parse(content);
                    await importDatabaseJSON(data);
                    toast.success("Data imported successfully!");
                } catch (err) {
                    toast.error("Invalid JSON file or import failed.");
                    console.error(err);
                } finally {
                    setIsImporting(false);
                    e.target.value = "";
                }
            };
            reader.readAsText(file);
        } catch (error) {
            toast.error("Failed to read file.");
            setIsImporting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-amber-200 bg-amber-50/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-amber-600" />
                        SQLite File Protection
                    </CardTitle>
                    <CardDescription>
                        Directly manage the SQLite database file on the server.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-white rounded-lg border border-amber-100 space-y-3">
                        <p className="text-sm text-amber-800 flex items-start gap-2">
                            <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
                            Creating a server-side backup copies your current `dev.db` to a `backups/` folder.
                        </p>
                        <Button
                            onClick={handleBackup}
                            disabled={isBackingUp}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            {isBackingUp ? (
                                <>
                                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                                    Creating Backup...
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4 mr-2" />
                                    System Snapshot (Daily/Manual)
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileJson className="h-5 w-5 text-blue-600" />
                        JSON Data Transfer
                    </CardTitle>
                    <CardDescription>
                        Portable data export and import. Best for schema migrations.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                        <Button
                            variant="outline"
                            onClick={handleExport}
                            disabled={isExporting}
                            className="w-full border-blue-200 hover:bg-blue-100"
                        >
                            {isExporting ? "Exporting..." : (
                                <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download JSON Export
                                </>
                            )}
                        </Button>

                        <div className="relative">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImport}
                                disabled={isImporting}
                                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                id="json-import"
                            />
                            <Button
                                variant="outline"
                                className="w-full border-blue-200 hover:bg-blue-100"
                                disabled={isImporting}
                            >
                                {isImporting ? "Importing..." : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Restore from JSON
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 text-xs bg-white/50 rounded border border-blue-100 text-blue-800">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-blue-600" />
                        <span>
                            **Important**: Exporting to JSON is the safest way to preserve data across significant schema changes or database moves.
                        </span>
                    </div>
                </CardContent>
            </Card>

            <div className="md:col-span-2">
                <AdminEmailSettings />
            </div>

            <Card className="md:col-span-2 border-green-200 bg-green-50/10">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Best Practices for Updates
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-4">
                        <li>Always **Download JSON Export** before making any manual changes to `schema.prisma`.</li>
                        <li>Use **System Snapshot** before running Prisma migrations in production.</li>
                        <li>If you lose data during an update, use **Restore from JSON** to bring your records back.</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
