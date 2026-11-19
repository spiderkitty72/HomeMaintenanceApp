"use client";

import { Warehouse } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { NO_SYSTEM } from "@/lib/inventory";

interface InventorySystemSelectProps {
    systems: { id: string; name: string; user?: { name?: string | null; email?: string | null } | null }[];
    value: string;
    onChange: (value: string) => void;
    showOwner?: boolean;
    className?: string;
}

/** The inventory system picker used on every parts screen, so stock is always read against a named system. */
export function InventorySystemSelect({ systems, value, onChange, showOwner, className }: InventorySystemSelectProps) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className={cn("w-[220px] bg-background", className)} aria-label="Inventory system">
                <Warehouse className="h-4 w-4 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Inventory system" />
            </SelectTrigger>
            <SelectContent>
                {systems.length === 0 && <SelectItem value={NO_SYSTEM}>No inventory systems</SelectItem>}
                {systems.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                        {s.name}
                        {showOwner && (s.user?.name || s.user?.email) ? ` (${s.user?.name || s.user?.email})` : ""}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
