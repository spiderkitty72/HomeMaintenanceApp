-- AlterTable: add inventorySystemId to ServicePart (missed in 20260515135126_add_inventory_systems)
ALTER TABLE "ServicePart" ADD COLUMN "inventorySystemId" TEXT;
