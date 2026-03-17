-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "OwnerSubscription" ADD COLUMN     "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "tier" "SubscriptionTier" NOT NULL DEFAULT 'STANDARD',
ALTER COLUMN "status" SET DEFAULT 'EXPIRED';

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "premiumMonthlyPrice" INTEGER,
ADD COLUMN     "premiumYearlyPrice" INTEGER,
ADD COLUMN     "standardMonthlyPrice" INTEGER,
ADD COLUMN     "standardYearlyPrice" INTEGER;

-- CreateIndex
CREATE INDEX "Invoice_subscriptionTier_idx" ON "Invoice"("subscriptionTier");

-- CreateIndex
CREATE INDEX "Invoice_billingCycle_idx" ON "Invoice"("billingCycle");

-- CreateIndex
CREATE INDEX "OwnerSubscription_tier_idx" ON "OwnerSubscription"("tier");

-- CreateIndex
CREATE INDEX "OwnerSubscription_billingCycle_idx" ON "OwnerSubscription"("billingCycle");

-- CreateIndex
CREATE INDEX "OwnerSubscription_serviceId_tier_status_paidUntil_idx" ON "OwnerSubscription"("serviceId", "tier", "status", "paidUntil");
