-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'SEND_REQUESTED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'DEAD');

-- CreateEnum
CREATE TYPE "MessageEventType" AS ENUM ('RECEIVED', 'PROCESSING_STARTED', 'PROCESSED', 'SEND_REQUESTED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'RETRY_SCHEDULED');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('PROCESS_INBOUND', 'SEND_OUTBOUND');

-- CreateEnum
CREATE TYPE "JobState" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED', 'DEAD');

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'RECEIVED',
    "providerMessageId" TEXT,
    "phoneNumberId" TEXT,
    "waId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "body" TEXT,
    "raw" JSONB,
    "receivedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "bookingId" TEXT,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageId" TEXT NOT NULL,
    "eventType" "MessageEventType" NOT NULL,
    "providerStatus" TEXT,
    "providerTimestamp" TIMESTAMP(3),
    "raw" JSONB,
    "fingerprint" TEXT NOT NULL,

    CONSTRAINT "MessageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageJob" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "messageId" TEXT NOT NULL,
    "type" "JobType" NOT NULL,
    "state" "JobState" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "lastError" TEXT,

    CONSTRAINT "MessageJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationLock" (
    "waId" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ConversationLock_pkey" PRIMARY KEY ("waId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Message_providerMessageId_key" ON "Message"("providerMessageId");

-- CreateIndex
CREATE INDEX "Message_waId_createdAt_idx" ON "Message"("waId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_phoneNumberId_createdAt_idx" ON "Message"("phoneNumberId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_status_createdAt_idx" ON "Message"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MessageEvent_fingerprint_key" ON "MessageEvent"("fingerprint");

-- CreateIndex
CREATE INDEX "MessageEvent_messageId_createdAt_idx" ON "MessageEvent"("messageId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageJob_state_nextRunAt_idx" ON "MessageJob"("state", "nextRunAt");

-- CreateIndex
CREATE INDEX "MessageJob_messageId_type_idx" ON "MessageJob"("messageId", "type");

-- CreateIndex
CREATE INDEX "ConversationLock_expiresAt_idx" ON "ConversationLock"("expiresAt");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageEvent" ADD CONSTRAINT "MessageEvent_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageJob" ADD CONSTRAINT "MessageJob_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
