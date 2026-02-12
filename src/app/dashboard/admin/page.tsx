import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUsers } from "@/lib/actions/users";
import { getGroups } from "@/lib/actions/groups";
import { getAllPartsSystem } from "@/lib/actions/parts";
import { getAllAssetsSystem } from "@/lib/actions/assets";
import { getAllFuelRecordsSystem } from "@/lib/actions/fuel";
import { getAllServiceRecordsSystem } from "@/lib/actions/service";
import { getAllSpecTypesSystem } from "@/lib/actions/specs";
import { getAllPurchasesSystem } from "@/lib/actions/inventory";
import { UserList } from "@/components/admin/UserList";
import { GroupList } from "@/components/admin/GroupList";
import { AdminInventory } from "@/components/admin/AdminInventory";
import { AdminAssetList } from "@/components/admin/AdminAssetList";
import { AdminFuelList } from "@/components/admin/AdminFuelList";
import { AdminServiceList } from "@/components/admin/AdminServiceList";
import { AdminSpecTypeList } from "@/components/admin/AdminSpecTypeList";
import { AdminPurchaseList } from "@/components/admin/AdminPurchaseList";
import { AdminSystemTab } from "@/components/admin/AdminSystemTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, PackageSearch, Car, Fuel, Wrench, Settings, ListChecks, ShoppingBag } from "lucide-react";
import { AddUserDialog } from "@/components/admin/AddUserDialog";
import { AddGroupDialog } from "@/components/admin/AddGroupDialog";
import { ExportDataButton } from "@/components/admin/ExportDataButton";

export default async function AdminDashboardPage() {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
        redirect("/dashboard");
    }

    const [users, groups, parts, assets, fuelRecords, serviceRecords, specTypes, purchases] = await Promise.all([
        getUsers(),
        getGroups(),
        getAllPartsSystem(),
        getAllAssetsSystem(),
        getAllFuelRecordsSystem(),
        getAllServiceRecordsSystem(),
        getAllSpecTypesSystem(),
        getAllPurchasesSystem(),
    ]);

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Admin Control Panel</h1>
                    <p className="text-muted-foreground mt-1">Manage users, groups, and system permissions.</p>
                </div>
                <div className="flex gap-2">
                    <ExportDataButton />
                    <AddUserDialog />
                    <AddGroupDialog />
                </div>
            </div>

            <Tabs defaultValue="users" className="space-y-6">
                <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
                    <TabsTrigger value="users" className="gap-2 flex-1 min-w-[100px]">
                        <Users className="h-4 w-4" /> Users
                    </TabsTrigger>
                    <TabsTrigger value="groups" className="gap-2 flex-1 min-w-[100px]">
                        <Shield className="h-4 w-4" /> Groups
                    </TabsTrigger>
                    <TabsTrigger value="assets" className="gap-2 flex-1 min-w-[100px]">
                        <Car className="h-4 w-4" /> Assets
                    </TabsTrigger>
                    <TabsTrigger value="inventory" className="gap-2 flex-1 min-w-[100px]">
                        <PackageSearch className="h-4 w-4" /> Inventory
                    </TabsTrigger>
                    <TabsTrigger value="fuel" className="gap-2 flex-1 min-w-[100px]">
                        <Fuel className="h-4 w-4" /> Fuel
                    </TabsTrigger>
                    <TabsTrigger value="service" className="gap-2 flex-1 min-w-[100px]">
                        <Wrench className="h-4 w-4" /> Services
                    </TabsTrigger>
                    <TabsTrigger value="purchases" className="gap-2 flex-1 min-w-[100px]">
                        <ShoppingBag className="h-4 w-4" /> Purchases
                    </TabsTrigger>
                    <TabsTrigger value="specs_library" className="gap-2 flex-1 min-w-[100px]">
                        <ListChecks className="h-4 w-4" /> Specs Library
                    </TabsTrigger>
                    <TabsTrigger value="system" className="gap-2 flex-1 min-w-[100px]">
                        <Settings className="h-4 w-4" /> System
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
                            <AdminInventory parts={parts} allAssets={assets} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="assets" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Assets</CardTitle>
                            <CardDescription>
                                Overview of all assets registered in the system.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AdminAssetList assets={assets} allUsers={users} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="fuel" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Fuel Records</CardTitle>
                            <CardDescription>
                                Full history of fuel usage logs across all assets.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AdminFuelList records={fuelRecords} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="service" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Service History</CardTitle>
                            <CardDescription>
                                Detailed records of all maintenance and service performed.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AdminServiceList records={serviceRecords} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="purchases" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Purchase Records</CardTitle>
                            <CardDescription>
                                Monitor and manage all part purchases made by system users.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AdminPurchaseList purchases={purchases} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="specs_library" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Global Specification Library</CardTitle>
                            <CardDescription>
                                Manage standardized labels and units for asset specifications.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AdminSpecTypeList specTypes={specTypes} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="system" className="space-y-4">
                    <AdminSystemTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
