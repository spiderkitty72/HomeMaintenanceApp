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
import { Link as LinkIcon, Trash2, Search, Car, Home, Hammer } from "lucide-react";
import { assignPartToAsset, unassignPartFromAsset } from "@/lib/actions/parts";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface AssignAssetDialogProps {
    part: any;
    assets: any[];
}

export function AssignAssetDialog({ part, assets }: AssignAssetDialogProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const assignedAssetIds = new Set(part.compatibilities.map((c: any) => c.assetId));

    const filteredAssets = assets.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAssign = async (assetId: string) => {
        try {
            await assignPartToAsset(part.id, assetId);
            toast.success("Part assigned to asset");
        } catch (error) {
            toast.error("Failed to assign part");
        }
    };

    const handleUnassign = async (assetId: string) => {
        try {
            await unassignPartFromAsset(part.id, assetId);
            toast.success("Assignment removed");
        } catch (error) {
            toast.error("Failed to remove assignment");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Assign to Asset">
                    <LinkIcon className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Assign Part: {part.name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search assets..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="border rounded-md max-h-[300px] overflow-y-auto">
                        {filteredAssets.length > 0 ? (
                            <div className="divide-y">
                                {filteredAssets.map((asset) => {
                                    const isAssigned = assignedAssetIds.has(asset.id);
                                    return (
                                        <div key={asset.id} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 bg-muted rounded-full">
                                                    {asset.type === "Car" && <Car className="h-4 w-4" />}
                                                    {asset.type === "House" && <Home className="h-4 w-4" />}
                                                    {asset.type === "Utility" && <Hammer className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium">{asset.name}</div>
                                                    <div className="text-xs text-muted-foreground">{asset.type}</div>
                                                </div>
                                            </div>
                                            {isAssigned ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive h-8 px-2"
                                                    onClick={() => handleUnassign(asset.id)}
                                                >
                                                    Unassign
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-primary h-8 px-2"
                                                    onClick={() => handleAssign(asset.id)}
                                                >
                                                    Assign
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-muted-foreground text-sm italic">
                                No assets found.
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
