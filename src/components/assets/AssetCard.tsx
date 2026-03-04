"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ASSET_TYPES, TRACKING_METHODS } from "@/lib/constants";
import { Asset } from "@prisma/client";
import { Car, Home, Wrench, MoreVertical, Fuel as FuelIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddFuelDialog } from "@/components/fuel/AddFuelDialog";
import { AddServiceDialog } from "@/components/service/AddServiceDialog";
import { AddAssetDialog } from "@/components/assets/AddAssetDialog";
import Image from "next/image";
import Link from "next/link";
import { differenceInDays, addDays } from "date-fns";
import { useState, useTransition } from "react";
import { isScheduleDue } from "@/lib/predictions";
import { dismissReminder } from "@/lib/actions/schedules";
import { Bell } from "lucide-react";

interface AssetCardProps {
    asset: any;
    currentUserId?: string;
    onDelete?: (id: string) => void;
    maxDaysToEstimate?: number;
}

export function AssetCard({ asset, currentUserId, onDelete, maxDaysToEstimate = 30 }: AssetCardProps) {
    const Icon = asset.type === ASSET_TYPES.CAR ? Car : asset.type === ASSET_TYPES.HOUSE ? Home : Wrench;
    const [showReminders, setShowReminders] = useState(false);
    const [isPending, startTransition] = useTransition();

    const targetDate = addDays(new Date(), 7);
    const daysSinceUpdate = asset.usageUpdatedAt ? Math.max(0, differenceInDays(new Date(), new Date(asset.usageUpdatedAt))) : 0;
    const isStale = daysSinceUpdate > maxDaysToEstimate;

    const effectiveDailyUsage = isStale ? 0 : (asset.dailyUsage || 0);
    const estimatedUsageIn7Days = asset.currentUsage + (effectiveDailyUsage * 7);

    const dueReminders = asset.schedules?.map((schedule: any) => {
        const { isDue, reason } = isScheduleDue(schedule, targetDate, estimatedUsageIn7Days);
        return isDue ? { ...schedule, reason } : null;
    }).filter(Boolean) || [];

    return (
        <div className="relative group overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all h-[240px]">
            {/* Background Image with Fade */}
            {asset.image ? (
                <div className="absolute inset-0 z-0">
                    <Image
                        src={asset.image}
                        alt={asset.name}
                        fill
                        className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                </div>
            ) : (
                <div className="absolute inset-0 z-0 bg-primary/5 group-hover:bg-primary/10 transition-colors">
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background to-transparent" />
                </div>
            )}

            {/* Navigation Link (z-10) - Covers the whole card */}
            <Link
                href={`/dashboard/asset/${asset.id}`}
                className="absolute inset-0 z-10"
                aria-label={`View ${asset.name} details`}
            />

            {/* Content Layer (z-20) - Pass-through clicks to Link, except for specific interactive elements */}
            <div className="relative z-20 flex flex-col h-full p-4 pointer-events-none">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <div className="p-2 bg-primary/10 backdrop-blur-sm rounded-full border border-primary/20">
                                <Icon className="h-4 w-4 text-primary" />
                            </div>
                            {dueReminders.length > 0 && (
                                <div
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 cursor-pointer pointer-events-auto hover:bg-red-600 transition-colors shadow-sm ring-2 ring-background z-30"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowReminders(!showReminders);
                                    }}
                                >
                                    <Bell className="h-3 w-3 animate-pulse" />
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold leading-none tracking-tight text-lg drop-shadow-sm">{asset.name}</h3>
                                {asset.userId !== currentUserId && (
                                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-blue-500/20 text-blue-200 border-blue-500/30">
                                        Shared
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground font-medium uppercase mt-1 tracking-wider">
                                {asset.type}
                                {asset.userId !== currentUserId && asset.owner && (
                                    <span className="ml-1 opacity-70 normal-case">by {asset.owner.name}</span>
                                )}
                                {asset.userId === currentUserId && asset.sharedWith?.length > 0 && (
                                    <span className="ml-1 opacity-70 normal-case">• Shared with {asset.sharedWith.length}</span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="pointer-events-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 bg-background/50 backdrop-blur-sm hover:bg-background/80"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/asset/${asset.id}`}>View Details</Link>
                                </DropdownMenuItem>
                                <div onClick={(e) => e.stopPropagation()}>
                                    <AddAssetDialog
                                        asset={asset}
                                        trigger={
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit</DropdownMenuItem>
                                        }
                                    />
                                </div>
                                <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete?.(asset.id);
                                    }}
                                >
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="mt-auto flex justify-between items-end pb-4 pointer-events-auto relative">
                    {showReminders && dueReminders.length > 0 && (
                        <div className="absolute bottom-full mb-2 right-0 left-0 bg-popover text-popover-foreground border shadow-lg rounded-lg p-3 z-50 pointer-events-auto">
                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                <Bell className="h-3.5 w-3.5 text-red-500" /> Reminders Due
                            </h4>
                            <div className="space-y-2 max-h-[120px] overflow-y-auto">
                                {dueReminders.map((reminder: any) => (
                                    <div key={reminder.id} className="bg-muted p-2 rounded text-xs flex justify-between items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{reminder.name}</p>
                                            <p className="opacity-70 truncate" title={reminder.reason}>{reminder.reason}</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-[10px] px-2 shrink-0"
                                            disabled={isPending}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                startTransition(() => {
                                                    dismissReminder(reminder.id, asset.id);
                                                });
                                            }}
                                        >
                                            Dismiss
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-1 text-foreground">
                        <p className="text-3xl font-bold tracking-tight">
                            {asset.currentUsage.toLocaleString()}
                            <span className="text-xs font-normal opacity-70 ml-1 uppercase">
                                {asset.trackingMethod === TRACKING_METHODS.MILEAGE ? "mi" : asset.trackingMethod === TRACKING_METHODS.HOURS ? "hrs" : ""}
                            </span>
                        </p>
                        <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest leading-none mb-1">Current Usage</p>

                        {asset.dailyUsage > 0 && asset.usageUpdatedAt && !isStale && (
                            <div className="mt-1 flex flex-col pt-1">
                                <p className="text-sm font-semibold tracking-tight text-primary/80">
                                    {Math.round(asset.currentUsage + (asset.dailyUsage * daysSinceUpdate)).toLocaleString()}
                                    <span className="text-[10px] font-normal opacity-70 ml-1 uppercase">EST</span>
                                </p>
                                <p className="text-[9px] opacity-60 uppercase tracking-widest leading-none mt-0.5">
                                    {daysSinceUpdate} Days Since Update
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2 pointer-events-auto">
                    {asset.type === ASSET_TYPES.CAR && (
                        <div onClick={(e) => e.stopPropagation()}>
                            <AddFuelDialog
                                assetId={asset.id}
                                trackingMethod={asset.trackingMethod}
                                trigger={
                                    <Button variant="secondary" size="sm" className="w-full h-9 bg-background/50 backdrop-blur-sm hover:bg-background/80 border-none shadow-none text-xs gap-1.5 font-semibold">
                                        <FuelIcon className="h-3.5 w-3.5" />
                                        Fuel
                                    </Button>
                                }
                            />
                        </div>
                    )}
                    <div
                        className={asset.type !== ASSET_TYPES.CAR ? "col-span-2" : ""}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <AddServiceDialog
                            assetId={asset.id}
                            trackingMethod={asset.trackingMethod}
                            schedules={asset.schedules}
                            trigger={
                                <Button variant="secondary" size="sm" className="w-full h-9 bg-background/50 backdrop-blur-sm hover:bg-background/80 border-none shadow-none text-xs gap-1.5 font-semibold">
                                    <Wrench className="h-3.5 w-3.5" />
                                    Service
                                </Button>
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
