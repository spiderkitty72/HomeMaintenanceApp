"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Fingerprint } from "lucide-react";
import { setGroupPermissions } from "@/lib/actions/groups";
import { toast } from "sonner";

const RESOURCES = ["ASSET", "SERVICE", "FUEL", "PART"];
const ACTIONS = ["CREATE", "EDIT", "DELETE", "VIEW"];

interface PermissionsDialogProps {
    groupId: string;
    groupName: string;
    existingPermissions: { action: string, resource: string }[];
}

export function PermissionsDialog({ groupId, groupName, existingPermissions }: PermissionsDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Permission state as "ACTION:RESOURCE" strings
    const [perms, setPerms] = useState<string[]>(
        existingPermissions.map(p => `${p.action}:${p.resource}`)
    );

    const togglePermission = (action: string, resource: string) => {
        const key = `${action}:${resource}`;
        setPerms(prev =>
            prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
        );
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const permissionData = perms.map(p => {
                const [action, resource] = p.split(":");
                return { action, resource };
            });
            await setGroupPermissions(groupId, permissionData);
            toast.success("Permissions updated");
            setOpen(false);
        } catch (error) {
            toast.error("Failed to update permissions");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Manage Permissions">
                    <Fingerprint className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Manage Permissions: {groupName}</DialogTitle>
                </DialogHeader>

                <div className="py-6 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left font-medium pb-2">Resource</th>
                                {ACTIONS.map(action => (
                                    <th key={action} className="text-center font-medium pb-2 whitespace-nowrap px-2">
                                        {action}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {RESOURCES.map(res => (
                                <tr key={res} className="border-b last:border-0">
                                    <td className="py-3 font-medium text-muted-foreground">{res}</td>
                                    {ACTIONS.map(action => {
                                        const isChecked = perms.includes(`${action}:${res}`);
                                        return (
                                            <td key={action} className="text-center py-3">
                                                <div className="flex justify-center">
                                                    <Checkbox
                                                        checked={isChecked}
                                                        onCheckedChange={() => togglePermission(action, res)}
                                                    />
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-center mt-4">
                    <div className="text-xs text-muted-foreground">
                        {perms.length} active permissions
                    </div>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
