"use client";

import { ServiceSchedule } from "@prisma/client";
import { format, isBefore, addDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Trash2, AlertCircle } from "lucide-react";
import { deleteSchedule } from "@/lib/actions/schedules";
import { toast } from "sonner";

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

    if (schedules.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Calendar className="h-10 w-10 mb-2 opacity-20" />
                    <p>No maintenance schedules set.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {schedules.map((schedule) => {
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

                            <Button variant="ghost" size="icon" onClick={() => handleDelete(schedule.id)} className="text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
