// apps/bot-api/src/workers/messageWorker.ts
import { Prisma } from "@prisma/client";

import prisma from "db";
import {
  sendCtaUrlMessage,
  sendListMessage,
  sendReplyButtonsMessage,
  sendTextMessage,
} from "../services/whatsapp/client.js";
import { env } from "../config/env.js";

type WorkerOptions = {
  workerId: string;
  pollIntervalMs?: number;
  batchSize?: number;
};

const DEFAULT_POLL_MS = 1000;
const DEFAULT_BATCH = 10;

const MAX_ATTEMPTS = 5;
const STALE_JOB_SWEEP_EVERY_MS = 30_000;
const DEFAULT_STALE_JOB_LOCK_MS = 5 * 60_000;
const DB_RECOVERY_MIN_MS = 1_000;
const DB_RECOVERY_MAX_MS = 30_000;

function backoffMs(attempts: number) {
  return Math.min(60000, 1000 * Math.pow(2, Math.max(0, attempts)));
}

function workerRecoveryBackoffMs(failures: number) {
  return Math.min(DB_RECOVERY_MAX_MS, DB_RECOVERY_MIN_MS * Math.pow(2, Math.max(0, failures - 1)));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function clampPositiveInt(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value) || !value || value <= 0) return fallback;
  return Math.trunc(value);
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return String(err ?? "Unknown error");
}

function getErrorCode(err: unknown): string {
  const maybeCode =
    typeof err === "object" && err !== null && "code" in err ? String((err as any).code ?? "") : "";

  return maybeCode.trim().toUpperCase();
}

function isRetryableWorkerDbError(err: unknown): boolean {
  const code = getErrorCode(err);
  const message = getErrorMessage(err).toLowerCase();
  const name =
    typeof err === "object" && err !== null && "name" in err ? String((err as any).name ?? "") : "";

  if (
    code === "ECONNREFUSED" ||
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "EHOSTUNREACH" ||
    code === "ENETUNREACH" ||
    code === "P1001" ||
    code === "P1002" ||
    code === "P1017"
  ) {
    return true;
  }

  if (
    name === "PrismaClientInitializationError" ||
    name === "PrismaClientRustPanicError" ||
    name === "PrismaClientKnownRequestError"
  ) {
    if (
      message.includes("econnrefused") ||
      message.includes("can't reach database server") ||
      message.includes("can't reach database server") ||
      message.includes("connection") ||
      message.includes("connect") ||
      message.includes("pool")
    ) {
      return true;
    }
  }

  return (
    message.includes("econnrefused") ||
    message.includes("connection terminated unexpectedly") ||
    message.includes("connect econnrefused") ||
    message.includes("timeout") ||
    message.includes("database server") ||
    message.includes("failed to connect")
  );
}

// ===============================
// ⏳ BRON MÜDDƏTİ NƏZARƏTİ
// ===============================
const EXPIRE_SWEEP_EVERY_MS = 10_000;

function normalizePhoneToWaIdDigits(input: string): string {
  const raw = (input ?? "").trim();
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";

  if (digits.startsWith("994")) return digits;
  if (digits.length === 10 && digits.startsWith("0")) return "994" + digits.slice(1);
  if (digits.length === 9) return "994" + digits;

  return digits;
}

async function sweepExpiredBookingsOnce() {
  const now = new Date();

  const candidates = await prisma.booking.findMany({
    where: {
      status: "PENDING",
      expiresAt: { not: null, lte: now },
    },
    take: 50,
    orderBy: { expiresAt: "asc" },
    select: {
      id: true,
      customerPhone: true,
      totalPrice: true,
      expiresAt: true,
      property: {
        select: {
          title: true,
          city: true,
          areaName: true,
          owner: { select: { phone: true, name: true } },
        },
      },
    },
  });

  for (const b of candidates) {
    const updated = await prisma.booking.updateMany({
      where: { id: b.id, status: "PENDING" },
      data: { status: "EXPIRED" },
    });

    if (updated.count !== 1) continue;

    const propTitle = b.property?.title ?? "Elan";
    const loc = (b.property?.city ?? "") + (b.property?.areaName ? " — " + b.property.areaName : "");

    const userText =
      `⏳ Bronun müddəti bitdi.\n\n` +
      `Elan sahibi cavab müddəti ərzində cavab vermədiyi üçün bron avtomatik ləğv olundu.\n\n` +
      `🏠 ${propTitle}\n` +
      (loc ? `📍 ${loc}\n` : "") +
      `💰 ${b.totalPrice} AZN\n\n` +
      `Yeni seçim etmək üçün menyuya qayıdın.`;

    await enqueueOutboundText(normalizePhoneToWaIdDigits(b.customerPhone), userText);

    const ownerWaId = normalizePhoneToWaIdDigits(b.property?.owner?.phone ?? "");
    if (ownerWaId) {
      const ownerText =
        `⌛ Bronun müddəti bitdi. Əlaqə məlumatları gizli saxlanıldı.\n\n` +
        `🏠 ${propTitle}\n` +
        (loc ? `📍 ${loc}\n` : "") +
        `💰 ${b.totalPrice} AZN\n\n` +
        `Qeyd: Cavab müddəti bitdiyi üçün sistem bronu avtomatik olaraq müddəti bitmiş kimi işarələdi.`;

      await enqueueOutboundText(ownerWaId, ownerText);
    }
  }
}

// ===============================
// 📤 GÖNDƏRİLMİŞ MESAJ TƏKRARINA QARŞI QORUMA
// ===============================
function isFinalOutboundStatus(status: string | null | undefined): boolean {
  return status === "SENT" || status === "DELIVERED" || status === "READ";
}

// ===============================
// 🔒 SƏRT MƏTN MƏHDUDİYYƏTİ
// ===============================
const MAX_TEXT_LENGTH = 120;

// ===============================
// 🧠 SPAM-A QARŞI YADDAŞ MEXANİZMİ
// ===============================
const SPAM_SCORE_LIMIT = 5;
const COOLDOWN_MS = 60_000;
const SCORE_DECAY_MS = 120_000;

// ===============================
// 🚦 TEZLİK MƏHDUDİYYƏTİ
// ===============================
const RATE_LIMIT_WINDOW_MS = 5000;
const RATE_LIMIT_MAX_MESSAGES = 3;

type RateLimitData = {
  timestamps?: number[];
  blockedUntil?: number;
};

function extractRateLimit(data: any): RateLimitData {
  if (!data || typeof data !== "object") return {};
  return data.__rateLimit ?? {};
}

function injectRateLimit(data: any, rl: RateLimitData) {
  const base = data && typeof data === "object" ? data : {};
  return {
    ...base,
    __rateLimit: rl,
  };
}

function pruneOldTimestamps(timestamps: number[], now: number) {
  return timestamps.filter((ts) => now - ts <= RATE_LIMIT_WINDOW_MS);
}

type AntiSpamData = {
  spamScore?: number;
  lastSpamAt?: number;
  cooldownUntil?: number;
};

function extractAntiSpam(data: any): AntiSpamData {
  if (!data || typeof data !== "object") return {};
  return data.__antiSpam ?? {};
}

function injectAntiSpam(data: any, anti: AntiSpamData) {
  const base = data && typeof data === "object" ? data : {};
  return {
    ...base,
    __antiSpam: anti,
  };
}

function isInCooldown(anti: AntiSpamData): boolean {
  if (!anti.cooldownUntil) return false;
  return Date.now() < anti.cooldownUntil;
}

function decaySpamScore(anti: AntiSpamData): AntiSpamData {
  if (!anti.lastSpamAt) return anti;

  const elapsed = Date.now() - anti.lastSpamAt;
  if (elapsed > SCORE_DECAY_MS && anti.spamScore && anti.spamScore > 0) {
    return {
      ...anti,
      spamScore: Math.max(0, anti.spamScore - 1),
    };
  }
  return anti;
}

function isNumericInput(text: string) {
  return /^[0-9]+$/.test(text);
}

function isEmojiSpam(text: string) {
  if (!text) return false;
  const nonAlnum = text.replace(/[a-zA-Z0-9\s]/g, "");
  return nonAlnum.length >= 4 && nonAlnum.length >= text.length * 0.6;
}

function isLongFreeText(text: string) {
  if (!text) return false;
  if (text.length > MAX_TEXT_LENGTH) return true;
  if (text.split(" ").length >= 6) return true;
  return false;
}

// ===============================
// ✅ ELAN SAHİBİ BRON ƏMRLƏRİ
// ===============================
type OwnerPendingBookingData = {
  bookingId?: string;
  createdAt?: number;
};

function parseOwnerBookingCommand(text: string): { action: "APPROVE" | "REJECT"; bookingId: string } | null {
  const m = String(text ?? "")
    .trim()
    .match(/^(approve|reject)\s+([0-9a-f-]{36})$/i);
  if (!m) return null;

  const action = m[1].toUpperCase() as "APPROVE" | "REJECT";
  const bookingId = m[2];
  return { action, bookingId };
}

function normalizeOwnerActionText(text: string) {
  return String(text ?? "")
    .toLocaleLowerCase("az-AZ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?]+$/g, "");
}

function parseOwnerBookingActionWithoutId(text: string): "APPROVE" | "REJECT" | null {
  const normalized = normalizeOwnerActionText(text);

  if (
    normalized === "təsdiq et" ||
    normalized === "tesdiq et" ||
    normalized === "təsdiqlə" ||
    normalized === "tesdiqle" ||
    normalized === "təsdiq" ||
    normalized === "tesdiq"
  ) {
    return "APPROVE";
  }

  if (
    normalized === "rədd et" ||
    normalized === "redd et" ||
    normalized === "rədd" ||
    normalized === "redd" ||
    normalized === "imtina et" ||
    normalized === "imtina"
  ) {
    return "REJECT";
  }

  return null;
}

function extractOwnerPendingBooking(data: any): OwnerPendingBookingData | null {
  if (!data || typeof data !== "object") return null;
  const pending = data.__ownerPendingBooking;
  if (!pending || typeof pending !== "object") return null;
  return pending as OwnerPendingBookingData;
}

async function clearOwnerPendingBooking(waId: string) {
  try {
    const conv = await prisma.conversationLock.findUnique({ where: { waId } });
    if (!conv || !conv.data || typeof conv.data !== "object") return;

    const currentData = conv.data as Prisma.JsonObject;
    if (!("__ownerPendingBooking" in currentData)) return;

    const nextData = { ...currentData } as Prisma.JsonObject;
    delete (nextData as Record<string, unknown>).__ownerPendingBooking;

    await prisma.conversationLock.update({
      where: { waId },
      data: {
        data: nextData as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    console.warn("[owner-booking-cmd] pending booking context cleanup failed:", err);
  }
}

function isUuidLike(id: string) {
  return /^[0-9a-f-]{36}$/i.test(id);
}

const AZ_MONTH_NAMES = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "İyun",
  "İyul",
  "Avqust",
  "Sentyabr",
  "Oktyabr",
  "Noyabr",
  "Dekabr",
] as const;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatDateOnlyAz(date: Date): string {
  return `${date.getDate()} ${AZ_MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDateTimeAz(date: Date): string {
  return `${formatDateOnlyAz(date)} saat ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function diffCalendarDays(startAt: Date, endAt: Date) {
  const startUtc = Date.UTC(startAt.getFullYear(), startAt.getMonth(), startAt.getDate());
  const endUtc = Date.UTC(endAt.getFullYear(), endAt.getMonth(), endAt.getDate());
  return Math.max(0, Math.round((endUtc - startUtc) / (24 * 60 * 60 * 1000)));
}

function getHourlyDurationHours(startAt: Date, endAt: Date) {
  const diffMs = endAt.getTime() - startAt.getTime();
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
}

function formatBookingPeriod(rentalType: string | null | undefined, startAt: Date, endAt: Date) {
  const normalized = String(rentalType ?? "").toUpperCase();

  if (normalized === "HOURLY") {
    const hours = getHourlyDurationHours(startAt, endAt);
    return `${formatDateTimeAz(startAt)} — ${formatDateTimeAz(endAt)} (${hours} saat)`;
  }

  const days = diffCalendarDays(startAt, endAt);
  return `${formatDateOnlyAz(startAt)} — ${formatDateOnlyAz(endAt)} (${days} gün)`;
}

// ===============================
// ✅ INTERAKTİV SEÇİM İD-LƏRİ
// ===============================
const NAV_MENU = "MENU";
const NAV_BACK = "BACK";
const NAV_CONTINUE = "CONTINUE";

function isInteractiveSelectionId(text: string): boolean {
  const v = (text ?? "").trim();
  if (!v) return false;

  if (
    v === "LANG_AZ" ||
    v === "LANG_EN" ||
    v === "LANG_RU" ||
    v === "LANG_ZH" ||
    v === NAV_MENU ||
    v === "RESET" ||
    v === NAV_BACK ||
    v === "OPEN_ALL" ||
    v === NAV_CONTINUE
  ) {
    return true;
  }

  if (
    v.startsWith("CITY:") ||
    v.startsWith("SVC:") ||
    v.startsWith("ROOMS:") ||
    v.startsWith("RENTAL:") ||
    v.startsWith("PROP:")
  ) {
    return true;
  }

  return false;
}

function isGlobalCommandStrict(text: string) {
  const v = text.toLowerCase();

  if (parseOwnerBookingCommand(v)) return true;
  if (parseOwnerBookingActionWithoutId(text)) return true;
  if (isInteractiveSelectionId(text)) return true;

  return (
    v === "/start" ||
    v === "start" ||
    v === "salam" ||
    v === "hi" ||
    v === "hello" ||
    v === "/menu" ||
    v === "menu" ||
    v === "/reset" ||
    v === "reset" ||
    v === "0" ||
    v.includes("🔁") ||
    v.includes("🏠")
  );
}

function shouldSilentlyIgnoreMessage(state: string | null | undefined, raw: string, text: string): boolean {
  if (isGlobalCommandStrict(text)) return false;
  if (isNumericInput(text)) return false;
  if (isInteractiveSelectionId(text)) return false;

  if (state && !isLongFreeText(raw) && !isEmojiSpam(raw)) {
    return false;
  }

  if (!state) return true;
  if (isEmojiSpam(raw) || isLongFreeText(raw)) return true;

  return false;
}

// Session TTL
const SESSION_TTL_MINUTES = Number(process.env.BOT_SESSION_TTL_MINUTES ?? "20");

// ===== Subscription defaults (MVP) =====
const SUBSCRIPTION_AMOUNT = Number(process.env.SUBSCRIPTION_AMOUNT ?? "1000");
const SUBSCRIPTION_CURRENCY = String(process.env.SUBSCRIPTION_CURRENCY ?? "AZN");
const SUBSCRIPTION_PERIOD_DAYS = Number(process.env.SUBSCRIPTION_PERIOD_DAYS ?? "30");

// ===== Types =====
type Lang = "az" | "en" | "ru" | "zh";
type Service = "RENT_HOME" | "HOTEL" | "CAR_RENTAL" | "BARBER" | "BEAUTY" | "SOBER_DRIVER";

function formatRentalTypeAz(value: string | null | undefined): string {
  switch (String(value ?? "").toUpperCase()) {
    case "HOURLY":
      return "Saatlıq";
    case "DAILY":
      return "Günlük";
    case "WEEKLY":
      return "Həftəlik";
    case "MONTHLY":
      return "Aylıq";
    default:
      return "Günlük";
  }
}

function formatBookingStatusAz(value: string | null | undefined): string {
  switch (String(value ?? "").toUpperCase()) {
    case "PENDING":
      return "gözləmə vəziyyətindədir";
    case "APPROVED":
      return "təsdiqlənib";
    case "REJECTED":
      return "rədd edilib";
    case "EXPIRED":
      return "müddəti bitib";
    default:
      return "yekunlaşdırılıb";
  }
}

function formatServiceLabelAz(value: string | null | undefined): string {
  switch (String(value ?? "").toUpperCase()) {
    case "RENT_HOME":
      return "Ev icarəsi";
    case "HOTEL":
      return "Otel";
    case "CAR_RENTAL":
      return "Avtomobil icarəsi";
    case "BARBER":
      return "Bərbər";
    case "BEAUTY":
      return "Gözəllik xidməti";
    case "SOBER_DRIVER":
      return "Ayıq sürücü";
    default:
      return "Xidmət";
  }
}

type State =
  | "LANG_SELECT"
  | "CITY_SELECT"
  | "SERVICE_SELECT"
  | "SERVICE_FLOW::RENT_HOME::ROOMS"
  | "SERVICE_FLOW::RENT_HOME::AREA_QUERY"
  | "SERVICE_FLOW::RENT_HOME::SELECT_RENTAL_TYPE"
  | "SERVICE_FLOW::RENT_HOME::SELECT_PROPERTY"
  | "SERVICE_FLOW::RENT_HOME::WAIT_WEBAPP";

const STATE_CITY_SELECT: State = "CITY_SELECT";
const SVC_RENT_ROOMS: State = "SERVICE_FLOW::RENT_HOME::ROOMS";
const SVC_RENT_AREA_QUERY: State = "SERVICE_FLOW::RENT_HOME::AREA_QUERY";
const SVC_RENT_SELECT_RENTAL_TYPE: State = "SERVICE_FLOW::RENT_HOME::SELECT_RENTAL_TYPE";
const SVC_RENT_SELECT_PROPERTY: State = "SERVICE_FLOW::RENT_HOME::SELECT_PROPERTY";
const SVC_RENT_WAIT_WEBAPP: State = "SERVICE_FLOW::RENT_HOME::WAIT_WEBAPP";

// Back stack for real BACK button behavior
type NavFrame = {
  state: State;
  data: SessionData;
};

type SessionData = {
  language?: Lang;
  city?: string;
  service?: Service;

  rentRooms?: string;
  rentalType?: string;

  areaQuery?: string;
  areaTries?: number;

  properties?: Array<{ id: string; title: string; areaName: string }>;
  propertyId?: string;

  cities?: string[];

  navStack?: NavFrame[];

  demandNotifiedKeys?: Record<string, number>;

  [k: string]: any;
};

function nowPlusTtl() {
  return new Date(Date.now() + SESSION_TTL_MINUTES * 60_000);
}

function norm(s: string | null | undefined) {
  return (s ?? "").trim();
}
function lower(s: string) {
  return s.trim().toLowerCase();
}

function isStart(text: string) {
  const v = lower(text);
  return v === "/start" || v === "salam" || v === "start" || v === "hi" || v === "hello";
}
function isMenu(text: string) {
  const v = lower(text);
  return v === "/menu" || v === "menu" || v.includes("🏠");
}
function isReset(text: string) {
  const v = lower(text);
  return v === "/reset" || v === "reset" || v.includes("🔁") || v === "/startover";
}
function isExit(text: string) {
  return lower(text) === "0";
}
function isRenew(text: string) {
  const v = lower(text);
  return (
    v === "/renew" ||
    v === "renew" ||
    v === "uzat" ||
    v === "uzatmaq" ||
    v === "abune" ||
    v === "abonə" ||
    v === "abonelik" ||
    v === "abunelik"
  );
}

function isMenuAction(text: string) {
  return text === NAV_MENU || isMenu(text);
}
function isBackAction(text: string) {
  return text === NAV_BACK;
}
function isContinueAction(text: string) {
  return text === NAV_CONTINUE;
}

// ===============================
// 🧠 SADƏ MƏNTİQİ NİYYƏT YÖNLƏNDİRİCİSİ
// ===============================
const RENT_HOME_KEYWORDS = [
  "ev",
  "kiraye",
  "kirayə",
  "home",
  "house",
  "apartment",
  "rent",
  "ev axtariram",
  "ev axtarıram",
  "kiraye ev",
  "kirayə ev",
];

const CITY_KEYWORDS = ["baku", "bakı", "baki", "ganja", "gəncə", "sumqayit", "sumqayıt"];

function detectRentIntent(text: string): boolean {
  const t = text.toLowerCase();
  return RENT_HOME_KEYWORDS.some((k) => t.includes(k));
}

function detectCityFromText(text: string, availableCities: string[]): string | null {
  const t = text.toLowerCase();

  for (const city of availableCities) {
    if (t.includes(city.toLowerCase())) {
      return city;
    }
  }

  for (const kw of CITY_KEYWORDS) {
    if (t.includes(kw)) {
      const found = availableCities.find((c) => c.toLowerCase().includes(kw));
      if (found) return found;
    }
  }

  return null;
}

// ========= Elan sahibi uyğunluğu =========
function normalizePhoneDigits(input: string): string {
  return (input ?? "").replace(/\D/g, "");
}

// ===============================
// 📞 CANONICAL E.164 NORMALIZATION
// ===============================
function normalizePhoneE164(input: string): string {
  if (!input) return "";

  let raw = input.trim().replace(/[^\d+]/g, "");

  if (raw.startsWith("+") && raw.length >= 10) {
    return raw;
  }

  if (raw.startsWith("+")) {
    raw = raw.slice(1);
  }

  if (raw.startsWith("0") && raw.length === 10) {
    return `+994${raw.slice(1)}`;
  }

  if (raw.length === 9) {
    return `+994${raw}`;
  }

  if (raw.startsWith("994") && raw.length === 12) {
    return `+${raw}`;
  }

  if (!raw.startsWith("+")) {
    return `+${raw}`;
  }

  return raw;
}

async function findOwnerByWaId(waId: string) {
  const digits = normalizePhoneDigits(waId);
  const e164 = normalizePhoneE164(waId);
  if (!digits) return null;

  const direct = await prisma.owner.findFirst({
    where: {
      OR: [{ phone: digits }, { phone: `+${digits}` }, { phone: waId }, { phone: `+${waId}` }, { phone: e164 }],
    },
    select: { id: true, phone: true, paidUntil: true, name: true },
  });
  if (direct) return direct;

  return prisma.owner.findFirst({
    where: {
      OR: [{ phone: { endsWith: digits } }, { phone: e164 }],
    },
    select: { id: true, phone: true, paidUntil: true, name: true },
  });
}

function isOwnerActive(paidUntil: Date | null | undefined): boolean {
  if (!paidUntil) return false;
  return paidUntil.getTime() > Date.now();
}

function formatIsoShort(d: Date): string {
  return formatDateTimeAz(d);
}

async function createRenewInvoice(ownerId: string) {
  const invoice = await prisma.invoice.create({
    data: {
      ownerId,
      amount: Math.max(0, Math.trunc(SUBSCRIPTION_AMOUNT)),
      currency: SUBSCRIPTION_CURRENCY,
      provider: "mock",
      status: "PENDING",
      periodDays: Math.max(1, Math.trunc(SUBSCRIPTION_PERIOD_DAYS)),
    },
    select: { id: true, amount: true, currency: true, periodDays: true },
  });

  const checkoutUrl = `${env.PUBLIC_BASE_URL}/billing/mock/checkout?invoiceId=${encodeURIComponent(invoice.id)}`;

  return { invoice, checkoutUrl };
}

// ===============================
// ✅ ÇIXIŞ GÖNDƏRİŞ KÖMƏKÇİLƏRİ
// ===============================
type ButtonDef = { id: string; title: string };

type OutboundInteractive =
  | {
    kind: "reply_buttons";
    body: string;
    buttons: ButtonDef[];
    footerText?: string;
  }
  | {
    kind: "list";
    body: string;
    buttonText: string;
    headerText?: string;
    footerText?: string;
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>;
  }
  | {
    kind: "cta_url";
    body: string;
    displayText: string;
    url: string;
    footerText?: string;
  };

async function enqueueOutbound(to: string, type: "text" | "interactive", body: string) {
  const waId = normalizePhoneToWaIdDigits(to);
  if (!waId) return;

  await prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: {
        direction: "OUTBOUND",
        status: "SEND_REQUESTED",
        waId,
        type,
        body,
      },
    });

    await tx.messageJob.create({
      data: {
        messageId: message.id,
        type: "SEND_OUTBOUND",
        state: "PENDING",
        attempts: 0,
        nextRunAt: new Date(),
      },
    });
  });
}

async function enqueueOutboundText(to: string, text: string) {
  await enqueueOutbound(to, "text", text);
}

async function enqueueOutboundInteractive(to: string, payload: OutboundInteractive) {
  await enqueueOutbound(to, "interactive", JSON.stringify(payload));
}

// ===============================
// ✅ NAVİQASİYA PANELİ
// ===============================
function navBarInteractive(opts?: { showContinue?: boolean; continueLabel?: string }): OutboundInteractive {
  const buttons: ButtonDef[] = [
    { id: NAV_MENU, title: "🏠 Ana səhifə" },
    { id: NAV_BACK, title: "⬅️ Geri" },
  ];

  if (opts?.showContinue) {
    buttons.push({ id: NAV_CONTINUE, title: opts.continueLabel ?? "➡️ Davam et" });
  }

  return {
    kind: "reply_buttons",
    body: "Naviqasiya bölməsi:",
    buttons,
  };
}

async function sendMainAndNav(
  to: string,
  main: { type: "text"; text: string } | { type: "interactive"; payload: OutboundInteractive },
  nav?: { showContinue?: boolean; continueLabel?: string }
) {
  if (main.type === "text") {
    await enqueueOutboundText(to, main.text);
  } else {
    await enqueueOutboundInteractive(to, main.payload);
  }

  await enqueueOutboundInteractive(
    to,
    navBarInteractive({ showContinue: nav?.showContinue, continueLabel: nav?.continueLabel })
  );
}

// ===============================
// 📍 ƏVVƏLCƏ ŞƏHƏRLƏR
// ===============================
async function loadAvailableCities(): Promise<string[]> {
  const cityRows = await prisma.property.findMany({
    where: { isVisible: true },
    distinct: ["city"],
    select: { city: true },
    orderBy: { city: "asc" },
  });

  return cityRows
    .map((r) => r.city)
    .filter((c): c is string => typeof c === "string" && c.trim().length > 0);
}

// ===============================
// ⭐ Elan keçidləri
// ===============================
function buildAllListingsUrl(params: { city?: string; service?: string; area?: string }) {
  const base = process.env.WEB_APP_URL ?? "http://localhost:5173";
  const url = new URL("/listings", base);
  if (params.service) url.searchParams.set("service", params.service);
  if (params.city) url.searchParams.set("city", params.city);
  if (params.area) url.searchParams.set("area", params.area);
  return url.toString();
}

// ===============================
// ⭐ Premium üstünlüklü ilkin elan siyahısı
// ===============================
const MAX_PREVIEW_PROPERTIES = Number(process.env.WA_PREVIEW_PROPERTIES ?? "8");

async function fetchPropertiesForPreview(params: { city: string; areaQuery?: string }) {
  const city = params.city;
  const q = (params.areaQuery ?? "").trim();

  const areaFilter =
    q.length >= 2
      ? {
        OR: [
          { areaName: { contains: q, mode: "insensitive" as any } },
          { title: { contains: q, mode: "insensitive" as any } },
          { location: { contains: q, mode: "insensitive" as any } },
        ],
      }
      : undefined;

  const premium = await prisma.property.findMany({
    where: {
      isVisible: true,
      city,
      ...(areaFilter ?? {}),
      owner: { paidUntil: { gt: new Date() } },
    },
    select: { id: true, title: true, areaName: true },
    take: MAX_PREVIEW_PROPERTIES,
    orderBy: { createdAt: "desc" },
  });

  if (premium.length >= MAX_PREVIEW_PROPERTIES) return premium;

  const need = MAX_PREVIEW_PROPERTIES - premium.length;
  const excludeIds = premium.map((x) => x.id);

  const excludeSql =
    excludeIds.length > 0 ? Prisma.sql`AND p.id NOT IN (${Prisma.join(excludeIds)})` : Prisma.sql``;

  const areaSql =
    q.length >= 2
      ? Prisma.sql`
          AND (
            p."areaName" ILIKE ${"%" + q + "%"}
            OR p.title ILIKE ${"%" + q + "%"}
            OR p.location ILIKE ${"%" + q + "%"}
          )
        `
      : Prisma.sql``;

  const nonPremium =
    need > 0
      ? await prisma.$queryRaw<Array<{ id: string; title: string; areaName: string }>>(Prisma.sql`
          SELECT p.id, p.title, p."areaName"
          FROM "Property" p
          JOIN "Owner" o ON o.id = p."ownerId"
          WHERE
            p."isVisible" = true
            AND p.city = ${city}
            ${excludeSql}
            AND (o."paidUntil" IS NULL OR o."paidUntil" <= NOW())
            ${areaSql}
          ORDER BY RANDOM()
          LIMIT ${need}
        `)
      : [];

  const merged = [...premium, ...nonPremium];

  if (!merged.length && q.length >= 2) {
    const fallback = await prisma.property.findMany({
      where: {
        isVisible: true,
        city,
      },
      select: { id: true, title: true, areaName: true },
      take: MAX_PREVIEW_PROPERTIES,
      orderBy: { createdAt: "desc" },
    });

    return fallback;
  }

  return merged;
}

// ===============================
// 🧬 OPTİMİSTİK CONVERSATION LOCK
// ===============================
async function getState(waId: string) {
  return prisma.conversationLock.findUnique({ where: { waId } });
}

async function setStateSafe(waId: string, nextState: State, nextData?: SessionData) {
  const now = new Date();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60_000);

  const updated = await prisma.conversationLock.updateMany({
    where: { waId },
    data: {
      state: nextState,
      data: nextData ?? {},
      expiresAt,
      lockedAt: now,
    },
  });

  if (updated.count === 1) return;

  await prisma.conversationLock.upsert({
    where: { waId },
    update: {
      state: nextState,
      data: nextData ?? {},
      expiresAt,
      lockedAt: now,
    },
    create: {
      waId,
      state: nextState,
      data: nextData ?? {},
      expiresAt,
      lockedAt: now,
    },
  });
}

function pushNav(data: SessionData, frame: NavFrame): SessionData {
  const stack = Array.isArray(data.navStack) ? data.navStack.slice(0) : [];
  stack.push(frame);
  while (stack.length > 10) stack.shift();
  return { ...data, navStack: stack };
}

async function transition(fromWaId: string, currentState: State, currentData: SessionData, nextState: State, nextData: SessionData) {
  const withStack = pushNav(nextData, { state: currentState, data: currentData });
  await setStateSafe(fromWaId, nextState, withStack);
}

async function goBack(fromWaId: string, currentData: SessionData): Promise<{ state: State; data: SessionData } | null> {
  const stack = Array.isArray(currentData.navStack) ? currentData.navStack.slice(0) : [];
  const last = stack.pop();
  if (!last) return null;
  const restored: SessionData = { ...last.data, navStack: stack };
  await setStateSafe(fromWaId, last.state, restored);
  return { state: last.state, data: restored };
}

// ===============================
// 🔗 Veb tətbiqi üçün bron qaralaması
// ===============================
const WEBAPP_DRAFT_TTL_MINUTES = Number(process.env.WEBAPP_DRAFT_TTL_MINUTES ?? "120");

const ALLOWED_RENTAL_TYPES = ["HOURLY", "DAILY", "WEEKLY", "MONTHLY"] as const;
type RentalTypeStr = (typeof ALLOWED_RENTAL_TYPES)[number];

function assertRentalType(v: string): RentalTypeStr {
  if ((ALLOWED_RENTAL_TYPES as readonly string[]).includes(v)) return v as RentalTypeStr;
  return "DAILY";
}

async function createWebappDraft(params: { propertyId: string; waId: string; rentalType: string }) {
  const rentalType = assertRentalType(params.rentalType);

  const expiresAt = new Date(Date.now() + WEBAPP_DRAFT_TTL_MINUTES * 60_000);

  const draft = await prisma.bookingDraft.create({
    data: {
      waId: params.waId,
      propertyId: params.propertyId,
      expiresAt,
      rentalType,
    },
    select: { id: true },
  });

  return draft.id;
}

function buildWebAppUrlDraft(draftId: string, rentalType: string) {
  const base = env.PUBLIC_BASE_URL || "http://localhost:3001";
  const url = new URL("/booking/webapp", base);
  url.searchParams.set("draftId", draftId);
  url.searchParams.set("rentalType", assertRentalType(rentalType));
  return url.toString();
}

// ===============================
// ✅ UI qurucuları
// ===============================
function langMenuInteractive(): OutboundInteractive {
  return {
    kind: "reply_buttons",
    body: "Dili seçin:",
    buttons: [
      { id: "LANG_AZ", title: "Azərbaycanca" },
      { id: "LANG_EN", title: "İngiliscə" },
      { id: "LANG_RU", title: "Rusca" },
    ],
  };
}

function langMenuFallbackText() {
  return "Dili seçin:\n\n1) Azərbaycan dili\n2) İngilis dili\n3) Rus dili\n4) Çin dili";
}

function cityMenuInteractive(cities: string[]): OutboundInteractive {
  return {
    kind: "list",
    headerText: "Şəhər",
    body: "Şəhəri seçin:",
    buttonText: "Seçin",
    sections: [
      {
        title: "Şəhərlər",
        rows: cities.slice(0, 10).map((c) => ({
          id: `CITY:${c}`,
          title: c,
        })),
      },
    ],
    footerText: "Seçim etmək üçün siyahını açın.",
  };
}

function serviceMenuInteractive(): OutboundInteractive {
  return {
    kind: "list",
    headerText: "Xidmət",
    body: "Xidməti seçin:",
    buttonText: "Seçin",
    sections: [
      {
        title: "Xidmətlər",
        rows: [
          { id: "SVC:RENT_HOME", title: "🏠 Ev icarəsi" },
          { id: "SVC:HOTEL", title: "🏨 Otel" },
          { id: "SVC:CAR_RENTAL", title: "🚗 Avtomobil icarəsi" },
          { id: "SVC:BARBER", title: "💈 Bərbər" },
          { id: "SVC:BEAUTY", title: "💅 Gözəllik xidməti" },
          { id: "SVC:SOBER_DRIVER", title: "🚘 Ayıq sürücü" },
        ],
      },
    ],
    footerText: "Seçim etmək üçün siyahını açın.",
  };
}

function roomsPromptText() {
  return (
    "Otaq sayını seçin:\n\n" +
    "1) 1 otaqlı ✅\n" +
    "2) 2 otaqlı ✅\n" +
    "3) 3 otaqlı ✅\n" +
    "4) 4 və daha çox otaqlı ✅\n\n" +
    "Seçim etmək üçün uyğun rəqəmi yazın."
  );
}

function rentalTypePromptText() {
  return (
    "İcarə müddətini seçin:\n\n" +
    "1) Saatlıq ✅\n" +
    "2) Günlük ✅\n" +
    "3) Həftəlik ✅\n" +
    "4) Aylıq ✅\n\n" +
    "Seçim etmək üçün uyğun rəqəmi yazın."
  );
}

function areaQueryPromptText(tries: number) {
  const hint = tries > 0 ? `\n\n⚠️ Uyğun elan tapılmadı. Qalan cəhd sayı: ${Math.max(0, 3 - tries)}` : "";
  return (
    "İstədiyiniz ərazinin adını yazın (məsələn: Yasamal, Nərimanov, Xətai).\n" +
    "Ərazi seçmək istəmirsinizsə, ➡️ Davam et düyməsini seçin." +
    hint
  );
}

function propertyListInteractive(city: string, props: Array<{ id: string; title: string; areaName: string }>): OutboundInteractive {
  const rows: Array<{ id: string; title: string; description?: string }> = props.slice(0, 8).map((p) => ({
    id: `PROP:${p.id}`,
    title: p.title,
    description: p.areaName ? `📍 ${p.areaName}` : undefined,
  }));

  rows.push({ id: "OPEN_ALL", title: "🌐 Bütün elanları açın" });

  return {
    kind: "list",
    headerText: `Elanlar • ${city}`,
    body: "Uyğun elanlardan birini seçin:",
    buttonText: "Açın",
    sections: [
      {
        title: "Seçilmiş elanlar",
        rows,
      },
    ],
    footerText: "Seçim etmək üçün siyahını açın.",
  };
}

function ctaAllListingsInteractive(city: string, area?: string): OutboundInteractive {
  return {
    kind: "cta_url",
    body: "🌐 Bütün elanları açın:",
    displayText: "Saytı açın",
    url: buildAllListingsUrl({ city, service: "RENT_HOME", area }),
  };
}

// ===============================
// ✅ ƏRAZİ TƏLƏBİ BİLDİRİŞİ
// ===============================
const DEMAND_NOTIFY_MAX_OWNERS = Number(process.env.DEMAND_NOTIFY_MAX_OWNERS ?? "20");
const DEMAND_NOTIFY_COOLDOWN_MS = Number(process.env.DEMAND_NOTIFY_COOLDOWN_MS ?? String(6 * 60 * 60 * 1000));

function demandKey(city: string, serviceKey: string, area: string) {
  return `${city}::${serviceKey}::${area.toLowerCase().trim()}`;
}

async function notifyOwnersAreaDemand(params: {
  city: string;
  service: Service;
  area: string;
  data: SessionData;
}) {
  const city = params.city;
  const area = (params.area ?? "").trim();
  if (area.length < 2) return;

  const serviceKey = String(params.service);
  const key = demandKey(city, serviceKey, area);

  const notifiedMap: Record<string, number> =
    params.data.demandNotifiedKeys && typeof params.data.demandNotifiedKeys === "object"
      ? params.data.demandNotifiedKeys
      : {};

  if (notifiedMap[key]) return;

  const now = new Date();
  const cooldownBorder = new Date(Date.now() - DEMAND_NOTIFY_COOLDOWN_MS);

  const shouldNotify = await prisma.$transaction(async (tx) => {
    const ds = await tx.demandSignal.upsert({
      where: {
        city_areaName_serviceKey: {
          city,
          areaName: area,
          serviceKey,
        },
      },
      update: {
        searchCount: { increment: 1 },
      },
      create: {
        city,
        areaName: area,
        serviceKey,
        searchCount: 1,
      },
      select: { id: true, lastNotifiedAt: true },
    });

    if (ds.lastNotifiedAt && ds.lastNotifiedAt > cooldownBorder) {
      return false;
    }

    await tx.demandSignal.update({
      where: { id: ds.id },
      data: { lastNotifiedAt: now },
    });

    return true;
  });

  params.data.demandNotifiedKeys = { ...notifiedMap, [key]: Date.now() };

  if (!shouldNotify) return;

  let owners: Array<{ phone: string | null; name: string | null }> = [];
  try {
    owners = await prisma.owner.findMany({
      where: {
        properties: {
          some: { isVisible: true, city },
        },
      },
      select: { phone: true, name: true },
      take: Math.max(0, Math.trunc(DEMAND_NOTIFY_MAX_OWNERS)),
    });
  } catch (err) {
    console.warn("[area-demand] owner query failed:", err);
    return;
  }

  if (!owners.length) return;

  const message =
    `📍 Tələb siqnalı\n\n` +
    `Şəhər: ${city}\n` +
    `Xidmət: ${formatServiceLabelAz(serviceKey)}\n` +
    `Axtarılan ərazi: "${area}"\n\n` +
    `Bu ərazi üzrə uyğun elan tapılmadı.\n` +
    `İstəyə uyğun elan yerləşdirməyiniz tövsiyə olunur.`;

  for (const o of owners) {
    const waId = normalizePhoneToWaIdDigits(o.phone ?? "");
    if (!waId) continue;
    try {
      await enqueueOutboundText(waId, message);
    } catch (err) {
      console.warn("[area-demand] enqueue failed:", err);
    }
  }
}

// ===============================
// ✅ ELAN SAHİBİ BRON ƏMRLƏRİ ÜZRƏ EMAL
// ===============================
async function handleOwnerBookingCommand(fromWaId: string, cmd: { action: "APPROVE" | "REJECT"; bookingId: string }) {
  if (!isUuidLike(cmd.bookingId)) {
    await enqueueOutboundText(fromWaId, "❌ Bron identifikatorunun formatı yanlışdır.");
    return;
  }

  const owner = await findOwnerByWaId(fromWaId);
  if (!owner) {
    await enqueueOutboundText(fromWaId, "❌ Bu əməliyyat yalnız elan sahibləri üçündür.");
    return;
  }

  const now = new Date();

  try {
    const res = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: cmd.bookingId },
        select: {
          id: true,
          status: true,
          expiresAt: true,
          customerPhone: true,
          rentalType: true,
          startAt: true,
          endAt: true,
          totalPrice: true,
          propertyId: true,
          property: {
            select: {
              id: true,
              title: true,
              ownerId: true,
              city: true,
              areaName: true,
              location: true,
              checkInTime: true,
              checkOutTime: true,
              rulesText: true,
              owner: { select: { name: true, phone: true } },
            },
          },
        },
      });

      if (!booking || !booking.property) return { ok: false as const, code: "NOT_FOUND" as const };
      if (booking.property.ownerId !== owner.id) return { ok: false as const, code: "NOT_YOURS" as const };

      if (booking.expiresAt && booking.expiresAt.getTime() <= now.getTime()) {
        await tx.booking.updateMany({
          where: { id: booking.id, status: "PENDING" },
          data: { status: "EXPIRED" },
        });
        return { ok: false as const, code: "EXPIRED" as const, booking };
      }

      if (booking.status !== "PENDING") return { ok: false as const, code: "ALREADY_FINAL" as const, booking };

      if (cmd.action === "REJECT") {
        const updated = await tx.booking.updateMany({
          where: { id: booking.id, status: "PENDING" },
          data: { status: "REJECTED" },
        });
        if (updated.count !== 1) return { ok: false as const, code: "RACE_LOST" as const, booking };
        return { ok: true as const, action: "REJECT" as const, booking };
      }

      await tx.$queryRaw`SELECT id FROM "Property" WHERE id = ${booking.propertyId} FOR UPDATE`;

      const conflict = await tx.booking.findFirst({
        where: {
          propertyId: booking.propertyId,
          status: "APPROVED",
          AND: [{ startAt: { lt: booking.endAt } }, { endAt: { gt: booking.startAt } }],
        },
        select: { id: true },
      });

      if (conflict) {
        await tx.booking.updateMany({
          where: { id: booking.id, status: "PENDING" },
          data: { status: "REJECTED" },
        });
        return { ok: false as const, code: "DATES_TAKEN" as const, booking };
      }

      const updated = await tx.booking.updateMany({
        where: { id: booking.id, status: "PENDING" },
        data: { status: "APPROVED" },
      });

      if (updated.count !== 1) return { ok: false as const, code: "RACE_LOST" as const, booking };
      return { ok: true as const, action: "APPROVE" as const, booking };
    });

    if (!res.ok) {
      if (res.code === "NOT_FOUND") {
        await clearOwnerPendingBooking(fromWaId);
        await enqueueOutboundText(fromWaId, "❌ Bron tapılmadı.");
        return;
      }
      if (res.code === "NOT_YOURS") {
        await clearOwnerPendingBooking(fromWaId);
        await enqueueOutboundText(fromWaId, "⛔ Bu bron sizə aid deyil.");
        return;
      }
      if (res.code === "EXPIRED") {
        await clearOwnerPendingBooking(fromWaId);
        await enqueueOutboundText(fromWaId, "⌛ Bronun müddəti bitib.");
        await enqueueOutboundText(
          normalizePhoneToWaIdDigits(res.booking.customerPhone),
          `⌛ Bron təsdiqlənmədən müddəti bitdi.\n\nAna menyuya qayıtmaq üçün /menu yazın.`
        );
        return;
      }
      if (res.code === "ALREADY_FINAL") {
        await clearOwnerPendingBooking(fromWaId);
        await enqueueOutboundText(fromWaId, `ℹ️ Bu bron artıq ${formatBookingStatusAz(res.booking.status)}.`);
        return;
      }
      if (res.code === "DATES_TAKEN") {
        await clearOwnerPendingBooking(fromWaId);
        await enqueueOutboundText(fromWaId, "❌ Seçilmiş tarix və ya saat artıq tutulub. Bron rədd edildi.");
        await enqueueOutboundText(
          normalizePhoneToWaIdDigits(res.booking.customerPhone),
          `❌ Bron təsdiqlənmədi, çünki seçilmiş tarix və ya saat artıq tutulub.\n\nAna menyuya qayıtmaq üçün /menu yazın.`
        );
        return;
      }

      await enqueueOutboundText(fromWaId, "⚠️ Sistem paralel əməliyyat səbəbilə bu sorğunu icra etmədi.");
      return;
    }

    const booking = res.booking;
    const prop = booking.property!;
    const title = prop.title ?? prop.id;
    const period = formatBookingPeriod(booking.rentalType, booking.startAt, booking.endAt);

    const ownerName = prop.owner?.name ? String(prop.owner.name) : "Elan sahibi";
    const ownerPhoneDigits = normalizePhoneToWaIdDigits(prop.owner?.phone ?? "");
    const customerDigits = normalizePhoneToWaIdDigits(booking.customerPhone);

    const placeLine = `📍 ${prop.city}${prop.areaName ? " — " + prop.areaName : ""}`;
    const timeLine =
      prop.checkInTime || prop.checkOutTime
        ? `⏱ Giriş saatı: ${prop.checkInTime ?? "—"} | Çıxış saatı: ${prop.checkOutTime ?? "—"}`
        : "";

    if (res.action === "REJECT") {
      await clearOwnerPendingBooking(fromWaId);

      await enqueueOutboundText(
        customerDigits,
        `❌ Bron rədd edildi.\n` +
        `🏠 ${title}\n` +
        `${placeLine}\n` +
        `📌 İcarə növü: ${formatRentalTypeAz(booking.rentalType)}\n` +
        `🕒 ${period}\n` +
        `💰 ${booking.totalPrice} AZN\n\n` +
        `Ana menyuya qayıtmaq üçün /menu yazın.`
      );

      await enqueueOutboundText(
        fromWaId,
        `✅ Bron rədd edildi.\n` +
        `🏠 ${title}\n` +
        `${placeLine}\n` +
        `📌 İcarə növü: ${formatRentalTypeAz(booking.rentalType)}\n` +
        `🕒 ${period}\n` +
        `💰 ${booking.totalPrice} AZN`
      );
      return;
    }

    const revealToCustomer =
      `✅ Bron təsdiqləndi!\n` +
      `🏠 ${title}\n` +
      `${placeLine}\n` +
      `📌 İcarə növü: ${formatRentalTypeAz(booking.rentalType)}\n` +
      `🕒 ${period}\n` +
      `💰 ${booking.totalPrice} AZN\n\n` +
      (prop.rulesText ? `📝 Elan haqqında:\n${prop.rulesText}\n\n` : "") +
      `👤 Elan sahibi: ${ownerName}\n` +
      (ownerPhoneDigits ? `📞 ${ownerPhoneDigits}\n` : "") +
      (prop.location ? `📌 Ünvan / yerləşmə: ${prop.location}\n` : "") +
      (timeLine ? `${timeLine}\n` : "");

    await enqueueOutboundText(customerDigits, revealToCustomer);

    await clearOwnerPendingBooking(fromWaId);

    await enqueueOutboundText(
      fromWaId,
      `✅ Bron təsdiqləndi.\n` +
      `🏠 ${title}\n` +
      `${placeLine}\n` +
      `📌 İcarə növü: ${formatRentalTypeAz(booking.rentalType)}\n` +
      `🕒 ${period}\n` +
      `💰 ${booking.totalPrice} AZN\n\n` +
      `👤 Müştərinin əlaqə məlumatı:\n` +
      `📞 ${customerDigits}`
    );
    return;
  } catch (e) {
    console.error("[owner-booking-cmd] error:", e);
    await enqueueOutboundText(fromWaId, "❌ Xəta baş verdi. Zəhmət olmasa bir qədər sonra yenidən cəhd edin.");
    return;
  }
}

// ===============================
// ✅ MÖVCUD HALIN TƏKRAR GÖSTƏRİLMƏSİ
// ===============================
async function renderState(from: string, state: State, data: SessionData) {
  if (state === "LANG_SELECT") {
    await sendMainAndNav(from, { type: "interactive", payload: langMenuInteractive() }, { showContinue: false });
    await sendMainAndNav(from, { type: "text", text: langMenuFallbackText() }, { showContinue: false });
    return;
  }

  if (state === STATE_CITY_SELECT) {
    const cities = data.cities?.length ? data.cities : await loadAvailableCities();
    await sendMainAndNav(from, { type: "interactive", payload: cityMenuInteractive(cities) }, { showContinue: false });
    return;
  }

  if (state === "SERVICE_SELECT") {
    await sendMainAndNav(from, { type: "interactive", payload: serviceMenuInteractive() }, { showContinue: false });
    return;
  }

  if (state === SVC_RENT_ROOMS) {
    await sendMainAndNav(from, { type: "text", text: roomsPromptText() }, { showContinue: false });
    return;
  }

  if (state === SVC_RENT_AREA_QUERY) {
    const tries = Number(data.areaTries ?? 0);
    await sendMainAndNav(
      from,
      { type: "text", text: areaQueryPromptText(tries) },
      { showContinue: true, continueLabel: "➡️ Davam et" }
    );
    return;
  }

  if (state === SVC_RENT_SELECT_RENTAL_TYPE) {
    await sendMainAndNav(from, { type: "text", text: rentalTypePromptText() }, { showContinue: false });
    return;
  }

  if (state === SVC_RENT_SELECT_PROPERTY) {
    const city = data.city ?? "Şəhər";
    const props = data.properties ?? [];
    await sendMainAndNav(from, { type: "interactive", payload: propertyListInteractive(city, props) }, { showContinue: false });
    return;
  }

  if (state === SVC_RENT_WAIT_WEBAPP) {
    await sendMainAndNav(
      from,
      { type: "text", text: "Zəhmət olmasa təqdim edilən keçiddən istifadə edin. Ana menyu üçün 🏠, geri qayıtmaq üçün ⬅️ seçin." },
      { showContinue: false }
    );
    return;
  }

  await sendMainAndNav(from, { type: "text", text: "Davam etmək üçün 🏠 Ana səhifəni seçin." }, { showContinue: false });
}

// ===== Əsas daxil olan mesaj emalı =====
async function processInboundMessage(messageId: string) {
  await prisma.message.update({ where: { id: messageId }, data: { status: "PROCESSING" } }).catch(() => { });

  try {
    const msg = await prisma.message.findUnique({ where: { id: messageId } });
    if (!msg || msg.direction !== "INBOUND") {
      await prisma.message.update({
        where: { id: messageId },
        data: { status: "PROCESSED" },
      }).catch(() => { });
      return;
    }

    const from = msg.waId;
    const raw = norm(msg.body);
    const text = raw;
    const textLower = lower(raw);

    const directCmd = parseOwnerBookingCommand(text);
    if (directCmd) {
      await handleOwnerBookingCommand(from, directCmd);
      await prisma.message.update({
        where: { id: messageId },
        data: { status: "PROCESSED" },
      }).catch(() => { });
      return;
    }

    const actionWithoutId = parseOwnerBookingActionWithoutId(text);
    if (actionWithoutId) {
      const convForOwnerAction = await getState(from);
      const pendingBooking = extractOwnerPendingBooking(convForOwnerAction?.data);

      if (pendingBooking?.bookingId && isUuidLike(pendingBooking.bookingId)) {
        await handleOwnerBookingCommand(from, {
          action: actionWithoutId,
          bookingId: pendingBooking.bookingId,
        });
      } else {
        await enqueueOutboundText(
          from,
          "⚠️ Cavablandırılacaq aktiv bron sorğusu tapılmadı. Zəhmət olmasa son gələn bron sorğusundan yenidən seçim edin."
        );
      }

      await prisma.message.update({
        where: { id: messageId },
        data: { status: "PROCESSED" },
      }).catch(() => { });
      return;
    }

    // ===============================
    // 🚦 TEZLİK MƏHDUDİYYƏTİ
    // ===============================
    const convLockForRate = await getState(from);
    const nowTs = Date.now();

    const rateData = extractRateLimit(convLockForRate?.data);
    const existingTimestamps = pruneOldTimestamps(rateData.timestamps ?? [], nowTs);

    if (rateData.blockedUntil && nowTs < rateData.blockedUntil) {
      await prisma.message.update({
        where: { id: messageId },
        data: { status: "PROCESSED" },
      }).catch(() => { });
      return;
    }

    const updatedTimestamps = [...existingTimestamps, nowTs];

    if (updatedTimestamps.length > RATE_LIMIT_MAX_MESSAGES) {
      const nextRate: RateLimitData = {
        timestamps: updatedTimestamps,
        blockedUntil: nowTs + RATE_LIMIT_WINDOW_MS,
      };

      await prisma.conversationLock.upsert({
        where: { waId: from },
        update: {
          data: injectRateLimit(convLockForRate?.data, nextRate),
          expiresAt: convLockForRate?.expiresAt ?? nowPlusTtl(),
        },
        create: {
          waId: from,
          state: null,
          data: injectRateLimit({}, nextRate),
          expiresAt: nowPlusTtl(),
        },
      });

      await prisma.message.update({
        where: { id: messageId },
        data: { status: "PROCESSED" },
      }).catch(() => { });
      return;
    }

    await prisma.conversationLock.upsert({
      where: { waId: from },
      update: {
        data: injectRateLimit(convLockForRate?.data, {
          ...rateData,
          timestamps: updatedTimestamps,
        }),
        expiresAt: convLockForRate?.expiresAt ?? nowPlusTtl(),
      },
      create: {
        waId: from,
        state: null,
        data: injectRateLimit({}, { timestamps: updatedTimestamps }),
        expiresAt: nowPlusTtl(),
      },
    });

    // ===============================
    // 🧠 SPAM İZLƏMƏ
    // ===============================
    const convLock = await getState(from);
    const anti = decaySpamScore(extractAntiSpam(convLock?.data));

    if (isInCooldown(anti)) {
      await prisma.message.update({
        where: { id: messageId },
        data: { status: "PROCESSED" },
      }).catch(() => { });
      return;
    }

    const conv = await getState(from);
    const currentState = (conv?.state as any) ?? null;

    if (shouldSilentlyIgnoreMessage(currentState, raw, text)) {
      const newScore = (anti.spamScore ?? 0) + 1;

      const nextAnti: AntiSpamData = {
        spamScore: newScore,
        lastSpamAt: Date.now(),
        cooldownUntil: newScore >= SPAM_SCORE_LIMIT ? Date.now() + COOLDOWN_MS : anti.cooldownUntil,
      };

      await prisma.conversationLock.upsert({
        where: { waId: from },
        update: {
          data: injectAntiSpam(convLock?.data, nextAnti),
          expiresAt: convLock?.expiresAt ?? nowPlusTtl(),
        },
        create: {
          waId: from,
          state: null,
          data: injectAntiSpam({}, nextAnti),
          expiresAt: nowPlusTtl(),
        },
      });

      await prisma.message.update({
        where: { id: messageId },
        data: { status: "PROCESSED" },
      }).catch(() => { });
      return;
    }

    if (!raw) {
      await enqueueOutboundText(from, "Yalnız mətn formatında mesaj qəbul edilir.");
      await prisma.message.update({
        where: { id: messageId },
        data: { status: "PROCESSED" },
      }).catch(() => { });
      return;
    }

    // =========================================================
    // ELAN SAHİBİ ABUNƏ GATE-İ
    // =========================================================
    const owner = await findOwnerByWaId(from);
    if (owner) {
      const active = isOwnerActive(owner.paidUntil);

      if (isRenew(textLower)) {
        const { invoice, checkoutUrl } = await createRenewInvoice(owner.id);

        const info =
          `💳 Abunəliyin yenilənməsi (${invoice.periodDays} gün)\n` +
          `Məbləğ: ${invoice.amount} ${invoice.currency}\n\n` +
          `Ödəniş keçidi:\n${checkoutUrl}\n\n` +
          `Ödəniş tamamlandıqdan sonra istifadə hüququ avtomatik uzadılacaq.`;

        await enqueueOutboundText(from, info);
        await prisma.message.update({
          where: { id: messageId },
          data: { status: "PROCESSED" },
        }).catch(() => { });
        return;
      }

      if (!active) {
        const until = owner.paidUntil ? formatIsoShort(owner.paidUntil) : "—";
        const msgText = `⛔ İstifadə hüququ aktiv deyil.\nSon tarix: ${until}\n\nUzatmaq üçün /renew yazın (və ya "uzat").`;
        await enqueueOutboundText(from, msgText);
        await prisma.message.update({
          where: { id: messageId },
          data: { status: "PROCESSED" },
        }).catch(() => { });
        return;
      }
    }

    const state: State = (conv?.state as any) ?? "LANG_SELECT";
    const data: SessionData = (conv?.data as any) ?? {};

    if (conv?.expiresAt && new Date(conv.expiresAt).getTime() < Date.now()) {
      await setStateSafe(from, "LANG_SELECT", {});
      await renderState(from, "LANG_SELECT", {});
      await prisma.message.update({
        where: { id: messageId },
        data: { status: "PROCESSED" },
      }).catch(() => { });
      return;
    }

    if (isBackAction(text)) {
      const back = await goBack(from, data);
      if (!back) {
        await setStateSafe(from, "LANG_SELECT", {});
        await renderState(from, "LANG_SELECT", {});
        await prisma.message.update({
          where: { id: messageId },
          data: { status: "PROCESSED" },
        }).catch(() => { });
        return;
      }
      await renderState(from, back.state, back.data);
      await prisma.message.update({
        where: { id: messageId },
        data: { status: "PROCESSED" },
      }).catch(() => { });
      return;
    }

    if (isReset(textLower)) {
      await setStateSafe(from, "LANG_SELECT", {});
      await renderState(from, "LANG_SELECT", {});
      await prisma.message.update({
        where: { id: messageId },
        data: { status: "PROCESSED" },
      }).catch(() => { });
      return;
    }

    if (isMenuAction(text) || isExit(textLower)) {
      if (!data.language) {
        await setStateSafe(from, "LANG_SELECT", {});
        await renderState(from, "LANG_SELECT", {});
        await prisma.message.update({
          where: { id: messageId },
          data: { status: "PROCESSED" },
        }).catch(() => { });
        return;
      }

      const cities = await loadAvailableCities();
      if (!cities.length) {
        await sendMainAndNav(from, { type: "text", text: "Hazırda heç bir şəhərdə aktiv elan yoxdur." });
        await prisma.message.update({
          where: { id: messageId },
          data: { status: "PROCESSED" },
        }).catch(() => { });
        return;
      }

      await setStateSafe(from, STATE_CITY_SELECT, { ...data, cities, navStack: [] });
      await renderState(from, STATE_CITY_SELECT, { ...data, cities, navStack: [] });
      await prisma.message.update({
        where: { id: messageId },
        data: { status: "PROCESSED" },
      }).catch(() => { });
      return;
    }

    if (isStart(textLower)) {
      await setStateSafe(from, "LANG_SELECT", {});
      await renderState(from, "LANG_SELECT", {});
      await prisma.message.update({
        where: { id: messageId },
        data: { status: "PROCESSED" },
      }).catch(() => { });
      return;
    }

    const isEarly = state === "LANG_SELECT" || state === STATE_CITY_SELECT || state === "SERVICE_SELECT";
    if (isEarly && raw.length >= 3 && !isNumericInput(textLower) && !isInteractiveSelectionId(text)) {
      const cities = data.cities?.length ? data.cities : await loadAvailableCities();

      const detectedCity = cities.length ? detectCityFromText(textLower, cities) : null;
      if (detectedCity) {
        const nextData = { ...data, city: detectedCity, cities };
        await transition(from, state, data, "SERVICE_SELECT", nextData);
        await renderState(from, "SERVICE_SELECT", nextData);
        await prisma.message.update({
          where: { id: messageId },
          data: { status: "PROCESSED" },
        }).catch(() => { });
        return;
      }

      if (detectRentIntent(textLower)) {
        if (cities.length) {
          const nextData = { ...data, cities };
          await transition(from, state, data, STATE_CITY_SELECT, nextData);
          await renderState(from, STATE_CITY_SELECT, nextData);
          await prisma.message.update({
            where: { id: messageId },
            data: { status: "PROCESSED" },
          }).catch(() => { });
          return;
        }
      }
    }

    // ===== LANG_SELECT =====
    if (state === "LANG_SELECT") {
      let language: Lang | undefined;

      if (text === "LANG_AZ") language = "az";
      else if (text === "LANG_EN") language = "en";
      else if (text === "LANG_RU") language = "ru";
      else if (text === "LANG_ZH") language = "zh";
      else {
        const pick = Number(textLower);
        const map: Record<number, Lang> = { 1: "az", 2: "en", 3: "ru", 4: "zh" };
        language = map[pick];
      }

      if (!language) {
        await renderState(from, "LANG_SELECT", data);
        await prisma.message.update({
          where: { id: messageId },
          data: { status: "PROCESSED" },
        }).catch(() => { });
        return;
      }

      const cities = await loadAvailableCities();
      if (!cities.length) {
        await setStateSafe(from, "LANG_SELECT", { language });
        await sendMainAndNav(from, { type: "text", text: "Hazırda heç bir şəhərdə aktiv elan yoxdur." });
        await prisma.message.update({
          where: { id: messageId },
          data: { status: "PROCESSED" },
        }).catch(() => { });
        return;
      }

      const nextData: SessionData = { language, cities, navStack: [] };
      await setStateSafe(from, STATE_CITY_SELECT, nextData);
      await renderState(from, STATE_CITY_SELECT, nextData);
      await prisma.message.update({
        where: { id: messageId },
        data: { status: "PROCESSED" },
      }).catch(() => { });
      return;
    }

    // ===== CITY_SELECT =====
    if (state === STATE_CITY_SELECT) {
      const cities = data.cities?.length ? data.cities : await loadAvailableCities();

      let city: string | undefined;

      if (text.startsWith("CITY:")) {
        city = text.slice("CITY:".length).trim();
      } else {
        const idx = Number(textLower);
        if (idx && idx >= 1 && idx <= cities.length) {
          city = cities[idx - 1];
        }
      }

      if (!city || !cities.includes(city)) {
        await renderState(from, STATE_CITY_SELECT, { ...data, cities });
        await prisma.message.update({
          where: { id: messageId },
          data: { status: "PROCESSED" },
        }).catch(() => { });
        return;
      }

      const nextData: SessionData = { ...data, city, cities };
      await transition(from, state, data, "SERVICE_SELECT", nextData);
      await renderState(from, "SERVICE_SELECT", nextData);
      await prisma.message.update({
        where: { id: messageId },
        data: { status: "PROCESSED" },
      }).catch(() => { });
      return;
    }

    // ===== SERVICE_SELECT =====
    if (state === "SERVICE_SELECT") {
      let service: Service | null = null;

      if (text.startsWith("SVC:")) {
        const v = text.slice("SVC:".length).trim();
        if (v === "RENT_HOME") service = "RENT_HOME";
        else if (v === "HOTEL") service = "HOTEL";
        else if (v === "CAR_RENTAL") service = "CAR_RENTAL";
        else if (v === "BARBER") service = "BARBER";
        else if (v === "BEAUTY") service = "BEAUTY";
        else if (v === "SOBER_DRIVER") service = "SOBER_DRIVER";
      } else {
        const pick = Number(textLower);
        const map: Record<number, Service> = {
          1: "RENT_HOME",
          2: "HOTEL",
          3: "CAR_RENTAL",
          4: "BARBER",
          5: "BEAUTY",
          6: "SOBER_DRIVER",
        };
        service = map[pick] ?? null;
      }

      if (!service) {
        await renderState(from, "SERVICE_SELECT", data);
        await prisma.message.update({
          where: { id: messageId },
          data: { status: "PROCESSED" },
        }).catch(() => { });
        return;
      }

      if (service !== "RENT_HOME") {
        await sendMainAndNav(from, { type: "text", text: "Bu xidmət tezliklə istifadəyə veriləcək." });
        await prisma.message.update({
          where: { id: messageId },
          data: { status: "PROCESSED" },
        }).catch(() => { });
        return;
      }

      if (!data.city) {
        const cities = data.cities?.length ? data.cities : await loadAvailableCities();
        const nextData = { ...data, cities };
        await transition(from, state, data, STATE_CITY_SELECT, nextData);
        await renderState(from, STATE_CITY_SELECT, nextData);
        await prisma.message.update({
          where: { id: messageId },
          data: { status: "PROCESSED" },
        }).catch(() => { });
        return;
      }

      const nextData: SessionData = { ...data, service: "RENT_HOME" };
      await transition(from, state, data, SVC_RENT_ROOMS, nextData);
      await renderState(from, SVC_RENT_ROOMS, nextData);
      await prisma.message.update({
        where: { id: messageId },
        data: { status: "PROCESSED" },
      }).catch(() => { });
      return;
    }

    // ===== RENT_HOME: ROOMS =====
    if (state === SVC_RENT_ROOMS) {
      let rooms: string | undefined;

      if (text.startsWith("ROOMS:")) {
        rooms = text.slice("ROOMS:".length).trim();
      } else {
        const map: Record<string, string> = { "1": "1", "2": "2", "3": "3", "4": "4+" };
        rooms = map[textLower];
      }

      if (!rooms) {
        await renderState(from, SVC_RENT_ROOMS, data);
        await prisma.message.update({
          where: { id: messageId },
          data: { status: "PROCESSED" },
        }).catch(() => { });
        return;
      }

      const nextData: SessionData = { ...data, rentRooms: rooms, areaQuery: undefined, areaTries: 0 };
      await transition(from, state, data, SVC_RENT_AREA_QUERY, nextData);
      await renderState(from, SVC_RENT_AREA_QUERY, nextData);
      await prisma.message.update({
        where: { id: messageId },
        data: { status: "PROCESSED" },
      }).catch(() => { });
      return;
    }

    // ===== RENT_HOME: AREA_QUERY =====
    if (state === SVC_RENT_AREA_QUERY) {
      const city = data.city;
      if (!city) {
        await sendMainAndNav(from, { type: "text", text: "Şəhər tapılmadı. 🏠 Ana səhifəyə qayıdın." });
        await prisma.message.update({
          where: { id: messageId },
          data: { status: "PROCESSED" },
        }).catch(() => { });
        return;
      }

      if (isContinueAction(text)) {
        const nextData: SessionData = { ...data, areaQuery: undefined, areaTries: data.areaTries ?? 0 };
        await transition(from, state, data, SVC_RENT_SELECT_RENTAL_TYPE, nextData);
        await renderState(from, SVC_RENT_SELECT_RENTAL_TYPE, nextData);
        await prisma.message.update({
          where: { id: messageId },
          data: { status: "PROCESSED" },
        }).catch(() => { });
        return;
      }

      const q = raw.trim();
      const tries = Number(data.areaTries ?? 0);

      if (q.length < 2) {
        const nextData: SessionData = { ...data, areaTries: tries + 1 };
        await setStateSafe(from, SVC_RENT_AREA_QUERY, nextData);
        if (tries + 1 >= 3) {
          const autoData: SessionData = { ...nextData, areaQuery: undefined };
          await transition(from, SVC_RENT_AREA_QUERY, nextData, SVC_RENT_SELECT_RENTAL_TYPE, autoData);
          await renderState(from, SVC_RENT_SELECT_RENTAL_TYPE, autoData);
          await prisma.message.update({
            where: { id: messageId },
            data: { status: "PROCESSED" },
          }).catch(() => { });
          return;
        }
        await renderState(from, SVC_RENT_AREA_QUERY, nextData);
        await prisma.message.update({
          where: { id: messageId },
          data: { status: "PROCESSED" },
        }).catch(() => { });
        return;
      }

      const sample = await fetchPropertiesForPreview({ city, areaQuery: q });

      if (!sample.length) {
        const nextTries = tries + 1;
        const nextData: SessionData = { ...data, areaTries: nextTries };

        try {
          await notifyOwnersAreaDemand({ city, service: "RENT_HOME", area: q, data: nextData });
        } catch (e) {
          console.warn("[area-demand] notify failed:", e);
        }

        await setStateSafe(from, SVC_RENT_AREA_QUERY, nextData);

        if (nextTries >= 3) {
          const autoData: SessionData = { ...nextData, areaQuery: undefined };
          await transition(from, SVC_RENT_AREA_QUERY, nextData, SVC_RENT_SELECT_RENTAL_TYPE, autoData);
          await renderState(from, SVC_RENT_SELECT_RENTAL_TYPE, autoData);
          await prisma.message.update({
            where: { id: messageId },
            data: { status: "PROCESSED" },
          }).catch(() => { });
          return;
        }

        await renderState(from, SVC_RENT_AREA_QUERY, nextData);
        await prisma.message.update({
          where: { id: messageId },
          data: { status: "PROCESSED" },
        }).catch(() => { });
        return;
      }

      const nextData: SessionData = { ...data, areaQuery: q, areaTries: tries };
      await transition(from, state, data, SVC_RENT_SELECT_RENTAL_TYPE, nextData);
      await renderState(from, SVC_RENT_SELECT_RENTAL_TYPE, nextData);
      await prisma.message.update({
        where: { id: messageId },
        data: { status: "PROCESSED" },
      }).catch(() => { });
      return;
    }

    // ===== RENT_HOME: RENTAL_TYPE =====
    if (state === SVC_RENT_SELECT_RENTAL_TYPE) {
      let type: string | undefined;

      if (text.startsWith("RENTAL:")) {
        type = text.slice("RENTAL:".length).trim();
      } else {
        const map: Record<string, string> = {
          "1": "HOURLY",
          "2": "DAILY",
          "3": "WEEKLY",
          "4": "MONTHLY",
        };
        type = map[textLower];
      }

      if (!type) {
        await renderState(from, SVC_RENT_SELECT_RENTAL_TYPE, data);
        await prisma.message.update({
          where: { id: messageId },
          data: { status: "PROCESSED" },
        }).catch(() => { });
        return;
      }

      const city = data.city;
      if (!city) {
        await sendMainAndNav(from, { type: "text", text: "Şəhər tapılmadı. 🏠 Ana səhifəyə qayıdın." });
        await prisma.message.update({
          where: { id: messageId },
          data: { status: "PROCESSED" },
        }).catch(() => { });
        return;
      }

      const props = await fetchPropertiesForPreview({ city, areaQuery: data.areaQuery });

      if (!props.length) {
        await sendMainAndNav(from, { type: "text", text: "Bu seçimlərə uyğun elan tapılmadı." });
        await prisma.message.update({
          where: { id: messageId },
          data: { status: "PROCESSED" },
        }).catch(() => { });
        return;
      }

      const nextData: SessionData = { ...data, rentalType: type, properties: props };
      await transition(from, state, data, SVC_RENT_SELECT_PROPERTY, nextData);
      await renderState(from, SVC_RENT_SELECT_PROPERTY, nextData);
      await prisma.message.update({
        where: { id: messageId },
        data: { status: "PROCESSED" },
      }).catch(() => { });
      return;
    }

    // ===== RENT_HOME: SELECT_PROPERTY =====
    if (state === SVC_RENT_SELECT_PROPERTY) {
      const props = data.properties ?? [];
      const city = data.city ?? "Şəhər";

      if (text === "OPEN_ALL") {
        await sendMainAndNav(from, { type: "interactive", payload: ctaAllListingsInteractive(city, data.areaQuery) });
        await prisma.message.update({
          where: { id: messageId },
          data: { status: "PROCESSED" },
        }).catch(() => { });
        return;
      }

      let propertyId: string | undefined;

      if (text.startsWith("PROP:")) {
        propertyId = text.slice("PROP:".length).trim();
      } else {
        const idx = Number(textLower);
        if (idx && idx >= 1 && idx <= props.length) {
          propertyId = props[idx - 1]?.id;
        }
      }

      if (!propertyId) {
        await renderState(from, SVC_RENT_SELECT_PROPERTY, data);
        await prisma.message.update({
          where: { id: messageId },
          data: { status: "PROCESSED" },
        }).catch(() => { });
        return;
      }

      const rentalType = data.rentalType ?? "DAILY";

      const draftId = await createWebappDraft({
        propertyId,
        waId: from,
        rentalType,
      });

      const url = buildWebAppUrlDraft(draftId, rentalType);

      const nextData: SessionData = { ...data, propertyId };
      await transition(from, state, data, SVC_RENT_WAIT_WEBAPP, nextData);

      await sendMainAndNav(from, {
        type: "interactive",
        payload: {
          kind: "cta_url",
          body: "📅 Tarixi seçmək üçün keçid:",
          displayText: "Tarixi seçin",
          url,
        },
      });

      await sendMainAndNav(from, { type: "text", text: `📅 Tarixi seçmək üçün keçid:\n${url}` });
      await prisma.message.update({
        where: { id: messageId },
        data: { status: "PROCESSED" },
      }).catch(() => { });
      return;
    }

    if (state === SVC_RENT_WAIT_WEBAPP) {
      await sendMainAndNav(from, { type: "text", text: "Zəhmət olmasa təqdim edilən keçiddən istifadə edin." });
      await prisma.message.update({
        where: { id: messageId },
        data: { status: "PROCESSED" },
      }).catch(() => { });
      return;
    }

    if (!data.language) {
      await setStateSafe(from, "LANG_SELECT", {});
      await renderState(from, "LANG_SELECT", {});
      await prisma.message.update({
        where: { id: messageId },
        data: { status: "PROCESSED" },
      }).catch(() => { });
      return;
    }

    const cities = data.cities?.length ? data.cities : await loadAvailableCities();
    const nextData: SessionData = { ...data, cities };
    await setStateSafe(from, STATE_CITY_SELECT, nextData);
    await renderState(from, STATE_CITY_SELECT, nextData);

    await prisma.message.update({
      where: { id: messageId },
      data: { status: "PROCESSED" },
    }).catch(() => { });
  } catch (err) {
    await prisma.message
      .update({
        where: { id: messageId },
        data: { status: "FAILED", failedAt: new Date() },
      })
      .catch(() => { });
    throw err;
  }
}

// ===== Çıxan mesaj emalı =====
async function processOutboundMessage(messageId: string) {
  const msg = await prisma.message.findUnique({ where: { id: messageId } });
  if (!msg) return;

  if (msg.providerMessageId || isFinalOutboundStatus(msg.status)) return;
  if (msg.direction !== "OUTBOUND" || !msg.body) return;

  try {
    if (msg.type !== "interactive") {
      const { providerMessageId } = await sendTextMessage(msg.waId, msg.body);

      await prisma.message.update({
        where: { id: msg.id },
        data: { providerMessageId, status: "SENT", sentAt: new Date(), failedAt: null },
      });

      return;
    }

    try {
      const payload = JSON.parse(msg.body) as OutboundInteractive;

      if (payload.kind === "reply_buttons") {
        const { providerMessageId } = await sendReplyButtonsMessage({
          to: msg.waId,
          body: payload.body,
          buttons: payload.buttons,
          footerText: payload.footerText,
        });

        await prisma.message.update({
          where: { id: msg.id },
          data: { providerMessageId, status: "SENT", sentAt: new Date(), failedAt: null },
        });
        return;
      }

      if (payload.kind === "list") {
        const { providerMessageId } = await sendListMessage({
          to: msg.waId,
          body: payload.body,
          buttonText: payload.buttonText,
          headerText: payload.headerText,
          footerText: payload.footerText,
          sections: payload.sections,
        });

        await prisma.message.update({
          where: { id: msg.id },
          data: { providerMessageId, status: "SENT", sentAt: new Date(), failedAt: null },
        });
        return;
      }

      if (payload.kind === "cta_url") {
        const { providerMessageId } = await sendCtaUrlMessage({
          to: msg.waId,
          body: payload.body,
          displayText: payload.displayText,
          url: payload.url,
          footerText: payload.footerText,
        });

        await prisma.message.update({
          where: { id: msg.id },
          data: { providerMessageId, status: "SENT", sentAt: new Date(), failedAt: null },
        });
        return;
      }

      throw new Error("Unknown interactive payload kind");
    } catch {
      const { providerMessageId } = await sendTextMessage(msg.waId, msg.body);

      await prisma.message.update({
        where: { id: msg.id },
        data: { providerMessageId, status: "SENT", sentAt: new Date(), failedAt: null },
      });

      return;
    }
  } catch (err) {
    await prisma.message
      .update({
        where: { id: msg.id },
        data: { status: "FAILED", failedAt: new Date() },
      })
      .catch(() => { });
    throw err;
  }
}

// ===============================
// 🔐 ATOMİK JOB CLAIM
// ===============================
async function claimPendingJobAtomically(jobId: string, workerId: string) {
  const res = await prisma.messageJob.updateMany({
    where: {
      id: jobId,
      state: "PENDING",
      lockedAt: null,
    },
    data: {
      state: "RUNNING",
      lockedAt: new Date(),
      lockedBy: workerId,
    },
  });

  return res.count === 1;
}

async function recoverStaleJobs(staleAfterMs: number) {
  const cutoff = new Date(Date.now() - staleAfterMs);

  const recovered = await prisma.messageJob.updateMany({
    where: {
      OR: [
        {
          state: "RUNNING",
          lockedAt: { lt: cutoff },
        },
        {
          state: "PENDING",
          lockedAt: { lt: cutoff },
        },
      ],
    },
    data: {
      state: "PENDING",
      lockedAt: null,
      lockedBy: null,
      lastError: "Recovered stale worker lock",
    },
  });

  return recovered.count;
}

// ===== Job xəta emalı =====
async function markJobFailed(jobId: string, attempts: number, err: unknown) {
  const msg = getErrorMessage(err);
  const nextAttempts = attempts + 1;

  if (nextAttempts >= MAX_ATTEMPTS) {
    await prisma.messageJob.update({
      where: { id: jobId },
      data: {
        state: "DEAD",
        attempts: nextAttempts,
        lastError: msg.slice(0, 1000),
        lockedAt: null,
        lockedBy: null,
      },
    });
    return;
  }

  const nextRunAt = new Date(Date.now() + backoffMs(nextAttempts));
  await prisma.messageJob.update({
    where: { id: jobId },
    data: {
      state: "PENDING",
      attempts: nextAttempts,
      nextRunAt,
      lastError: msg.slice(0, 1000),
      lockedAt: null,
      lockedBy: null,
    },
  });
}

export async function startMessageWorker(opts: WorkerOptions) {
  const workerId = String(opts.workerId || "").trim();
  if (!workerId) {
    throw new Error("startMessageWorker requires a non-empty workerId");
  }

  const pollIntervalMs = clampPositiveInt(opts.pollIntervalMs, DEFAULT_POLL_MS);
  const batchSize = clampPositiveInt(opts.batchSize, DEFAULT_BATCH);
  const staleJobLockMs = Math.max(DEFAULT_STALE_JOB_LOCK_MS, pollIntervalMs * Math.max(batchSize * 12, 60));

  console.log("worker started:", workerId);

  let lastExpireSweepAt = 0;
  let lastStaleSweepAt = 0;
  let consecutiveInfraFailures = 0;

  while (true) {
    try {
      const nowTs = Date.now();

      if (nowTs - lastStaleSweepAt >= STALE_JOB_SWEEP_EVERY_MS) {
        lastStaleSweepAt = nowTs;

        const recoveredCount = await recoverStaleJobs(staleJobLockMs);
        if (recoveredCount > 0) {
          console.warn(`[worker] recovered ${recoveredCount} stale jobs`);
        }
      }

      const jobs = await prisma.messageJob.findMany({
        where: {
          state: "PENDING",
          nextRunAt: { lte: new Date() },
          lockedAt: null,
        },
        take: batchSize,
        orderBy: { createdAt: "asc" },
      });

      consecutiveInfraFailures = 0;

      for (const job of jobs) {
        try {
          const claimed = await claimPendingJobAtomically(job.id, workerId);
          if (!claimed) continue;

          if (job.type === "PROCESS_INBOUND") {
            await processInboundMessage(job.messageId);
          } else if (job.type === "SEND_OUTBOUND") {
            await processOutboundMessage(job.messageId);
          } else {
            throw new Error(`Unsupported job type: ${String(job.type)}`);
          }

          await prisma.messageJob.update({
            where: { id: job.id },
            data: {
              state: "DONE",
              lockedAt: null,
              lockedBy: null,
              lastError: null,
            },
          });
        } catch (e) {
          console.error("[worker] job failed:", e);
          await markJobFailed(job.id, job.attempts ?? 0, e);
        }
      }

      const afterJobsTs = Date.now();
      if (afterJobsTs - lastExpireSweepAt >= EXPIRE_SWEEP_EVERY_MS) {
        lastExpireSweepAt = afterJobsTs;
        try {
          await sweepExpiredBookingsOnce();
        } catch (e) {
          console.error("[expire-sweep] failed:", e);
        }
      }

      await sleep(pollIntervalMs);
    } catch (e) {
      if (isRetryableWorkerDbError(e)) {
        consecutiveInfraFailures += 1;
        const waitMs = workerRecoveryBackoffMs(consecutiveInfraFailures);
        console.error(
          `[worker] db/infra unavailable; retrying in ${waitMs}ms (failure #${consecutiveInfraFailures})`,
          e
        );
        await sleep(waitMs);
        continue;
      }

      consecutiveInfraFailures = 0;
      console.error("[worker] loop iteration failed:", e);
      await sleep(pollIntervalMs);
    }
  }
}