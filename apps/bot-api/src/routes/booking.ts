import { Router, type Request, type Response } from "express";
import prisma from "db";
import { Prisma } from "@prisma/client";

export const bookingRouter = Router();

const DB_TIMEOUT_MS = 5000;
const DAY_MS = 24 * 60 * 60 * 1000;

const ALLOWED_RENTAL_TYPES = ["HOURLY", "DAILY", "WEEKLY", "MONTHLY"] as const;
const MIN_DURATION_DAYS: Record<(typeof ALLOWED_RENTAL_TYPES)[number], number> = {
  HOURLY: 0,
  DAILY: 1,
  WEEKLY: 7,
  MONTHLY: 30,
};

const ERROR_MESSAGES_AZ: Record<string, string> = {
  DATES_REQUIRED: "Başlanğıc və bitiş tarixi/saatı tələb olunur.",
  INVALID_RENTAL_TYPE: "Seçilmiş icarə növü yanlışdır.",
  INVALID_DATE_FORMAT: "Tarix və ya saat formatı yanlışdır.",
  INVALID_DATES: "Tarix aralığı yanlışdır.",
  END_MUST_BE_AFTER_START: "Bitiş vaxtı başlanğıc vaxtından sonra olmalıdır.",
  PAST_DATES_NOT_ALLOWED: "Cari gündən əvvəlki tarixlər üçün bron sorğusu göndərilə bilməz.",
  DRAFT_NOT_FOUND: "Bron qaralaması tapılmadı.",
  DRAFT_EXPIRED: "Bron keçidinin müddəti bitib.",
  PROPERTY_ID_REQUIRED: "Elan identifikatoru tələb olunur.",
  PROPERTY_NOT_FOUND: "Elan tapılmadı.",
  PROPERTY_UNAVAILABLE: "Bu elan hazırda bron qəbul etmir.",
  PHONE_REQUIRED: "Telefon nömrəsi tələb olunur.",
  INVALID_PHONE_FORMAT: "Telefon nömrəsinin formatı yanlışdır.",
  PHONE_MUST_BE_AZ_FORMAT: "Telefon nömrəsi Azərbaycan formatında olmalıdır.",
  PHONE_LENGTH_INVALID: "Telefon nömrəsi natamam və ya yanlışdır.",
  PRICING_NOT_AVAILABLE: "Seçilmiş icarə növü üzrə qiymət aktiv deyil.",
  PRICE_CALCULATION_FAILED: "Qiymət hesablana bilmədi.",
  DATES_TAKEN: "Bu tarix və ya saat aralığı artıq tutulub.",
  BOOKING_ALREADY_EXISTS: "Bu seçim üzrə aktiv bron sorğunuz artıq mövcuddur.",
  BOOKING_NOT_FOUND: "Bron tapılmadı.",
  INTERNAL_ERROR: "Daxili xəta baş verdi. Zəhmət olmasa bir qədər sonra yenidən cəhd edin.",
};

const moneyFormatter = new Intl.NumberFormat("az-AZ", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

type RentalType = (typeof ALLOWED_RENTAL_TYPES)[number];
type BookingVisibility = "LIMITED" | "FULL";

type BookableProperty = Prisma.PropertyGetPayload<{
  include: {
    pricings: true;
    owner: true;
    service: {
      select: {
        id: true;
        key: true;
        isActive: true;
      };
    };
  };
}>;

type BookingWithExposure = Prisma.BookingGetPayload<{
  include: {
    property: {
      include: {
        owner: true;
        service: {
          select: {
            id: true;
            key: true;
            isActive: true;
          };
        };
      };
    };
  };
}>;

type PropertyBookabilityResult = {
  ok: boolean;
  reason:
  | "PROPERTY_NOT_VISIBLE"
  | "OWNER_MISSING"
  | "SERVICE_MISSING"
  | "SERVICE_INACTIVE"
  | "OWNER_SUBSCRIPTION_ACTIVE"
  | "OWNER_SUBSCRIPTION_LEGACY_ACTIVE"
  | "OWNER_SUBSCRIPTION_COMPAT_ALLOW"
  | "OWNER_SUBSCRIPTION_INACTIVE";
  service: { id: string; key: string; isActive: boolean } | null;
};

function sendError(
  res: Response,
  code: string,
  status = 400,
  extra?: Record<string, unknown>
) {
  return res.status(status).json({
    ok: false,
    code,
    message: code,
    userMessage: ERROR_MESSAGES_AZ[code] || ERROR_MESSAGES_AZ.INTERNAL_ERROR,
    ...(extra || {}),
  });
}

function htmlErrorText(code: string) {
  return ERROR_MESSAGES_AZ[code] || ERROR_MESSAGES_AZ.INTERNAL_ERROR;
}

function sanitizeId(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/[<>]/g, "")
    .replace(/\s+/g, "");
}

function safeRentalType(value: unknown): RentalType | "" {
  const normalized = String(value ?? "").trim().toUpperCase();
  if ((ALLOWED_RENTAL_TYPES as readonly string[]).includes(normalized)) {
    return normalized as RentalType;
  }
  return "";
}

function parseIso(value: string) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    const parsed = new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const localDateTime = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
  );
  if (localDateTime) {
    const [, y, m, d, hh, mm, ss] = localDateTime;
    const parsed = new Date(
      Number(y),
      Number(m) - 1,
      Number(d),
      Number(hh),
      Number(mm),
      Number(ss || "0"),
      0
    );
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseMonthStart(value: string): Date | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const shortMatch = raw.match(/^(\d{4})-(\d{2})$/);
  if (shortMatch) {
    const [, y, m] = shortMatch;
    const parsed = new Date(Number(y), Number(m) - 1, 1, 0, 0, 0, 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const fullMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (fullMatch) {
    const [, y, m] = fullMatch;
    const parsed = new Date(Number(y), Number(m) - 1, 1, 0, 0, 0, 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function normalizePhoneToWaId(input: string) {
  const raw = String(input ?? "").trim();
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";

  if (digits.startsWith("994")) return digits;
  if (digits.length === 10 && digits.startsWith("0")) return "994" + digits.slice(1);
  if (digits.length === 9) return "994" + digits;

  return digits;
}

function validateAzWaId(input: string) {
  const waId = normalizePhoneToWaId(input);

  if (!waId) return { ok: false as const, waId: "", error: "PHONE_REQUIRED" };
  if (!/^\d+$/.test(waId)) {
    return { ok: false as const, waId: "", error: "INVALID_PHONE_FORMAT" };
  }
  if (!waId.startsWith("994")) {
    return { ok: false as const, waId: "", error: "PHONE_MUST_BE_AZ_FORMAT" };
  }
  if (waId.length !== 12) {
    return { ok: false as const, waId: "", error: "PHONE_LENGTH_INVALID" };
  }

  return { ok: true as const, waId, error: "" };
}

function isSameWaId(a: unknown, b: unknown) {
  const left = normalizePhoneToWaId(String(a ?? ""));
  const right = normalizePhoneToWaId(String(b ?? ""));
  return !!left && !!right && left === right;
}

function startOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function startOfMonthLocal(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function hasPastLocalDaySelection(start: Date, end: Date, now = new Date()) {
  const todayStart = startOfLocalDay(now).getTime();

  return (
    startOfLocalDay(start).getTime() < todayStart ||
    startOfLocalDay(end).getTime() < todayStart
  );
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function addMonthsLocal(d: Date, months: number) {
  return new Date(d.getFullYear(), d.getMonth() + months, 1, 0, 0, 0, 0);
}

function getMinimumDurationDays(rentalType: RentalType) {
  return MIN_DURATION_DAYS[rentalType] || 1;
}

function normalizeDates(rentalType: RentalType, start: Date, end: Date) {
  const s = new Date(start);
  let e = new Date(end);

  if (rentalType === "HOURLY") {
    if (e.getTime() <= s.getTime()) {
      e = new Date(s.getTime() + 60 * 60 * 1000);
    }
    return { start: s, end: e };
  }

  const sLocal = startOfLocalDay(s);
  let eLocal = startOfLocalDay(e);
  const minimumDays = getMinimumDurationDays(rentalType);

  if (eLocal.getTime() <= sLocal.getTime()) {
    eLocal = addDays(sLocal, minimumDays);
  }

  const actualDays = diffCalendarDays(sLocal, eLocal);
  if (actualDays < minimumDays) {
    eLocal = addDays(sLocal, minimumDays);
  }

  return { start: sLocal, end: eLocal };
}

function diffCalendarDays(start: Date, end: Date) {
  const sUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const eUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  const diffMs = eUtc - sUtc;
  const diffDays = Math.round(diffMs / DAY_MS);
  return Math.max(0, diffDays);
}

function getHourlyDurationHours(start: Date, end: Date) {
  const diffMs = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
}

function toMoneyNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Number(num.toFixed(2));
}

function formatMoneyAz(value: unknown) {
  return `${moneyFormatter.format(toMoneyNumber(value))} AZN`;
}

function getRentalTypeLabel(type: unknown) {
  const normalized = safeRentalType(type);
  switch (normalized) {
    case "HOURLY":
      return "Saatlıq";
    case "DAILY":
      return "Günlük";
    case "WEEKLY":
      return "Həftəlik";
    case "MONTHLY":
      return "Aylıq";
    default:
      return "Naməlum";
  }
}

function getBookingStatusLabel(status: unknown) {
  const normalized = String(status ?? "").trim().toUpperCase();
  switch (normalized) {
    case "PENDING":
      return "Gözləmədə";
    case "APPROVED":
      return "Təsdiqləndi";
    case "REJECTED":
      return "Rədd edildi";
    case "EXPIRED":
      return "Müddəti bitib";
    case "CANCELLED":
      return "Ləğv edildi";
    default:
      return normalized || "Naməlum";
  }
}

function getServiceKeyLabel(serviceKey: unknown) {
  const normalized = String(serviceKey ?? "").trim().toUpperCase();
  switch (normalized) {
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
      return normalizeSafeText(serviceKey, 64) || "Naməlum";
  }
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

function formatDateOnlyAz(d: Date) {
  return `${d.getDate()} ${AZ_MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTimeOnlyAz(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${min}`;
}

function formatDateTimeAz(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${formatDateOnlyAz(d)} saat ${hh}:${min}`;
}

function formatDateKeyLocal(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatBookingIntervalLabel(rentalType: RentalType, start: Date, end: Date) {
  if (rentalType === "HOURLY") {
    const hours = getHourlyDurationHours(start, end);
    return `${formatDateTimeAz(start)} — ${formatDateTimeAz(end)} (${hours} saat)`;
  }

  const days = diffCalendarDays(start, end);
  return `${formatDateOnlyAz(start)} — ${formatDateOnlyAz(end)} (${days} gün)`;
}

function calcPrice(property: BookableProperty, type: RentalType, start: Date, end: Date) {
  if (!property?.pricings?.length) return 0;

  const pricing = property.pricings.find((p) => p.type === type);
  if (!pricing) return 0;

  const unitPrice = toMoneyNumber(pricing.unitPrice, 0);
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) return 0;

  if (type === "HOURLY") {
    const diffHours = getHourlyDurationHours(start, end);
    return toMoneyNumber(diffHours * unitPrice, 0);
  }

  const diffDays = diffCalendarDays(start, end);
  if (diffDays < 1) return 0;

  if (type === "DAILY") return toMoneyNumber(diffDays * unitPrice, 0);
  if (type === "WEEKLY") return toMoneyNumber(Math.ceil(diffDays / 7) * unitPrice, 0);
  if (type === "MONTHLY") return toMoneyNumber(Math.ceil(diffDays / 30) * unitPrice, 0);

  return 0;
}

function hasRentalPricing(property: BookableProperty, type: RentalType): boolean {
  const pricing = property.pricings.find((p) => p.type === type);
  if (!pricing) return false;

  const unitPrice = toMoneyNumber(pricing.unitPrice, 0);
  return Number.isFinite(unitPrice) && unitPrice > 0;
}

function getAvailableRentalTypes(property: BookableProperty): RentalType[] {
  const available = new Set<RentalType>();

  for (const pricing of property.pricings || []) {
    const type = safeRentalType(pricing.type);
    const unitPrice = toMoneyNumber(pricing.unitPrice, 0);

    if (!type) continue;
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) continue;

    available.add(type);
  }

  return ALLOWED_RENTAL_TYPES.filter((type) => available.has(type));
}

function pickInitialRentalType(
  preferredType: string,
  draftType: string,
  availableTypes: RentalType[]
): RentalType {
  const preferred = safeRentalType(preferredType);
  if (preferred && availableTypes.includes(preferred)) {
    return preferred;
  }

  const fromDraft = safeRentalType(draftType);
  if (fromDraft && availableTypes.includes(fromDraft)) {
    return fromDraft;
  }

  if (availableTypes.includes("DAILY")) {
    return "DAILY";
  }

  return availableTypes[0] || "DAILY";
}

function getApprovalExpireHours(property: BookableProperty): number {
  const raw = Number((property as Record<string, unknown>)?.approvalExpireHours);
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  return Math.trunc(raw);
}

function getOptionalDate(value: unknown, key: string): Date | null {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : null;
  if (!record) return null;

  const raw = record[key];
  if (!raw) return null;

  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? null : raw;
  }

  const parsed = new Date(String(raw));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isSubscriptionCurrentlyActive(
  sub:
    | {
      status: string;
      paidUntil: Date | null;
    }
    | null
    | undefined
) {
  if (!sub) return false;
  if (sub.status !== "ACTIVE") return false;
  if (!sub.paidUntil) return false;
  return sub.paidUntil.getTime() > Date.now();
}

function isLegacySubscriptionActive(owner: unknown) {
  const paidUntil = getOptionalDate(owner, "paidUntil");
  return !!paidUntil && paidUntil.getTime() > Date.now();
}

function normalizeSafeText(value: unknown, max = 1000): string | null {
  const raw = String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!raw) return null;
  return raw.slice(0, max);
}

function normalizeSafeMultilineText(value: unknown, max = 1000): string | null {
  const raw = String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();

  if (!raw) return null;
  return raw.slice(0, max);
}

function normalizeSafeMediaUrl(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (raw.length > 2048) return null;
  if (/[\u0000-\u001F\u007F<>"'`]/.test(raw)) return null;
  if (/^(javascript|data|vbscript):/i.test(raw)) return null;

  if (raw.startsWith("/")) {
    return raw;
  }

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getOwnerVisibilityFromBookingStatus(status: string): BookingVisibility {
  return String(status || "").toUpperCase() === "APPROVED" ? "FULL" : "LIMITED";
}

function serializeOwnerExposure(
  owner: Record<string, unknown> | null | undefined,
  visibility: BookingVisibility
) {
  const avatar = normalizeSafeMediaUrl(owner?.profilePhotoUrl);
  const bio = normalizeSafeMultilineText(owner?.bio, 1000);
  const name = normalizeSafeText(owner?.name, 160);

  if (visibility === "FULL") {
    return {
      visibility,
      profilePhotoUrl: avatar,
      bio,
      name,
      phone: normalizeSafeText(owner?.phone, 64),
      email: normalizeSafeText(owner?.email, 254),
    };
  }

  return {
    visibility,
    profilePhotoUrl: avatar,
    bio,
    name,
    phone: null,
    email: null,
  };
}

function serializePropertySummary(property: {
  id: string;
  title?: string | null;
  city?: string | null;
  areaName?: string | null;
  location?: string | null;
  locationLabel?: string | null;
  rulesText?: string | null;
  service?: { key?: string | null } | null;
}) {
  const location = normalizeSafeText(property.location, 255);
  const locationLabel =
    normalizeSafeText((property as Record<string, unknown>)?.locationLabel, 255) || location;

  return {
    id: property.id,
    title: normalizeSafeText(property.title, 160),
    city: normalizeSafeText(property.city, 120),
    areaName: normalizeSafeText(property.areaName, 160),
    location,
    locationLabel,
    rulesText: normalizeSafeMultilineText((property as Record<string, unknown>)?.rulesText, 2000),
    serviceKey: normalizeSafeText(property.service?.key, 64),
  };
}

function resolveEffectiveBookingStatus(status: unknown, expiresAt: Date | null): string {
  const normalizedStatus = String(status ?? "").trim().toUpperCase();

  if (normalizedStatus === "PENDING" && expiresAt && expiresAt.getTime() <= Date.now()) {
    return "EXPIRED";
  }

  return normalizedStatus || "PENDING";
}

function buildBookingForUserPayload(params: {
  id: string;
  status: string;
  rentalType: RentalType;
  startAt: Date;
  endAt: Date;
  totalPrice: unknown;
  depositPrice: unknown;
  expiresAt: Date | null;
  property: BookableProperty | BookingWithExposure["property"];
  owner: Record<string, unknown> | null | undefined;
}) {
  const effectiveStatus = resolveEffectiveBookingStatus(params.status, params.expiresAt);
  const visibility = getOwnerVisibilityFromBookingStatus(effectiveStatus);
  const totalPrice = toMoneyNumber(params.totalPrice, 0);
  const depositPrice = toMoneyNumber(params.depositPrice, 0);

  return {
    id: params.id,
    status: effectiveStatus,
    statusLabel: getBookingStatusLabel(effectiveStatus),
    rentalType: params.rentalType,
    rentalTypeLabel: getRentalTypeLabel(params.rentalType),
    startAt: params.startAt,
    endAt: params.endAt,
    intervalLabel: formatBookingIntervalLabel(params.rentalType, params.startAt, params.endAt),
    totalPrice,
    price: totalPrice,
    priceLabel: formatMoneyAz(totalPrice),
    depositPrice,
    depositPriceLabel: formatMoneyAz(depositPrice),
    expiresAt: params.expiresAt,
    property: serializePropertySummary(params.property),
    owner: serializeOwnerExposure(params.owner, visibility),
  };
}

function serializeBookingForUser(booking: BookingWithExposure) {
  return buildBookingForUserPayload({
    id: booking.id,
    status: booking.status,
    rentalType: booking.rentalType as RentalType,
    startAt: booking.startAt,
    endAt: booking.endAt,
    totalPrice: booking.totalPrice,
    depositPrice: booking.depositPrice,
    expiresAt: booking.expiresAt,
    property: booking.property,
    owner: booking.property?.owner as Record<string, unknown>,
  });
}

function getDateRangeOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  const start = new Date(Math.max(startA.getTime(), startB.getTime()));
  const end = new Date(Math.min(endA.getTime(), endB.getTime()));
  if (end.getTime() <= start.getTime()) return null;
  return { start, end };
}

function getAvailabilityRangeStatusLabel(isOwnBooking: boolean, status: string) {
  return isOwnBooking ? getBookingStatusLabel(status) : "Status məlumatı gizlidir";
}

function getAvailabilitySlotDetailLabel(params: {
  isOwnBooking: boolean;
  rentalType: RentalType;
  status: string;
  intervalLabel: string;
}) {
  if (params.isOwnBooking) {
    return `Sizin bron sorğunuz • ${getBookingStatusLabel(params.status)} • ${getRentalTypeLabel(
      params.rentalType
    )} • ${params.intervalLabel}`;
  }

  return `Bu zaman aralığı artıq bron edilib.`;
}

async function withTimeout<T>(
  promise: Promise<T>,
  label: string,
  ms = DB_TIMEOUT_MS
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function enqueueOutboundText(to: string, text: string) {
  await prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: {
        direction: "OUTBOUND",
        status: "SEND_REQUESTED",
        waId: to,
        type: "text",
        body: text,
      },
    });

    await tx.messageJob.create({
      data: {
        messageId: message.id,
        type: "SEND_OUTBOUND",
        state: "PENDING",
        attempts: 0,
      },
    });
  });
}

async function safeEnqueueOutboundText(to: string, text: string) {
  try {
    await enqueueOutboundText(to, text);
  } catch (e) {
    console.error("[booking] enqueueOutboundText failed:", e);
  }
}

async function rememberOwnerPendingBooking(ownerWaId: string, bookingId: string, expiresAt: Date) {
  const now = new Date();

  const conv = await prisma.conversationLock.findUnique({
    where: { waId: ownerWaId },
    select: { data: true },
  });

  const pendingData = {
    bookingId,
    createdAt: now.getTime(),
  } as Prisma.JsonObject;

  if (conv) {
    const currentData =
      conv.data && typeof conv.data === "object"
        ? (conv.data as Prisma.JsonObject)
        : ({} as Prisma.JsonObject);

    const nextData = {
      ...currentData,
      __ownerPendingBooking: pendingData,
    } as Prisma.JsonObject;

    await prisma.conversationLock.update({
      where: { waId: ownerWaId },
      data: {
        data: nextData as Prisma.InputJsonValue,
        expiresAt,
        lockedAt: now,
      },
    });
    return;
  }

  await prisma.conversationLock.create({
    data: {
      waId: ownerWaId,
      state: null,
      data: {
        __ownerPendingBooking: pendingData,
      } as Prisma.InputJsonValue,
      expiresAt,
      lockedAt: now,
    },
  });
}

async function safeRememberOwnerPendingBooking(
  ownerWaId: string,
  bookingId: string,
  expiresAt: Date
) {
  try {
    await rememberOwnerPendingBooking(ownerWaId, bookingId, expiresAt);
  } catch (e) {
    console.error("[booking] rememberOwnerPendingBooking failed:", e);
  }
}

async function notifyOwnerAboutNewBooking(params: {
  ownerWaId: string;
  property: ReturnType<typeof serializePropertySummary>;
  rentalType: RentalType;
  startAt: Date;
  endAt: Date;
  price: number;
  bookingId: string;
  expiresAt: Date;
}) {
  const title = params.property.title || params.property.id;
  const locationLine = buildLocationLine(params.property);

  const message = [
    "Yeni bron sorğusu",
    `Elan: ${title}`,
    `Məkan: ${locationLine}`,
    `İcarə növü: ${getRentalTypeLabel(params.rentalType)}`,
    `Tarix / saat aralığı: ${formatBookingIntervalLabel(params.rentalType, params.startAt, params.endAt)}`,
    `Qiymət: ${formatMoneyAz(params.price)}`,
    "Qeyd: Müştərinin əlaqə məlumatları təsdiqədək gizli saxlanılır.",
    "Qərar vermək üçün aşağıdakı mətnlərdən birini yazın:",
    "• Təsdiq et",
    "• Rədd et",
  ].join("\n");

  try {
    await enqueueOutboundText(params.ownerWaId, message);
    await rememberOwnerPendingBooking(params.ownerWaId, params.bookingId, params.expiresAt);
  } catch (e) {
    console.error("[booking] notifyOwnerAboutNewBooking failed:", e);
  }
}

async function getBookableProperty(propertyId: string): Promise<BookableProperty | null> {
  if (!propertyId) return null;

  return withTimeout(
    prisma.property.findFirst({
      where: {
        id: propertyId,
        isVisible: true,
      },
      include: {
        pricings: true,
        owner: true,
        service: {
          select: {
            id: true,
            key: true,
            isActive: true,
          },
        },
      },
    }),
    `getBookableProperty(${propertyId})`
  );
}

async function resolveServiceForProperty(
  property: BookableProperty
): Promise<{ id: string; key: string; isActive: boolean } | null> {
  if (property.service?.id) {
    return property.service;
  }

  const rawServiceId = String((property as Record<string, unknown>)?.serviceId ?? "").trim();
  if (!rawServiceId) return null;

  return withTimeout(
    prisma.service.findUnique({
      where: { id: rawServiceId },
      select: {
        id: true,
        key: true,
        isActive: true,
      },
    }),
    `resolveServiceForProperty(${property.id})`
  );
}

async function ensurePropertyBookable(
  property: BookableProperty
): Promise<PropertyBookabilityResult> {
  if (!property?.isVisible) {
    return {
      ok: false,
      reason: "PROPERTY_NOT_VISIBLE",
      service: null,
    };
  }

  const resolvedService = await resolveServiceForProperty(property).catch(() => null);

  if (!property.owner?.id) {
    console.warn(`[booking] compat allow: owner missing for propertyId=${property.id}`);
    return {
      ok: true,
      reason: "OWNER_SUBSCRIPTION_COMPAT_ALLOW",
      service: resolvedService,
    };
  }

  if (!resolvedService?.id) {
    console.warn(`[booking] compat allow: service missing for propertyId=${property.id}`);
    return {
      ok: true,
      reason: "OWNER_SUBSCRIPTION_COMPAT_ALLOW",
      service: null,
    };
  }

  if (!resolvedService.isActive) {
    console.warn(
      `[booking] compat allow: service inactive for propertyId=${property.id} serviceId=${resolvedService.id}`
    );
    return {
      ok: true,
      reason: "OWNER_SUBSCRIPTION_COMPAT_ALLOW",
      service: resolvedService,
    };
  }

  const sub = await withTimeout(
    prisma.ownerSubscription.findUnique({
      where: {
        ownerId_serviceId: {
          ownerId: property.owner.id,
          serviceId: resolvedService.id,
        },
      },
      select: {
        status: true,
        paidUntil: true,
      },
    }),
    `ensurePropertyBookable.ownerSubscription(${property.id})`
  ).catch(() => null);

  if (isSubscriptionCurrentlyActive(sub)) {
    return {
      ok: true,
      reason: "OWNER_SUBSCRIPTION_ACTIVE",
      service: resolvedService,
    };
  }

  if (isLegacySubscriptionActive(property.owner)) {
    return {
      ok: true,
      reason: "OWNER_SUBSCRIPTION_LEGACY_ACTIVE",
      service: resolvedService,
    };
  }

  console.warn(
    `[booking] compat allow without active subscription. propertyId=${property.id} ownerId=${property.owner.id} serviceId=${resolvedService.id}`
  );

  return {
    ok: true,
    reason: "OWNER_SUBSCRIPTION_COMPAT_ALLOW",
    service: resolvedService,
  };
}

function buildLocationLine(property: {
  city?: string | null;
  areaName?: string | null;
  locationLabel?: string | null;
  location?: string | null;
}) {
  const cityArea = [property.city, property.areaName].filter(Boolean).join(" — ");
  const locationLabel = property.locationLabel || property.location || "";
  if (cityArea && locationLabel) return `${cityArea} • ${locationLabel}`;
  return cityArea || locationLabel || "Məlumat yoxdur";
}

function buildCustomerCreatedBookingMessage(params: {
  property: ReturnType<typeof serializePropertySummary>;
  rentalType: RentalType;
  startAt: Date;
  endAt: Date;
  price: number;
  expireHours: number;
}) {
  const title = params.property.title || params.property.id;
  const locationLine = buildLocationLine(params.property);

  return [
    "Bron sorğunuz yaradıldı.",
    `Elan: ${title}`,
    `Məkan: ${locationLine}`,
    `İcarə növü: ${getRentalTypeLabel(params.rentalType)}`,
    `Tarix / saat aralığı: ${formatBookingIntervalLabel(params.rentalType, params.startAt, params.endAt)}`,
    `Qiymət: ${formatMoneyAz(params.price)}`,
    params.property.rulesText ? `Elan haqqında:\n${params.property.rulesText}` : null,
    `Status: ${getBookingStatusLabel("PENDING")}`,
    `Cavab müddəti: ${params.expireHours} saat`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function resolveBookingContextFromRequest(
  req: Request,
  options?: { allowDirectWithoutPhone?: boolean }
): Promise<
  | {
    ok: false;
    response: Response;
    code: string;
    status: number;
  }
  | {
    ok: true;
    property: BookableProperty;
    propertyId: string;
    draftId: string;
    phone: string;
  }
> {
  const draftId = sanitizeId(req.query?.draftId ?? req.body?.draftId);
  let propertyId = sanitizeId(req.query?.propertyId ?? req.body?.propertyId);
  let phone = String(req.query?.phone ?? req.body?.phone ?? "").trim();

  if ((!propertyId || !phone) && draftId) {
    const draft = await withTimeout(
      prisma.bookingDraft.findUnique({
        where: { id: draftId },
        select: {
          expiresAt: true,
          waId: true,
          propertyId: true,
        },
      }),
      `bookingDraft.findUnique(${draftId})`
    );

    if (!draft) {
      return {
        ok: false,
        response: req.res as Response,
        code: "DRAFT_NOT_FOUND",
        status: 404,
      };
    }

    if (draft.expiresAt.getTime() <= Date.now()) {
      return {
        ok: false,
        response: req.res as Response,
        code: "DRAFT_EXPIRED",
        status: 410,
      };
    }

    propertyId = draft.propertyId;
    phone = draft.waId;
  }

  if (!propertyId) {
    return {
      ok: false,
      response: req.res as Response,
      code: "PROPERTY_ID_REQUIRED",
      status: 400,
    };
  }

  if (!options?.allowDirectWithoutPhone) {
    if (!phone) {
      return {
        ok: false,
        response: req.res as Response,
        code: "PHONE_REQUIRED",
        status: 400,
      };
    }

    const phoneCheck = validateAzWaId(phone);
    if (!phoneCheck.ok) {
      return {
        ok: false,
        response: req.res as Response,
        code: phoneCheck.error,
        status: 400,
      };
    }

    phone = phoneCheck.waId;
  }

  const property = await getBookableProperty(propertyId);
  if (!property) {
    return {
      ok: false,
      response: req.res as Response,
      code: "PROPERTY_NOT_FOUND",
      status: 404,
    };
  }

  const propertyBookability = await ensurePropertyBookable(property);
  if (!propertyBookability.ok) {
    console.warn(
      `[booking] PROPERTY_UNAVAILABLE on resolve context. propertyId=${property.id} reason=${propertyBookability.reason}`
    );

    return {
      ok: false,
      response: req.res as Response,
      code: "PROPERTY_UNAVAILABLE",
      status: 409,
    };
  }

  return {
    ok: true,
    property,
    propertyId,
    draftId,
    phone,
  };
}

bookingRouter.post("/create", async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};

    const draftId = sanitizeId(body.draftId);
    let propertyId = sanitizeId(body.propertyId);
    let phone = String(body.phone ?? "").trim();

    const rentalType = safeRentalType(body.rentalType);
    const startAtRaw = String(body.startAt ?? "").trim();
    const endAtRaw = String(body.endAt ?? "").trim();

    if (!startAtRaw || !endAtRaw) return sendError(res, "DATES_REQUIRED");
    if (!rentalType) return sendError(res, "INVALID_RENTAL_TYPE");

    const startParsed = parseIso(startAtRaw);
    const endParsed = parseIso(endAtRaw);
    if (!startParsed || !endParsed) return sendError(res, "INVALID_DATE_FORMAT");

    if ((!propertyId || !phone) && draftId) {
      const draft = await withTimeout(
        prisma.bookingDraft.findUnique({
          where: { id: draftId },
          select: {
            expiresAt: true,
            waId: true,
            propertyId: true,
          },
        }),
        `bookingDraft.findUnique(${draftId})`
      );

      if (!draft) return sendError(res, "DRAFT_NOT_FOUND", 404);
      if (draft.expiresAt.getTime() <= Date.now()) return sendError(res, "DRAFT_EXPIRED", 410);

      propertyId = draft.propertyId;
      phone = draft.waId;
    }

    if (!propertyId) return sendError(res, "PROPERTY_ID_REQUIRED");
    if (!phone) return sendError(res, "PHONE_REQUIRED");

    const phoneCheck = validateAzWaId(phone);
    if (!phoneCheck.ok) return sendError(res, phoneCheck.error);
    const waId = phoneCheck.waId;

    const { start, end } = normalizeDates(rentalType, startParsed, endParsed);

    if (hasPastLocalDaySelection(start, end)) {
      return sendError(res, "PAST_DATES_NOT_ALLOWED");
    }

    if (end.getTime() <= start.getTime()) return sendError(res, "END_MUST_BE_AFTER_START");

    const property = await getBookableProperty(propertyId);
    if (!property) return sendError(res, "PROPERTY_NOT_FOUND", 404);

    const propertyBookability = await ensurePropertyBookable(property);
    if (!propertyBookability.ok) {
      console.warn(
        `[booking] PROPERTY_UNAVAILABLE on create. propertyId=${property.id} reason=${propertyBookability.reason}`
      );

      return sendError(res, "PROPERTY_UNAVAILABLE", 409, {
        reason: propertyBookability.reason,
      });
    }

    if (!hasRentalPricing(property, rentalType)) {
      return sendError(res, "PRICING_NOT_AVAILABLE", 409);
    }

    const expireHours = getApprovalExpireHours(property);
    const price = calcPrice(property, rentalType, start, end);

    if (!Number.isFinite(price) || price <= 0) {
      return sendError(res, "PRICE_CALCULATION_FAILED", 409);
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expireHours * 60 * 60 * 1000);

    const createResult = await withTimeout(
      prisma.$transaction(
        async (tx) => {
          const duplicate = await tx.booking.findFirst({
            where: {
              propertyId,
              customerPhone: waId,
              rentalType,
              startAt: start,
              endAt: end,
              OR: [
                { status: "APPROVED" as never },
                {
                  status: "PENDING" as never,
                  expiresAt: { gt: now },
                },
              ],
            },
            select: { id: true },
          });

          if (duplicate) {
            return {
              kind: "duplicate" as const,
              bookingId: duplicate.id,
            };
          }

          const conflict = await tx.booking.findFirst({
            where: {
              propertyId,
              OR: [
                { status: "APPROVED" as never },
                {
                  status: "PENDING" as never,
                  expiresAt: { gt: now },
                },
              ],
              AND: [{ startAt: { lt: end } }, { endAt: { gt: start } }],
            },
            select: { id: true },
          });

          if (conflict) {
            return {
              kind: "conflict" as const,
            };
          }

          const booking = await tx.booking.create({
            data: {
              propertyId,
              customerPhone: waId,
              rentalType,
              startAt: start,
              endAt: end,
              totalPrice: price,
              depositPrice: 0,
              status: "PENDING",
              expiresAt,
            },
            select: { id: true },
          });

          return {
            kind: "created" as const,
            bookingId: booking.id,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }
      ),
      `booking.create.transaction(${propertyId})`
    );

    if (createResult.kind === "duplicate") {
      const existingBooking = await withTimeout(
        prisma.booking.findUnique({
          where: { id: createResult.bookingId },
          include: {
            property: {
              include: {
                owner: true,
                service: {
                  select: {
                    id: true,
                    key: true,
                    isActive: true,
                  },
                },
              },
            },
          },
        }),
        `booking.findUnique(duplicate:${createResult.bookingId})`
      );

      const duplicateBookingPayload = existingBooking
        ? serializeBookingForUser(existingBooking)
        : buildBookingForUserPayload({
          id: createResult.bookingId,
          status: "PENDING",
          rentalType,
          startAt: start,
          endAt: end,
          totalPrice: price,
          depositPrice: 0,
          expiresAt,
          property,
          owner: property.owner as Record<string, unknown>,
        });

      return res.json({
        ok: true,
        duplicate: true,
        code: "BOOKING_ALREADY_EXISTS",
        message: "BOOKING_ALREADY_EXISTS",
        userMessage: ERROR_MESSAGES_AZ.BOOKING_ALREADY_EXISTS,
        bookingId: createResult.bookingId,
        price: duplicateBookingPayload.price,
        priceLabel: duplicateBookingPayload.priceLabel,
        booking: duplicateBookingPayload,
      });
    }

    if (createResult.kind === "conflict") {
      return sendError(res, "DATES_TAKEN", 409);
    }

    const propertySummary = serializePropertySummary(property);
    const ownerWaId = normalizePhoneToWaId(String(property.owner?.phone ?? ""));

    if (ownerWaId) {
      void notifyOwnerAboutNewBooking({
        ownerWaId,
        property: propertySummary,
        rentalType,
        startAt: start,
        endAt: end,
        price,
        bookingId: createResult.bookingId,
        expiresAt,
      });
    } else {
      void safeRememberOwnerPendingBooking("", createResult.bookingId, expiresAt);
    }

    void safeEnqueueOutboundText(
      waId,
      buildCustomerCreatedBookingMessage({
        property: propertySummary,
        rentalType,
        startAt: start,
        endAt: end,
        price,
        expireHours,
      })
    );

    const bookingPayload = buildBookingForUserPayload({
      id: createResult.bookingId,
      status: "PENDING",
      rentalType,
      startAt: start,
      endAt: end,
      totalPrice: price,
      depositPrice: 0,
      expiresAt,
      property,
      owner: property.owner as Record<string, unknown>,
    });

    return res.json({
      ok: true,
      duplicate: false,
      code: "BOOKING_CREATED",
      message: "BOOKING_CREATED",
      userMessage: "Bron sorğunuz yaradıldı.",
      bookingId: createResult.bookingId,
      price: bookingPayload.price,
      priceLabel: bookingPayload.priceLabel,
      booking: bookingPayload,
    });
  } catch (e) {
    console.error("[booking] create error:", e);
    return sendError(res, "INTERNAL_ERROR", 500);
  }
});

bookingRouter.post("/draft/create", async (req: Request, res: Response) => {
  try {
    const propertyId = sanitizeId(req.body?.propertyId);
    const phone = String(req.body?.phone ?? "").trim();
    const rentalType = safeRentalType(req.body?.rentalType);

    if (!propertyId) return sendError(res, "PROPERTY_ID_REQUIRED");
    if (!phone) return sendError(res, "PHONE_REQUIRED");

    const phoneCheck = validateAzWaId(phone);
    if (!phoneCheck.ok) return sendError(res, phoneCheck.error);
    const waId = phoneCheck.waId;

    const property = await getBookableProperty(propertyId);
    if (!property) return sendError(res, "PROPERTY_NOT_FOUND", 404);

    const propertyBookability = await ensurePropertyBookable(property);
    if (!propertyBookability.ok) {
      console.warn(
        `[booking] PROPERTY_UNAVAILABLE on draft/create. propertyId=${property.id} reason=${propertyBookability.reason}`
      );

      return sendError(res, "PROPERTY_UNAVAILABLE", 409, {
        reason: propertyBookability.reason,
      });
    }

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const draft = await withTimeout(
      prisma.bookingDraft.create({
        data: {
          waId,
          propertyId,
          ...(rentalType ? { rentalType } : {}),
          expiresAt,
        },
        select: { id: true, expiresAt: true },
      }),
      `bookingDraft.create(${propertyId})`
    );

    return res.json({
      ok: true,
      draftId: draft.id,
      expiresAt: draft.expiresAt,
      property: serializePropertySummary(property),
      owner: serializeOwnerExposure(property.owner as Record<string, unknown>, "LIMITED"),
    });
  } catch (e) {
    console.error("[booking] draft/create error:", e);
    return sendError(res, "INTERNAL_ERROR", 500);
  }
});

bookingRouter.get("/availability", async (req: Request, res: Response) => {
  try {
    const context = await resolveBookingContextFromRequest(req);

    if (!context.ok) {
      return sendError(res, context.code, context.status);
    }

    const monthStart =
      parseMonthStart(String(req.query?.month ?? "").trim()) || startOfMonthLocal(new Date());
    const monthEnd = addMonthsLocal(monthStart, 1);
    const now = new Date();

    const rawBookings = await withTimeout(
      prisma.booking.findMany({
        where: {
          propertyId: context.property.id,
          OR: [
            { status: "APPROVED" as never },
            {
              status: "PENDING" as never,
              expiresAt: { gt: now },
            },
          ],
          AND: [{ startAt: { lt: monthEnd } }, { endAt: { gt: monthStart } }],
        },
        orderBy: [{ startAt: "asc" }],
        select: {
          id: true,
          status: true,
          rentalType: true,
          customerPhone: true,
          startAt: true,
          endAt: true,
          expiresAt: true,
        },
      }),
      `booking.availability.findMany(${context.property.id},${formatDateKeyLocal(monthStart)})`
    );

    const blockedDateKeys = new Set<string>();
    const blockedSlotsByDate: Record<
      string,
      Array<{
        bookingId: string | null;
        isOwnBooking: boolean;
        rentalType: RentalType;
        rentalTypeLabel: string;
        status: string | null;
        statusLabel: string;
        startAt: string;
        endAt: string;
        startMinutes: number;
        endMinutes: number;
        isAllDay: boolean;
        label: string;
        detailLabel: string;
      }>
    > = {};
    const bookedRanges: Array<{
      bookingId: string | null;
      isOwnBooking: boolean;
      rentalType: RentalType;
      rentalTypeLabel: string;
      status: string | null;
      statusLabel: string;
      startAt: string;
      endAt: string;
      intervalLabel: string;
    }> = [];

    for (const booking of rawBookings) {
      const bookingRentalType = safeRentalType(booking.rentalType) || "DAILY";
      const intervalLabel = formatBookingIntervalLabel(
        bookingRentalType,
        booking.startAt,
        booking.endAt
      );
      const isOwnBooking = isSameWaId(booking.customerPhone, context.phone);

      bookedRanges.push({
        bookingId: isOwnBooking ? booking.id : null,
        isOwnBooking,
        rentalType: bookingRentalType,
        rentalTypeLabel: getRentalTypeLabel(bookingRentalType),
        status: isOwnBooking ? booking.status : null,
        statusLabel: getAvailabilityRangeStatusLabel(isOwnBooking, booking.status),
        startAt: booking.startAt.toISOString(),
        endAt: booking.endAt.toISOString(),
        intervalLabel,
      });

      const clippedRange = getDateRangeOverlap(booking.startAt, booking.endAt, monthStart, monthEnd);
      if (!clippedRange) continue;

      let dayCursor = startOfLocalDay(clippedRange.start);

      while (dayCursor.getTime() < clippedRange.end.getTime()) {
        const dayStart = new Date(dayCursor);
        const dayEnd = addDays(dayStart, 1);
        const dayOverlap = getDateRangeOverlap(booking.startAt, booking.endAt, dayStart, dayEnd);

        if (dayOverlap) {
          const dayKey = formatDateKeyLocal(dayStart);
          blockedDateKeys.add(dayKey);

          const startMinutes = Math.max(
            0,
            Math.round((dayOverlap.start.getTime() - dayStart.getTime()) / (1000 * 60))
          );
          const endMinutes = Math.min(
            1440,
            Math.round((dayOverlap.end.getTime() - dayStart.getTime()) / (1000 * 60))
          );
          const isAllDay =
            startMinutes === 0 &&
            (endMinutes === 1440 || dayOverlap.end.getTime() === dayEnd.getTime());

          const timeLabel = isAllDay
            ? "Bütün gün bron edilib"
            : `${formatTimeOnlyAz(dayOverlap.start)} — ${endMinutes >= 1440 ? "24:00" : formatTimeOnlyAz(dayOverlap.end)
            } bron edilib`;

          if (!Array.isArray(blockedSlotsByDate[dayKey])) {
            blockedSlotsByDate[dayKey] = [];
          }

          blockedSlotsByDate[dayKey].push({
            bookingId: isOwnBooking ? booking.id : null,
            isOwnBooking,
            rentalType: bookingRentalType,
            rentalTypeLabel: getRentalTypeLabel(bookingRentalType),
            status: isOwnBooking ? booking.status : null,
            statusLabel: getAvailabilityRangeStatusLabel(isOwnBooking, booking.status),
            startAt: dayOverlap.start.toISOString(),
            endAt: dayOverlap.end.toISOString(),
            startMinutes,
            endMinutes: Math.max(startMinutes + 1, endMinutes),
            isAllDay,
            label: timeLabel,
            detailLabel: getAvailabilitySlotDetailLabel({
              isOwnBooking,
              rentalType: bookingRentalType,
              status: booking.status,
              intervalLabel,
            }),
          });
        }

        dayCursor = dayEnd;
      }
    }

    for (const dayKey of Object.keys(blockedSlotsByDate)) {
      blockedSlotsByDate[dayKey].sort((a, b) => {
        if (a.startMinutes !== b.startMinutes) return a.startMinutes - b.startMinutes;
        return a.endMinutes - b.endMinutes;
      });
    }

    bookedRanges.sort((a, b) => a.startAt.localeCompare(b.startAt));

    return res.json({
      ok: true,
      propertyId: context.property.id,
      requesterPhone: context.phone,
      monthStart: monthStart.toISOString(),
      monthEnd: monthEnd.toISOString(),
      blockedDateKeys: [...blockedDateKeys].sort(),
      blockedSlotsByDate,
      bookedRanges,
      notice:
        "Təqvimdə qırmızı ilə işarələnmiş tarix və zaman aralıqları artıq bron edilib. Zəhmət olmasa yalnız boş zaman aralıqlarından seçim edin.",
    });
  } catch (e) {
    console.error("[booking] availability error:", e);
    return sendError(res, "INTERNAL_ERROR", 500);
  }
});

bookingRouter.get("/webapp", async (req: Request, res: Response) => {
  try {
    const draftId = sanitizeId(req.query?.draftId);
    const propertyId = sanitizeId(req.query?.propertyId);
    const phone = String(req.query?.phone ?? "").trim();

    const rentalTypeQ = safeRentalType(req.query?.rentalType);
    const preferredRentalType = rentalTypeQ || "";

    if (!draftId && (!propertyId || !phone)) {
      return res
        .status(400)
        .send(
          "Parametrlər çatışmır. ?draftId=... və ya ?propertyId=...&phone=9945XXXXXXXXX formatından istifadə edin."
        );
    }

    let defaultTypeFromDraft = "";
    let resolvedProperty: BookableProperty | null = null;

    if (draftId) {
      const draft = await withTimeout(
        prisma.bookingDraft.findUnique({
          where: { id: draftId },
          select: { expiresAt: true, rentalType: true, propertyId: true },
        }),
        `bookingDraft.findUnique(${draftId})`
      );

      if (!draft) return res.status(404).send(htmlErrorText("DRAFT_NOT_FOUND"));
      if (draft.expiresAt.getTime() <= Date.now()) {
        return res.status(410).send(htmlErrorText("DRAFT_EXPIRED"));
      }

      const property = await getBookableProperty(draft.propertyId);
      if (!property) return res.status(404).send(htmlErrorText("PROPERTY_NOT_FOUND"));

      const propertyBookability = await ensurePropertyBookable(property);
      if (!propertyBookability.ok) {
        console.warn(
          `[booking] webapp unavailable via draft. propertyId=${property.id} reason=${propertyBookability.reason}`
        );
        return res.status(409).send(htmlErrorText("PROPERTY_UNAVAILABLE"));
      }

      defaultTypeFromDraft = safeRentalType(draft.rentalType) || "";
      resolvedProperty = property;
    } else {
      const phoneCheck = validateAzWaId(phone);
      if (!phoneCheck.ok) return res.status(400).send(htmlErrorText(phoneCheck.error));

      const property = await getBookableProperty(propertyId);
      if (!property) return res.status(404).send(htmlErrorText("PROPERTY_NOT_FOUND"));

      const propertyBookability = await ensurePropertyBookable(property);
      if (!propertyBookability.ok) {
        console.warn(
          `[booking] webapp unavailable direct. propertyId=${property.id} reason=${propertyBookability.reason}`
        );
        return res.status(409).send(htmlErrorText("PROPERTY_UNAVAILABLE"));
      }

      resolvedProperty = property;
    }

    const availableRentalTypes = getAvailableRentalTypes(resolvedProperty);
    if (availableRentalTypes.length < 1) {
      return res.status(409).send(htmlErrorText("PRICING_NOT_AVAILABLE"));
    }

    const initialRentalType = pickInitialRentalType(
      preferredRentalType,
      defaultTypeFromDraft,
      availableRentalTypes
    );

    const rentalTypeOptionsHtml = availableRentalTypes
      .map(
        (type) =>
          `<option value="${escapeHtml(type)}"${type === initialRentalType ? " selected" : ""
          }>${escapeHtml(getRentalTypeLabel(type))}</option>`
      )
      .join("");

    const ownerPreview = serializeOwnerExposure(
      resolvedProperty?.owner as Record<string, unknown>,
      "LIMITED"
    );
    const propertySummary = serializePropertySummary(resolvedProperty);
    const approvalExpireHours = getApprovalExpireHours(resolvedProperty);
    const pricingMap = Object.fromEntries(
      availableRentalTypes.map((type) => {
        const pricing = resolvedProperty!.pricings.find((item) => item.type === type);
        return [type, pricing ? toMoneyNumber(pricing.unitPrice, 0) : 0];
      })
    );
    const pricingLabelMap = Object.fromEntries(
      availableRentalTypes.map((type) => [type, formatMoneyAz(pricingMap[type])])
    );
    const propertyLocationLine = buildLocationLine(propertySummary);
    const propertyTitle = propertySummary.title || propertySummary.id;
    const propertyServiceLabel = getServiceKeyLabel(propertySummary.serviceKey);
    const ownerName = ownerPreview.name || "Elan sahibi";
    const ownerBioHtml = ownerPreview.bio
      ? escapeHtml(ownerPreview.bio).replace(/\n/g, "<br/>")
      : "Elan sahibi haqqında məlumat hələ əlavə edilməyib.";
    const propertyBioHtml = propertySummary.rulesText
      ? escapeHtml(propertySummary.rulesText).replace(/\n/g, "<br/>")
      : "Elan haqqında məlumat əlavə edilməyib.";
    const pricingListHtml = availableRentalTypes
      .map((type) => {
        const unitLabel =
          type === "HOURLY"
            ? "/ saat"
            : type === "DAILY"
              ? "/ gün"
              : type === "WEEKLY"
                ? "/ 7 gün"
                : "/ 30 gün";
        return `<div class="meta-item"><span>${escapeHtml(getRentalTypeLabel(type))}</span><strong>${escapeHtml(
          `${pricingLabelMap[type]} ${unitLabel}`
        )}</strong></div>`;
      })
      .join("");

    const propertyCardHtml = `
      <div class="card">
        <div class="section-kicker">Elan məlumatı</div>
        <div class="meta-grid">
          <div class="meta-item"><span>Elan</span><strong>${escapeHtml(propertyTitle)}</strong></div>
          <div class="meta-item"><span>Məkan</span><strong>${escapeHtml(propertyLocationLine)}</strong></div>
          <div class="meta-item"><span>Xidmət</span><strong>${escapeHtml(
      propertyServiceLabel
    )}</strong></div>
          <div class="meta-item"><span>Cavab müddəti</span><strong>${escapeHtml(
      `${approvalExpireHours} saat`
    )}</strong></div>
          ${pricingListHtml}
        </div>
        <div class="owner-bio">${propertyBioHtml}</div>
      </div>
    `;

    const ownerPreviewHtml = `
      <div class="card owner-card">
        <div class="section-kicker">Elan sahibi</div>
        <div class="owner-row">
          ${ownerPreview.profilePhotoUrl
        ? `<img class="owner-avatar" src="${escapeHtml(
          ownerPreview.profilePhotoUrl
        )}" alt="Elan sahibinin profil şəkli" />`
        : `<div class="owner-avatar owner-avatar-fallback">${escapeHtml(
          ownerName.slice(0, 1).toUpperCase()
        )}</div>`
      }
          <div class="owner-main">
            <div class="owner-name">${escapeHtml(ownerName)}</div>
            <div class="owner-title">Əlaqə məlumatları bron təsdiqləndikdən sonra açılır.</div>
          </div>
        </div>
        <div class="owner-bio">${ownerBioHtml}</div>
      </div>
    `;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Bron sorğusu</title>
    <style>
      :root{
        --bg:#ffffff; --card:#ffffff; --text:#111111; --muted:#666666; --line:#eaeaea;
        --btn:#111111; --btnText:#ffffff; --ok:#0a7a2f; --err:#b00020; --soft:#fafafa; --accent:#0f172a;
        --radius:16px;
      }
      *{ box-sizing:border-box; }
      body{
        margin:0; background:var(--bg); color:var(--text);
        font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
      }
      .wrap{ max-width:760px; margin:0 auto; padding:20px 16px 32px; }
      h1{ font-size:24px; margin:8px 0 6px; }
      .sub{ color:var(--muted); font-size:13px; line-height:1.45; }
      .card{
        margin-top:14px; background:var(--card); border:1px solid var(--line);
        border-radius:var(--radius); padding:14px;
      }
      .section-kicker{
        font-size:11px; text-transform:uppercase; letter-spacing:.08em;
        color:var(--muted); font-weight:800; margin-bottom:10px;
      }
      .grid{ display:grid; gap:12px; }
      .row2{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
      label{ font-weight:800; font-size:13px; display:block; }
      select,input{
        width:100%; margin-top:6px; padding:12px 12px;
        border:1px solid #dcdcdc; border-radius:14px; font-size:16px;
        background:#ffffff; color:#111111;
      }
      .btn{
        width:100%; margin-top:2px; padding:14px 14px;
        border:0; border-radius:16px; background:var(--btn); color:var(--btnText);
        font-weight:900; font-size:16px; cursor:pointer;
      }
      .btn[disabled]{ opacity:.6; cursor:not-allowed; }
      .msg{ margin-top:4px; font-weight:800; line-height:1.5; }
      .msg.ok{ color:var(--ok); }
      .msg.err{ color:var(--err); }
      .hint{ color:var(--muted); font-size:12px; line-height:1.45; }
      .hide{ display:none !important; }
      .meta-grid{ display:grid; gap:10px; }
      .meta-item{
        display:flex; align-items:flex-start; justify-content:space-between; gap:12px;
        padding:10px 12px; border:1px solid var(--line); border-radius:14px; background:#fff;
      }
      .meta-item span{ color:var(--muted); font-size:13px; }
      .meta-item strong{ font-size:14px; text-align:right; line-height:1.45; }
      .owner-card{ background:var(--soft); }
      .owner-row{ display:flex; align-items:center; gap:12px; }
      .owner-avatar{
        width:56px; height:56px; border-radius:999px; object-fit:cover; flex:0 0 auto;
        border:1px solid var(--line); background:#f3f4f6;
      }
      .owner-avatar-fallback{
        display:flex; align-items:center; justify-content:center;
        background:#111111; color:#ffffff; font-weight:900;
      }
      .owner-main{ min-width:0; }
      .owner-name{ font-size:16px; font-weight:900; line-height:1.3; }
      .owner-title{ margin-top:4px; font-size:13px; color:#333333; line-height:1.45; font-weight:700; }
      .owner-bio{
        margin-top:12px; color:#333333; font-size:14px; line-height:1.6; white-space:normal; word-break:break-word;
      }
      .quote-box{ border:1px solid var(--line); border-radius:14px; padding:12px; background:var(--soft); }
      .quote-title{ font-size:14px; font-weight:900; margin-bottom:10px; }
      .quote-grid{ display:grid; gap:8px; }
      .quote-line{ display:flex; justify-content:space-between; gap:12px; }
      .quote-line span{ color:var(--muted); font-size:13px; }
      .quote-line strong{ font-size:14px; text-align:right; line-height:1.45; }
      .result-card{ background:#fcfcfc; }

      .availability-legend{
        display:flex; gap:12px; flex-wrap:wrap; align-items:center;
        margin-bottom:12px; color:#374151; font-size:12px; line-height:1.4;
      }
      .availability-legend-item{ display:inline-flex; align-items:center; gap:8px; font-weight:700; }
      .availability-swatch{
        width:12px; height:12px; border-radius:999px; display:inline-block; border:1px solid transparent;
      }
      .availability-swatch.booked{ background:#ef4444; border-color:#dc2626; }
      .availability-swatch.selected{ background:#111111; border-color:#111111; }
      .availability-swatch.free{ background:#ffffff; border-color:#d1d5db; }

      .calendar-shell{
        border:1px solid var(--line);
        border-radius:14px;
        background:#ffffff;
        padding:12px;
      }
      .calendar-toolbar{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:8px;
        margin-bottom:10px;
      }
      .calendar-toolbar-title{
        font-size:14px;
        font-weight:900;
        color:#111827;
      }
      .calendar-nav-btn{
        border:1px solid #d1d5db;
        background:#ffffff;
        color:#111827;
        min-width:38px;
        height:38px;
        border-radius:12px;
        font-weight:900;
        cursor:pointer;
      }
      .calendar-nav-btn[disabled]{ opacity:.55; cursor:not-allowed; }
      .calendar-grid{
        display:grid;
        grid-template-columns:repeat(7, minmax(0,1fr));
        gap:6px;
      }
      .calendar-weekday{
        text-align:center;
        font-size:12px;
        color:var(--muted);
        font-weight:800;
        padding:6px 0;
      }
      .calendar-day{
        min-height:46px;
        border-radius:12px;
        border:1px solid #e5e7eb;
        background:#ffffff;
        color:#111827;
        font-weight:800;
        cursor:pointer;
        padding:8px 6px;
      }
      .calendar-day.other-month{
        opacity:.55;
      }
      .calendar-day.disabled{
        background:#f9fafb;
        border-color:#e5e7eb;
        color:#9ca3af;
        cursor:not-allowed;
        opacity:.7;
      }
      .calendar-day.range{
        background:#eff6ff;
        border-color:#bfdbfe;
      }
      .calendar-day.blocked{
        background:#fef2f2;
        border-color:#fca5a5;
        color:#991b1b;
      }
      .calendar-day.selected{
        outline:2px solid #111111;
        outline-offset:1px;
      }
      .calendar-day.today{
        box-shadow:inset 0 0 0 1px #111827;
      }

      .availability-day-detail{
        margin-top:12px;
        display:grid;
        gap:8px;
      }
      .availability-day-title{
        font-size:13px;
        font-weight:900;
        color:#111827;
      }
      .availability-empty{
        padding:10px 12px;
        border-radius:12px;
        border:1px solid #d1fae5;
        background:#ecfdf5;
        color:#166534;
        font-size:13px;
        line-height:1.5;
      }
      .availability-error{
        padding:10px 12px;
        border-radius:12px;
        border:1px solid #fecaca;
        background:#fef2f2;
        color:#991b1b;
        font-size:13px;
        line-height:1.5;
      }
      .availability-slot-list{
        display:grid;
        gap:8px;
      }
      .availability-slot-item{
        padding:10px 12px;
        border-radius:12px;
        border:1px solid #fecaca;
        background:#fff5f5;
        color:#7f1d1d;
      }
      .availability-slot-label{
        font-size:13px;
        font-weight:900;
        line-height:1.4;
      }
      .availability-slot-detail{
        margin-top:4px;
        font-size:12px;
        line-height:1.45;
        color:#991b1b;
      }
      .availability-ranges{
        margin-top:12px;
        display:grid;
        gap:8px;
      }
      .availability-range-item{
        padding:10px 12px;
        border-radius:12px;
        border:1px solid #fee2e2;
        background:#ffffff;
      }
      .availability-range-top{
        display:flex;
        justify-content:space-between;
        gap:10px;
        align-items:flex-start;
        flex-wrap:wrap;
      }
      .availability-range-type{
        font-size:12px;
        font-weight:900;
        color:#991b1b;
      }
      .availability-range-status{
        font-size:12px;
        font-weight:800;
        color:#6b7280;
      }
      .availability-range-interval{
        margin-top:4px;
        font-size:13px;
        line-height:1.45;
        color:#111827;
      }
      .availability-notice{
        margin-top:12px;
        padding:10px 12px;
        border-radius:12px;
        border:1px solid #fecaca;
        background:#fff5f5;
        color:#991b1b;
        font-size:13px;
        line-height:1.55;
        font-weight:700;
      }

      @media (max-width:520px){
        .row2{ grid-template-columns:1fr; }
        .meta-item, .quote-line{ flex-direction:column; align-items:flex-start; }
        .meta-item strong, .quote-line strong{ text-align:left; }
        .calendar-day{ min-height:42px; padding:8px 4px; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>Bron sorğusu</h1>

      ${propertyCardHtml}
      ${ownerPreviewHtml}

      <div class="card">
        <div class="section-kicker">Seçim</div>
        <div class="grid">
          <div>
            <label for="rentalType">İcarə növü</label>
            <select id="rentalType">
              ${rentalTypeOptionsHtml}
            </select>
          </div>

          <div id="blockDates" class="row2">
            <div>
              <label id="startDateLabel" for="startDate">Başlanğıc tarixi</label>
              <input id="startDate" type="date" />
            </div>
            <div>
              <label id="endDateLabel" for="endDate">Bitiş tarixi</label>
              <input id="endDate" type="date" />
            </div>
          </div>

          <div id="dateHint" class="hint"></div>

          <div id="blockHourly" class="hide">
            <div class="row2">
              <div>
                <label for="hourDay">Gün</label>
                <input id="hourDay" type="date" />
                <div class="hint">Saatlıq bron yalnız eyni gün daxilində hesablanır. Cari gündən əvvəlki tarixlər seçilə bilməz.</div>
              </div>
              <div>
                <label for="durationHours">Müddət</label>
                <select id="durationHours"></select>
                <div class="hint">Bitiş saatı avtomatik hesablanır.</div>
              </div>
            </div>

            <div class="row2">
              <div>
                <label for="startTime">Başlanğıc saatı</label>
                <select id="startTime"></select>
              </div>
              <div>
                <label for="endTime">Bitiş saatı</label>
                <select id="endTime" disabled></select>
              </div>
            </div>
          </div>

          <div class="quote-box">
            <div class="quote-title">Bron edilmiş zamanlar</div>
            <div class="availability-legend">
              <div class="availability-legend-item"><span class="availability-swatch booked"></span>Bron edilib</div>
              <div class="availability-legend-item"><span class="availability-swatch selected"></span>Seçilmiş gün</div>
              <div class="availability-legend-item"><span class="availability-swatch free"></span>Boş görünən gün</div>
            </div>
            <div id="availabilityCalendar"></div>
            <div id="availabilityDayDetail" class="availability-day-detail"></div>
            <div id="availabilityRanges" class="availability-ranges"></div>
            <div id="availabilityNotice" class="availability-notice">Təqvimdə qırmızı ilə işarələnmiş tarix və zaman aralıqları artıq bron edilib. Zəhmət olmasa yalnız boş zaman aralıqlarından seçim edin.</div>
          </div>

          <div class="quote-box">
            <div class="quote-title">Sorğunun xülasəsi</div>
            <div class="quote-grid">
              <div class="quote-line"><span>İcarə növü</span><strong id="summaryRentalType">-</strong></div>
              <div class="quote-line"><span>Tarix / saat aralığı</span><strong id="summaryInterval">-</strong></div>
              <div class="quote-line"><span>Müddət</span><strong id="summaryDuration">-</strong></div>
              <div class="quote-line"><span>Təxmini qiymət</span><strong id="summaryPrice">-</strong></div>
              <div class="quote-line"><span>Status</span><strong id="summaryStatus">Bron sorğusu hələ yaradılmayıb</strong></div>
            </div>
            <h2><div id="summaryPrivacy" class="hint" style="margin-top:10px;">Əlaqə məlumatları bron təsdiqləndikdən sonra açılır.</div></h2>
          </div>

          <button id="btn" class="btn">Bron sorğusu yaradın</button>

          <div id="msg" class="msg"></div>
        </div>
      </div>

      <div id="resultCard" class="card result-card hide">
        <div class="section-kicker">Nəticə</div>
        <div class="meta-grid">
          <div class="meta-item"><span>Status</span><strong id="resultStatus">-</strong></div>
          <div class="meta-item"><span>Tarix / saat aralığı</span><strong id="resultInterval">-</strong></div>
          <div class="meta-item"><span>Qiymət</span><strong id="resultPrice">-</strong></div>
        </div>
      </div>
    </div>

    <script>
      const draftId = ${JSON.stringify(draftId)};
      const propertyId = ${JSON.stringify(propertyId)};
      const phone = ${JSON.stringify(phone)};
      const initialRentalType = ${JSON.stringify(initialRentalType)};
      const pricingMap = ${JSON.stringify(pricingMap)};
      const propertyData = ${JSON.stringify(propertySummary)};
      const approvalExpireHours = ${JSON.stringify(approvalExpireHours)};
      const rentalTypeLabels = ${JSON.stringify(
      Object.fromEntries(ALLOWED_RENTAL_TYPES.map((type) => [type, getRentalTypeLabel(type)]))
    )};
      const statusLabels = ${JSON.stringify({
      PENDING: getBookingStatusLabel("PENDING"),
      APPROVED: getBookingStatusLabel("APPROVED"),
      REJECTED: getBookingStatusLabel("REJECTED"),
      EXPIRED: getBookingStatusLabel("EXPIRED"),
    })};
      const minimumDaysByType = ${JSON.stringify(MIN_DURATION_DAYS)};
      const errorTextMap = ${JSON.stringify(ERROR_MESSAGES_AZ)};

      const rentalTypeEl = document.getElementById("rentalType");
      const blockDates = document.getElementById("blockDates");
      const startDate = document.getElementById("startDate");
      const endDate = document.getElementById("endDate");
      const startDateLabel = document.getElementById("startDateLabel");
      const endDateLabel = document.getElementById("endDateLabel");
      const dateHint = document.getElementById("dateHint");

      const blockHourly = document.getElementById("blockHourly");
      const hourDay = document.getElementById("hourDay");
      const startTime = document.getElementById("startTime");
      const durationHours = document.getElementById("durationHours");
      const endTime = document.getElementById("endTime");

      const availabilityCalendar = document.getElementById("availabilityCalendar");
      const availabilityDayDetail = document.getElementById("availabilityDayDetail");
      const availabilityRanges = document.getElementById("availabilityRanges");
      const availabilityNotice = document.getElementById("availabilityNotice");

      const summaryRentalType = document.getElementById("summaryRentalType");
      const summaryInterval = document.getElementById("summaryInterval");
      const summaryDuration = document.getElementById("summaryDuration");
      const summaryPrice = document.getElementById("summaryPrice");
      const summaryStatus = document.getElementById("summaryStatus");

      const btn = document.getElementById("btn");
      const msg = document.getElementById("msg");
      const resultCard = document.getElementById("resultCard");
      const resultStatus = document.getElementById("resultStatus");
      const resultInterval = document.getElementById("resultInterval");
      const resultPrice = document.getElementById("resultPrice");

      const moneyFormatter = new Intl.NumberFormat("az-AZ", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });

      const availabilityState = {
        loading: false,
        error: "",
        blockedDateKeys: [],
        blockedSlotsByDate: {},
        bookedRanges: [],
        notice: "Təqvimdə qırmızı ilə işarələnmiş tarix və zaman aralıqları artıq bron edilib. Zəhmət olmasa yalnız boş zaman aralıqlarından seçim edin."
      };

      let availabilityMonthCursor = "";
      let availabilityRequestToken = 0;

      const monthNamesAz = [
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
        "Dekabr"
      ];

      function setMsg(kind, text){
        msg.className = "msg " + (kind || "");
        msg.textContent = text || "";
      }

      function pad2(n){ return String(n).padStart(2, "0"); }

      function todayLocalDate(){
        const d = new Date();
        return d.getFullYear() + "-" + pad2(d.getMonth()+1) + "-" + pad2(d.getDate());
      }

      function getTodayMonthCursor(){
        return todayLocalDate().slice(0, 7);
      }

      function clampDateValueToToday(value){
        const today = todayLocalDate();
        const normalized = String(value || "").trim();
        if(!normalized) return today;
        return normalized < today ? today : normalized;
      }

      function isPastDayKey(dayKey){
        return String(dayKey || "").trim() < todayLocalDate();
      }

      function parseLocalDateValue(value){
        const parts = String(value || "").split("-").map(Number);
        if(parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
        return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0, 0);
      }

      function parseLocalDateTimeValue(value){
        const raw = String(value || "").trim();
        if(!raw) return null;

        const dateOnly = raw.match(/^(\\d{4})-(\\d{2})-(\\d{2})$/);
        if(dateOnly){
          return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]), 0, 0, 0, 0);
        }

        const localDateTime = raw.match(/^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2})(?::(\\d{2}))?/);
        if(localDateTime){
          return new Date(
            Number(localDateTime[1]),
            Number(localDateTime[2]) - 1,
            Number(localDateTime[3]),
            Number(localDateTime[4]),
            Number(localDateTime[5]),
            Number(localDateTime[6] || "0"),
            0
          );
        }

        const parsed = new Date(raw);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }

      function toDateInputValue(date){
        return date.getFullYear() + "-" + pad2(date.getMonth()+1) + "-" + pad2(date.getDate());
      }

      function addDaysToDateString(value, days){
        const base = parseLocalDateValue(value);
        if(!base) return "";
        base.setDate(base.getDate() + days);
        return toDateInputValue(base);
      }

      function diffCalendarDaysValue(startValue, endValue){
        const s = parseLocalDateValue(startValue);
        const e = parseLocalDateValue(endValue);
        if(!s || !e) return 0;
        const sUtc = Date.UTC(s.getFullYear(), s.getMonth(), s.getDate());
        const eUtc = Date.UTC(e.getFullYear(), e.getMonth(), e.getDate());
        return Math.max(0, Math.round((eUtc - sUtc) / (24 * 60 * 60 * 1000)));
      }

      function formatDateValue(value){
        const d = parseLocalDateValue(value);
        if(!d) return "-";
        return d.getDate() + " " + monthNamesAz[d.getMonth()] + " " + d.getFullYear();
      }

      function formatDateTimeValue(dateLike){
        const d = parseLocalDateTimeValue(dateLike);
        if(!d) return "-";
        return d.getDate() + " " + monthNamesAz[d.getMonth()] + " " + d.getFullYear() + " saat " + pad2(d.getHours()) + ":" + pad2(d.getMinutes());
      }

      function formatTimeValue(dateLike){
        const d = parseLocalDateTimeValue(dateLike);
        if(!d) return "-";
        return pad2(d.getHours()) + ":" + pad2(d.getMinutes());
      }

      function formatMoney(value){
        const num = Number(value || 0);
        if(!Number.isFinite(num)) return "-";
        return moneyFormatter.format(num) + " AZN";
      }

      function getMinimumDays(type){
        return Number(minimumDaysByType[type] || 1);
      }

      function escapeHtmlClient(value){
        return String(value == null ? "" : value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
      }

      function fillDurationOptions(){
        durationHours.innerHTML = "";
        for(let h=1; h<=12; h++){
          const opt = document.createElement("option");
          opt.value = String(h);
          opt.textContent = h + " saat";
          durationHours.appendChild(opt);
        }
        if(!durationHours.value) durationHours.value = "2";
      }

      function ensureHourlyDayIsTodayOrLater(){
        const today = todayLocalDate();
        const normalizedDay = clampDateValueToToday(hourDay.value);
        hourDay.min = today;
        hourDay.value = normalizedDay;
      }

      function getSelectedCalendarDay(){
        return rentalTypeEl.value === "HOURLY"
          ? clampDateValueToToday(hourDay.value || todayLocalDate())
          : clampDateValueToToday(startDate.value || todayLocalDate());
      }

      function getMonthCursorFromDayKey(dayKey){
        const raw = String(dayKey || "");
        const match = raw.match(/^(\\d{4})-(\\d{2})/);
        if(match) return match[1] + "-" + match[2];
        return todayLocalDate().slice(0, 7);
      }

      function setAvailabilityMonthFromSelection(){
        availabilityMonthCursor = getMonthCursorFromDayKey(getSelectedCalendarDay());
      }

      function getBlockedSlotsForDay(dayKey){
        const items = availabilityState.blockedSlotsByDate && availabilityState.blockedSlotsByDate[dayKey];
        return Array.isArray(items) ? items : [];
      }

      function isHourlyStartBlocked(dayKey, startHour, duration){
        const slots = getBlockedSlotsForDay(dayKey);
        if(!slots.length) return false;
        const startMinutes = startHour * 60;
        const endMinutes = startMinutes + duration * 60;

        return slots.some((slot) => {
          const slotStart = Number(slot.startMinutes || 0);
          const slotEnd = Number(slot.endMinutes || 0);
          return startMinutes < slotEnd && endMinutes > slotStart;
        });
      }

      function refillStartTimeOptions(){
        const current = startTime.value;
        const duration = parseInt(durationHours.value || "2", 10);
        const lastStart = Math.max(0, 24 - duration);
        const selectedDay = clampDateValueToToday(hourDay.value || todayLocalDate());

        startTime.innerHTML = "";
        for(let h=0; h<=lastStart; h++){
          const value = pad2(h) + ":00";
          const blocked = isHourlyStartBlocked(selectedDay, h, duration);
          const opt = document.createElement("option");
          opt.value = value;
          opt.textContent = blocked ? value + " • tutulub" : value;
          opt.disabled = blocked;
          startTime.appendChild(opt);
        }

        const enabledOptions = Array.from(startTime.options).filter((opt) => !opt.disabled);

        if(current && enabledOptions.some((opt) => opt.value === current)){
          startTime.value = current;
        } else if(enabledOptions.some((opt) => opt.value === "10:00")){
          startTime.value = "10:00";
        } else if(enabledOptions.length > 0){
          startTime.value = enabledOptions[0].value;
        } else {
          startTime.value = "";
        }
      }

      function syncHourlyEnd(){
        const s = startTime.value || "";
        const dur = parseInt(durationHours.value || "2", 10);

        endTime.innerHTML = "";
        if(!s){
          const opt = document.createElement("option");
          opt.value = "";
          opt.textContent = "Boş saat yoxdur";
          endTime.appendChild(opt);
          endTime.value = "";
          renderLiveSummary();
          renderAvailabilityDayDetail(hourDay.value || todayLocalDate());
          return;
        }

        const parts = s.split(":").map(Number);
        const endHour = (parts[0] || 0) + dur;
        const value = pad2(endHour) + ":00";
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = value;
        endTime.appendChild(opt);
        endTime.value = value;
        renderLiveSummary();
      }

      function ensureDateRangeForType(){
        const type = rentalTypeEl.value;
        if(type === "HOURLY") return;

        const today = todayLocalDate();
        const startValue = clampDateValueToToday(startDate.value || today);
        const minDays = getMinimumDays(type);

        startDate.min = today;
        startDate.value = startValue;

        const minEndValue = addDaysToDateString(startValue, minDays);
        const currentEndValue = String(endDate.value || "").trim();
        const normalizedEndValue = currentEndValue ? clampDateValueToToday(currentEndValue) : "";

        endDate.min = minEndValue;

        if(!normalizedEndValue || diffCalendarDaysValue(startDate.value, normalizedEndValue) < minDays){
          endDate.value = minEndValue;
        } else {
          endDate.value = normalizedEndValue;
        }
      }

      function updateDateLabels(){
        const type = rentalTypeEl.value;
        if(type === "DAILY"){
          startDateLabel.textContent = "Başlanğıc tarixi";
          endDateLabel.textContent = "Bitiş tarixi";
          dateHint.textContent = "Günlük bron üçün minimum müddət 1 gündür. Cari gündən əvvəlki tarixlər seçilə bilməz.";
          return;
        }
        if(type === "WEEKLY"){
          startDateLabel.textContent = "Başlanğıc tarixi";
          endDateLabel.textContent = "Bitiş tarixi";
          dateHint.textContent = "Həftəlik bron üçün minimum müddət 7 gündür. Bitiş tarixi buna uyğun avtomatik yenilənir. Cari gündən əvvəlki tarixlər seçilə bilməz.";
          return;
        }
        if(type === "MONTHLY"){
          startDateLabel.textContent = "Başlanğıc tarixi";
          endDateLabel.textContent = "Bitiş tarixi";
          dateHint.textContent = "Aylıq bron üçün minimum müddət 30 gündür. Bitiş tarixi buna uyğun avtomatik yenilənir. Cari gündən əvvəlki tarixlər seçilə bilməz.";
          return;
        }
        dateHint.textContent = "";
      }

      function getLiveEstimate(){
        const type = rentalTypeEl.value;
        const unitPrice = Number(pricingMap[type] || 0);

        if(type === "HOURLY"){
          const duration = parseInt(durationHours.value || "1", 10);
          return {
            intervalLabel: (hourDay.value ? formatDateValue(hourDay.value) : "-") + " " + (startTime.value || "--:--") + " — " + (hourDay.value ? formatDateValue(hourDay.value) : "-") + " " + (endTime.value || "--:--"),
            durationLabel: duration + " saat",
            price: startTime.value && unitPrice > 0 ? duration * unitPrice : 0,
          };
        }

        const days = diffCalendarDaysValue(startDate.value, endDate.value);
        let units = days;
        if(type === "WEEKLY") units = Math.ceil(days / 7);
        if(type === "MONTHLY") units = Math.ceil(days / 30);
        return {
          intervalLabel: formatDateValue(startDate.value) + " — " + formatDateValue(endDate.value),
          durationLabel: days + " gün",
          price: unitPrice > 0 ? units * unitPrice : 0,
        };
      }

      function renderLiveSummary(){
        const type = rentalTypeEl.value;
        const estimate = getLiveEstimate();
        summaryRentalType.textContent = rentalTypeLabels[type] || type || "-";
        summaryInterval.textContent = estimate.intervalLabel;
        summaryDuration.textContent = estimate.durationLabel;
        summaryPrice.textContent = estimate.price > 0 ? formatMoney(estimate.price) : "Qiymət mövcud deyil";
      }

      function setResultCard(data){
        const booking = data && data.booking ? data.booking : null;
        const statusCode = booking && booking.status ? booking.status : "PENDING";
        const statusLabel = booking && booking.statusLabel ? booking.statusLabel : (statusLabels[statusCode] || statusCode || "-");
        const intervalLabel = booking && booking.intervalLabel
          ? booking.intervalLabel
          : (booking && booking.startAt && booking.endAt && booking.rentalType
              ? (booking.rentalType === "HOURLY"
                  ? formatDateTimeValue(booking.startAt) + " — " + formatDateTimeValue(booking.endAt)
                  : formatDateValue(String(booking.startAt).slice(0,10)) + " — " + formatDateValue(String(booking.endAt).slice(0,10)))
              : "-");
        const priceValue = data && data.price != null ? data.price : (booking && booking.totalPrice != null ? booking.totalPrice : 0);

        resultStatus.textContent = statusLabel;
        resultInterval.textContent = intervalLabel;
        resultPrice.textContent = formatMoney(priceValue);
        summaryStatus.textContent = statusLabel;
        resultCard.classList.remove("hide");
      }

      function mapServerError(data){
        if(!data || typeof data !== "object") return errorTextMap.INTERNAL_ERROR;
        if(data.userMessage) return data.userMessage;
        const code = data.code || data.message;
        return errorTextMap[code] || errorTextMap.INTERNAL_ERROR;
      }

      function getSelectedRangeDayKeys(){
        if(rentalTypeEl.value === "HOURLY") return [];
        const startValue = startDate.value;
        const endValue = endDate.value;
        if(!startValue || !endValue) return [];

        const keys = [];
        let cursor = startValue;
        while(cursor && cursor < endValue){
          keys.push(cursor);
          cursor = addDaysToDateString(cursor, 1);
          if(!cursor) break;
        }
        return keys;
      }

      function formatMonthCursorLabel(cursor){
        const parts = String(cursor || "").split("-").map(Number);
        if(parts.length !== 2 || !parts[0] || !parts[1]) return "";
        return monthNamesAz[parts[1] - 1] + " " + parts[0];
      }

      function shiftMonthCursor(cursor, delta){
        const parts = String(cursor || "").split("-").map(Number);
        if(parts.length !== 2 || !parts[0] || !parts[1]) return todayLocalDate().slice(0, 7);
        const date = new Date(parts[0], parts[1] - 1 + delta, 1, 0, 0, 0, 0);
        return date.getFullYear() + "-" + pad2(date.getMonth() + 1);
      }

      function renderAvailabilityRanges(){
        availabilityRanges.innerHTML = "";
      }

      function renderAvailabilityDayDetail(dayKey){
        if(availabilityState.loading){
          availabilityDayDetail.innerHTML = '<div class="availability-empty">Bron məlumatları yüklənir...</div>';
          return;
        }

        if(availabilityState.error){
          availabilityDayDetail.innerHTML = '<div class="availability-error">' + escapeHtmlClient(availabilityState.error) + '</div>';
          return;
        }

        if(!dayKey){
          availabilityDayDetail.innerHTML = '';
          return;
        }

        const slots = getBlockedSlotsForDay(dayKey);
        const title = '<div class="availability-day-title">' + escapeHtmlClient(formatDateValue(dayKey)) + ' üçün bron vəziyyəti</div>';

        if(slots.length === 0){
          availabilityDayDetail.innerHTML = title + '<div class="availability-empty">Bu gün üçün aktiv bron görünmür.</div>';
          return;
        }

        const html = slots.map((slot) => {
          return (
            '<div class="availability-slot-item">' +
              '<div class="availability-slot-label">' + escapeHtmlClient(slot.label || "Bron edilib") + '</div>' +
              '<div class="availability-slot-detail">' + escapeHtmlClient(slot.detailLabel || "-") + '</div>' +
            '</div>'
          );
        }).join("");

        availabilityDayDetail.innerHTML = title + '<div class="availability-slot-list">' + html + '</div>';
      }

      function renderAvailabilityCalendar(){
        if(availabilityState.error){
          availabilityCalendar.innerHTML = '<div class="availability-error">' + escapeHtmlClient(availabilityState.error) + '</div>';
          availabilityNotice.textContent = availabilityState.error;
          renderAvailabilityDayDetail(getSelectedCalendarDay());
          renderAvailabilityRanges();
          return;
        }

        const blockedSet = new Set(Array.isArray(availabilityState.blockedDateKeys) ? availabilityState.blockedDateKeys : []);
        const selectedDay = getSelectedCalendarDay();
        const selectedRangeKeys = new Set(getSelectedRangeDayKeys());
        const todayKey = todayLocalDate();
        const todayMonthCursor = getTodayMonthCursor();
        const cursor = availabilityMonthCursor || todayMonthCursor;
        const parts = cursor.split("-").map(Number);
        const year = parts[0];
        const monthIndex = (parts[1] || 1) - 1;
        const monthStart = new Date(year, monthIndex, 1, 0, 0, 0, 0);
        const gridStart = new Date(monthStart);
        const mondayBasedWeekday = (monthStart.getDay() + 6) % 7;
        gridStart.setDate(monthStart.getDate() - mondayBasedWeekday);

        const weekdays = ["B.e", "Ç.a", "Ç", "C.a", "C", "Ş", "B"];
        const html = [];
        html.push('<div class="calendar-shell">');
        html.push(
          '<div class="calendar-toolbar">' +
            '<button type="button" class="calendar-nav-btn" data-cal-nav="prev"' + (availabilityState.loading || cursor <= todayMonthCursor ? ' disabled' : '') + '>&lt;</button>' +
            '<div class="calendar-toolbar-title">' + escapeHtmlClient(formatMonthCursorLabel(cursor)) + '</div>' +
            '<button type="button" class="calendar-nav-btn" data-cal-nav="next"' + (availabilityState.loading ? ' disabled' : '') + '>&gt;</button>' +
          '</div>'
        );
        html.push('<div class="calendar-grid">');
        for(const weekday of weekdays){
          html.push('<div class="calendar-weekday">' + weekday + '</div>');
        }

        for(let i=0; i<42; i++){
          const cellDate = new Date(gridStart);
          cellDate.setDate(gridStart.getDate() + i);
          const dayKey = toDateInputValue(cellDate);
          const inCurrentMonth = cellDate.getMonth() === monthIndex;
          const isBlocked = blockedSet.has(dayKey);
          const isSelected = dayKey === selectedDay;
          const isRange = selectedRangeKeys.has(dayKey);
          const isToday = dayKey === todayKey;
          const isPastDay = dayKey < todayKey;

          const classes = ["calendar-day"];
          if(!inCurrentMonth) classes.push("other-month");
          if(isPastDay) classes.push("disabled");
          if(isRange) classes.push("range");
          if(isBlocked) classes.push("blocked");
          if(isSelected) classes.push("selected");
          if(isToday) classes.push("today");

          html.push(
            '<button type="button" class="' + classes.join(" ") + '"' +
              (isPastDay ? ' disabled aria-disabled="true"' : '') +
              ' data-cal-day="' + escapeHtmlClient(dayKey) + '">' +
              escapeHtmlClient(String(cellDate.getDate())) +
            '</button>'
          );
        }

        html.push('</div>');
        html.push('</div>');
        availabilityCalendar.innerHTML = html.join("");

        availabilityCalendar.querySelectorAll("[data-cal-nav]").forEach((el) => {
          el.addEventListener("click", () => {
            const direction = el.getAttribute("data-cal-nav");
            if(direction === "prev" && cursor <= todayMonthCursor) return;
            availabilityMonthCursor = shiftMonthCursor(cursor, direction === "prev" ? -1 : 1);
            void loadAvailability(true);
          });
        });

        availabilityCalendar.querySelectorAll("[data-cal-day]").forEach((el) => {
          el.addEventListener("click", () => {
            const dayKey = String(el.getAttribute("data-cal-day") || "");
            if(!dayKey || isPastDayKey(dayKey)) return;

            if(rentalTypeEl.value === "HOURLY"){
              hourDay.value = dayKey;
              refillStartTimeOptions();
              syncHourlyEnd();
            } else {
              startDate.value = dayKey;
              ensureDateRangeForType();
              renderLiveSummary();
            }

            const targetMonth = getMonthCursorFromDayKey(dayKey);
            if(targetMonth !== availabilityMonthCursor){
              availabilityMonthCursor = targetMonth;
              void loadAvailability(true);
              return;
            }

            renderAvailabilityCalendar();
            renderAvailabilityDayDetail(dayKey);
          });
        });

        availabilityNotice.textContent = availabilityState.notice || "Təqvimdə qırmızı ilə işarələnmiş tarix və zaman aralıqları artıq bron edilib. Zəhmət olmasa yalnız boş zaman aralıqlarından seçim edin.";
        renderAvailabilityDayDetail(selectedDay);
        renderAvailabilityRanges();
      }

      async function loadAvailability(preserveCursor){
        if(!preserveCursor || !availabilityMonthCursor){
          setAvailabilityMonthFromSelection();
        }

        const todayMonthCursor = getTodayMonthCursor();
        let monthCursor = availabilityMonthCursor || todayMonthCursor;

        if(monthCursor < todayMonthCursor){
          monthCursor = todayMonthCursor;
          availabilityMonthCursor = todayMonthCursor;
        }

        const requestToken = ++availabilityRequestToken;

        availabilityState.loading = true;
        availabilityState.error = "";
        renderAvailabilityCalendar();

        try{
          const qs = new URLSearchParams();
          if(draftId) qs.set("draftId", draftId);
          else {
            qs.set("propertyId", propertyId);
            qs.set("phone", phone);
          }
          qs.set("month", monthCursor + "-01");
          qs.set("rentalType", rentalTypeEl.value);
          qs.set("day", getSelectedCalendarDay());

          const response = await fetch("/booking/availability?" + qs.toString(), {
            method: "GET"
          });

          const data = await response.json().catch(() => ({}));

          if(requestToken !== availabilityRequestToken) return;

          if(!response.ok || !data.ok){
            throw new Error(mapServerError(data));
          }

          availabilityState.loading = false;
          availabilityState.error = "";
          availabilityState.blockedDateKeys = Array.isArray(data.blockedDateKeys) ? data.blockedDateKeys : [];
          availabilityState.blockedSlotsByDate = data.blockedSlotsByDate && typeof data.blockedSlotsByDate === "object" ? data.blockedSlotsByDate : {};
          availabilityState.bookedRanges = Array.isArray(data.bookedRanges) ? data.bookedRanges : [];
          availabilityState.notice = String(data.notice || availabilityState.notice || "").trim() || "Təqvimdə qırmızı ilə işarələnmiş tarix və zaman aralıqları artıq bron edilib. Zəhmət olmasa yalnız boş zaman aralıqlarından seçim edin.";

          if(rentalTypeEl.value === "HOURLY"){
            refillStartTimeOptions();
            syncHourlyEnd();
          }

          renderAvailabilityCalendar();
        } catch(e){
          if(requestToken !== availabilityRequestToken) return;
          availabilityState.loading = false;
          availabilityState.error = e && e.message ? e.message : errorTextMap.INTERNAL_ERROR;
          renderAvailabilityCalendar();
        }
      }

      function applyMode(){
        const type = rentalTypeEl.value;
        const isHourly = type === "HOURLY";

        blockHourly.classList.toggle("hide", !isHourly);
        blockDates.classList.toggle("hide", isHourly);
        dateHint.classList.toggle("hide", isHourly);
        setMsg("", "");

        if(isHourly){
          ensureHourlyDayIsTodayOrLater();
          fillDurationOptions();
          refillStartTimeOptions();
          syncHourlyEnd();
        } else {
          startDate.value = clampDateValueToToday(startDate.value || todayLocalDate());
          updateDateLabels();
          ensureDateRangeForType();
          renderLiveSummary();
        }

        renderLiveSummary();
        void loadAvailability(false);
      }

      rentalTypeEl.value = initialRentalType;
      fillDurationOptions();
      rentalTypeEl.addEventListener("change", applyMode);

      startDate.addEventListener("change", () => {
        ensureDateRangeForType();
        renderLiveSummary();
        void loadAvailability(false);
      });

      endDate.addEventListener("change", () => {
        ensureDateRangeForType();
        renderLiveSummary();
        renderAvailabilityCalendar();
      });

      hourDay.addEventListener("change", () => {
        ensureHourlyDayIsTodayOrLater();
        refillStartTimeOptions();
        syncHourlyEnd();
        void loadAvailability(false);
      });

      startTime.addEventListener("change", syncHourlyEnd);

      durationHours.addEventListener("change", () => {
        refillStartTimeOptions();
        syncHourlyEnd();
        renderAvailabilityCalendar();
      });

      applyMode();

      function toIsoStartEndForApi(){
        const type = rentalTypeEl.value;
        const today = todayLocalDate();

        if(type === "HOURLY"){
          const day = clampDateValueToToday(hourDay.value);
          const s = startTime.value;
          const e = endTime.value;

          if(!day) throw new Error("Gün seçilməlidir.");
          if(day < today) throw new Error(errorTextMap.PAST_DATES_NOT_ALLOWED);
          if(!s || !e) throw new Error("Seçilmiş gün üzrə boş saat qalmayıb.");

          return {
            rentalType: type,
            startAt: day + "T" + s + ":00",
            endAt: day + "T" + e + ":00",
          };
        }

        const sD = clampDateValueToToday(startDate.value);
        const eD = clampDateValueToToday(endDate.value);

        if(!sD || !eD) throw new Error("Tarixlər seçilməlidir.");
        if(sD < today || eD < today) throw new Error(errorTextMap.PAST_DATES_NOT_ALLOWED);

        return {
          rentalType: type,
          startAt: sD,
          endAt: eD,
        };
      }

      btn.addEventListener("click", async () => {
        try{
          setMsg("", "");
          btn.disabled = true;
          btn.textContent = "Yaradılır...";

          const core = toIsoStartEndForApi();
          const payload = { ...core };
          if(draftId) payload.draftId = draftId;
          else {
            payload.propertyId = propertyId;
            payload.phone = phone;
          }

          const response = await fetch("/booking/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const text = await response.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch {
            throw new Error(errorTextMap.INTERNAL_ERROR);
          }

          if(!response.ok || !data.ok){
            throw new Error(mapServerError(data));
          }

          setResultCard(data);
          if(data.duplicate){
            setMsg("ok", "Bu seçim üzrə aktiv bron sorğunuz artıq mövcuddur. Mövcud bron məlumatları aşağıda göstərildi.");
          } else {
            setMsg("ok", "Bron sorğunuz yaradıldı. Elan sahibinin cavabı gözlənilir.");
          }

          void loadAvailability(true);
        } catch(e){
          setMsg("err", e && e.message ? e.message : errorTextMap.INTERNAL_ERROR);
        } finally {
          btn.disabled = false;
          btn.textContent = "Bron sorğusu yaradın";
        }
      });
    </script>
  </body>
</html>`);
  } catch (e) {
    console.error("[booking] webapp error:", e);
    return res.status(500).send(htmlErrorText("INTERNAL_ERROR"));
  }
});

bookingRouter.get("/status/:bookingId", async (req: Request, res: Response) => {
  try {
    const bookingId = sanitizeId(req.params?.bookingId);
    const phone = String(req.query?.phone ?? req.headers["x-customer-phone"] ?? "").trim();

    if (!bookingId) return sendError(res, "BOOKING_NOT_FOUND");
    if (!phone) return sendError(res, "PHONE_REQUIRED");

    const phoneCheck = validateAzWaId(phone);
    if (!phoneCheck.ok) return sendError(res, phoneCheck.error);

    const booking = await withTimeout(
      prisma.booking.findFirst({
        where: {
          id: bookingId,
          customerPhone: phoneCheck.waId,
        },
        include: {
          property: {
            include: {
              owner: true,
              service: {
                select: {
                  id: true,
                  key: true,
                  isActive: true,
                },
              },
            },
          },
        },
      }),
      `booking.findFirst(status:${bookingId})`
    );

    if (!booking) {
      return sendError(res, "BOOKING_NOT_FOUND", 404);
    }

    return res.json({
      ok: true,
      booking: serializeBookingForUser(booking),
    });
  } catch (e) {
    console.error("[booking] status error:", e);
    return sendError(res, "INTERNAL_ERROR", 500);
  }
});