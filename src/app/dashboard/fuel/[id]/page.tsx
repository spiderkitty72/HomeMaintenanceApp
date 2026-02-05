import { getFuelRecord, getFuelRecords } from "@/lib/actions/fuel";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
    Calendar,
    Calculator,
    Droplets,
    Tag,
    Banknote,
    Gauge,
    Paperclip,
    ChevronLeft,
    Fuel,
    CircleDashed
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddFuelDialog } from "@/components/fuel/AddFuelDialog";
import { DeleteRecordButton } from "@/components/common/DeleteRecordButton";
import { deleteFuelRecord } from "@/lib/actions/fuel";
import { auth } from "@/auth";
import { checkPermission } from "@/lib/permissions";
import { Edit2 } from "lucide-react";

export default async function FuelDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const { id } = await params;
    const record = await getFuelRecord(id);

    if (!record || !session?.user?.id) {
        notFound();
    }

    const isAdmin = (session.user as any).role === "ADMIN";
    const isOwner = record.asset.userId === session.user.id;
    const hasEditPermission = await checkPermission("EDIT", "FUEL");
    const hasDeletePermission = await checkPermission("DELETE", "FUEL");

    const canEdit = isAdmin || isOwner || hasEditPermission;
    const canDelete = isAdmin || isOwner || hasDeletePermission;

    // Get all records for this asset to calculate MPG for this specific record
    // In a real app we might pass this calculation or the previous record id
    const allRecords = await getFuelRecords(record.assetId);
    const currentIndex = allRecords.findIndex(r => r.id === record.id);
    const nextRecord = allRecords[currentIndex + 1];

    let mpg = null;
    if (record.isFullTank && nextRecord && nextRecord.isFullTank) {
        const distance = record.usageAtFill - nextRecord.usageAtFill;
        if (distance > 0) {
            mpg = distance / record.gallons;
        }
    }

    const usageUnit = record.asset.trackingMethod === "Mileage" ? "mi" : record.asset.trackingMethod === "Hours" ? "hrs" : "";

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-6">
                <Link href={`/dashboard/asset/${record.assetId}`}>
                    <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground hover:text-primary">
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back to {record.asset.name}
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Fuel Log Details</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Entry ID: <span className="font-mono text-xs text-muted-foreground/70">{record.id}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="px-3 py-1 bg-green-500/5 text-green-600 border-green-500/20">
                        <Fuel className="h-3.5 w-3.5 mr-1.5" />
                        Fuel Record
                    </Badge>
                    {!record.isFullTank && (
                        <Badge variant="outline" className="px-3 py-1 bg-amber-500/5 text-amber-600 border-amber-500/20">
                            <CircleDashed className="h-3.5 w-3.5 mr-1.5" />
                            Partial Fill
                        </Badge>
                    )}
                    {(canEdit || canDelete) && (
                        <div className="flex items-center gap-2 ml-2 border-l pl-4 py-1">
                            {canEdit && (
                                <AddFuelDialog
                                    assetId={record.assetId}
                                    trackingMethod={record.asset.trackingMethod}
                                    fuelRecord={record}
                                    trigger={
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Edit2 className="h-4 w-4" />
                                            Edit
                                        </Button>
                                    }
                                />
                            )}
                            {canDelete && (
                                <DeleteRecordButton
                                    recordId={record.id}
                                    onDelete={deleteFuelRecord}
                                    redirectPath={`/dashboard/asset/${record.assetId}`}
                                    recordType="Fuel"
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Metric Cards */}
                <Card className="bg-primary/5 border-primary/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center">
                            <Calendar className="h-3 w-3 mr-1.5" /> Date
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-bold">{format(new Date(record.date), "MMM d, yyyy")}</p>
                    </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center">
                            <Calculator className="h-3 w-3 mr-1.5" /> Usage
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-bold">{record.usageAtFill.toLocaleString()} {usageUnit}</p>
                    </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center">
                            <Banknote className="h-3 w-3 mr-1.5" /> Total Cost
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-bold text-green-600">${record.totalCost.toFixed(2)}</p>
                    </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/10 shadow-sm border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] uppercase tracking-wider text-primary flex items-center">
                            <Gauge className="h-3 w-3 mr-1.5" /> Efficiency
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-black text-primary">
                            {mpg ? `${mpg.toFixed(2)} MPG` : "---"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Price Break-down</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-blue-500/10 rounded-full">
                                        <Droplets className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Gallons Pumped</p>
                                        <p className="text-xs text-muted-foreground text-blue-600 font-medium">
                                            {record.isFullTank ? "Full Tank" : "Partial tank fill"}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-xl font-bold">{record.gallons.toFixed(3)} G</p>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-purple-500/10 rounded-full">
                                        <Tag className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Price per Gallon</p>
                                        <p className="text-xs text-muted-foreground">Market price at fill</p>
                                    </div>
                                </div>
                                <p className="text-xl font-bold">${record.pricePerGallon.toFixed(3)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center">
                                <Paperclip className="h-4 w-4 mr-2" />
                                Data Integrity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-sm text-muted-foreground leading-relaxed">
                                {mpg ? (
                                    <p>Efficiency was calculated based on the distance between this fill-up and the previous full tank record.</p>
                                ) : (
                                    <p>Efficiency (MPG) cannot be calculated as either this or the previous record was a partial fill.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center">
                                <Paperclip className="h-4 w-4 mr-2" />
                                Attachments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {record.attachments && record.attachments.length > 0 ? (
                                <div className="space-y-4">
                                    {record.attachments.map((attachment) => (
                                        <a
                                            key={attachment.id}
                                            href={attachment.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group block relative aspect-[4/3] rounded-lg overflow-hidden border bg-muted"
                                        >
                                            <img
                                                src={attachment.url}
                                                alt="Fuel Receipt"
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                            />
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center py-6 text-muted-foreground italic text-xs">
                                    No receipts or photos found.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
