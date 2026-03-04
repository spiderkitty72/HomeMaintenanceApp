-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ServiceSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "frequencyType" TEXT NOT NULL,
    "frequencyValue" REAL NOT NULL,
    "lastPerformedDate" DATETIME,
    "lastPerformedUsage" REAL,
    "nextDueDate" DATETIME,
    "nextDueUsage" REAL,
    "isReminderDismissed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ServiceSchedule_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ServiceSchedule" ("assetId", "frequencyType", "frequencyValue", "id", "lastPerformedDate", "lastPerformedUsage", "name", "nextDueDate", "nextDueUsage") SELECT "assetId", "frequencyType", "frequencyValue", "id", "lastPerformedDate", "lastPerformedUsage", "name", "nextDueDate", "nextDueUsage" FROM "ServiceSchedule";
DROP TABLE "ServiceSchedule";
ALTER TABLE "new_ServiceSchedule" RENAME TO "ServiceSchedule";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
