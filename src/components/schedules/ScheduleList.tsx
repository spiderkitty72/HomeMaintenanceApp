"use client";

import { useState } from "react";
import { ServiceSchedule } from "@prisma/client";
import { format, isBefore } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Trash2, AlertCircle } from "lucide-react";
import { deleteSchedule } from "@/lib/actions/schedules";
import { toast } from "sonner";
import { AddScheduleDialog } from "./AddScheduleDialog";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface ScheduleListProps {
    schedules: ServiceSchedule[];
    assetId: string;
    trackingMethod: string;
    currentUsage: number;
}

export function ScheduleList({ schedules, assetId, trackingMethod, currentUsage }: ScheduleListProps) {
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this schedule?")) return;
        try {
            await deleteSchedule(id, assetId);
            toast.success("Schedule deleted");
        } catch (error) {
            toast.error("Failed to delete schedule");
        }
    };

    const [searchQuery, setSearchQuery] = useState("");

    const filteredSchedules = schedules.filter((schedule) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return schedule.name.toLowerCase().includes(q);
    }).sort((a, b) => {
        if (a.nextDueUsage !== null && b.nextDueUsage !== null) {
            return a.nextDueUsage - b.nextDueUsage;
        }
        if (a.nextDueDate && b.nextDueDate) {
            return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
        }
        return 0;
    });

    if (schedules.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Calendar className="h-10 w-10 mb-2 opacity-20" />
                    <p>No maintenance reminders set.</p>
                    <div className="mt-4">
                        <AddScheduleDialog assetId={assetId} trackingMethod={trackingMethod} currentUsage={currentUsage} />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Input
                    placeholder="Search reminders by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                />
                <div className="flex items-center gap-2">
                    <AddScheduleDialog assetId={assetId} trackingMethod={trackingMethod} currentUsage={currentUsage} />
                </div>
            </div>

            {/* Mobile View: Cards */}
            <div className="md:hidden space-y-3">
                {filteredSchedules.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-md">
                        No reminders match your search.
                    </div>
                ) : (
                    filteredSchedules.map((schedule) => {
                        const isOverdue = schedule.nextDueUsage
                            ? currentUsage >= schedule.nextDueUsage
                            : schedule.nextDueDate
                                ? isBefore(new Date(schedule.nextDueDate), new Date())
                                : false;

                        const isWarning = !isOverdue && schedule.nextDueUsage
                            ? (schedule.nextDueUsage - currentUsage) < (schedule.frequencyValue * 0.1)
                            : false;

                        return (
                            <Card key={schedule.id} className={isOverdue ? "border-red-200 bg-red-50/10" : ""}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">{schedule.name}</h3>
                                            {isOverdue && (
                                                <Badge variant="destructive" className="gap-1">
                                                    <AlertCircle className="h-3 w-3" /> Overdue
                                                </Badge>
                                            )}
                                            {isWarning && (
                                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
                                                    Due Soon
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center">
                                                <Clock className="h-3 w-3 mr-1" />
                                                Every {schedule.frequencyValue} {schedule.frequencyType === "Date" ? "days" : trackingMethod === "Mileage" ? "miles" : "hours"}
                                            </div>

                                            {schedule.nextDueUsage && (
                                                <div className="flex items-center font-medium text-foreground">
                                                    Target: {schedule.nextDueUsage.toLocaleString()} {trackingMethod === "Mileage" ? "mi" : "hrs"}
                                                </div>
                                            )}

                                            {schedule.nextDueDate && (
                                                <div className="flex items-center text-primary font-medium">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    Est. {format(new Date(schedule.nextDueDate), "MMM d, yyyy")}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end items-center gap-1">
                                        <AddScheduleDialog assetId={assetId} trackingMethod={trackingMethod} currentUsage={currentUsage} schedule={schedule} />
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(schedule.id)} className="text-muted-foreground hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Desktop View: Standard Table */}
            <div className="hidden md:block rounded-md border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Reminder</TableHead>
                            <TableHead>Frequency</TableHead>
                            <TableHead>Target Usage</TableHead>
                            <TableHead>Est. Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredSchedules.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No reminders match your search.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSchedules.map((schedule) => {
                                const isOverdue = schedule.nextDueUsage
                                    ? currentUsage >= schedule.nextDueUsage
                                    : schedule.nextDueDate
                                        ? isBefore(new Date(schedule.nextDueDate), new Date())
                                        : false;

                                const isWarning = !isOverdue && schedule.nextDueUsage
                                    ? (schedule.nextDueUsage - currentUsage) < (schedule.frequencyValue * 0.1)
                                    : false;

                                return (
                                    <TableRow key={schedule.id} className={isOverdue ? "bg-red-50/10" : ""}>
                                        <TableCell className="font-medium">{schedule.name}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-muted-foreground text-sm">
                                                <Clock className="h-3 w-3 mr-1" />
                                                Every {schedule.frequencyValue} {schedule.frequencyType === "Date" ? "days" : trackingMethod === "Mileage" ? "miles" : "hours"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {schedule.nextDueUsage ? (
                                                <div className="font-bold">
                                                    {schedule.nextDueUsage.toLocaleString()} <span className="text-[10px] text-muted-foreground uppercase">{trackingMethod === "Mileage" ? "mi" : "hrs"}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">---</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {schedule.nextDueDate ? (
                                                <div className="flex items-center text-primary font-medium text-sm">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    {format(new Date(schedule.nextDueDate), "MMM d, yyyy")}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">---</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {isOverdue && (
                                                <Badge variant="destructive" className="gap-1">
                                                    <AlertCircle className="h-3 w-3" /> Overdue
                                                </Badge>
                                            )}
                                            {isWarning && (
                                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
                                                    Due Soon
                                                </Badge>
                                            )}
                                            {!isOverdue && !isWarning && (
                                                <Badge variant="outline" className="text-muted-foreground">Active</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-1">
                                                <AddScheduleDialog assetId={assetId} trackingMethod={trackingMethod} currentUsage={currentUsage} schedule={schedule} />
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(schedule.id)} className="text-muted-foreground hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
