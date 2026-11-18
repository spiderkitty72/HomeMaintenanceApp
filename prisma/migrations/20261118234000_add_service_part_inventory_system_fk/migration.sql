-- Adds the foreign key from ServicePart.inventorySystemId to InventorySystem that
-- 20260515150000_add_service_part_inventory_system_id left out. Every existing row and
-- column is copied. Part.quantityOnHand is intentionally kept (see schema.prisma).

-- A service part can only point at an inventory system that still exists; clear any
-- dangling ids first (the new key uses ON DELETE SET NULL, so this matches its behavior).
UPDATE "ServicePart" SET "inventorySystemId" = NULL
WHERE "inventorySystemId" IS NOT NULL
  AND "inventorySystemId" NOT IN (SELECT "id" FROM "InventorySystem");

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ServicePart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceRecordId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "costPerUnit" REAL NOT NULL,
    "inventorySystemId" TEXT,
    CONSTRAINT "ServicePart_serviceRecordId_fkey" FOREIGN KEY ("serviceRecordId") REFERENCES "ServiceRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ServicePart_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServicePart_inventorySystemId_fkey" FOREIGN KEY ("inventorySystemId") REFERENCES "InventorySystem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ServicePart" ("costPerUnit", "id", "inventorySystemId", "partId", "quantity", "serviceRecordId") SELECT "costPerUnit", "id", "inventorySystemId", "partId", "quantity", "serviceRecordId" FROM "ServicePart";
DROP TABLE "ServicePart";
ALTER TABLE "new_ServicePart" RENAME TO "ServicePart";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
