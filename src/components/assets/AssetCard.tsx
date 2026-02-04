"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ASSET_TYPES, ASSET_TYPES as AssetTypes, TRACKING_METHODS } from "@/lib/constants";
import { Asset } from "@prisma/client";
import { Car, Home, Wrench, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import Link from "next/link";

interface AssetCardProps {
    asset: Asset;
    onDelete?: (id: string) => void;
}

export function AssetCard({ asset, onDelete }: AssetCardProps) {
    const Icon = asset.type === ASSET_TYPES.CAR ? Car : asset.type === ASSET_TYPES.HOUSE ? Home : Wrench;

    return (
        <div className="relative group">
            <Link href={`/dashboard/asset/${asset.id}`} className="block">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-medium">{asset.name}</CardTitle>
                                <CardDescription className="text-xs">{asset.type}</CardDescription>
                            </div>
                        </div>
                        {/* Empty div to preserve flex layout since dropdown is absolute below */}
                        <div className="h-8 w-8" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-end mt-4">
                            <div className="space-y-1">
                                <p className="text-2xl font-bold">
                                    {asset.currentUsage.toLocaleString()}
                                    <span className="text-xs font-normal text-muted-foreground ml-1">
                                        {asset.trackingMethod === TRACKING_METHODS.MILEAGE ? "mi" : asset.trackingMethod === TRACKING_METHODS.HOURS ? "hrs" : ""}
                                    </span>
                                </p>
                                <p className="text-xs text-muted-foreground">Current Usage</p>
                            </div>
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                                {asset.trackingMethod}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </Link>

            <div className="absolute top-2 right-2 z-10">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/asset/${asset.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(asset.id)}>
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
