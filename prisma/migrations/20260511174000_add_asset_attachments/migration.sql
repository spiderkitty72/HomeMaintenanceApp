-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "serviceRecordId" TEXT,
    "fuelRecordId" TEXT,
    "partPurchaseId" TEXT,
    "assetId" TEXT,
    CONSTRAINT "Attachment_serviceRecordId_fkey" FOREIGN KEY ("serviceRecordId") REFERENCES "ServiceRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attachment_fuelRecordId_fkey" FOREIGN KEY ("fuelRecordId") REFERENCES "FuelRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attachment_partPurchaseId_fkey" FOREIGN KEY ("partPurchaseId") REFERENCES "PartPurchase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attachment_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Attachment" ("fileType", "fuelRecordId", "id", "partPurchaseId", "serviceRecordId", "url") SELECT "fileType", "fuelRecordId", "id", "partPurchaseId", "serviceRecordId", "url" FROM "Attachment";
DROP TABLE "Attachment";
ALTER TABLE "new_Attachment" RENAME TO "Attachment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
