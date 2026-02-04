"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getExportData } from "@/lib/actions/export";
import * as XLSX from "xlsx";

export function ExportDataButton() {
    const [isExporting, setIsExporting] = useState(false);

    async function handleExport() {
        setIsExporting(true);
        try {
            const { assets, parts } = await getExportData() as any;

            // Create workbook
            const wb = XLSX.utils.book_new();

            // 1. Assets Sheet
            const assetRows = assets.map((asset: any) => ({
                "Asset Id": asset.id,
                "Name": asset.name,
                "Type": asset.type,
                "Owner": asset.owner.name || asset.owner.email,
                "Tracking": asset.trackingMethod,
                "Current Usage": asset.currentUsage,
                "Created At": new Date(asset.createdAt).toLocaleDateString(),
            }));
            const wsAssets = XLSX.utils.json_to_sheet(assetRows);
            XLSX.utils.book_append_sheet(wb, wsAssets, "Assets");

            // 2. Service Sheet
            const serviceRows: any[] = [];
            assets.forEach((asset: any) => {
                asset.serviceRecords.forEach((record: any) => {
                    serviceRows.push({
                        "Asset": asset.name,
                        "Date": new Date(record.date).toLocaleDateString(),
                        "Usage": record.usageAtService,
                        "Summary": record.summary,
                        "Vendor": record.vendor || "-",
                        "Cost": record.totalCost,
                        "Parts Used": record.parts.map((p: any) => `${p.part.name} (${p.quantity})`).join(", ")
                    });
                });
            });
            const wsService = XLSX.utils.json_to_sheet(serviceRows);
            XLSX.utils.book_append_sheet(wb, wsService, "Service History");

            // 3. Fuel Sheet
            const fuelRows: any[] = [];
            assets.forEach((asset: any) => {
                asset.fuelRecords.forEach((record: any) => {
                    fuelRows.push({
                        "Asset": asset.name,
                        "Date": record.date ? new Date(record.date).toLocaleDateString() : "-", // Safety check
                        "Usage": record.usageAtFill,
                        "Gallons": record.gallons,
                        "Price/Gal": record.pricePerGallon,
                        "Total Cost": record.totalCost,
                        "Full Tank": record.isFullTank ? "Yes" : "No"
                    });
                });
            });
            const wsFuel = XLSX.utils.json_to_sheet(fuelRows);
            XLSX.utils.book_append_sheet(wb, wsFuel, "Fuel Logs");

            // 4. Specs Sheet
            const specRows: any[] = [];
            assets.forEach((asset: any) => {
                asset.specs.forEach((spec: any) => {
                    specRows.push({
                        "Asset": asset.name,
                        "Spec Type": spec.specType.name,
                        "Value": spec.value,
                        "Unit": spec.specType.unit || "-"
                    });
                });
            });
            const wsSpecs = XLSX.utils.json_to_sheet(specRows);
            XLSX.utils.book_append_sheet(wb, wsSpecs, "Specifications");

            // 5. Parts Sheet
            const partRows = parts.map((part: any) => ({
                "Name": part.name,
                "Part Number": part.partNumber || "-",
                "Manufacturer": part.manufacturer || "-",
                "Compatible Type": part.compatibleType || "-",
                "Unit Cost": part.defaultCost,
                "UOM": part.unitOfMeasure,
                "Qty On Hand": part.quantityOnHand
            }));
            const wsParts = XLSX.utils.json_to_sheet(partRows);
            XLSX.utils.book_append_sheet(wb, wsParts, "Parts Catalog");

            // Export file
            const dateStr = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `Maintenance_App_Export_${dateStr}.xlsx`);

            toast.success("Data export complete!");
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Failed to export data. Please try again.");
        } finally {
            setIsExporting(false);
        }
    }

    return (
        <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
            className="gap-2"
        >
            {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Download className="h-4 w-4" />
            )}
            {isExporting ? "Exporting..." : "Export All Data"}
        </Button>
    );
}
