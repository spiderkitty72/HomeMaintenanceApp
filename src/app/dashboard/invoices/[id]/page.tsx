import { getInvoice } from "@/lib/actions/invoices";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { ChevronLeft, FileText, CheckCircle2, Clock, Package, User, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceActions } from "@/components/invoices/InvoiceActions";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) notFound();

    let invoice: any;
    try {
        invoice = await getInvoice(id);
    } catch {
        notFound();
    }

    const total = invoice.lineItems.reduce((sum: number, l: any) => sum + l.quantity * l.unitCost, 0);
    const isIssuer = invoice.fromUserId === session.user.id || (session.user as any).role === "ADMIN";

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="mb-6">
                <Link href="/dashboard/invoices">
                    <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground hover:text-primary">
                        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Invoices
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-bold tracking-tight">{invoice.invoiceNumber}</h1>
                        {invoice.status === "PAID" ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0">
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Paid
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-300 dark:border-amber-700 dark:text-amber-400">
                                <Clock className="h-3.5 w-3.5 mr-1" /> Unpaid
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">Issued {format(new Date(invoice.issuedAt), "MMMM d, yyyy")}</p>
                    {invoice.paidAt && (
                        <p className="text-sm text-green-600 dark:text-green-400">Paid {format(new Date(invoice.paidAt), "MMMM d, yyyy")}</p>
                    )}
                </div>
                {isIssuer && (
                    <InvoiceActions
                        invoiceId={invoice.id}
                        status={invoice.status}
                    />
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card>
                    <CardHeader className="pb-1">
                        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" /> From
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="font-semibold text-sm">{invoice.fromUser.name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{invoice.fromUser.email}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-1">
                        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" /> To
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="font-semibold text-sm">{invoice.toUser.name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{invoice.toUser.email}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-1">
                        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <Warehouse className="h-3.5 w-3.5" /> Inventory System
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="font-semibold text-sm">{invoice.inventorySystem.name}</p>
                        <Link href={`/dashboard/service/${invoice.serviceRecord.id}`} className="text-xs text-primary hover:underline">
                            {invoice.serviceRecord.summary}
                        </Link>
                    </CardContent>
                </Card>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" /> Line Items
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="divide-y">
                        {invoice.lineItems.map((item: any) => (
                            <div key={item.id} className="py-3 flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-sm">{item.partName}</p>
                                    <p className="text-xs text-muted-foreground">{item.quantity} × ${item.unitCost.toFixed(2)}</p>
                                </div>
                                <p className="font-mono font-bold text-sm">${(item.quantity * item.unitCost).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                    <div className="border-t mt-2 pt-3 flex justify-between items-center">
                        <p className="font-semibold">Total</p>
                        <p className="font-mono font-black text-lg text-primary">${total.toFixed(2)}</p>
                    </div>
                </CardContent>
            </Card>

            {invoice.notes && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Notes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
