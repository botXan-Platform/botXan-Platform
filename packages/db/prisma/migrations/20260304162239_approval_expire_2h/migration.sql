/*
  Warnings:

  - You are about to drop the column `priceDay` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `priceHour` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `priceMonth` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `priceWeek` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `priceYear` on the `Property` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "expiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "priceDay",
DROP COLUMN "priceHour",
DROP COLUMN "priceMonth",
DROP COLUMN "priceWeek",
DROP COLUMN "priceYear",
ADD COLUMN     "approvalExpireHours" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "serviceId" TEXT;

-- CreateTable
CREATE TABLE "PropertyPricing" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "type" "PricingType" NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "depositRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyPricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertyPricing_propertyId_idx" ON "PropertyPricing"("propertyId");

-- CreateIndex
CREATE INDEX "Property_serviceId_idx" ON "Property"("serviceId");

-- CreateIndex
CREATE INDEX "Property_serviceId_city_idx" ON "Property"("serviceId", "city");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyPricing" ADD CONSTRAINT "PropertyPricing_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
