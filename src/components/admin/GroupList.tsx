"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Settings, UserPlus, Fingerprint, Settings2 } from "lucide-react";
import { PermissionsDialog } from "./PermissionsDialog";
import { EditGroupDialog } from "./EditGroupDialog";
import { ManageMembersDialog } from "./ManageMembersDialog";

interface GroupListProps {
    groups: any[];
    allUsers: any[];
}

export function GroupList({ groups, allUsers }: GroupListProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Group Name</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {groups.map((group) => (
                        <TableRow key={group.id}>
                            <TableCell>
                                <div>
                                    <div className="font-medium text-sm">{group.name}</div>
                                    <div className="text-xs text-muted-foreground">{group.description || "No description"}</div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Users className="h-4 w-4 mr-1" />
                                    {group.members.length}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {group.permissions.map((p: any) => (
                                        <Badge key={p.id} variant="secondary" className="text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
                                            {p.action} {p.resource}
                                        </Badge>
                                    ))}
                                    {group.permissions.length === 0 && <span className="text-xs text-muted-foreground italic">No permissions set</span>}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                    <ManageMembersDialog
                                        groupId={group.id}
                                        groupName={group.name}
                                        members={group.members}
                                        allUsers={allUsers}
                                    />
                                    <PermissionsDialog
                                        groupId={group.id}
                                        groupName={group.name}
                                        existingPermissions={group.permissions}
                                    />
                                    <EditGroupDialog group={group} />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {groups.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                No groups created yet.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
