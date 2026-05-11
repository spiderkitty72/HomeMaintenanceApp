-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FuelRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "usageAtFill" REAL NOT NULL,
    "gallons" REAL NOT NULL,
    "pricePerGallon" REAL NOT NULL,
    "totalCost" REAL NOT NULL,
    "isFullTank" BOOLEAN NOT NULL DEFAULT true,
    "missedPrevious" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "FuelRecord_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FuelRecord" ("assetId", "date", "gallons", "id", "isFullTank", "pricePerGallon", "totalCost", "usageAtFill") SELECT "assetId", "date", "gallons", "id", "isFullTank", "pricePerGallon", "totalCost", "usageAtFill" FROM "FuelRecord";
DROP TABLE "FuelRecord";
ALTER TABLE "new_FuelRecord" RENAME TO "FuelRecord";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
