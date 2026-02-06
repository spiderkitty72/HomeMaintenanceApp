"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, User, Users, Search, Check, Save } from "lucide-react";
import { updateAssetAccess } from "@/lib/actions/assets";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ManageAssetAccessDialogProps {
    asset: any;
    allUsers: any[];
    trigger?: React.ReactNode;
}

export function ManageAssetAccessDialog({ asset, allUsers, trigger }: ManageAssetAccessDialogProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);

    // Internal state for changes
    const [ownerId, setOwnerId] = useState(asset.userId);
    const [sharedUserIds, setSharedUserIds] = useState<string[]>(
        asset.sharedWith?.map((s: any) => s.userId) || []
    );

    const filteredUsers = allUsers.filter(user =>
    (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const toggleShare = (userId: string) => {
        if (userId === ownerId) return; // Can't share with the owner

        setSharedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateAssetAccess(asset.id, ownerId, sharedUserIds);
            toast.success("Asset access updated successfully");
            setOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to update asset access");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" title="Manage Ownership & Sharing">
                        <Shield className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Management: {asset.name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Owner Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" /> Primary Owner
                        </label>
                        <Select value={ownerId} onValueChange={(val) => {
                            setOwnerId(val);
                            // If new owner was in shared list, remove them
                            setSharedUserIds(prev => prev.filter(id => id !== val));
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an owner" />
                            </SelectTrigger>
                            <SelectContent>
                                {allUsers.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                        <div className="flex flex-col">
                                            <span>{user.name}</span>
                                            <span className="text-xs text-muted-foreground">{user.email}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground italic">
                            The owner has full control and is the primary contact for this asset.
                        </p>
                    </div>

                    <div className="border-t pt-4 space-y-4">
                        <label className="text-sm font-semibold flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" /> Shared With
                        </label>

                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users to share with..."
                                className="pl-9 h-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="max-h-[220px] overflow-y-auto rounded-md border p-2 custom-scrollbar">
                            <div className="space-y-1">
                                {filteredUsers.map((user) => {
                                    const isOwner = user.id === ownerId;
                                    const isShared = sharedUserIds.includes(user.id);

                                    return (
                                        <div
                                            key={user.id}
                                            onClick={() => !isOwner && toggleShare(user.id)}
                                            className={cn(
                                                "flex items-center justify-between p-2 rounded-sm text-sm cursor-pointer transition-colors",
                                                isOwner ? "opacity-50 cursor-not-allowed bg-muted/30" : "hover:bg-accent hover:text-accent-foreground",
                                                isShared && !isOwner && "bg-accent/50 text-accent-foreground"
                                            )}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium">{user.name}</span>
                                                <span className="text-xs opacity-70">{user.email}</span>
                                            </div>
                                            {isOwner ? (
                                                <Badge variant="outline">Owner</Badge>
                                            ) : isShared ? (
                                                <Check className="h-4 w-4 text-primary" />
                                            ) : null}
                                        </div>
                                    );
                                })}
                                {filteredUsers.length === 0 && (
                                    <div className="py-4 text-center text-xs text-muted-foreground italic">
                                        No users found.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="gap-2">
                        {loading ? "Saving..." : <><Save className="h-4 w-4" /> Save Changes</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
