-- CreateTable
CREATE TABLE "WhatsappMessage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageId" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "body" TEXT,
    "raw" JSONB,

    CONSTRAINT "WhatsappMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappMessage_messageId_key" ON "WhatsappMessage"("messageId");

-- CreateIndex
CREATE INDEX "WhatsappMessage_from_idx" ON "WhatsappMessage"("from");

-- CreateIndex
CREATE INDEX "WhatsappMessage_createdAt_idx" ON "WhatsappMessage"("createdAt");
