import { getAssets } from "@/lib/actions/assets";
import { AssetCard } from "@/components/assets/AssetCard";
import { AddAssetDialog } from "@/components/assets/AddAssetDialog";
import { auth } from "@/auth";
import { getSystemSetting } from "@/lib/actions/settings";

export default async function DashboardPage() {
    const session = await auth();
    const assets = await getAssets();
    const reminderSettings = await getSystemSetting("reminder_schedule");
    const maxDaysToEstimate = reminderSettings?.maxDaysToEstimate ?? 30;

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
                    <p className="text-muted-foreground">Manage your vehicles, property, and equipment.</p>
                </div>
                <AddAssetDialog />
            </div>

            {assets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-lg bg-muted/30">
                    <p className="text-lg font-medium">No assets found</p>
                    <p className="text-sm text-muted-foreground">Add your first asset to start tracking maintenance.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assets.map((asset) => (
                        <AssetCard key={asset.id} asset={asset} currentUserId={session?.user?.id} maxDaysToEstimate={maxDaysToEstimate} />
                    ))}
                </div>
            )}
        </div>
    );
}
