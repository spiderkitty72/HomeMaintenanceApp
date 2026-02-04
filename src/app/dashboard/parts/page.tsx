import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getParts } from "@/lib/actions/parts";
import { getAssets } from "@/lib/actions/assets";
import { PartsList } from "@/components/parts/PartsList";
import { AddPartDialog } from "@/components/parts/AddPartDialog";
import { AddPurchaseDialog } from "@/components/parts/AddPurchaseDialog";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Package } from "lucide-react";

export default async function PartsPage() {
    const session = await auth();
    if (!session) redirect("/api/auth/signin");

    const [parts, assets] = await Promise.all([
        getParts(),
        getAssets()
    ]);

    return (
        <div className="container mx-auto py-8 px-4 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Parts Catalog</h1>
                    <p className="text-muted-foreground">
                        Manage your inventory of spare parts and their asset compatibility.
                    </p>
                </div>
                <div className="flex gap-2">
                    <AddPurchaseDialog parts={parts} />
                    <AddPartDialog assets={assets} />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        Inventory
                    </CardTitle>
                    <CardDescription>
                        A list of all parts you've added to your catalog.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <PartsList parts={parts} assets={assets} />
                </CardContent>
            </Card>
        </div>
    );
}
