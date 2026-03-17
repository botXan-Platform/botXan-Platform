/*
  Warnings:

  - The values [CONFIRMED,CANCELLED] on the enum `BookingStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `customerWa` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `deposit` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `rentType` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Owner` table. All the data in the column will be lost.
  - You are about to drop the column `addressText` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `checkIn` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `checkOut` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `isPublished` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `locationUrl` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `maxGuests` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `quietAfter` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `rooms` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `smokingAllowed` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the `PaymentMethod` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Token` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[phone]` on the table `Owner` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Owner` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[propertyId,sortOrder]` on the table `PropertyImage` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customerPhone` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rentalType` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomCount` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Made the column `rulesText` on table `Property` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `sortOrder` to the `PropertyImage` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RentalType" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
BEGIN;
CREATE TYPE "BookingStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');
ALTER TABLE "public"."Booking" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Booking" ALTER COLUMN "status" TYPE "BookingStatus_new" USING ("status"::text::"BookingStatus_new");
ALTER TYPE "BookingStatus" RENAME TO "BookingStatus_old";
ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";
DROP TYPE "public"."BookingStatus_old";
ALTER TABLE "Booking" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "PaymentMethod" DROP CONSTRAINT "PaymentMethod_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Token" DROP CONSTRAINT "Token_ownerId_fkey";

-- DropIndex
DROP INDEX "Booking_propertyId_startAt_endAt_idx";

-- DropIndex
DROP INDEX "Booking_status_idx";

-- DropIndex
DROP INDEX "Owner_phone_idx";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "customerWa",
DROP COLUMN "deposit",
DROP COLUMN "rentType",
ADD COLUMN     "customerPhone" TEXT NOT NULL,
ADD COLUMN     "depositPrice" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ownerNote" TEXT,
ADD COLUMN     "rentalType" "RentalType" NOT NULL;

-- AlterTable
ALTER TABLE "Owner" DROP COLUMN "isActive";

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "addressText",
DROP COLUMN "checkIn",
DROP COLUMN "checkOut",
DROP COLUMN "isPublished",
DROP COLUMN "locationUrl",
DROP COLUMN "maxGuests",
DROP COLUMN "quietAfter",
DROP COLUMN "rooms",
DROP COLUMN "smokingAllowed",
ADD COLUMN     "bankCardNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "binanceId" TEXT,
ADD COLUMN     "checkInTime" TEXT,
ADD COLUMN     "checkOutTime" TEXT,
ADD COLUMN     "cryptoAddress" TEXT,
ADD COLUMN     "cryptoChain" TEXT,
ADD COLUMN     "isVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "m10Number" TEXT,
ADD COLUMN     "quietHours" TEXT,
ADD COLUMN     "roomCount" INTEGER NOT NULL,
ALTER COLUMN "rulesText" SET NOT NULL;

-- AlterTable
ALTER TABLE "PropertyImage" ADD COLUMN     "sortOrder" INTEGER NOT NULL;

-- DropTable
DROP TABLE "PaymentMethod";

-- DropTable
DROP TABLE "Token";

-- DropEnum
DROP TYPE "RentType";

-- CreateTable
CREATE TABLE "OwnerToken" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OwnerToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingReceipt" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bookingId" TEXT NOT NULL,
    "status" "ReceiptStatus" NOT NULL DEFAULT 'PENDING',
    "fileUrl" TEXT NOT NULL,
    "ownerReviewedAt" TIMESTAMP(3),

    CONSTRAINT "BookingReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OwnerToken_code_key" ON "OwnerToken"("code");

-- CreateIndex
CREATE INDEX "OwnerToken_ownerId_idx" ON "OwnerToken"("ownerId");

-- CreateIndex
CREATE INDEX "OwnerToken_expiresAt_idx" ON "OwnerToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "BookingReceipt_bookingId_key" ON "BookingReceipt"("bookingId");

-- CreateIndex
CREATE INDEX "Booking_propertyId_status_idx" ON "Booking"("propertyId", "status");

-- CreateIndex
CREATE INDEX "Booking_customerPhone_idx" ON "Booking"("customerPhone");

-- CreateIndex
CREATE INDEX "Booking_startAt_endAt_idx" ON "Booking"("startAt", "endAt");

-- CreateIndex
CREATE UNIQUE INDEX "Owner_phone_key" ON "Owner"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Owner_email_key" ON "Owner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyImage_propertyId_sortOrder_key" ON "PropertyImage"("propertyId", "sortOrder");

-- AddForeignKey
ALTER TABLE "OwnerToken" ADD CONSTRAINT "OwnerToken_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingReceipt" ADD CONSTRAINT "BookingReceipt_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
