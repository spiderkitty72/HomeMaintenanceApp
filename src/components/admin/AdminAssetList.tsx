"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddAssetDialog } from "@/components/assets/AddAssetDialog";
import { deleteAsset } from "@/lib/actions/assets";
import { toast } from "sonner";
import { Car, Home, UtilityPole, Trash2, User, Search, Edit2, Filter, Shield } from "lucide-react";
import { ManageAssetAccessDialog } from "./ManageAssetAccessDialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ASSET_TYPES } from "@/lib/constants";

interface AdminAssetListProps {
    assets: any[];
    allUsers: any[];
}

export function AdminAssetList({ assets, allUsers }: AdminAssetListProps) {
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("ALL");

    const filteredAssets = assets.filter(asset => {
        const matchesSearch = asset.name.toLowerCase().includes(search.toLowerCase()) ||
            asset.owner?.name?.toLowerCase().includes(search.toLowerCase()) ||
            asset.owner?.email?.toLowerCase().includes(search.toLowerCase());

        const matchesType = typeFilter === "ALL" || asset.type === typeFilter;

        return matchesSearch && matchesType;
    });

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;

        try {
            await deleteAsset(id);
            toast.success("Asset deleted successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to delete asset");
        }
    };

    const getIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case "car": return <Car className="h-4 w-4" />;
            case "house": return <Home className="h-4 w-4" />;
            default: return <UtilityPole className="h-4 w-4" />;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-1 items-center gap-2 w-full max-w-xl">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search assets or owners..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[140px]">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Types</SelectItem>
                            {Object.values(ASSET_TYPES).map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <AddAssetDialog />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Asset</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>Usage</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAssets.map((asset) => (
                            <TableRow key={asset.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0 border">
                                            {asset.image ? (
                                                <img src={asset.image} alt="" className="h-full w-full object-cover rounded" />
                                            ) : (
                                                getIcon(asset.type)
                                            )}
                                        </div>
                                        <span>{asset.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                        {asset.type.toLowerCase()}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{asset.owner?.name || "Unknown"}</span>
                                        <span className="text-xs text-muted-foreground">{asset.owner?.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        {asset.currentUsage.toLocaleString()}
                                        <span className="ml-1 text-xs text-muted-foreground">
                                            {asset.trackingMethod === "Mileage" ? "mi" : asset.trackingMethod === "Hours" ? "hrs" : ""}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <AddAssetDialog
                                            asset={asset}
                                            trigger={
                                                <Button size="icon" variant="ghost" className="h-8 w-8" title="Edit Asset">
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            }
                                        />
                                        <ManageAssetAccessDialog
                                            asset={asset}
                                            allUsers={allUsers}
                                        />
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDelete(asset.id, asset.name)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredAssets.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No assets found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
