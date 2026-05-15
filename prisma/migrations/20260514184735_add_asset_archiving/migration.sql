-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "trackingMethod" TEXT NOT NULL,
    "details" TEXT,
    "currentUsage" REAL NOT NULL DEFAULT 0,
    "usageUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dailyUsage" REAL NOT NULL DEFAULT 0,
    "image" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Asset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Asset" ("createdAt", "currentUsage", "dailyUsage", "details", "id", "image", "name", "trackingMethod", "type", "updatedAt", "usageUpdatedAt", "userId") SELECT "createdAt", "currentUsage", "dailyUsage", "details", "id", "image", "name", "trackingMethod", "type", "updatedAt", "usageUpdatedAt", "userId" FROM "Asset";
DROP TABLE "Asset";
ALTER TABLE "new_Asset" RENAME TO "Asset";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
