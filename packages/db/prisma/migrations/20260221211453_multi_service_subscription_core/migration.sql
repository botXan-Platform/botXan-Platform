/*
  Warnings:

  - A unique constraint covering the columns `[providerRef]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELED');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "serviceId" TEXT,
ADD COLUMN     "subscriptionId" TEXT;

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT,
    "price" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'AZN',
    "periodDays" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnerSubscription" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "paidUntil" TIMESTAMP(3),

    CONSTRAINT "OwnerSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Service_key_key" ON "Service"("key");

-- CreateIndex
CREATE INDEX "Service_ownerId_idx" ON "Service"("ownerId");

-- CreateIndex
CREATE INDEX "Service_isActive_idx" ON "Service"("isActive");

-- CreateIndex
CREATE INDEX "Service_key_idx" ON "Service"("key");

-- CreateIndex
CREATE INDEX "OwnerSubscription_ownerId_idx" ON "OwnerSubscription"("ownerId");

-- CreateIndex
CREATE INDEX "OwnerSubscription_serviceId_idx" ON "OwnerSubscription"("serviceId");

-- CreateIndex
CREATE INDEX "OwnerSubscription_paidUntil_idx" ON "OwnerSubscription"("paidUntil");

-- CreateIndex
CREATE INDEX "OwnerSubscription_status_idx" ON "OwnerSubscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OwnerSubscription_ownerId_serviceId_key" ON "OwnerSubscription"("ownerId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_providerRef_key" ON "Invoice"("providerRef");

-- CreateIndex
CREATE INDEX "Invoice_subscriptionId_idx" ON "Invoice"("subscriptionId");

-- CreateIndex
CREATE INDEX "Invoice_serviceId_idx" ON "Invoice"("serviceId");

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerSubscription" ADD CONSTRAINT "OwnerSubscription_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerSubscription" ADD CONSTRAINT "OwnerSubscription_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "OwnerSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
