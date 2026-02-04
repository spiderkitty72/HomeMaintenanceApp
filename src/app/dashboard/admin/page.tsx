import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUsers } from "@/lib/actions/users";
import { getGroups } from "@/lib/actions/groups";
import { getParts } from "@/lib/actions/parts";
import { UserList } from "@/components/admin/UserList";
import { GroupList } from "@/components/admin/GroupList";
import { AdminInventory } from "@/components/admin/AdminInventory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Lock, UserPlus, FolderPlus, PackageSearch } from "lucide-react";
import { AddUserDialog } from "@/components/admin/AddUserDialog";
import { AddGroupDialog } from "@/components/admin/AddGroupDialog";

export default async function AdminDashboardPage() {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
        redirect("/dashboard");
    }

    const [users, groups, parts] = await Promise.all([
        getUsers(),
        getGroups(),
        getParts(),
    ]);

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Admin Control Panel</h1>
                    <p className="text-muted-foreground mt-1">Manage users, groups, and system permissions.</p>
                </div>
                <div className="flex gap-2">
                    <AddUserDialog />
                    <AddGroupDialog />
                </div>
            </div>

            <Tabs defaultValue="users" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
                    <TabsTrigger value="users" className="gap-2">
                        <Users className="h-4 w-4" /> Users
                    </TabsTrigger>
                    <TabsTrigger value="groups" className="gap-2">
                        <Shield className="h-4 w-4" /> Groups
                    </TabsTrigger>
                    <TabsTrigger value="inventory" className="gap-2">
                        <PackageSearch className="h-4 w-4" /> Inventory
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Accounts</CardTitle>
                            <CardDescription>
                                Total of {users.length} registered users in the system.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UserList users={users} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="groups" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Permission Groups</CardTitle>
                            <CardDescription>
                                Define roles and access levels for different user groups.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <GroupList groups={groups} allUsers={users} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="inventory" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Global Inventory Management</CardTitle>
                            <CardDescription>
                                Manually adjust stock levels and units of measure for all parts.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AdminInventory parts={parts} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
