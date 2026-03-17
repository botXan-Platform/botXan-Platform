-- CreateTable
CREATE TABLE "BookingDraft" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "waId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "rentalType" "RentalType",
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),

    CONSTRAINT "BookingDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingDraft_waId_idx" ON "BookingDraft"("waId");

-- CreateIndex
CREATE INDEX "BookingDraft_expiresAt_idx" ON "BookingDraft"("expiresAt");

-- CreateIndex
CREATE INDEX "BookingDraft_propertyId_idx" ON "BookingDraft"("propertyId");

-- AddForeignKey
ALTER TABLE "BookingDraft" ADD CONSTRAINT "BookingDraft_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
