"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Power, PowerOff } from "lucide-react";
import { toggleSpecTypeStatus } from "@/lib/actions/specs";
import { toast } from "sonner";
import { EditSpecTypeDialog } from "./EditSpecTypeDialog";
import { Badge } from "@/components/ui/badge";

interface AdminSpecTypeListProps {
    specTypes: any[];
}

export function AdminSpecTypeList({ specTypes }: AdminSpecTypeListProps) {
    const [isPending, setIsPending] = useState<string | null>(null);

    async function handleToggleStatus(id: string, currentStatus: boolean) {
        setIsPending(id);
        try {
            await toggleSpecTypeStatus(id, !currentStatus);
            toast.success(`Spec type ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setIsPending(null);
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Usage Count</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {specTypes.map((type: any) => (
                        <TableRow key={type.id} className={!type.isActive ? "opacity-60 bg-muted/20" : ""}>
                            <TableCell className="font-medium">{type.name}</TableCell>
                            <TableCell>{type.unit || <span className="text-muted-foreground italic">None</span>}</TableCell>
                            <TableCell>{type._count?.specs || 0}</TableCell>
                            <TableCell>
                                {type.isActive ? (
                                    <Badge variant="default">Active</Badge>
                                ) : (
                                    <Badge variant="secondary">Inactive</Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-sm">
                                {type.user?.name || "System"}<br />
                                <span className="text-xs text-muted-foreground">{type.user?.email}</span>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                <EditSpecTypeDialog specType={type} />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleToggleStatus(type.id, type.isActive)}
                                    disabled={isPending === type.id}
                                    title={type.isActive ? "Deactivate" : "Activate"}
                                >
                                    {type.isActive ? (
                                        <Power className="h-4 w-4 text-destructive" />
                                    ) : (
                                        <PowerOff className="h-4 w-4 text-green-600" />
                                    )}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {specTypes.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                No specification types found in the library.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
