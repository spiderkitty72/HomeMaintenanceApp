import { getServiceRecord } from "@/lib/actions/service";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
    Calendar,
    Calculator,
    Wrench,
    Store,
    FileText,
    Package,
    Paperclip,
    ChevronLeft,
    Banknote
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddServiceDialog } from "@/components/service/AddServiceDialog";
import { DeleteRecordButton } from "@/components/common/DeleteRecordButton";
import { deleteServiceRecord } from "@/lib/actions/service";
import { auth } from "@/auth";
import { checkPermission } from "@/lib/permissions";
import { Edit2 } from "lucide-react";

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const { id } = await params;
    const record = await getServiceRecord(id);

    if (!record || !session?.user?.id) {
        notFound();
    }

    const isAdmin = (session.user as any).role === "ADMIN";
    const isOwner = record.asset.userId === session.user.id;
    const hasEditPermission = await checkPermission("EDIT", "SERVICE");
    const hasDeletePermission = await checkPermission("DELETE", "SERVICE");

    const canEdit = isAdmin || isOwner || hasEditPermission;
    const canDelete = isAdmin || isOwner || hasDeletePermission;

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

            {/* DEBUG INFO - REMOVE LATER */}
            {process.env.NODE_ENV === "development" && (
                <div className="mb-4 p-2 bg-black text-white text-[10px] font-mono rounded flex gap-4">
                    <span>isAdmin: {String(isAdmin)}</span>
                    <span>isOwner: {String(isOwner)}</span>
                    <span>hasEdit: {String(hasEditPermission)}</span>
                    <span>hasDelete: {String(hasDeletePermission)}</span>
                    <span>canEdit: {String(canEdit)}</span>
                    <span>canDelete: {String(canDelete)}</span>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{record.summary}</h1>
                    <p className="text-muted-foreground mt-1">
                        Service ID: <span className="font-mono text-xs">{record.id}</span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="px-3 py-1 text-sm bg-primary/5 border-primary/20 text-primary">
                        <Wrench className="h-3.5 w-3.5 mr-1.5" />
                        Service Record
                    </Badge>
                    {(canEdit || canDelete) && (
                        <div className="flex items-center gap-2 ml-2 border-l pl-4 py-1">
                            {canEdit && (
                                <AddServiceDialog
                                    assetId={record.assetId}
                                    trackingMethod={record.asset.trackingMethod}
                                    serviceRecord={record}
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
                                    onDelete={deleteServiceRecord}
                                    redirectPath={`/dashboard/asset/${record.assetId}`}
                                    recordType="Service"
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Primary Info Cards */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                            <Calendar className="h-4 w-4 mr-2" /> Date
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">{format(new Date(record.date), "MMMM d, yyyy")}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                            <Calculator className="h-4 w-4 mr-2" /> Usage
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">
                            {record.usageAtService.toLocaleString()} {usageUnit}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                            <Banknote className="h-4 w-4 mr-2" /> Total Cost
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black text-primary">
                            ${record.totalCost.toFixed(2)}
                        </p>
                    </CardContent>
                </Card>

                {/* Details Section */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <FileText className="h-5 w-5 mr-2 text-primary" />
                                Details & Notes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {record.vendor && (
                                <div className="flex items-start space-x-3">
                                    <Store className="h-5 w-5 mt-0.5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Vendor / Location</p>
                                        <p className="text-muted-foreground">{record.vendor}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start space-x-3">
                                <FileText className="h-5 w-5 mt-0.5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Notes</p>
                                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                        {record.notes || "No additional notes provided."}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Package className="h-5 w-5 mr-2 text-primary" />
                                Parts Used ({record.parts.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {record.parts.length > 0 ? (
                                <div className="divide-y">
                                    {record.parts.map((p) => (
                                        <div key={p.id} className="py-4 first:pt-0 last:pb-0 flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold">{p.part.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Quantity: {p.quantity} × ${p.costPerUnit.toFixed(2)}
                                                </p>
                                            </div>
                                            <p className="font-mono font-bold">
                                                ${(p.quantity * p.costPerUnit).toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center py-6 text-muted-foreground italic">
                                    No parts were logged with this service.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Section */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Paperclip className="h-5 w-5 mr-2 text-primary" />
                                Attachments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {record.attachments && record.attachments.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {record.attachments.map((attachment) => (
                                        <a
                                            key={attachment.id}
                                            href={attachment.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group block relative aspect-video rounded-lg overflow-hidden border bg-muted"
                                        >
                                            <img
                                                src={attachment.url}
                                                alt="Attachment"
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <p className="text-white text-sm font-medium">View Full Image</p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center py-6 text-muted-foreground italic text-sm">
                                    No attachments found.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
