-- CreateTable
CREATE TABLE "InventorySystem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventorySystem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventorySystemId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "quantityOnHand" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "InventoryItem_inventorySystemId_fkey" FOREIGN KEY ("inventorySystemId") REFERENCES "InventorySystem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InventoryItem_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PartPurchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "vendor" TEXT,
    "totalCost" REAL NOT NULL DEFAULT 0,
    "inventorySystemId" TEXT,
    CONSTRAINT "PartPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PartPurchase_inventorySystemId_fkey" FOREIGN KEY ("inventorySystemId") REFERENCES "InventorySystem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PartPurchase" ("date", "id", "totalCost", "userId", "vendor") SELECT "date", "id", "totalCost", "userId", "vendor" FROM "PartPurchase";
DROP TABLE "PartPurchase";
ALTER TABLE "new_PartPurchase" RENAME TO "PartPurchase";
CREATE TABLE "new_ServiceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "usageAtService" REAL NOT NULL,
    "summary" TEXT NOT NULL,
    "notes" TEXT,
    "totalCost" REAL NOT NULL DEFAULT 0,
    "vendor" TEXT,
    "inventorySystemId" TEXT,
    CONSTRAINT "ServiceRecord_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ServiceRecord_inventorySystemId_fkey" FOREIGN KEY ("inventorySystemId") REFERENCES "InventorySystem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ServiceRecord" ("assetId", "date", "id", "notes", "summary", "totalCost", "usageAtService", "vendor") SELECT "assetId", "date", "id", "notes", "summary", "totalCost", "usageAtService", "vendor" FROM "ServiceRecord";
DROP TABLE "ServiceRecord";
ALTER TABLE "new_ServiceRecord" RENAME TO "ServiceRecord";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_inventorySystemId_partId_key" ON "InventoryItem"("inventorySystemId", "partId");
