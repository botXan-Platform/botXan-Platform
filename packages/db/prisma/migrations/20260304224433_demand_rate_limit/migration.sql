/*
  Warnings:

  - You are about to drop the column `notifiedCount` on the `DemandSignal` table. All the data in the column will be lost.
  - You are about to drop the column `notifyWindowStartAt` on the `DemandSignal` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[city,areaName,serviceKey]` on the table `DemandSignal` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "DemandSignal_city_serviceId_idx";

-- DropIndex
DROP INDEX "DemandSignal_notifyWindowStartAt_idx";

-- DropIndex
DROP INDEX "DemandSignal_serviceId_idx";

-- AlterTable
ALTER TABLE "DemandSignal" DROP COLUMN "notifiedCount",
DROP COLUMN "notifyWindowStartAt",
ADD COLUMN     "serviceKey" TEXT;

-- CreateIndex
CREATE INDEX "DemandSignal_serviceKey_idx" ON "DemandSignal"("serviceKey");

-- CreateIndex
CREATE INDEX "DemandSignal_city_serviceKey_idx" ON "DemandSignal"("city", "serviceKey");

-- CreateIndex
CREATE UNIQUE INDEX "DemandSignal_city_areaName_serviceKey_key" ON "DemandSignal"("city", "areaName", "serviceKey");
