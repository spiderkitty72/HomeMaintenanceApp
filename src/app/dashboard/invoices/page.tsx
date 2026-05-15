import { getInvoices } from "@/lib/actions/invoices";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { FileText, CheckCircle2, Clock, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function invoiceTotal(lineItems: { quantity: number; unitCost: number }[]) {
    return lineItems.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);
}

function StatusBadge({ status }: { status: string }) {
    return status === "PAID" ? (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Paid
        </Badge>
    ) : (
        <Badge variant="outline" className="text-amber-600 border-amber-300 dark:border-amber-700 dark:text-amber-400">
            <Clock className="h-3 w-3 mr-1" /> Unpaid
        </Badge>
    );
}

function InvoiceRow({ invoice, userLabel }: { invoice: any; userLabel: string }) {
    const total = invoiceTotal(invoice.lineItems);
    return (
        <Link href={`/dashboard/invoices/${invoice.id}`} className="block group">
            <div className="flex items-center justify-between py-4 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground truncate">
                            {userLabel} · {invoice.serviceRecord.summary} · {invoice.inventorySystem.name}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-4">
                    <StatusBadge status={invoice.status} />
                    <div className="text-right hidden sm:block">
                        <p className="font-mono font-bold text-sm">${total.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(invoice.issuedAt), "MMM d, yyyy")}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>
        </Link>
    );
}

export default async function InvoicesPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const { sent, received } = await getInvoices();

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
                <p className="text-muted-foreground mt-1">Invoices you've sent and received for parts used in service records.</p>
            </div>

            <Tabs defaultValue="sent">
                <TabsList className="mb-6">
                    <TabsTrigger value="sent">
                        Sent
                        {sent.length > 0 && <span className="ml-2 text-xs bg-primary/10 text-primary rounded-full px-1.5 py-0.5">{sent.length}</span>}
                    </TabsTrigger>
                    <TabsTrigger value="received">
                        Received
                        {received.length > 0 && <span className="ml-2 text-xs bg-primary/10 text-primary rounded-full px-1.5 py-0.5">{received.length}</span>}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="sent">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium text-muted-foreground">Invoices You Sent</CardTitle>
                        </CardHeader>
                        <CardContent className="divide-y">
                            {sent.length === 0 ? (
                                <p className="text-center py-8 text-muted-foreground italic text-sm">No invoices sent yet.</p>
                            ) : (
                                sent.map((inv: any) => (
                                    <InvoiceRow
                                        key={inv.id}
                                        invoice={inv}
                                        userLabel={`To: ${inv.toUser?.name || inv.toUser?.email}`}
                                    />
                                ))
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="received">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium text-muted-foreground">Invoices Sent to You</CardTitle>
                        </CardHeader>
                        <CardContent className="divide-y">
                            {received.length === 0 ? (
                                <p className="text-center py-8 text-muted-foreground italic text-sm">No invoices received.</p>
                            ) : (
                                received.map((inv: any) => (
                                    <InvoiceRow
                                        key={inv.id}
                                        invoice={inv}
                                        userLabel={`From: ${inv.fromUser?.name || inv.fromUser?.email}`}
                                    />
                                ))
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
