-- CreateEnum
CREATE TYPE "LocationSource" AS ENUM ('MANUAL', 'CURRENT_DEVICE', 'MAP_PICKER');

-- AlterTable
ALTER TABLE "Owner" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "profilePhotoUrl" TEXT;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "locationLat" DOUBLE PRECISION,
ADD COLUMN     "locationLng" DOUBLE PRECISION,
ADD COLUMN     "locationPlaceId" TEXT,
ADD COLUMN     "locationSource" "LocationSource" NOT NULL DEFAULT 'MANUAL';

-- CreateIndex
CREATE INDEX "Property_locationPlaceId_idx" ON "Property"("locationPlaceId");

-- CreateIndex
CREATE INDEX "Property_locationSource_idx" ON "Property"("locationSource");

-- CreateIndex
CREATE INDEX "Property_locationLat_locationLng_idx" ON "Property"("locationLat", "locationLng");
