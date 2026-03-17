-- CreateTable
CREATE TABLE "DemandSignal" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "city" TEXT NOT NULL,
    "areaName" TEXT NOT NULL,
    "serviceId" TEXT,
    "searchCount" INTEGER NOT NULL DEFAULT 1,
    "lastNotifiedAt" TIMESTAMP(3),
    "notifyWindowStartAt" TIMESTAMP(3),
    "notifiedCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DemandSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DemandSignal_city_idx" ON "DemandSignal"("city");

-- CreateIndex
CREATE INDEX "DemandSignal_areaName_idx" ON "DemandSignal"("areaName");

-- CreateIndex
CREATE INDEX "DemandSignal_serviceId_idx" ON "DemandSignal"("serviceId");

-- CreateIndex
CREATE INDEX "DemandSignal_city_serviceId_idx" ON "DemandSignal"("city", "serviceId");

-- CreateIndex
CREATE INDEX "DemandSignal_notifyWindowStartAt_idx" ON "DemandSignal"("notifyWindowStartAt");

-- AddForeignKey
ALTER TABLE "DemandSignal" ADD CONSTRAINT "DemandSignal_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
