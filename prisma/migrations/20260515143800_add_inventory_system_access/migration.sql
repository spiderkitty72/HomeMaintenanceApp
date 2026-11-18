-- CreateTable
CREATE TABLE "InventorySystemAccess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventorySystemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    CONSTRAINT "InventorySystemAccess_inventorySystemId_fkey" FOREIGN KEY ("inventorySystemId") REFERENCES "InventorySystem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InventorySystemAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "InventorySystemAccess_inventorySystemId_userId_key" ON "InventorySystemAccess"("inventorySystemId", "userId");
