-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AssetSpecType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "AssetSpecType_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AssetSpecType" ("id", "name", "unit", "userId") SELECT "id", "name", "unit", "userId" FROM "AssetSpecType";
DROP TABLE "AssetSpecType";
ALTER TABLE "new_AssetSpecType" RENAME TO "AssetSpecType";
CREATE UNIQUE INDEX "AssetSpecType_userId_name_key" ON "AssetSpecType"("userId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
