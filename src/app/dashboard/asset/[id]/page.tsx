import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getServiceRecords } from "@/lib/actions/service";
import { ServiceList } from "@/components/service/ServiceList";
import { AddServiceDialog } from "@/components/service/AddServiceDialog";
import { getFuelRecords, getFuelStats } from "@/lib/actions/fuel";
import { FuelList } from "@/components/fuel/FuelList";
import { AddFuelDialog } from "@/components/fuel/AddFuelDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Calendar, Gauge, History, Settings, Droplet, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSchedules } from "@/lib/actions/schedules";
import { ScheduleList } from "@/components/schedules/ScheduleList";
import { AddScheduleDialog } from "@/components/schedules/AddScheduleDialog";
import { isBefore } from "date-fns";
import { getCompatibleParts } from "@/lib/actions/parts";
import { Package, ListChecks } from "lucide-react";
import { getAssetSpecs } from "@/lib/actions/specs";
import { SpecList } from "@/components/assets/SpecList";

export default async function AssetDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        return <div>Unauthorized</div>;
    }

    const asset = await prisma.asset.findUnique({
        where: { id },
        include: {
            owner: true,
            sharedWith: {
                include: {
                    user: true,
                },
            },
        },
    });

    if (!asset) {
        notFound();
    }

    const serviceRecords = await getServiceRecords(id);
    const fuelRecords = await getFuelRecords(id);
    const fuelStats = await getFuelStats(id);
    const schedules = await getSchedules(id);
    const compatibleParts = await getCompatibleParts(id);
    const specs = await getAssetSpecs(id);

    // Find the most urgent reminder
    const urgentSchedule = schedules.find(s => {
        if (s.nextDueUsage && asset.currentUsage >= s.nextDueUsage) return true;
        if (s.nextDueDate && isBefore(new Date(s.nextDueDate), new Date())) return true;
        return false;
    });

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                        <span>Assets</span>
                        <span>/</span>
                        <span className="text-foreground font-medium">{asset.type}</span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">{asset.name}</h1>
                </div>

                <div className="flex flex-wrap gap-2">
                    <AddScheduleDialog assetId={asset.id} trackingMethod={asset.trackingMethod} currentUsage={asset.currentUsage} />
                    <AddFuelDialog
                        assetId={asset.id}
                        trackingMethod={asset.trackingMethod}
                        lastUsage={asset.currentUsage}
                    />
                    <AddServiceDialog assetId={asset.id} trackingMethod={asset.trackingMethod} />
                    <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Settings</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar / Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                At a Glance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            {asset.image && (
                                <div className="relative w-full aspect-video rounded-lg overflow-hidden border mb-4">
                                    <Image
                                        src={asset.image}
                                        alt={asset.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Gauge className="h-4 w-4 mr-2" />
                                    Current Usage
                                </div>
                                <div className="font-bold">
                                    {asset.currentUsage.toLocaleString()} {asset.trackingMethod === "Mileage" ? "mi" : "hrs"}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Last Service
                                </div>
                                <div className="font-medium">
                                    {serviceRecords.length > 0
                                        ? new Date(serviceRecords[0].date).toLocaleDateString()
                                        : "None logged"}
                                </div>
                            </div>

                            {urgentSchedule && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-red-600 uppercase tracking-tight">Maintenance Due</p>
                                        <p className="text-sm font-medium text-red-900">{urgentSchedule.name}</p>
                                    </div>
                                </div>
                            )}
                            {fuelStats && (
                                <>
                                    <div className="pt-4 border-t space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <TrendingUp className="h-4 w-4 mr-2" />
                                                Avg. Economy
                                            </div>
                                            <div className="font-bold text-green-600">
                                                {fuelStats.avgMpg.toFixed(1)} {asset.trackingMethod === "Mileage" ? "mpg" : "gph"}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <Droplet className="h-4 w-4 mr-2" />
                                                Avg. Price
                                            </div>
                                            <div className="font-medium">
                                                ${fuelStats.avgCostPerGal.toFixed(2)}/gal
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Dynamic Details from JSON */}
                    {asset.details && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    Specifications
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="space-y-3">
                                    {Object.entries(JSON.parse(asset.details)).map(([key, value]) => (
                                        <div key={key} className="flex flex-col border-b border-muted last:border-0 pb-2 last:pb-0">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </span>
                                            <span className="text-sm font-medium">{value as string}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="service" className="w-full">
                        <TabsList className="flex flex-wrap !h-auto w-full gap-2 p-1 bg-muted/50 border rounded-xl mb-6 justify-start">
                            <TabsTrigger value="service" className="flex-1 min-w-[120px] flex items-center justify-center py-2">
                                <History className="h-4 w-4 mr-2" /> History
                            </TabsTrigger>
                            <TabsTrigger value="fuel" className="flex-1 min-w-[120px] flex items-center justify-center py-2">
                                <Droplet className="h-4 w-4 mr-2" /> Fuel
                            </TabsTrigger>
                            <TabsTrigger value="schedules" className="flex-1 min-w-[120px] flex items-center justify-center py-2">
                                <Bell className="h-4 w-4 mr-2" /> Reminders
                            </TabsTrigger>
                            <TabsTrigger value="specs" className="flex-1 min-w-[120px] flex items-center justify-center py-2">
                                <ListChecks className="h-4 w-4 mr-2" /> Specs
                            </TabsTrigger>
                            <TabsTrigger value="parts" className="flex-1 min-w-[120px] flex items-center justify-center py-2">
                                <Package className="h-4 w-4 mr-2" /> Parts
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="service">
                            <ServiceList records={serviceRecords} trackingMethod={asset.trackingMethod} />
                        </TabsContent>
                        <TabsContent value="fuel">
                            <FuelList records={fuelRecords} trackingMethod={asset.trackingMethod} />
                        </TabsContent>
                        <TabsContent value="schedules">
                            <ScheduleList
                                schedules={schedules}
                                assetId={asset.id}
                                trackingMethod={asset.trackingMethod}
                                currentUsage={asset.currentUsage}
                            />
                        </TabsContent>
                        <TabsContent value="specs">
                            <SpecList assetId={asset.id} specs={specs} />
                        </TabsContent>
                        <TabsContent value="parts">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Assigned & Compatible Parts</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {compatibleParts.length === 0 && (
                                            <div className="col-span-full py-8 text-center text-muted-foreground italic">
                                                No parts assigned to this asset yet.
                                                <div className="mt-2">
                                                    <Link href="/dashboard/parts" className="text-primary hover:underline">
                                                        Manage Parts Catalog
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                        {compatibleParts.map((part) => (
                                            <div key={part.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/10 rounded-full">
                                                        <Package className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold">{part.name}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {part.manufacturer} {part.partNumber && `• ${part.partNumber}`}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
