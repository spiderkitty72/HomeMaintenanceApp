"use client";

import { useEffect, useState, useTransition } from "react";
import { DatabaseBackup, Download, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createDatabaseBackup, getBackupOverview, saveBackupSettings } from "@/lib/actions/db";

type Overview = Awaited<ReturnType<typeof getBackupOverview>>;

const REASON_LABEL: Record<string, string> = { daily: "Daily", manual: "Manual", "pre-migrate": "Before update" };

function formatSize(bytes: number) {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function BackupsCard() {
    const [overview, setOverview] = useState<Overview | null>(null);
    const [enabled, setEnabled] = useState(true);
    const [time, setTime] = useState("03:00");
    const [keep, setKeep] = useState(30);
    const [isPending, startTransition] = useTransition();

    const apply = (data: Overview) => {
        setOverview(data);
        setEnabled(data.settings.enabled);
        setTime(data.settings.time);
        setKeep(data.settings.keep);
    };
    const load = async () => apply(await getBackupOverview());

    useEffect(() => {
        getBackupOverview()
            .then(apply)
            .catch(() => toast.error("Couldn't load backups"));
    }, []);

    const backupNow = () =>
        startTransition(async () => {
            try {
                const { name } = await createDatabaseBackup();
                toast.success(`Backup saved: ${name}`);
                await load();
            } catch {
                toast.error("Backup failed");
            }
        });

    const save = () =>
        startTransition(async () => {
            try {
                await saveBackupSettings({ enabled, time, keep, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
                toast.success("Backup settings saved");
                await load();
            } catch {
                toast.error("Couldn't save backup settings");
            }
        });

    const timeZone = typeof window === "undefined" ? "" : Intl.DateTimeFormat().resolvedOptions().timeZone;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DatabaseBackup className="h-5 w-5 text-primary" />
                    Database backups
                </CardTitle>
                <CardDescription>
                    Timestamped copies of the database, saved on the server next to it
                    {overview ? <> in <code className="text-xs">{overview.folder}</code></> : null}. A backup is also made automatically
                    before any update that changes the database.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-[auto_1fr_1fr_auto] sm:items-end">
                    <div className="flex items-center gap-3 sm:pb-2">
                        <Switch id="backup-enabled" checked={enabled} onCheckedChange={setEnabled} />
                        <Label htmlFor="backup-enabled">Daily backup</Label>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="backup-time">Time ({timeZone})</Label>
                        <Input id="backup-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={!enabled} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="backup-keep">Keep the newest</Label>
                        <Input id="backup-keep" type="number" min={1} max={365} value={keep} onChange={(e) => setKeep(Number(e.target.value))} />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={save} disabled={isPending}>
                            <Save className="h-4 w-4" />
                            Save
                        </Button>
                        <Button onClick={backupNow} disabled={isPending}>
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseBackup className="h-4 w-4" />}
                            Back up now
                        </Button>
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Backup</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Size</TableHead>
                                <TableHead className="w-[60px]" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!overview && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                        <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                                    </TableCell>
                                </TableRow>
                            )}
                            {overview?.backups.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-16 text-center text-sm text-muted-foreground">
                                        No backups yet.
                                    </TableCell>
                                </TableRow>
                            )}
                            {overview?.backups.map((b) => (
                                <TableRow key={b.name}>
                                    <TableCell>
                                        <div className="text-sm font-medium">{new Date(b.createdAt).toLocaleString()}</div>
                                        <div className="font-mono text-xs text-muted-foreground">{b.name}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={b.reason === "pre-migrate" ? "default" : "secondary"}>{REASON_LABEL[b.reason] ?? b.reason}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">{formatSize(b.size)}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" asChild title="Download">
                                            <a href={`/api/admin/backups/${encodeURIComponent(b.name)}`} download aria-label={`Download ${b.name}`}>
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <p className="text-xs text-muted-foreground">
                    Before-update backups are kept until you delete them. To restore, see “Restoring a backup” in the README.
                </p>
            </CardContent>
        </Card>
    );
}
