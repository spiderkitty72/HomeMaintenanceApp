"use client";

import { cn } from "@/lib/utils";
import { getSystemItem, NO_SYSTEM } from "@/lib/inventory";

interface PartStockProps {
    part: any;
    systemId: string;
    systemName?: string;
    className?: string;
}

/** Stock for one part in one inventory system, always labeled with the system it refers to. */
export function PartStock({ part, systemId, systemName, className }: PartStockProps) {
    if (systemId === NO_SYSTEM || !systemName) {
        return <span className={cn("text-xs italic text-muted-foreground", className)}>No inventory system</span>;
    }

    const item = getSystemItem(part, systemId);
    if (!item) {
        return (
            <div className={cn("flex flex-col", className)}>
                <span className="text-xs italic text-muted-foreground">Not tracked</span>
                <span className="text-[11px] text-muted-foreground">in {systemName}</span>
            </div>
        );
    }

    const stock = item.quantityOnHand;
    return (
        <div className={cn("flex flex-col", className)}>
            <span className={cn("text-sm font-semibold", stock <= 0 && "text-destructive")}>
                {stock} <span className="text-xs font-normal uppercase text-muted-foreground">{part.unitOfMeasure}</span>
                {stock <= 0 && <span className="ml-1.5 text-[10px] font-bold uppercase">Out of stock</span>}
            </span>
            <span className="text-[11px] text-muted-foreground">in {systemName}</span>
        </div>
    );
}
