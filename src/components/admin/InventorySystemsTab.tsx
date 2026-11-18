"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Warehouse, Trash2, Eye, ShieldCheck, Crown } from "lucide-react";
import { AddInventorySystemDialog } from "./AddInventorySystemDialog";
import { deleteInventorySystem } from "@/lib/actions/inventorySystems";
import { toast } from "sonner";

interface InventorySystemsTabProps {
  systems: any[];
  users: any[];
}

export function InventorySystemsTab({ systems, users }: InventorySystemsTabProps) {
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inventory system? All stock data within this system will be lost.")) return;
    try {
      await deleteInventorySystem(id);
      toast.success("Inventory system deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete system");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Inventory Management Systems</CardTitle>
          <CardDescription>
            Create isolated inventory systems and grant specific users access.
          </CardDescription>
        </div>
        <AddInventorySystemDialog users={users} />
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>System Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Access</TableHead>
                <TableHead>Parts</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {systems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">
                    No inventory systems created yet.
                  </TableCell>
                </TableRow>
              )}
              {systems.map((system) => (
                <TableRow key={system.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Warehouse className="h-4 w-4 text-muted-foreground" />
                      {system.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={system.user?.image || undefined} />
                        <AvatarFallback className="text-[9px]">
                          {(system.user?.name || system.user?.email || "?").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{system.user?.name || system.user?.email || "Unknown"}</span>
                      <span className="h-3 w-3 text-amber-500" title="Owner">
                        <Crown className="h-3 w-3 text-amber-500" />
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {system.sharedWith && system.sharedWith.length > 0 ? (
                      <TooltipProvider>
                        <div className="flex items-center gap-1">
                          {system.sharedWith.map((access: any) => (
                            <Tooltip key={access.id}>
                              <TooltipTrigger asChild>
                                <div className="relative cursor-default">
                                  <Avatar className="h-7 w-7 border-2 border-background">
                                    <AvatarImage src={access.user?.image || undefined} />
                                    <AvatarFallback className="text-[9px]">
                                      {(access.user?.name || access.user?.email || "?").charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center ${access.permission === "MANAGE" ? "bg-primary" : "bg-muted-foreground"}`}>
                                    {access.permission === "MANAGE"
                                      ? <ShieldCheck className="h-2 w-2 text-primary-foreground" />
                                      : <Eye className="h-2 w-2 text-background" />
                                    }
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-medium">{access.user?.name || access.user?.email}</p>
                                <p className="text-xs text-muted-foreground">
                                  {access.permission === "MANAGE" ? "Can Manage" : "View Only"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </TooltipProvider>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No shared access</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{system._count?.items || 0} Parts</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <AddInventorySystemDialog mode="edit" system={system} users={users} />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(system.id)}
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
      </CardContent>
    </Card>
  );
}
