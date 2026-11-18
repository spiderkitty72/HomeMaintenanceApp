-- AlterTable
ALTER TABLE "Asset" ADD COLUMN "manualUsage" REAL;

-- Backfill: keep every asset's current reading as its floor so no existing value is lost
UPDATE "Asset" SET "manualUsage" = "currentUsage";
