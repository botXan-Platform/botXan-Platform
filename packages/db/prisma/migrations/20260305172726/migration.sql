-- CreateEnum
CREATE TYPE "DemandNotificationStatus" AS ENUM ('QUEUED', 'SENT', 'SKIPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "DemandNotificationSkipReason" AS ENUM ('COOLDOWN', 'THROTTLED', 'NO_SUBSCRIPTION', 'NO_CAPACITY', 'DUPLICATE', 'INTERNAL');

-- CreateEnum
CREATE TYPE "ReferralCampaign" AS ENUM ('OWNER_ONBOARD', 'SHARE_LISTING', 'INVITE_USER');

-- CreateEnum
CREATE TYPE "FunnelEventType" AS ENUM ('START', 'CITY_SELECTED', 'SERVICE_SELECTED', 'SEARCH', 'LISTING_VIEW', 'BOOKING_DRAFT', 'BOOKING_CONFIRMED');

-- CreateTable
CREATE TABLE "DemandSignalEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waId" TEXT,
    "customerPhone" TEXT,
    "city" TEXT NOT NULL,
    "areaName" TEXT NOT NULL,
    "serviceKey" TEXT,
    "serviceId" TEXT,
    "criteria" JSONB,

    CONSTRAINT "DemandSignalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnerDemandSubscription" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "areaName" TEXT NOT NULL,
    "serviceKey" TEXT,
    "serviceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OwnerDemandSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandNotification" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "areaName" TEXT NOT NULL,
    "serviceKey" TEXT,
    "status" "DemandNotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "skipReason" "DemandNotificationSkipReason",
    "note" TEXT,
    "bucketStartAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "messageId" TEXT,

    CONSTRAINT "DemandNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "windowStartAt" TIMESTAMP(3) NOT NULL,
    "windowSeconds" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "limit" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "waId" TEXT,
    "city" TEXT NOT NULL,
    "areaName" TEXT NOT NULL,
    "serviceKey" TEXT,
    "criteria" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "frequencyMinutes" INTEGER NOT NULL DEFAULT 10080,
    "lastNotifiedAt" TIMESTAMP(3),

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralCode" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "code" TEXT NOT NULL,
    "campaign" "ReferralCampaign" NOT NULL,
    "ownerId" TEXT,
    "propertyId" TEXT,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralAttribution" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "codeId" TEXT NOT NULL,
    "referredWaId" TEXT,
    "referredCustomerPhone" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertedAt" TIMESTAMP(3),

    CONSTRAINT "ReferralAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event" "FunnelEventType" NOT NULL,
    "waId" TEXT,
    "customerPhone" TEXT,
    "ownerId" TEXT,
    "propertyId" TEXT,
    "bookingId" TEXT,
    "properties" JSONB,

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DemandSignalEvent_createdAt_idx" ON "DemandSignalEvent"("createdAt");

-- CreateIndex
CREATE INDEX "DemandSignalEvent_city_areaName_createdAt_idx" ON "DemandSignalEvent"("city", "areaName", "createdAt");

-- CreateIndex
CREATE INDEX "DemandSignalEvent_serviceKey_createdAt_idx" ON "DemandSignalEvent"("serviceKey", "createdAt");

-- CreateIndex
CREATE INDEX "DemandSignalEvent_serviceId_createdAt_idx" ON "DemandSignalEvent"("serviceId", "createdAt");

-- CreateIndex
CREATE INDEX "DemandSignalEvent_waId_createdAt_idx" ON "DemandSignalEvent"("waId", "createdAt");

-- CreateIndex
CREATE INDEX "DemandSignalEvent_customerPhone_createdAt_idx" ON "DemandSignalEvent"("customerPhone", "createdAt");

-- CreateIndex
CREATE INDEX "OwnerDemandSubscription_ownerId_idx" ON "OwnerDemandSubscription"("ownerId");

-- CreateIndex
CREATE INDEX "OwnerDemandSubscription_city_areaName_idx" ON "OwnerDemandSubscription"("city", "areaName");

-- CreateIndex
CREATE INDEX "OwnerDemandSubscription_serviceKey_idx" ON "OwnerDemandSubscription"("serviceKey");

-- CreateIndex
CREATE INDEX "OwnerDemandSubscription_serviceId_idx" ON "OwnerDemandSubscription"("serviceId");

-- CreateIndex
CREATE INDEX "OwnerDemandSubscription_isActive_idx" ON "OwnerDemandSubscription"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "OwnerDemandSubscription_ownerId_city_areaName_serviceKey_key" ON "OwnerDemandSubscription"("ownerId", "city", "areaName", "serviceKey");

-- CreateIndex
CREATE INDEX "DemandNotification_signalId_createdAt_idx" ON "DemandNotification"("signalId", "createdAt");

-- CreateIndex
CREATE INDEX "DemandNotification_ownerId_createdAt_idx" ON "DemandNotification"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "DemandNotification_status_createdAt_idx" ON "DemandNotification"("status", "createdAt");

-- CreateIndex
CREATE INDEX "DemandNotification_city_areaName_createdAt_idx" ON "DemandNotification"("city", "areaName", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DemandNotification_ownerId_signalId_bucketStartAt_key" ON "DemandNotification"("ownerId", "signalId", "bucketStartAt");

-- CreateIndex
CREATE INDEX "RateLimitBucket_windowStartAt_idx" ON "RateLimitBucket"("windowStartAt");

-- CreateIndex
CREATE INDEX "SavedSearch_customerPhone_idx" ON "SavedSearch"("customerPhone");

-- CreateIndex
CREATE INDEX "SavedSearch_waId_idx" ON "SavedSearch"("waId");

-- CreateIndex
CREATE INDEX "SavedSearch_city_areaName_idx" ON "SavedSearch"("city", "areaName");

-- CreateIndex
CREATE INDEX "SavedSearch_serviceKey_idx" ON "SavedSearch"("serviceKey");

-- CreateIndex
CREATE INDEX "SavedSearch_isActive_idx" ON "SavedSearch"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SavedSearch_customerPhone_city_areaName_serviceKey_key" ON "SavedSearch"("customerPhone", "city", "areaName", "serviceKey");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_code_key" ON "ReferralCode"("code");

-- CreateIndex
CREATE INDEX "ReferralCode_campaign_createdAt_idx" ON "ReferralCode"("campaign", "createdAt");

-- CreateIndex
CREATE INDEX "ReferralCode_ownerId_idx" ON "ReferralCode"("ownerId");

-- CreateIndex
CREATE INDEX "ReferralCode_propertyId_idx" ON "ReferralCode"("propertyId");

-- CreateIndex
CREATE INDEX "ReferralAttribution_codeId_idx" ON "ReferralAttribution"("codeId");

-- CreateIndex
CREATE INDEX "ReferralAttribution_referredWaId_idx" ON "ReferralAttribution"("referredWaId");

-- CreateIndex
CREATE INDEX "ReferralAttribution_referredCustomerPhone_idx" ON "ReferralAttribution"("referredCustomerPhone");

-- CreateIndex
CREATE INDEX "ReferralAttribution_convertedAt_idx" ON "ReferralAttribution"("convertedAt");

-- CreateIndex
CREATE INDEX "EventLog_event_createdAt_idx" ON "EventLog"("event", "createdAt");

-- CreateIndex
CREATE INDEX "EventLog_waId_createdAt_idx" ON "EventLog"("waId", "createdAt");

-- CreateIndex
CREATE INDEX "EventLog_customerPhone_createdAt_idx" ON "EventLog"("customerPhone", "createdAt");

-- CreateIndex
CREATE INDEX "EventLog_ownerId_createdAt_idx" ON "EventLog"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "EventLog_propertyId_createdAt_idx" ON "EventLog"("propertyId", "createdAt");

-- CreateIndex
CREATE INDEX "EventLog_bookingId_createdAt_idx" ON "EventLog"("bookingId", "createdAt");

-- AddForeignKey
ALTER TABLE "DemandSignalEvent" ADD CONSTRAINT "DemandSignalEvent_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerDemandSubscription" ADD CONSTRAINT "OwnerDemandSubscription_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerDemandSubscription" ADD CONSTRAINT "OwnerDemandSubscription_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandNotification" ADD CONSTRAINT "DemandNotification_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandNotification" ADD CONSTRAINT "DemandNotification_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "DemandSignal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandNotification" ADD CONSTRAINT "DemandNotification_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCode" ADD CONSTRAINT "ReferralCode_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCode" ADD CONSTRAINT "ReferralCode_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralAttribution" ADD CONSTRAINT "ReferralAttribution_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "ReferralCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventLog" ADD CONSTRAINT "EventLog_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventLog" ADD CONSTRAINT "EventLog_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventLog" ADD CONSTRAINT "EventLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
