"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Shield, ShieldCheck, Trash2, Mail, Settings2 } from "lucide-react";
import { deleteUser } from "@/lib/actions/users";
import { toast } from "sonner";
import { EditUserDialog } from "./EditUserDialog";

interface UserListProps {
    users: any[];
}

export function UserList({ users }: UserListProps) {
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this user?")) return;
        try {
            await deleteUser(id);
            toast.success("User deleted");
        } catch (error: any) {
            toast.error(error.message || "Failed to delete user");
        }
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Groups</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell>
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-muted rounded-full">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">{user.name}</div>
                                        <div className="text-xs text-muted-foreground flex items-center">
                                            <Mail className="h-3 w-3 mr-1" /> {user.email}
                                        </div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={user.role === "ADMIN" ? "default" : "secondary"} className="gap-1">
                                    {user.role === "ADMIN" ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                                    {user.role}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {user.groups.map((m: any) => (
                                        <Badge key={m.id} variant="outline" className="text-[10px]">
                                            {m.group.name}
                                        </Badge>
                                    ))}
                                    {user.groups.length === 0 && <span className="text-xs text-muted-foreground italic">None</span>}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                    <EditUserDialog user={user} />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDelete(user.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
