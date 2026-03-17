// apps/bot-api/src/services/whatsapp/handler.ts

import prisma, {
  type Prisma,
  type MessageEventType,
  type MessageStatus,
} from "db";
import crypto from "crypto";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

type WebhookBody = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        metadata?: { phone_number_id?: string };
        contacts?: Array<{ wa_id?: string }>;
        messages?: Array<{
          id?: string; // wamid...
          from?: string;
          type?: string;
          timestamp?: string; // epoch seconds (string)
          text?: { body?: string };

          // ✅ interactive replies (button/list)
          interactive?: {
            type?: "button_reply" | "list_reply" | string;
            button_reply?: { id?: string; title?: string };
            list_reply?: { id?: string; title?: string; description?: string };
          };
        }>;
        statuses?: Array<{
          id?: string; // wamid...
          status?: "sent" | "delivered" | "read" | "failed" | string;
          timestamp?: string; // epoch seconds (string)
          recipient_id?: string;
          errors?: unknown;
        }>;
      };
    }>;
  }>;
};

type Entry = NonNullable<WebhookBody["entry"]>[number];
type Change = NonNullable<Entry["changes"]>[number];
type Value = NonNullable<Change["value"]>;
type IncomingMessage = NonNullable<Value["messages"]>[number];

type ProviderComparableMessageStatus = "SENT" | "DELIVERED" | "READ" | "FAILED";

function isUniqueViolation(e: unknown): boolean {
  const code = (e as { code?: string } | null)?.code;
  return code === "P2002";
}

function sha1(input: unknown): string {
  return crypto.createHash("sha1").update(JSON.stringify(input)).digest("hex");
}

function toDateFromEpochSeconds(s?: string): Date | null {
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return new Date(n * 1000);
}

function mapProviderStatusToEnums(
  providerStatus?: string
): { eventType: MessageEventType; messageStatus: ProviderComparableMessageStatus } | null {
  switch (providerStatus) {
    case "sent":
      return { eventType: "SENT", messageStatus: "SENT" };
    case "delivered":
      return { eventType: "DELIVERED", messageStatus: "DELIVERED" };
    case "read":
      return { eventType: "READ", messageStatus: "READ" };
    case "failed":
      return { eventType: "FAILED", messageStatus: "FAILED" };
    default:
      return null;
  }
}

function getProviderStatusRank(status?: MessageStatus | null): number {
  switch (status) {
    case "SENT":
      return 1;
    case "DELIVERED":
      return 2;
    case "READ":
      return 3;
    case "FAILED":
      return 4;
    default:
      return 0;
  }
}

function getCurrentStatusTimestamp(
  current: {
    sentAt: Date | null;
    deliveredAt: Date | null;
    readAt: Date | null;
    failedAt: Date | null;
  },
  status: ProviderComparableMessageStatus
): Date | null {
  switch (status) {
    case "SENT":
      return current.sentAt;
    case "DELIVERED":
      return current.deliveredAt;
    case "READ":
      return current.readAt;
    case "FAILED":
      return current.failedAt;
    default:
      return null;
  }
}

function shouldApplyProviderStatusUpdate(params: {
  current: {
    status: MessageStatus;
    sentAt: Date | null;
    deliveredAt: Date | null;
    readAt: Date | null;
    failedAt: Date | null;
  };
  nextStatus: ProviderComparableMessageStatus;
  nextTimestamp: Date;
}): boolean {
  const currentRank = getProviderStatusRank(params.current.status);
  const nextRank = getProviderStatusRank(params.nextStatus);

  if (nextRank > currentRank) return true;
  if (nextRank < currentRank) return false;

  const currentStatusTimestamp = getCurrentStatusTimestamp(params.current, params.nextStatus);
  if (!currentStatusTimestamp) return true;

  return params.nextTimestamp.getTime() >= currentStatusTimestamp.getTime();
}

async function createEventDedupe(
  tx: Prisma.TransactionClient,
  params: {
    messageDbId: string;
    eventType: MessageEventType;
    providerStatus?: string;
    providerTimestamp?: string;
    raw?: unknown;
  }
): Promise<void> {
  const fp = sha1({
    messageDbId: params.messageDbId,
    eventType: params.eventType,
    providerStatus: params.providerStatus ?? null,
    providerTimestamp: params.providerTimestamp ?? null,
    raw: params.raw ?? null,
  });

  try {
    await tx.messageEvent.create({
      data: {
        messageId: params.messageDbId,
        eventType: params.eventType,
        providerStatus: params.providerStatus ?? null,
        providerTimestamp: toDateFromEpochSeconds(params.providerTimestamp),
        raw: (params.raw ?? null) as any,
        fingerprint: fp,
      },
    });
  } catch (e) {
    if (!isUniqueViolation(e)) throw e;
  }
}

function extractInboundBodyAndType(m: IncomingMessage) {
  const msgType = m.type ?? "unknown";

  // 1) text
  const textBody = m.text?.body?.trim() ?? null;

  // 2) interactive reply id (preferred), fallback to title if id missing
  const interactiveId =
    m.interactive?.button_reply?.id?.trim() ||
    m.interactive?.list_reply?.id?.trim() ||
    null;

  const interactiveTitle =
    m.interactive?.button_reply?.title?.trim() ||
    m.interactive?.list_reply?.title?.trim() ||
    null;

  // Priority:
  // - if provider says type=interactive OR interactive payload exists => store type="interactive"
  // - body: prefer id, else title, else null
  if (msgType === "interactive" || m.interactive) {
    return {
      type: "interactive",
      body: interactiveId ?? interactiveTitle, // keep something useful for worker routing
    };
  }

  return {
    type: msgType,
    body: msgType === "text" ? textBody : null,
  };
}

/**
 * Returns a referral code if the inbound text contains:
 * - ref=CODE
 * - ref:CODE
 * - invite=CODE
 *
 * Notes:
 * - We keep it strict to avoid accidental attribution from random text.
 * - CODE is limited to [A-Za-z0-9_-] and length 3..64
 */
function extractReferralCodeFromText(text: string | null): string | null {
  if (!text) return null;

  // Normalize spaces; keep original chars
  const t = text.trim();

  // Match ref=CODE / ref:CODE / invite=CODE (case-insensitive)
  const m = t.match(/\b(?:ref|invite)\s*[:=]\s*([A-Za-z0-9_-]{3,64})\b/i);
  return m?.[1] ?? null;
}

function isStartIntent(extracted: { type: string; body: string | null }): boolean {
  const b = (extracted.body ?? "").trim().toLowerCase();
  if (!b) return false;

  // Text commands
  if (b === "/start" || b === "start" || b === "get started") return true;

  // Interactive ids/titles often look like: START, GET_STARTED, START_FLOW
  if (extracted.type === "interactive") {
    if (b === "start" || b === "get_started" || b === "get started") return true;
    if (b.startsWith("start")) return true;
  }

  return false;
}

/**
 * Webhook handler:
 * - Status update-ləri DB-də event + status kimi saxlayır
 * - Incoming message-ləri DB-yə yazır
 * - PROCESS_INBOUND job enqueue edir
 * - ✅ Minimal funnel tracking: EventLog.START
 * - ✅ Referral attribution: ref=CODE / invite=CODE
 *
 * QƏTİYYƏN burada send/reply ETMİRİK.
 * Cavab məntiqi messageWorker.ts -> processInboundMessage() içindədir.
 */
export async function handleIncomingWebhook(body: unknown): Promise<void> {
  const data = body as WebhookBody;
  const changes = data.entry?.flatMap((e) => e.changes ?? []) ?? [];

  for (const change of changes) {
    const value = change.value;
    if (!value) continue;

    const phoneNumberId = value.metadata?.phone_number_id ?? null;

    // =========================
    // 1) STATUS UPDATES
    // =========================
    const statuses = value.statuses ?? [];
    for (const st of statuses) {
      const providerMessageId = st.id;
      if (!providerMessageId) continue;

      const mapping = mapProviderStatusToEnums(st.status);
      if (!mapping) continue;

      const msg = await prisma.message.findUnique({
        where: { providerMessageId },
        select: { id: true },
      });
      if (!msg) continue;

      await prisma.$transaction(async (tx: Tx) => {
        await createEventDedupe(tx, {
          messageDbId: msg.id,
          eventType: mapping.eventType,
          providerStatus: st.status,
          providerTimestamp: st.timestamp,
          raw: st,
        });

        const currentMessage = await tx.message.findUnique({
          where: { id: msg.id },
          select: {
            id: true,
            status: true,
            sentAt: true,
            deliveredAt: true,
            readAt: true,
            failedAt: true,
          },
        });

        if (!currentMessage) return;

        const ts = toDateFromEpochSeconds(st.timestamp) ?? new Date();
        const shouldApply = shouldApplyProviderStatusUpdate({
          current: currentMessage,
          nextStatus: mapping.messageStatus,
          nextTimestamp: ts,
        });

        if (!shouldApply) {
          return;
        }

        const updateData: Prisma.MessageUpdateInput = {
          status: mapping.messageStatus,
        };

        if (mapping.messageStatus === "SENT") {
          updateData.sentAt = ts;
        } else if (mapping.messageStatus === "DELIVERED") {
          updateData.deliveredAt = ts;
        } else if (mapping.messageStatus === "READ") {
          updateData.readAt = ts;
        } else if (mapping.messageStatus === "FAILED") {
          updateData.failedAt = ts;
        }

        await tx.message.update({
          where: { id: msg.id },
          data: updateData,
        });
      });
    }

    // =========================
    // 2) INCOMING MESSAGES
    // =========================
    const messages = value.messages ?? [];
    if (!messages.length) continue;

    for (const m of messages) {
      const providerMessageId = m.id;
      const from = m.from;
      if (!providerMessageId || !from) continue;

      const receivedAt = toDateFromEpochSeconds(m.timestamp) ?? new Date();
      const extracted = extractInboundBodyAndType(m);

      await prisma.$transaction(async (tx: Tx) => {
        const message = await tx.message.upsert({
          where: { providerMessageId },
          update: {},
          create: {
            direction: "INBOUND",
            status: "RECEIVED",
            providerMessageId,
            phoneNumberId: phoneNumberId ?? undefined,
            waId: from,
            type: extracted.type,
            body: extracted.body,
            raw: m as any, // ✅ slimmer than whole webhook body
            receivedAt,
          },
        });

        await createEventDedupe(tx, {
          messageDbId: message.id,
          eventType: "RECEIVED",
          providerTimestamp: m.timestamp,
          raw: m,
        });

        // ===============================
        // 🛡️ INBOUND IDEMPOTENCY SHIELD (Webhook Replay Protection)
        // ===============================
        const existingJob = await tx.messageJob.findFirst({
          where: {
            messageId: message.id,
            type: "PROCESS_INBOUND",
            state: { in: ["PENDING", "RUNNING", "DONE"] },
          },
          select: { id: true },
        });

        if (!existingJob) {
          await tx.messageJob.create({
            data: {
              messageId: message.id,
              type: "PROCESS_INBOUND",
              state: "PENDING",
              attempts: 0,
            },
          });
        }

        // ===============================
        // 📈 MINIMAL FUNNEL EVENT TRACKING
        // ===============================
        if (isStartIntent(extracted)) {
          await tx.eventLog.create({
            data: {
              event: "START",
              waId: from,
              customerPhone: from, // WhatsApp waId is phone-like identifier; good enough for MVP
              properties: {
                providerMessageId,
                phoneNumberId,
                type: extracted.type,
                body: extracted.body,
              } as any,
            },
          });
        }

        // ===============================
        // 🔁 REFERRAL ATTRIBUTION (MVP)
        // ===============================
        // We only attempt attribution on TEXT messages to avoid accidental matches from button ids.
        if (extracted.type === "text") {
          const ref = extractReferralCodeFromText(extracted.body ?? null);
          if (ref) {
            const code = await tx.referralCode.findUnique({
              where: { code: ref },
              select: { id: true },
            });

            if (code) {
              // idempotent-ish: avoid duplicates for same (codeId, referredWaId)
              const exists = await tx.referralAttribution.findFirst({
                where: {
                  codeId: code.id,
                  referredWaId: from,
                },
                select: { id: true },
              });

              if (!exists) {
                await tx.referralAttribution.create({
                  data: {
                    codeId: code.id,
                    referredWaId: from,
                    referredCustomerPhone: from,
                    firstSeenAt: receivedAt,
                  },
                });
              }
            }
          }
        }

        // Legacy table (optional)
        try {
          await tx.whatsappMessage.create({
            data: {
              messageId: providerMessageId,
              from,
              type: extracted.type,
              body: extracted.body, // ✅ keep selection id (interactive) or text
              raw: m as any, // ✅ slimmer
            },
          });
        } catch (e) {
          if (!isUniqueViolation(e)) throw e;
        }
      });
    }
  }
}