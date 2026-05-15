"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Edit2, Loader2, UserPlus, X, ShieldCheck, Eye } from "lucide-react";
import { createInventorySystem, updateInventorySystem } from "@/lib/actions/inventorySystems";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  userId: z.string().min(1, "Owner is required"),
});

type SharedUser = {
  userId: string;
  permission: "VIEW" | "MANAGE";
  name: string;
  email: string;
  image?: string | null;
};

interface AddInventorySystemDialogProps {
  mode?: "add" | "edit";
  system?: any;
  users: any[];
}

export function AddInventorySystemDialog({ mode = "add", system, users }: AddInventorySystemDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Build initial sharedWith list from existing system data
  const initialShared: SharedUser[] = system?.sharedWith?.map((a: any) => ({
    userId: a.userId,
    permission: a.permission as "VIEW" | "MANAGE",
    name: a.user?.name || a.user?.email || "Unknown",
    email: a.user?.email || "",
    image: a.user?.image,
  })) || [];

  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>(initialShared);
  const [userToAdd, setUserToAdd] = useState("");
  const [permToAdd, setPermToAdd] = useState<"VIEW" | "MANAGE">("VIEW");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: system?.name || "",
      userId: system?.userId || "",
    },
  });

  const currentOwnerId = form.watch("userId");

  // Users available to be shared (not the current owner, not already in the list)
  const availableUsers = users.filter(
    (u) => u.id !== currentOwnerId && !sharedUsers.some((s) => s.userId === u.id)
  );

  function handleAddSharedUser() {
    if (!userToAdd) return;
    const user = users.find((u) => u.id === userToAdd);
    if (!user) return;
    setSharedUsers((prev) => [
      ...prev,
      { userId: user.id, permission: permToAdd, name: user.name || user.email, email: user.email, image: user.image },
    ]);
    setUserToAdd("");
    setPermToAdd("VIEW");
  }

  function handleRemoveSharedUser(userId: string) {
    setSharedUsers((prev) => prev.filter((u) => u.userId !== userId));
  }

  function handleChangePermission(userId: string, permission: "VIEW" | "MANAGE") {
    setSharedUsers((prev) =>
      prev.map((u) => (u.userId === userId ? { ...u, permission } : u))
    );
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const accessList = sharedUsers.map(({ userId, permission }) => ({ userId, permission }));
      if (mode === "edit") {
        await updateInventorySystem(system.id, values.name, accessList);
        toast.success("Inventory system updated");
      } else {
        await createInventorySystem({ ...values, sharedWith: accessList });
        toast.success("Inventory system created");
      }
      setOpen(false);
      if (mode === "add") {
        form.reset();
        setSharedUsers([]);
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "edit" ? (
          <Button variant="ghost" size="sm">
            <Edit2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> New System
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit System" : "Create Inventory System"}</DialogTitle>
          <DialogDescription>
            Inventory systems group parts and track stock. You can grant other users read-only or management access.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Main Garage, Mobile Van" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Owner</FormLabel>
                  <Select
                    onValueChange={(v) => {
                      // Remove from sharedWith if they become the owner
                      setSharedUsers((prev) => prev.filter((u) => u.userId !== v));
                      field.onChange(v);
                    }}
                    value={field.value}
                    disabled={mode === "edit"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Shared Access Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FormLabel className="text-sm">Shared Access</FormLabel>
                <Badge variant="outline" className="text-[10px]">{sharedUsers.length} users</Badge>
              </div>

              {/* Existing shared users */}
              {sharedUsers.length > 0 && (
                <div className="space-y-2 rounded-md border p-3 bg-muted/20">
                  {sharedUsers.map((su) => (
                    <div key={su.userId} className="flex items-center gap-3">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={su.image || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {(su.name || su.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 text-sm font-medium truncate">{su.name}</span>
                      <Select
                        value={su.permission}
                        onValueChange={(v) => handleChangePermission(su.userId, v as "VIEW" | "MANAGE")}
                      >
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VIEW">
                            <span className="flex items-center gap-1.5">
                              <Eye className="h-3 w-3" /> View Only
                            </span>
                          </SelectItem>
                          <SelectItem value="MANAGE">
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck className="h-3 w-3" /> Can Manage
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveSharedUser(su.userId)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add a new user */}
              {availableUsers.length > 0 && (
                <div className="flex gap-2">
                  <Select value={userToAdd} onValueChange={setUserToAdd}>
                    <SelectTrigger className="flex-1 bg-background">
                      <SelectValue placeholder="Add a user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name || u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={permToAdd} onValueChange={(v) => setPermToAdd(v as "VIEW" | "MANAGE")}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VIEW">
                        <span className="flex items-center gap-1.5">
                          <Eye className="h-3 w-3" /> View Only
                        </span>
                      </SelectItem>
                      <SelectItem value="MANAGE">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="h-3 w-3" /> Can Manage
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddSharedUser}
                    disabled={!userToAdd}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {availableUsers.length === 0 && sharedUsers.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  All users are already assigned or there are no other users to add.
                </p>
              )}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === "edit" ? (
                  "Save Changes"
                ) : (
                  "Create System"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
