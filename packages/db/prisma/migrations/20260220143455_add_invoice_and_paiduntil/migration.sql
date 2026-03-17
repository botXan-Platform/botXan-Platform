/*
  Warnings:

  - Made the column `city` on table `Property` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELED');

-- AlterTable
ALTER TABLE "Owner" ADD COLUMN     "paidUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Property" ALTER COLUMN "city" SET NOT NULL;

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AZN',
    "provider" TEXT NOT NULL,
    "providerRef" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "periodDays" INTEGER NOT NULL DEFAULT 30,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Invoice_ownerId_idx" ON "Invoice"("ownerId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_provider_idx" ON "Invoice"("provider");

-- CreateIndex
CREATE INDEX "Invoice_createdAt_idx" ON "Invoice"("createdAt");

-- CreateIndex
CREATE INDEX "Owner_phone_idx" ON "Owner"("phone");

-- CreateIndex
CREATE INDEX "Owner_paidUntil_idx" ON "Owner"("paidUntil");

-- CreateIndex
CREATE INDEX "Property_city_idx" ON "Property"("city");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
