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
import { UserPlus, UserMinus, Search, User } from "lucide-react";
import { addMemberToGroup, removeMemberFromGroup } from "@/lib/actions/groups";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ManageMembersDialogProps {
    groupId: string;
    groupName: string;
    members: any[];
    allUsers: any[];
}

export function ManageMembersDialog({ groupId, groupName, members, allUsers }: ManageMembersDialogProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const memberIds = new Set(members.map(m => m.userId));

    const filteredUsers = allUsers.filter(user =>
    (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleAdd = async (userId: string) => {
        try {
            await addMemberToGroup(groupId, userId);
            toast.success("Member added");
        } catch (error) {
            toast.error("Failed to add member");
        }
    };

    const handleRemove = async (userId: string) => {
        try {
            await removeMemberFromGroup(groupId, userId);
            toast.success("Member removed");
        } catch (error) {
            toast.error("Failed to remove member");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Manage Members">
                    <UserPlus className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Manage Members: {groupName}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users to add..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="border rounded-md max-h-[300px] overflow-y-auto">
                        {filteredUsers.length > 0 ? (
                            <div className="divide-y">
                                {filteredUsers.map((user) => {
                                    const isMember = memberIds.has(user.id);
                                    return (
                                        <div key={user.id} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 bg-muted rounded-full">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium">{user.name}</div>
                                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                                </div>
                                            </div>
                                            {isMember ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive h-8 px-2"
                                                    onClick={() => handleRemove(user.id)}
                                                >
                                                    <UserMinus className="h-4 w-4 mr-1" />
                                                    Remove
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-primary h-8 px-2"
                                                    onClick={() => handleAdd(user.id)}
                                                >
                                                    <UserPlus className="h-4 w-4 mr-1" />
                                                    Add
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-muted-foreground text-sm italic">
                                No users found matching "{searchTerm}"
                            </div>
                        )}
                    </div>

                    <div className="pt-2 flex flex-wrap gap-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase w-full mb-1">Current Members</span>
                        {members.map(m => (
                            <Badge key={m.id} variant="secondary" className="gap-1 px-2 py-1">
                                {m.user.name}
                                <UserMinus
                                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                                    onClick={() => handleRemove(m.userId)}
                                />
                            </Badge>
                        ))}
                        {members.length === 0 && <span className="text-xs text-muted-foreground italic">No members yet.</span>}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
