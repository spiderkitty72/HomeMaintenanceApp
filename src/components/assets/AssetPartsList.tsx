"use client";

import { Package, Edit2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddPartDialog } from "@/components/parts/AddPartDialog";
import Link from "next/link";

interface AssetPartsListProps {
    parts: any[];
    assets: any[];
}

export function AssetPartsList({ parts, assets }: AssetPartsListProps) {
    if (parts.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground italic">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No parts assigned to this asset yet.</p>
                    <div className="mt-4">
                        <Link href="/dashboard/parts" className="text-primary hover:underline text-sm font-medium">
                            Go to Parts Catalog
                        </Link>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {parts.map((part) => (
                <Card key={part.id} className="overflow-hidden hover:shadow-md transition-shadow group">
                    <CardContent className="p-0">
                        <div className="flex">
                            {/* Image Side */}
                            <div className="w-24 h-24 bg-muted flex items-center justify-center shrink-0 border-r relative">
                                {part.image ? (
                                    <img
                                        src={part.image}
                                        alt={part.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <Package className="h-8 w-8 text-muted-foreground/50" />
                                )}
                                {part.quantityOnHand <= 0 && (
                                    <div className="absolute inset-0 bg-destructive/10 flex items-center justify-center">
                                        <AlertCircle className="h-6 w-6 text-destructive" />
                                    </div>
                                )}
                            </div>

                            {/* Content Side */}
                            <div className="flex-1 p-3 min-w-0 flex flex-col justify-between">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-sm truncate leading-none mb-1">{part.name}</h3>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-tight truncate">
                                            {part.manufacturer || "Unknown Mfg"} {part.partNumber && `• ${part.partNumber}`}
                                        </p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <AddPartDialog mode="edit" part={part} assets={assets} />
                                    </div>
                                </div>

                                <div className="mt-2 flex items-end justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-xs font-bold ${part.quantityOnHand > 0 ? 'text-foreground' : 'text-destructive font-black'}`}>
                                                {part.quantityOnHand} {part.unitOfMeasure}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground uppercase font-medium">In Stock</span>
                                        </div>
                                        <div className="text-[11px] font-mono text-muted-foreground">
                                            ${part.defaultCost?.toFixed(2) || "0.00"} / {part.unitOfMeasure}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-1 justify-end">
                                        {part.compatibleType && (
                                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-muted/50">
                                                {part.compatibleType}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
