import { Router, type Request, type Response } from "express";
import prisma from "db";

export const ownerBookingsRouter = Router();

const DB_TIMEOUT_MS = 5000;
const DAY_MS = 24 * 60 * 60 * 1000;

type OwnerFlowState =
  | "PROFILE_REQUIRED"
  | "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED"
  | "SERVICE_SELECTION_REQUIRED"
  | "SUBSCRIPTION_REQUIRED"
  | "ACTIVE";

type AccessDeniedResult = {
  ok: false;
  status: number;
  message:
    | "PROFILE_REQUIRED"
    | "PHONE_VERIFICATION_REQUIRED"
    | "SERVICE_SELECTION_REQUIRED"
    | "SUBSCRIPTION_REQUIRED"
    | "service not found or inactive"
    | "BOOKING_NOT_FOUND";
  state: OwnerFlowState;
  redirectUrl?: string;
};

type AccessGrantedResult = {
  ok: true;
  owner: any;
  service: { id: string; key: string; isActive: boolean };
  state: OwnerFlowState;
};

const BOOKING_APPROVAL_GUIDANCE_BY_SERVICE: Partial<Record<string, string[]>> = {
  RENT_HOME: [
    "Zəhmət olmasa təyin olunmuş məkana seçim etdiyiniz tarixdən 10 dəqiqə sonra daxil olun. Bu, həm sizin, həm də sizdən əvvəlki müştərinin rahatlığı üçün daha uyğun yanaşmadır.",
  ],
};

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

const ALLOWED_BOOKING_STATUSES = ["PENDING", "APPROVED", "REJECTED", "EXPIRED"] as const;

const moneyFormatter = new Intl.NumberFormat("az-AZ", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function bad(
  res: Response,
  message: string,
  status = 400,
  extra?: Record<string, unknown>
) {
  return res.status(status).json({ ok: false, message, ...(extra || {}) });
}

function digitsOnly(s: string) {
  return String(s ?? "").replace(/[^\d]/g, "");
}

function normalizeString(input: unknown): string {
  return String(input ?? "").trim();
}

function normalizePhone(input: unknown): string {
  return String(input ?? "").trim().replace(/\s+/g, "");
}

function normalizeEmail(input: unknown): string {
  return String(input ?? "").trim().toLowerCase();
}

function normalizeSafeText(input: unknown, max = 500): string {
  return String(input ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeSafeMultilineText(input: unknown, max = 2000): string {
  return String(input ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

function getPhoneVariants(input: unknown): string[] {
  const normalized = normalizePhone(input);
  if (!normalized) return [];

  const variants = new Set<string>();
  variants.add(normalized);

  if (normalized.startsWith("+")) {
    variants.add(normalized.slice(1));
  } else {
    variants.add(`+${normalized}`);
  }

  return [...variants].filter(Boolean);
}

/**
 * Accepts legacy variants and returns WhatsApp-compatible numeric id.
 * Examples:
 * - "994501234567"
 * - "0501234567"
 * - "501234567"
 * - "+994 50 123 45 67"
 */
function normalizePhoneToWaId(input: string) {
  const digits = digitsOnly(String(input ?? "").trim());
  if (!digits) return "";

  if (digits.startsWith("994")) return digits;
  if (digits.length === 10 && digits.startsWith("0")) return "994" + digits.slice(1);
  if (digits.length === 9) return "994" + digits;

  return digits;
}

function sanitizeIdParam(id: unknown) {
  return String(id ?? "")
    .trim()
    .replace(/[<>]/g, "")
    .replace(/\s+/g, "");
}

function safeServiceKey(v: unknown) {
  const s = String(v ?? "").trim().toUpperCase();
  if (!s) return "";
  if (!/^[A-Z0-9_-]{2,64}$/.test(s)) return "";
  return s;
}

function requestLabel(req: Request) {
  return `${req.method} ${req.originalUrl || req.url}`;
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

function getWebAppBaseUrl(): string {
  const primary = String(process.env.WEB_APP_URL ?? "").trim();
  if (primary) return primary.replace(/\/+$/, "");

  const list = String(process.env.WEB_APP_URLS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (list[0]) return list[0].replace(/\/+$/, "");

  return "http://localhost:3000";
}

function buildBookingsPath(serviceKey?: string): string {
  const safeKey = safeServiceKey(serviceKey);
  if (!safeKey) return "/bookings";
  return `/bookings?serviceKey=${encodeURIComponent(safeKey)}`;
}

function buildServicesPageUrl(nextPath: string, serviceKey?: string): string {
  const params = new URLSearchParams();
  if (nextPath) params.set("next", nextPath);

  const safeKey = safeServiceKey(serviceKey);
  if (safeKey) params.set("serviceKey", safeKey);

  return `${getWebAppBaseUrl()}/services${params.toString() ? `?${params.toString()}` : ""}`;
}

function buildProfileRedirectUrl(serviceKey?: string): string {
  const safeKey = safeServiceKey(serviceKey);
  const nextPath = buildBookingsPath(safeKey);

  const params = new URLSearchParams();
  params.set("next", nextPath);
  if (safeKey) params.set("serviceKey", safeKey);

  return `${getWebAppBaseUrl()}/profile?${params.toString()}`;
}

function buildBillingRedirectUrl(serviceKey?: string): string {
  const safeKey = safeServiceKey(serviceKey);
  if (!safeKey) return `${getWebAppBaseUrl()}/billing`;
  return `${getWebAppBaseUrl()}/billing?serviceKey=${encodeURIComponent(safeKey)}`;
}

async function resolveOwnerFromRequest(req: Request) {
  const headerOwnerIdRaw = req.headers["x-owner-id"] || req.headers["x-ownerid"];

  const queryOwnerId = normalizeString(req.query?.ownerId);
  const bodyOwnerId = normalizeString(req.body?.ownerId);

  const ownerIdCandidates = [headerOwnerIdRaw, queryOwnerId, bodyOwnerId]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => normalizeString(value))
    .filter(Boolean);

  if (ownerIdCandidates.length > 0) {
    const ownerById = await withTimeout(
      prisma.owner.findFirst({
        where: {
          id: { in: ownerIdCandidates },
        },
        orderBy: { createdAt: "asc" },
      }),
      "resolveOwnerFromRequest.findFirst(by id)"
    );

    if (ownerById) return ownerById;
  }

  const headerPhoneRaw = req.headers["x-owner-phone"] || req.headers["x-ownerphone"];

  const queryPhone = normalizePhone(req.query?.phone);
  const bodyPhone = normalizePhone(req.body?.phone);

  const phoneCandidates = [headerPhoneRaw, queryPhone, bodyPhone]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => normalizePhone(value))
    .filter(Boolean);

  const variants = new Set<string>();
  for (const candidate of phoneCandidates) {
    for (const variant of getPhoneVariants(candidate)) {
      variants.add(variant);
    }
  }

  if (variants.size > 0) {
    const ownerByPhone = await withTimeout(
      prisma.owner.findFirst({
        where: {
          OR: [...variants].map((phone) => ({ phone })),
        },
        orderBy: { createdAt: "asc" },
      }),
      "resolveOwnerFromRequest.findFirst(by phone)"
    );

    if (ownerByPhone) return ownerByPhone;
  }

  const headerEmailRaw = req.headers["x-owner-email"] || req.headers["x-owneremail"];

  const queryEmail = normalizeEmail(req.query?.email);
  const bodyEmail = normalizeEmail(req.body?.email);

  const emailCandidates = [headerEmailRaw, queryEmail, bodyEmail]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => normalizeEmail(value))
    .filter(Boolean);

  if (emailCandidates.length > 0) {
    const ownerByEmail = await withTimeout(
      prisma.owner.findFirst({
        where: {
          email: { in: emailCandidates },
        },
        orderBy: { createdAt: "asc" },
      }),
      "resolveOwnerFromRequest.findFirst(by email)"
    );

    if (ownerByEmail) return ownerByEmail;
  }

  return null;
}

async function getActiveServiceByKey(serviceKey: string) {
  if (!serviceKey) return null;

  return withTimeout(
    prisma.service.findFirst({
      where: { key: serviceKey, isActive: true },
      select: { id: true, key: true, isActive: true },
    }),
    `getActiveServiceByKey(${serviceKey})`
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return {};
}

function getOptionalBoolean(value: unknown, key: string): boolean | null {
  const record = asRecord(value);
  const raw = record[key];
  return typeof raw === "boolean" ? raw : null;
}

function getOptionalString(value: unknown, key: string): string {
  const record = asRecord(value);
  return normalizeString(record[key]);
}

function getOptionalDate(value: unknown, key: string): Date | null {
  const record = asRecord(value);
  const raw = record[key];

  if (!raw) return null;

  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? null : raw;
  }

  const parsed = new Date(String(raw));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function hasPhoneVerificationSignals(owner: unknown): boolean {
  const record = asRecord(owner);

  return (
    Object.prototype.hasOwnProperty.call(record, "phoneVerified") ||
    Object.prototype.hasOwnProperty.call(record, "phoneVerifiedAt") ||
    Object.prototype.hasOwnProperty.call(record, "phoneVerificationStatus")
  );
}

function hasOwnerCoreProfile(owner: unknown): boolean {
  const name = getOptionalString(owner, "name");
  const email = normalizeEmail(getOptionalString(owner, "email"));
  const phone = normalizePhone(getOptionalString(owner, "phone"));

  return !!name && !!email && !!phone;
}

function isOwnerPhoneVerified(owner: unknown): boolean {
  const explicitVerified = getOptionalBoolean(owner, "phoneVerified");
  if (explicitVerified === true) return true;
  if (explicitVerified === false) return false;

  const verifiedAt = getOptionalDate(owner, "phoneVerifiedAt");
  if (verifiedAt) return true;

  const status = getOptionalString(owner, "phoneVerificationStatus").toUpperCase();
  if (["VERIFIED", "APPROVED", "CONFIRMED", "SUCCESS"].includes(status)) {
    return true;
  }
  if (
    ["PENDING", "REQUIRED", "UNVERIFIED", "NOT_VERIFIED", "EXPIRED", "FAILED"].includes(status)
  ) {
    return false;
  }

  if (!hasPhoneVerificationSignals(owner)) {
    return !!normalizePhone(getOptionalString(owner, "phone"));
  }

  return false;
}

function resolveOwnerOnboardingState(owner: unknown): OwnerFlowState {
  if (!owner) return "PROFILE_REQUIRED";
  if (!hasOwnerCoreProfile(owner)) return "PROFILE_REQUIRED";
  if (!isOwnerPhoneVerified(owner)) return "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED";
  return "SERVICE_SELECTION_REQUIRED";
}

function isLegacySubscriptionActive(owner: unknown, now: Date): boolean {
  const paidUntil = getOptionalDate(owner, "paidUntil");
  return !!paidUntil && paidUntil.getTime() > now.getTime();
}

async function getOwnerServiceSubscription(ownerId: string, serviceId: string) {
  return withTimeout(
    prisma.ownerSubscription.findUnique({
      where: { ownerId_serviceId: { ownerId, serviceId } },
      select: { status: true, paidUntil: true },
    }),
    `getOwnerServiceSubscription(${ownerId}, ${serviceId})`
  );
}

function buildAccessDeniedResult(
  state: OwnerFlowState,
  serviceKey?: string,
  status?: number
): AccessDeniedResult {
  if (state === "PROFILE_REQUIRED") {
    return {
      ok: false,
      status: status ?? 403,
      message: "PROFILE_REQUIRED",
      state,
      redirectUrl: buildProfileRedirectUrl(serviceKey),
    };
  }

  if (state === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED") {
    return {
      ok: false,
      status: status ?? 403,
      message: "PHONE_VERIFICATION_REQUIRED",
      state,
      redirectUrl: buildProfileRedirectUrl(serviceKey),
    };
  }

  if (state === "SERVICE_SELECTION_REQUIRED") {
    return {
      ok: false,
      status: status ?? 403,
      message: "SERVICE_SELECTION_REQUIRED",
      state,
      redirectUrl: buildServicesPageUrl(buildBookingsPath(serviceKey), serviceKey),
    };
  }

  return {
    ok: false,
    status: status ?? 402,
    message: "SUBSCRIPTION_REQUIRED",
    state,
    redirectUrl: buildBillingRedirectUrl(serviceKey),
  };
}

async function ensureOwnerAccess(
  req: Request,
  opts?: {
    serviceKey?: string;
    requireActiveSubscription?: boolean;
  }
): Promise<AccessDeniedResult | AccessGrantedResult> {
  const serviceKey = safeServiceKey(opts?.serviceKey);

  const owner = await resolveOwnerFromRequest(req);
  const onboardingState = resolveOwnerOnboardingState(owner);

  if (onboardingState === "PROFILE_REQUIRED") {
    return buildAccessDeniedResult("PROFILE_REQUIRED", serviceKey, 403);
  }

  if (onboardingState === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED") {
    return buildAccessDeniedResult("PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED", serviceKey, 403);
  }

  if (!owner) {
    return buildAccessDeniedResult("PROFILE_REQUIRED", serviceKey, 403);
  }

  if (!serviceKey) {
    return buildAccessDeniedResult("SERVICE_SELECTION_REQUIRED", serviceKey, 403);
  }

  const service = await getActiveServiceByKey(serviceKey);
  if (!service) {
    return {
      ok: false,
      status: 404,
      message: "service not found or inactive",
      state: "SERVICE_SELECTION_REQUIRED",
    };
  }

  if (opts?.requireActiveSubscription) {
    const now = new Date();

    const sub = await getOwnerServiceSubscription(owner.id, service.id);

    const isSubActive =
      !!sub &&
      sub.status === "ACTIVE" &&
      !!sub.paidUntil &&
      sub.paidUntil.getTime() > now.getTime();

    const isLegacyActive = isLegacySubscriptionActive(owner, now);

    if (!isSubActive && !isLegacyActive) {
      return buildAccessDeniedResult("SUBSCRIPTION_REQUIRED", service.key, 402);
    }
  }

  return {
    ok: true,
    owner,
    service,
    state: "ACTIVE",
  };
}

function sendAccessDenied(res: Response, denied: AccessDeniedResult) {
  return res.status(denied.status).json({
    ok: false,
    message: denied.message,
    state: denied.state,
    ...(denied.redirectUrl ? { redirectUrl: denied.redirectUrl } : {}),
  });
}

/**
 * Queue an outbound WhatsApp message (DB message + messageJob).
 * Note: Actual send happens via worker.
 */
async function enqueueOutbound(to: string, text: string) {
  const waId = normalizePhoneToWaId(to);
  if (!waId) return;

  await prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: {
        direction: "OUTBOUND",
        status: "SEND_REQUESTED",
        waId,
        type: "text",
        body: text,
      },
      select: { id: true },
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

async function safeEnqueueOutbound(to: string, text: string) {
  try {
    await enqueueOutbound(to, text);
  } catch (e) {
    console.error("[ownerBookings] enqueueOutbound failed:", e);
  }
}

function getBookingApprovalGuidance(serviceKey: string): string[] {
  const safeKey = safeServiceKey(serviceKey);
  const guidance = BOOKING_APPROVAL_GUIDANCE_BY_SERVICE[safeKey];
  return Array.isArray(guidance) ? guidance.filter(Boolean) : [];
}

function formatMoney(value: unknown): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0 AZN";
  return `${moneyFormatter.format(num)} AZN`;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatDateOnlyAz(date: Date): string {
  return `${date.getDate()} ${AZ_MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDateTimeAz(date: Date): string {
  return `${formatDateOnlyAz(date)} saat - ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function diffCalendarDays(start: Date, end: Date): number {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.max(0, Math.round((endUtc - startUtc) / DAY_MS));
}

function getHourlyDurationHours(start: Date, end: Date): number {
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (60 * 60 * 1000)));
}

function getRentalTypeLabel(type: unknown): string {
  const normalized = String(type ?? "").trim().toUpperCase();
  switch (normalized) {
    case "HOURLY":
      return "Saatlıq";
    case "DAILY":
      return "Günlük";
    case "WEEKLY":
      return "Həftəlik";
    case "MONTHLY":
      return "Aylıq";
    case "YEARLY":
      return "İllik";
    default:
      return normalized || "-";
  }
}

function formatBookingIntervalLabel(rentalType: string, startAt: Date, endAt: Date): string {
  const type = String(rentalType ?? "").trim().toUpperCase();

  if (type === "HOURLY") {
    const hours = getHourlyDurationHours(startAt, endAt);
    return `${formatDateTimeAz(startAt)} — ${formatDateTimeAz(endAt)} (${hours} saat)`;
  }

  const days = diffCalendarDays(startAt, endAt);
  return `${formatDateOnlyAz(startAt)} — ${formatDateOnlyAz(endAt)} (${days} gün)`;
}

function buildLocationLine(property: {
  city?: string | null;
  areaName?: string | null;
  location?: string | null;
} | null): string {
  const city = normalizeSafeText(property?.city, 120);
  const areaName = normalizeSafeText(property?.areaName, 160);
  const location = normalizeSafeText(property?.location, 255);

  const cityArea = [city, areaName].filter(Boolean).join(" — ");
  if (cityArea && location) return `${cityArea} • ${location}`;
  return cityArea || location || "-";
}

function joinMessageLines(lines: Array<string | null | undefined | false>): string {
  return lines.filter((line) => typeof line === "string" && line.trim().length > 0).join("\n");
}

function buildCustomerApprovedMessage(params: {
  propertyTitle?: string | null;
  locationLine?: string;
  rentalType: string;
  startAt: Date;
  endAt: Date;
  totalPrice: number;
  serviceKey: string;
  ownerName?: string | null;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  propertyRulesText?: string | null;
}): string {
  const ownerPhone = normalizePhoneToWaId(params.ownerPhone || "") || "-";
  const ownerEmail = normalizeEmail(params.ownerEmail);
  const propertyRulesText = normalizeSafeMultilineText(params.propertyRulesText, 2000);

  return joinMessageLines([
    "Bron təsdiqləndi.",
    `Elan: ${normalizeSafeText(params.propertyTitle || "-", 200) || "-"}`,
    `Məkan: ${normalizeSafeText(params.locationLine || "-", 255) || "-"}`,
    `İcarə növü: ${getRentalTypeLabel(params.rentalType)}`,
    `Tarix / saat aralığı: ${formatBookingIntervalLabel(params.rentalType, params.startAt, params.endAt)}`,
    `Qiymət: ${formatMoney(params.totalPrice)}`,
    propertyRulesText ? `Elan haqqında:\n${propertyRulesText}` : null,
    "",
    "Elan sahibinin əlaqə məlumatları açıldı:",
    `Ad: ${normalizeSafeText(params.ownerName || "-", 160) || "-"}`,
    `Telefon: ${ownerPhone}`,
    ownerEmail ? `E-poçt: ${ownerEmail}` : null,
    ...(getBookingApprovalGuidance(params.serviceKey).length > 0
      ? ["", ...getBookingApprovalGuidance(params.serviceKey)]
      : []),
  ]);
}

function buildOwnerApprovedMessage(params: {
  propertyTitle?: string | null;
  locationLine?: string;
  rentalType: string;
  startAt: Date;
  endAt: Date;
  totalPrice: number;
  customerPhone?: string | null;
}): string {
  return joinMessageLines([
    "Bron sorğusu təsdiqləndi.",
    `Elan: ${normalizeSafeText(params.propertyTitle || "-", 200) || "-"}`,
    `Məkan: ${normalizeSafeText(params.locationLine || "-", 255) || "-"}`,
    `İcarə növü: ${getRentalTypeLabel(params.rentalType)}`,
    `Tarix / saat aralığı: ${formatBookingIntervalLabel(params.rentalType, params.startAt, params.endAt)}`,
    `Qiymət: ${formatMoney(params.totalPrice)}`,
    "",
    "Müştərinin əlaqə məlumatları açıldı:",
    `Telefon: ${normalizePhoneToWaId(params.customerPhone || "") || "-"}`,
  ]);
}

function buildCustomerRejectedMessage(params: {
  propertyTitle?: string | null;
  locationLine?: string;
  rentalType: string;
  startAt: Date;
  endAt: Date;
}): string {
  return joinMessageLines([
    "Bron sorğunuz rədd edildi.",
    `Elan: ${normalizeSafeText(params.propertyTitle || "-", 200) || "-"}`,
    `Məkan: ${normalizeSafeText(params.locationLine || "-", 255) || "-"}`,
    `İcarə növü: ${getRentalTypeLabel(params.rentalType)}`,
    `Tarix / saat aralığı: ${formatBookingIntervalLabel(params.rentalType, params.startAt, params.endAt)}`,
  ]);
}

function buildOwnerRejectedMessage(params: {
  propertyTitle?: string | null;
  locationLine?: string;
  rentalType: string;
  startAt: Date;
  endAt: Date;
}): string {
  return joinMessageLines([
    "Bron sorğusu rədd edildi.",
    `Elan: ${normalizeSafeText(params.propertyTitle || "-", 200) || "-"}`,
    `Məkan: ${normalizeSafeText(params.locationLine || "-", 255) || "-"}`,
    `İcarə növü: ${getRentalTypeLabel(params.rentalType)}`,
    `Tarix / saat aralığı: ${formatBookingIntervalLabel(params.rentalType, params.startAt, params.endAt)}`,
  ]);
}

/**
 * GET /owner/bookings?status=PENDING&serviceKey=RENT_HOME
 * Owner panel üçün booking list
 */
ownerBookingsRouter.get("/bookings", async (req: Request, res: Response) => {
  try {
    const serviceKey = safeServiceKey(req.query.serviceKey);
    const status = String(req.query.status ?? "PENDING").trim().toUpperCase();

    if (!(ALLOWED_BOOKING_STATUSES as readonly string[]).includes(status)) {
      return bad(res, "invalid status filter");
    }

    const access = await ensureOwnerAccess(req, {
      serviceKey,
      requireActiveSubscription: true,
    });

    if (!access.ok) {
      return sendAccessDenied(res, access);
    }

    const rows = await withTimeout(
      prisma.booking.findMany({
        where: {
          status: status as any,
          property: {
            ownerId: access.owner.id,
            serviceId: access.service.id,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          status: true,
          rentalType: true,
          startAt: true,
          endAt: true,
          totalPrice: true,
          expiresAt: true,
          property: {
            select: {
              id: true,
              title: true,
              city: true,
              areaName: true,
              roomCount: true,
            },
          },
        },
      }),
      `${requestLabel(req)} booking.findMany`
    );

    return res.json({
      ok: true,
      state: access.state,
      items: rows,
    });
  } catch (e: any) {
    console.error("[ownerBookings] list error:", e);
    return res.status(500).json({
      ok: false,
      message: e?.message ?? "INTERNAL_ERROR",
    });
  }
});

async function getOwnedBookingForAction(
  req: Request,
  bookingId: string,
  serviceKey: string
): Promise<
  | { ok: false; denied: AccessDeniedResult }
  | {
      ok: true;
      owner: any;
      service: { id: string; key: string; isActive: boolean };
      booking: {
        id: string;
        status: string;
        expiresAt: Date | null;
        customerPhone: string | null;
        rentalType: string;
        startAt: Date;
        endAt: Date;
        totalPrice: number;
        property: {
          title: string | null;
          city: string | null;
          areaName: string | null;
          location: string | null;
          rulesText: string | null;
          owner: {
            name: string | null;
            phone: string | null;
            email: string | null;
          } | null;
        } | null;
      };
    }
> {
  const access = await ensureOwnerAccess(req, {
    serviceKey,
    requireActiveSubscription: true,
  });

  if (!access.ok) {
    return { ok: false, denied: access };
  }

  const booking = await withTimeout(
    prisma.booking.findFirst({
      where: {
        id: bookingId,
        property: {
          ownerId: access.owner.id,
          serviceId: access.service.id,
        },
      },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        customerPhone: true,
        rentalType: true,
        startAt: true,
        endAt: true,
        totalPrice: true,
        property: {
          select: {
            title: true,
            city: true,
            areaName: true,
            location: true,
            rulesText: true,
            owner: {
              select: {
                name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
    }),
    `getOwnedBookingForAction(${bookingId})`
  );

  if (!booking) {
    return {
      ok: false,
      denied: {
        ok: false,
        status: 404,
        message: "BOOKING_NOT_FOUND",
        state: "ACTIVE",
      },
    };
  }

  return {
    ok: true,
    owner: access.owner,
    service: access.service,
    booking,
  };
}

/**
 * POST /owner/bookings/:id/approve?serviceKey=RENT_HOME
 */
ownerBookingsRouter.post("/bookings/:id/approve", async (req: Request, res: Response) => {
  try {
    const id = sanitizeIdParam(req.params.id);
    const serviceKey = safeServiceKey(req.query.serviceKey);

    if (!id) return bad(res, "missing id");
    if (!serviceKey) {
      return sendAccessDenied(
        res,
        buildAccessDeniedResult("SERVICE_SELECTION_REQUIRED", serviceKey, 403)
      );
    }

    const resolved = await getOwnedBookingForAction(req, id, serviceKey);
    if (!resolved.ok) {
      return sendAccessDenied(res, resolved.denied);
    }

    const b = resolved.booking;

    if (b.status !== "PENDING") {
      return res.status(409).json({
        ok: false,
        message: "BOOKING_ALREADY_PROCESSED",
        state: "ACTIVE",
      });
    }

    if (b.expiresAt && b.expiresAt.getTime() <= Date.now()) {
      return res.status(409).json({
        ok: false,
        message: "BOOKING_EXPIRED",
        state: "ACTIVE",
      });
    }

    const updated = await withTimeout(
      prisma.booking.updateMany({
        where: {
          id,
          status: "PENDING" as any,
        },
        data: {
          status: "APPROVED" as any,
        },
      }),
      `${requestLabel(req)} booking.updateMany(APPROVED)`
    );

    if (updated.count === 0) {
      return res.status(409).json({
        ok: false,
        message: "BOOKING_ALREADY_PROCESSED",
        state: "ACTIVE",
      });
    }

    const propertyTitle = b.property?.title ?? "-";
    const locationLine = buildLocationLine(b.property);

    const customerWaId = normalizePhoneToWaId(b.customerPhone ?? "");
    if (customerWaId) {
      void safeEnqueueOutbound(
        customerWaId,
        buildCustomerApprovedMessage({
          propertyTitle,
          locationLine,
          rentalType: b.rentalType,
          startAt: b.startAt,
          endAt: b.endAt,
          totalPrice: b.totalPrice,
          serviceKey: resolved.service.key,
          ownerName: b.property?.owner?.name ?? "-",
          ownerPhone: b.property?.owner?.phone ?? "",
          ownerEmail: b.property?.owner?.email ?? "",
          propertyRulesText: b.property?.rulesText ?? "",
        })
      );
    }

    const ownerWaId = normalizePhoneToWaId(b.property?.owner?.phone ?? "");
    if (ownerWaId) {
      void safeEnqueueOutbound(
        ownerWaId,
        buildOwnerApprovedMessage({
          propertyTitle,
          locationLine,
          rentalType: b.rentalType,
          startAt: b.startAt,
          endAt: b.endAt,
          totalPrice: b.totalPrice,
          customerPhone: b.customerPhone ?? "",
        })
      );
    }

    return res.json({
      ok: true,
      state: "ACTIVE",
      booking: {
        id: b.id,
        status: "APPROVED",
      },
    });
  } catch (e: any) {
    console.error("[ownerBookings] approve error:", e);
    return res.status(500).json({
      ok: false,
      message: e?.message ?? "INTERNAL_ERROR",
    });
  }
});

/**
 * POST /owner/bookings/:id/reject?serviceKey=RENT_HOME
 */
ownerBookingsRouter.post("/bookings/:id/reject", async (req: Request, res: Response) => {
  try {
    const id = sanitizeIdParam(req.params.id);
    const serviceKey = safeServiceKey(req.query.serviceKey);

    if (!id) return bad(res, "missing id");
    if (!serviceKey) {
      return sendAccessDenied(
        res,
        buildAccessDeniedResult("SERVICE_SELECTION_REQUIRED", serviceKey, 403)
      );
    }

    const resolved = await getOwnedBookingForAction(req, id, serviceKey);
    if (!resolved.ok) {
      return sendAccessDenied(res, resolved.denied);
    }

    const b = resolved.booking;

    if (b.status !== "PENDING") {
      return res.status(409).json({
        ok: false,
        message: "BOOKING_ALREADY_PROCESSED",
        state: "ACTIVE",
      });
    }

    const updated = await withTimeout(
      prisma.booking.updateMany({
        where: {
          id,
          status: "PENDING" as any,
        },
        data: {
          status: "REJECTED" as any,
        },
      }),
      `${requestLabel(req)} booking.updateMany(REJECTED)`
    );

    if (updated.count === 0) {
      return res.status(409).json({
        ok: false,
        message: "BOOKING_ALREADY_PROCESSED",
        state: "ACTIVE",
      });
    }

    const propertyTitle = b.property?.title ?? "-";
    const locationLine = buildLocationLine(b.property);

    const customerWaId = normalizePhoneToWaId(b.customerPhone ?? "");
    if (customerWaId) {
      void safeEnqueueOutbound(
        customerWaId,
        buildCustomerRejectedMessage({
          propertyTitle,
          locationLine,
          rentalType: b.rentalType,
          startAt: b.startAt,
          endAt: b.endAt,
        })
      );
    }

    const ownerWaId = normalizePhoneToWaId(b.property?.owner?.phone ?? "");
    if (ownerWaId) {
      void safeEnqueueOutbound(
        ownerWaId,
        buildOwnerRejectedMessage({
          propertyTitle,
          locationLine,
          rentalType: b.rentalType,
          startAt: b.startAt,
          endAt: b.endAt,
        })
      );
    }

    return res.json({
      ok: true,
      state: "ACTIVE",
      booking: {
        id: b.id,
        status: "REJECTED",
      },
    });
  } catch (e: any) {
    console.error("[ownerBookings] reject error:", e);
    return res.status(500).json({
      ok: false,
      message: e?.message ?? "INTERNAL_ERROR",
    });
  }
});