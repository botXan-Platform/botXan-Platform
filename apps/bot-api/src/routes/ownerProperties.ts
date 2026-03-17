// apps/bot-api/src/routes/ownerProperties.ts

import { Router, type NextFunction, type Request, type Response } from "express";
import prisma from "db";
import { Prisma } from "@prisma/client";
import { createHash } from "crypto";

export const ownerPropertiesRouter = Router();

const DB_TIMEOUT_MS = 5000;
const MAX_PROPERTY_IMAGES = 30;
const MAX_IMAGE_URL_LENGTH = 2048;
const MAX_TITLE_LENGTH = 160;
const MAX_CITY_LENGTH = 120;
const MAX_AREA_NAME_LENGTH = 160;
const MAX_LOCATION_LENGTH = 255;
const MAX_LOCATION_PLACE_ID_LENGTH = 255;
const MAX_RULES_TEXT_LENGTH = 5000;

const OWNER_PHONE_VERIFICATION_TOKEN_PREFIX = "OWNER_PHONE_VERIFICATION_V1:";

type OwnerFlowState =
  | "PROFILE_REQUIRED"
  | "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED"
  | "SERVICE_SELECTION_REQUIRED"
  | "SUBSCRIPTION_REQUIRED"
  | "ACTIVE";

type AccessDeniedResult = {
  ok: false;
  status: number;
  message: OwnerFlowState | "service not found or inactive" | "PROPERTY_NOT_FOUND";
  state: OwnerFlowState;
  redirectUrl?: string;
};

type AccessGrantedResult = {
  ok: true;
  owner: any;
  service: { id: string; key: string; isActive: boolean } | null;
  state: OwnerFlowState;
};

type PropertyLocationSource = "MANUAL" | "CURRENT_DEVICE" | "MAP_PICKER";
type PropertyDeleteMode = "HARD" | "SOFT";

type PropertyWithRelations = Prisma.PropertyGetPayload<{
  include: {
    pricings: true;
    images: true;
    service: {
      select: { id: true; key: true };
    };
  };
}>;

type OwnerResolveCriteria = {
  ownerIdCandidates: string[];
  emailCandidates: string[];
  phoneVariants: string[];
  phoneDigitsCandidates: string[];
};

type OwnerVerificationSnapshot = {
  phoneVerified: boolean;
  phoneVerifiedAt: Date | null;
  phoneVerificationStatus: "REQUIRED" | "SENT" | "VERIFIED" | "EXPIRED" | "FAILED";
  pendingPhone: string | null;
};

type PersistedPhoneVerificationPayload = {
  version: 1;
  kind: "OWNER_PHONE_VERIFICATION";
  phoneHash: string;
  status: OwnerVerificationSnapshot["phoneVerificationStatus"];
  otpHash: string | null;
  attempts: number;
  lastSentAt: string | null;
  verifiedAt: string | null;
  nonce: string;
};

type PersistedPhoneVerificationToken = {
  id: string;
  ownerId: string;
  createdAt: Date;
  expiresAt: Date;
  payload: PersistedPhoneVerificationPayload;
};

type CountryConfig = {
  iso2: string;
  dial: string;
  minNationalLength: number;
  maxNationalLength: number;
  allowedNationalPrefixes?: string[];
};

const COUNTRIES: CountryConfig[] = [
  {
    iso2: "AZ",
    dial: "+994",
    minNationalLength: 9,
    maxNationalLength: 9,
    allowedNationalPrefixes: ["10", "50", "51", "55", "70", "77", "99"],
  },
  { iso2: "TR", dial: "+90", minNationalLength: 10, maxNationalLength: 10 },
  { iso2: "GE", dial: "+995", minNationalLength: 9, maxNationalLength: 9 },
  { iso2: "RU", dial: "+7", minNationalLength: 10, maxNationalLength: 10 },
  { iso2: "UA", dial: "+380", minNationalLength: 9, maxNationalLength: 9 },
  { iso2: "KZ", dial: "+7", minNationalLength: 10, maxNationalLength: 10 },
  { iso2: "AE", dial: "+971", minNationalLength: 9, maxNationalLength: 9 },
  { iso2: "SA", dial: "+966", minNationalLength: 9, maxNationalLength: 9 },
  { iso2: "DE", dial: "+49", minNationalLength: 10, maxNationalLength: 11 },
  { iso2: "FR", dial: "+33", minNationalLength: 9, maxNationalLength: 9 },
  { iso2: "GB", dial: "+44", minNationalLength: 10, maxNationalLength: 10 },
  { iso2: "US", dial: "+1", minNationalLength: 10, maxNationalLength: 10 },
];

function bad(
  res: Response,
  message: string,
  status = 400,
  extra?: Record<string, unknown>
) {
  return res.status(status).json({ ok: false, message, ...(extra || {}) });
}

function digitsOnly(input: string): string {
  return String(input || "").replace(/[^\d]/g, "");
}

function toPositiveIntOrNull(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;

  const n = Number(value);
  if (!Number.isFinite(n)) return null;

  const x = Math.trunc(n);
  if (x <= 0) return null;
  return x;
}

function toFiniteNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toIntegerOrNull(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function normServiceKey(v: unknown) {
  const value = String(v ?? "").trim().toUpperCase();
  if (!value) return "";
  if (!/^[A-Z0-9_-]{2,64}$/.test(value)) return "";
  return value;
}

function normalizeString(v: unknown) {
  return String(v ?? "").trim();
}

function normalizeMultilineText(v: unknown) {
  return String(v ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function normalizeAsciiHeaderValue(value: unknown): string {
  const raw = String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim();

  if (!raw) return "";

  let out = "";
  for (const ch of raw) {
    const code = ch.charCodeAt(0);
    if (code >= 0x20 && code <= 0x7e) {
      out += ch;
    }
  }

  return out.trim();
}

function normalizePhone(input: unknown): string {
  const raw = String(input ?? "").trim();
  if (!raw) return "";

  const digits = digitsOnly(raw);
  if (!digits) return "";

  return `+${digits}`;
}

function normalizeEmail(input: unknown): string {
  return String(input ?? "").trim().toLowerCase();
}

function normalizeIso2(input: unknown): string {
  return String(input ?? "").trim().toUpperCase();
}

function findCountryByIso2(iso2: unknown): CountryConfig | null {
  const normalized = normalizeIso2(iso2);
  return COUNTRIES.find((c) => c.iso2 === normalized) || null;
}

function findCountryByE164(phone: string): CountryConfig | null {
  const cleaned = `+${digitsOnly(phone)}`;
  if (!cleaned || cleaned === "+") return null;

  const sorted = [...COUNTRIES].sort(
    (a, b) => digitsOnly(b.dial).length - digitsOnly(a.dial).length
  );

  for (const country of sorted) {
    const dialDigits = digitsOnly(country.dial);
    if (digitsOnly(cleaned).startsWith(dialDigits)) {
      return country;
    }
  }

  return null;
}

function stripLeadingZeros(value: string) {
  return value.replace(/^0+/, "");
}

function isValidE164(phone: string) {
  return /^\+[1-9]\d{7,14}$/.test(String(phone || "").trim());
}

function normalizePhoneToE164(input: unknown, phoneCountryIso2?: unknown): string {
  const raw = String(input ?? "").trim();
  if (!raw) return "";

  if (raw.startsWith("+")) {
    const normalized = `+${digitsOnly(raw)}`;
    return isValidE164(normalized) ? normalized : "";
  }

  const digits = digitsOnly(raw);
  if (!digits) return "";

  if (digits.startsWith("00")) {
    const normalized = `+${digits.slice(2)}`;
    return isValidE164(normalized) ? normalized : "";
  }

  const country = findCountryByIso2(phoneCountryIso2);
  if (country) {
    const countryDialDigits = digitsOnly(country.dial);

    if (digits.startsWith(countryDialDigits)) {
      const normalized = `+${digits}`;
      return isValidE164(normalized) ? normalized : "";
    }

    const nationalDigits = stripLeadingZeros(digits);
    if (nationalDigits) {
      const normalized = `+${countryDialDigits}${nationalDigits}`;
      if (isValidE164(normalized)) return normalized;
    }
  }

  if (digits.startsWith("994")) {
    const normalized = `+${digits}`;
    return isValidE164(normalized) ? normalized : "";
  }

  if ((digits.length === 10 && digits.startsWith("0")) || digits.length === 9) {
    const normalized = `+994${stripLeadingZeros(digits)}`;
    return isValidE164(normalized) ? normalized : "";
  }

  const generic = `+${digits}`;
  return isValidE164(generic) ? generic : "";
}

function getPhoneVariants(phone: string): string[] {
  const normalized = normalizePhone(phone);
  if (!normalized) return [];

  const digits = digitsOnly(normalized);
  if (!digits) return [];

  const variants = new Set<string>();
  const last9 = digits.length >= 9 ? digits.slice(-9) : "";

  variants.add(`+${digits}`);
  variants.add(digits);

  if (last9) {
    variants.add(last9);
    variants.add(`+${last9}`);
    variants.add(`0${last9}`);
    variants.add(`+0${last9}`);
    variants.add(`994${last9}`);
    variants.add(`+994${last9}`);
  }

  if (digits.startsWith("0") && digits.length === 10) {
    variants.add(digits.slice(1));
    variants.add(`+${digits.slice(1)}`);
    variants.add(`994${digits.slice(1)}`);
    variants.add(`+994${digits.slice(1)}`);
  }

  if (digits.startsWith("994") && digits.length === 12) {
    variants.add(`0${digits.slice(3)}`);
    variants.add(`+0${digits.slice(3)}`);
  }

  return [...variants].filter(Boolean);
}

function getPhoneDigitsVariants(input: unknown): string[] {
  const variants = new Set<string>();

  for (const value of getPhoneVariants(String(input ?? ""))) {
    const digits = digitsOnly(value);
    if (!digits) continue;

    variants.add(digits);

    if (digits.length >= 9) {
      variants.add(digits.slice(-9));
    }

    if (digits.startsWith("994") && digits.length === 12) {
      variants.add(`0${digits.slice(3)}`);
    }
  }

  return [...variants].filter(Boolean);
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

function buildServicesPageUrl(serviceKey?: string): string {
  const safeKey = normServiceKey(serviceKey);
  const params = new URLSearchParams();

  if (safeKey) {
    params.set("serviceKey", safeKey);
  }

  return `${getWebAppBaseUrl()}/services${params.toString() ? `?${params.toString()}` : ""}`;
}

function buildProfileRedirectUrl(serviceKey?: string): string {
  const safeKey = normServiceKey(serviceKey);
  const nextPathParams = new URLSearchParams();

  if (safeKey) {
    nextPathParams.set("serviceKey", safeKey);
  }

  const nextPath = `/services${nextPathParams.toString() ? `?${nextPathParams.toString()}` : ""}`;
  const params = new URLSearchParams();

  params.set("next", nextPath);

  if (safeKey) {
    params.set("serviceKey", safeKey);
  }

  return `${getWebAppBaseUrl()}/profile?${params.toString()}`;
}

function buildServicesBillingRedirectUrl(serviceKey: string): string {
  const safeKey = normServiceKey(serviceKey);
  const nextParams = new URLSearchParams();

  if (safeKey) {
    nextParams.set("serviceKey", safeKey);
  }

  const nextPath = `/billing${nextParams.toString() ? `?${nextParams.toString()}` : ""}`;

  const params = new URLSearchParams();
  params.set("next", nextPath);

  if (safeKey) {
    params.set("serviceKey", safeKey);
  }

  return `${getWebAppBaseUrl()}/services?${params.toString()}`;
}

function attachResolvedServiceKey(req: Request, _res: Response, next: NextFunction) {
  const bodyServiceKey = normServiceKey(req.body?.serviceKey);
  const queryServiceKey = normServiceKey(req.query?.serviceKey);

  const resolvedServiceKey = queryServiceKey || bodyServiceKey;

  if (resolvedServiceKey) {
    req.query.serviceKey = resolvedServiceKey;
    if (req.body && typeof req.body === "object") {
      req.body.serviceKey = resolvedServiceKey;
    }
  }

  next();
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function hasOwn(value: unknown, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(asRecord(value), key);
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

function toValidDateOrNull(input: unknown): Date | null {
  if (!input) return null;

  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }

  const parsed = new Date(String(input));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function hasOwnerCoreProfile(owner: unknown): boolean {
  const name = getOptionalString(owner, "name");
  const email = normalizeEmail(getOptionalString(owner, "email"));
  const phone = normalizePhone(getOptionalString(owner, "phone"));

  return !!name && !!email && !!phone;
}

function getDbVerificationSnapshot(owner: unknown): OwnerVerificationSnapshot {
  const explicitVerified = getOptionalBoolean(owner, "phoneVerified");
  const verifiedAt = getOptionalDate(owner, "phoneVerifiedAt");
  const status = getOptionalString(owner, "phoneVerificationStatus").toUpperCase();

  if (
    explicitVerified === true ||
    verifiedAt ||
    ["VERIFIED", "APPROVED", "CONFIRMED", "SUCCESS"].includes(status)
  ) {
    return {
      phoneVerified: true,
      phoneVerifiedAt: verifiedAt,
      phoneVerificationStatus: "VERIFIED",
      pendingPhone: getOptionalString(owner, "pendingPhone") || null,
    };
  }

  if (status === "SENT") {
    return {
      phoneVerified: false,
      phoneVerifiedAt: null,
      phoneVerificationStatus: "SENT",
      pendingPhone: getOptionalString(owner, "pendingPhone") || null,
    };
  }

  if (status === "EXPIRED") {
    return {
      phoneVerified: false,
      phoneVerifiedAt: null,
      phoneVerificationStatus: "EXPIRED",
      pendingPhone: getOptionalString(owner, "pendingPhone") || null,
    };
  }

  if (status === "FAILED") {
    return {
      phoneVerified: false,
      phoneVerifiedAt: null,
      phoneVerificationStatus: "FAILED",
      pendingPhone: getOptionalString(owner, "pendingPhone") || null,
    };
  }

  return {
    phoneVerified: false,
    phoneVerifiedAt: null,
    phoneVerificationStatus: "REQUIRED",
    pendingPhone: getOptionalString(owner, "pendingPhone") || null,
  };
}

function hashPhoneFingerprint(phone: string): string {
  const normalized = normalizePhoneToE164(phone) || normalizeString(phone);
  return createHash("sha256").update(normalized).digest("hex");
}

function decodeVerificationTokenPayload(code: string): PersistedPhoneVerificationPayload | null {
  const raw = String(code ?? "");
  if (!raw.startsWith(OWNER_PHONE_VERIFICATION_TOKEN_PREFIX)) return null;

  try {
    const encoded = raw.slice(OWNER_PHONE_VERIFICATION_TOKEN_PREFIX.length);
    const parsed = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));

    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.version !== 1 || parsed.kind !== "OWNER_PHONE_VERIFICATION") return null;
    if (typeof parsed.phoneHash !== "string" || !parsed.phoneHash) return null;

    if (
      !["REQUIRED", "SENT", "VERIFIED", "EXPIRED", "FAILED"].includes(
        String(parsed.status || "")
      )
    ) {
      return null;
    }

    return {
      version: 1,
      kind: "OWNER_PHONE_VERIFICATION",
      phoneHash: String(parsed.phoneHash),
      status: parsed.status,
      otpHash: typeof parsed.otpHash === "string" && parsed.otpHash ? parsed.otpHash : null,
      attempts:
        Number.isFinite(parsed.attempts) && Number(parsed.attempts) >= 0
          ? Math.trunc(Number(parsed.attempts))
          : 0,
      lastSentAt:
        typeof parsed.lastSentAt === "string" && parsed.lastSentAt ? parsed.lastSentAt : null,
      verifiedAt:
        typeof parsed.verifiedAt === "string" && parsed.verifiedAt ? parsed.verifiedAt : null,
      nonce: typeof parsed.nonce === "string" && parsed.nonce ? parsed.nonce : "",
    };
  } catch {
    return null;
  }
}

function buildSnapshotFromPersistedToken(
  phoneE164: string,
  token: PersistedPhoneVerificationToken
): OwnerVerificationSnapshot {
  const expiresAtMs = token.expiresAt.getTime();
  const verifiedAt = toValidDateOrNull(token.payload.verifiedAt);
  const normalizedPhone = normalizePhoneToE164(phoneE164) || normalizeString(phoneE164);

  if (token.payload.status === "VERIFIED") {
    return {
      phoneVerified: true,
      phoneVerifiedAt: verifiedAt || token.createdAt,
      phoneVerificationStatus: "VERIFIED",
      pendingPhone: null,
    };
  }

  const status: OwnerVerificationSnapshot["phoneVerificationStatus"] =
    token.payload.status === "SENT" && expiresAtMs <= Date.now()
      ? "EXPIRED"
      : token.payload.status;

  return {
    phoneVerified: false,
    phoneVerifiedAt: null,
    phoneVerificationStatus: status,
    pendingPhone: normalizedPhone || null,
  };
}

async function findPersistedVerificationToken(
  ownerId: string,
  phoneE164: string
): Promise<PersistedPhoneVerificationToken | null> {
  const normalizedOwnerId = normalizeString(ownerId);
  const normalizedPhone = normalizePhoneToE164(phoneE164) || normalizeString(phoneE164);

  if (!normalizedOwnerId || !normalizedPhone) {
    return null;
  }

  const phoneHash = hashPhoneFingerprint(normalizedPhone);

  const tokens = await withTimeout(
    prisma.ownerToken.findMany({
      where: {
        ownerId: normalizedOwnerId,
        isActive: true,
        code: { startsWith: OWNER_PHONE_VERIFICATION_TOKEN_PREFIX },
      },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        ownerId: true,
        createdAt: true,
        expiresAt: true,
        code: true,
      },
      take: 10,
    }),
    "ownerProperties.findPersistedVerificationToken"
  );

  for (const token of tokens) {
    const payload = decodeVerificationTokenPayload(token.code);
    if (!payload) continue;
    if (payload.phoneHash !== phoneHash) continue;

    return {
      id: token.id,
      ownerId: token.ownerId,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
      payload,
    };
  }

  return null;
}

async function getEffectiveOwnerVerificationSnapshot(
  owner: unknown
): Promise<OwnerVerificationSnapshot> {
  const record = asRecord(owner);
  const ownerId = normalizeString(record.id);
  const ownerPhone = normalizePhoneToE164(record.phone) || normalizeString(record.phone);

  if (!ownerId || !ownerPhone) {
    return getDbVerificationSnapshot(owner);
  }

  const token = await findPersistedVerificationToken(ownerId, ownerPhone);
  if (!token) {
    return getDbVerificationSnapshot(owner);
  }

  return buildSnapshotFromPersistedToken(ownerPhone, token);
}

async function resolveOwnerOnboardingState(owner: unknown): Promise<OwnerFlowState> {
  if (!owner) return "PROFILE_REQUIRED";
  if (!hasOwnerCoreProfile(owner)) return "PROFILE_REQUIRED";

  const verification = await getEffectiveOwnerVerificationSnapshot(owner);
  if (!verification.phoneVerified) {
    return "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED";
  }

  return "SERVICE_SELECTION_REQUIRED";
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
      message: "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED",
      state,
      redirectUrl: buildProfileRedirectUrl(serviceKey),
    };
  }

  if (state === "SUBSCRIPTION_REQUIRED") {
    return {
      ok: false,
      status: status ?? 402,
      message: "SUBSCRIPTION_REQUIRED",
      state,
      redirectUrl: serviceKey ? buildServicesBillingRedirectUrl(serviceKey) : buildServicesPageUrl(),
    };
  }

  return {
    ok: false,
    status: status ?? 403,
    message: state,
    state,
  };
}

function buildOwnerResolveCriteria(req: Request): OwnerResolveCriteria {
  const headerOwnerIdRaw = req.headers["x-owner-id"] || req.headers["x-ownerid"];
  const queryOwnerId = normalizeString(req.query?.ownerId);
  const bodyOwnerId = normalizeString(req.body?.ownerId);

  const ownerIdCandidates = [headerOwnerIdRaw, queryOwnerId, bodyOwnerId]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => normalizeAsciiHeaderValue(value))
    .filter(Boolean);

  const headerPhoneRaw = req.headers["x-owner-phone"] || req.headers["x-ownerphone"];
  const queryPhone = normalizePhone(req.query?.phone);
  const bodyPhone = normalizePhone(req.body?.phone);

  const phoneCandidates = [headerPhoneRaw, queryPhone, bodyPhone]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => normalizePhone(value))
    .filter(Boolean);

  const phoneVariants = new Set<string>();
  const phoneDigitsCandidates = new Set<string>();

  for (const candidate of phoneCandidates) {
    for (const variant of getPhoneVariants(candidate)) {
      phoneVariants.add(variant);
    }
    for (const digits of getPhoneDigitsVariants(candidate)) {
      phoneDigitsCandidates.add(digits);
    }
  }

  const headerEmailRaw = req.headers["x-owner-email"] || req.headers["x-owneremail"];
  const queryEmail = normalizeEmail(req.query?.email);
  const bodyEmail = normalizeEmail(req.body?.email);

  const emailCandidates = [headerEmailRaw, queryEmail, bodyEmail]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => normalizeEmail(value))
    .filter(Boolean);

  return {
    ownerIdCandidates,
    emailCandidates,
    phoneVariants: [...phoneVariants],
    phoneDigitsCandidates: [...phoneDigitsCandidates],
  };
}

function scoreResolvedOwner(owner: any, criteria: OwnerResolveCriteria): number {
  let score = 0;

  const ownerId = normalizeAsciiHeaderValue(owner?.id);
  const ownerEmail = normalizeEmail(owner?.email);
  const ownerPhoneVariants = getPhoneVariants(owner?.phone);
  const ownerPhoneDigitsVariants = getPhoneDigitsVariants(owner?.phone);

  if (ownerId && criteria.ownerIdCandidates.includes(ownerId)) {
    score += 40;
  }

  if (ownerEmail && criteria.emailCandidates.includes(ownerEmail)) {
    score += 60;
  }

  if (
    ownerPhoneVariants.some((phone) => criteria.phoneVariants.includes(phone)) ||
    ownerPhoneDigitsVariants.some((digits) => criteria.phoneDigitsCandidates.includes(digits))
  ) {
    score += 80;
  }

  if (hasOwnerCoreProfile(owner)) {
    score += 5;
  }

  return score;
}

function buildOwnerSearchWhere(criteria: OwnerResolveCriteria) {
  const or: Prisma.OwnerWhereInput[] = [];

  if (criteria.ownerIdCandidates.length > 0) {
    or.push({ id: { in: criteria.ownerIdCandidates } });
  }

  if (criteria.emailCandidates.length > 0) {
    or.push({ email: { in: criteria.emailCandidates } });
  }

  for (const phone of criteria.phoneVariants) {
    or.push({ phone });
  }

  for (const digits of criteria.phoneDigitsCandidates) {
    or.push({ phone: { endsWith: digits } });
  }

  return or;
}

async function resolveOwnerFromRequest(req: Request) {
  const criteria = buildOwnerResolveCriteria(req);
  const whereOr = buildOwnerSearchWhere(criteria);

  if (whereOr.length === 0) {
    return null;
  }

  const candidates = await withTimeout(
    prisma.owner.findMany({
      where: { OR: whereOr },
      take: 25,
      orderBy: { createdAt: "desc" },
    }),
    "resolveOwnerFromRequest.findMany"
  );

  if (!candidates.length) {
    return null;
  }

  const ranked = candidates
    .map((owner: any) => ({
      owner,
      score: scoreResolvedOwner(owner, criteria),
      createdAtMs:
        owner?.createdAt instanceof Date && !Number.isNaN(owner.createdAt.getTime())
          ? owner.createdAt.getTime()
          : 0,
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.createdAtMs - a.createdAtMs;
    });

  return ranked[0]?.owner ?? null;
}

function isActiveSubscription(status: string, paidUntil: Date | null, now: Date) {
  return status === "ACTIVE" && !!paidUntil && paidUntil.getTime() > now.getTime();
}

function getSubscriptionSortBucket(
  status: string,
  tier: "STANDARD" | "PREMIUM",
  paidUntil: Date | null,
  now: Date
) {
  if (!isActiveSubscription(status, paidUntil, now)) {
    return 3;
  }

  if (tier === "PREMIUM") {
    return 1;
  }

  return 2;
}

async function getOwnerServiceSubscription(ownerId: string, serviceId: string) {
  return withTimeout(
    prisma.ownerSubscription.findUnique({
      where: { ownerId_serviceId: { ownerId, serviceId } },
      select: { status: true, paidUntil: true, tier: true },
    }),
    `getOwnerServiceSubscription(${ownerId}, ${serviceId})`
  );
}

function getLegacyPaidUntil(owner: unknown): Date | null {
  return getOptionalDate(owner, "paidUntil");
}

function isLegacySubscriptionActive(owner: unknown, now: Date): boolean {
  const paidUntil = getLegacyPaidUntil(owner);
  return !!paidUntil && paidUntil.getTime() > now.getTime();
}

async function ensureOwnerAccess(
  req: Request,
  opts?: {
    serviceKey?: string;
    requireActiveSubscription?: boolean;
  }
): Promise<AccessDeniedResult | AccessGrantedResult> {
  const serviceKey = normServiceKey(opts?.serviceKey);

  const owner = await resolveOwnerFromRequest(req);
  const onboardingState = await resolveOwnerOnboardingState(owner);

  if (onboardingState === "PROFILE_REQUIRED") {
    return buildAccessDeniedResult("PROFILE_REQUIRED", serviceKey, 403);
  }

  if (onboardingState === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED") {
    return buildAccessDeniedResult("PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED", serviceKey, 403);
  }

  if (!owner) {
    return buildAccessDeniedResult("PROFILE_REQUIRED", serviceKey, 403);
  }

  let service: { id: string; key: string; isActive: boolean } | null = null;

  if (serviceKey) {
    service = await getActiveServiceByKey(serviceKey);
    if (!service) {
      return {
        ok: false,
        status: 404,
        message: "service not found or inactive",
        state: "SERVICE_SELECTION_REQUIRED",
      };
    }
  }

  if (opts?.requireActiveSubscription && service) {
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

    return {
      ok: true,
      owner,
      service,
      state: "ACTIVE",
    };
  }

  return {
    ok: true,
    owner,
    service,
    state: service ? "ACTIVE" : "SERVICE_SELECTION_REQUIRED",
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

function buildPricingCreateInputs(
  propertyId: string,
  prices: {
    priceHour: number | null;
    priceDay: number | null;
    priceWeek: number | null;
    priceMonth: number | null;
    priceYear: number | null;
  }
): Prisma.PropertyPricingCreateManyInput[] {
  const out: Prisma.PropertyPricingCreateManyInput[] = [];

  if (prices.priceHour !== null) {
    out.push({
      propertyId,
      type: "HOURLY",
      unitPrice: prices.priceHour,
      depositRequired: true,
    });
  }

  if (prices.priceDay !== null) {
    out.push({
      propertyId,
      type: "DAILY",
      unitPrice: prices.priceDay,
      depositRequired: true,
    });
  }

  if (prices.priceWeek !== null) {
    out.push({
      propertyId,
      type: "WEEKLY",
      unitPrice: prices.priceWeek,
    });
  }

  if (prices.priceMonth !== null) {
    out.push({
      propertyId,
      type: "MONTHLY",
      unitPrice: prices.priceMonth,
    });
  }

  if (prices.priceYear !== null) {
    out.push({
      propertyId,
      type: "YEARLY",
      unitPrice: prices.priceYear,
    });
  }

  return out;
}

function getPricingUnitPrice(
  pricings: Array<{ type: string; unitPrice: unknown }>,
  type: "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
): number | null {
  const pricing = pricings.find((item) => item.type === type);
  if (!pricing) return null;

  const n = Number(pricing.unitPrice);
  return Number.isFinite(n) ? n : null;
}

function normalizeLocationSource(input: unknown): PropertyLocationSource | "" {
  const value = normalizeString(input).toUpperCase();
  if (value === "MANUAL" || value === "CURRENT_DEVICE" || value === "MAP_PICKER") {
    return value;
  }
  return "";
}

function normalizeImageUrl(input: unknown): string {
  const value = normalizeString(input);
  if (!value) return "";
  if (value.length > MAX_IMAGE_URL_LENGTH) return "";
  if (/[\u0000-\u001F\u007F<>"'`]/.test(value)) return "";
  if (/^(javascript|data|vbscript):/i.test(value)) return "";
  return value;
}

function parsePossibleJsonArray(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : null;
      } catch {
        return null;
      }
    }

    if (trimmed.includes("\n")) {
      return trimmed
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    if (trimmed.includes(",")) {
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return null;
}

function extractImagesPayload(body: Record<string, unknown>): {
  provided: boolean;
  rawItems: unknown[];
} {
  const candidates: Array<{ provided: boolean; raw: unknown }> = [
    { provided: hasOwn(body, "images"), raw: body.images },
    { provided: hasOwn(body, "imageUrls"), raw: body.imageUrls },
    { provided: hasOwn(body, "propertyImages"), raw: body.propertyImages },
  ];

  for (const candidate of candidates) {
    if (!candidate.provided) continue;

    const asArray = parsePossibleJsonArray(candidate.raw);
    if (asArray) {
      return { provided: true, rawItems: asArray };
    }

    if (candidate.raw == null || candidate.raw === "") {
      return { provided: true, rawItems: [] };
    }

    return { provided: true, rawItems: [candidate.raw] };
  }

  return { provided: false, rawItems: [] };
}

function parseImageSortOrder(rawItem: unknown, fallbackIndex: number): number {
  if (!rawItem || typeof rawItem !== "object" || Array.isArray(rawItem)) {
    return fallbackIndex;
  }

  const record = rawItem as Record<string, unknown>;
  const sortOrder =
    toIntegerOrNull(record.sortOrder) ??
    toIntegerOrNull(record.order) ??
    toIntegerOrNull(record.position) ??
    fallbackIndex;

  return sortOrder >= 0 ? sortOrder : fallbackIndex;
}

function parsePropertyImages(body: Record<string, unknown>): {
  provided: boolean;
  images: Array<{ url: string; sortOrder: number }>;
  error: string | null;
} {
  const payload = extractImagesPayload(body);

  if (!payload.provided) {
    return {
      provided: false,
      images: [],
      error: null,
    };
  }

  const dedup = new Set<string>();
  const collected: Array<{ url: string; sortOrder: number; inputIndex: number }> = [];

  for (let index = 0; index < payload.rawItems.length; index += 1) {
    const rawItem = payload.rawItems[index];

    let rawUrl: unknown = rawItem;

    if (rawItem && typeof rawItem === "object" && !Array.isArray(rawItem)) {
      const record = rawItem as Record<string, unknown>;
      rawUrl = record.url ?? record.src ?? record.imageUrl ?? record.path;
    }

    const url = normalizeImageUrl(rawUrl);
    if (!url) {
      return {
        provided: true,
        images: [],
        error: "Hər property şəkli üçün düzgün URL və ya media yolu göndərin.",
      };
    }

    if (dedup.has(url)) {
      continue;
    }

    dedup.add(url);
    collected.push({
      url,
      sortOrder: parseImageSortOrder(rawItem, index),
      inputIndex: index,
    });
  }

  if (collected.length < 1) {
    return {
      provided: true,
      images: [],
      error: "Ən azı 1 şəkil əlavə etmək mütləqdir.",
    };
  }

  if (collected.length > MAX_PROPERTY_IMAGES) {
    return {
      provided: true,
      images: [],
      error: `Maksimum ${MAX_PROPERTY_IMAGES} şəkil əlavə etmək olar.`,
    };
  }

  const normalizedImages = collected
    .sort((a, b) => a.sortOrder - b.sortOrder || a.inputIndex - b.inputIndex)
    .map((item, index) => ({
      url: item.url,
      sortOrder: index,
    }));

  return {
    provided: true,
    images: normalizedImages,
    error: null,
  };
}

function parseLocationInput(body: Record<string, unknown>): {
  location: string;
  locationLat: number | null;
  locationLng: number | null;
  locationPlaceId: string | null;
  locationSource: PropertyLocationSource;
  error: string | null;
} {
  const nestedLocation =
    body.location && typeof body.location === "object" && !Array.isArray(body.location)
      ? (body.location as Record<string, unknown>)
      : null;

  const directLocationValue =
    typeof body.location === "string" || typeof body.location === "number"
      ? normalizeString(body.location)
      : "";

  const displayLocation =
    directLocationValue ||
    normalizeString(body.locationLabel) ||
    normalizeString(nestedLocation?.label) ||
    normalizeString(nestedLocation?.name) ||
    normalizeString(nestedLocation?.address) ||
    normalizeString(nestedLocation?.text);

  const locationLat = toFiniteNumberOrNull(
    body.locationLat ?? nestedLocation?.lat ?? nestedLocation?.latitude
  );
  const locationLng = toFiniteNumberOrNull(
    body.locationLng ?? nestedLocation?.lng ?? nestedLocation?.lon ?? nestedLocation?.longitude
  );

  const rawPlaceId = normalizeString(body.locationPlaceId ?? nestedLocation?.placeId);
  const locationPlaceId = rawPlaceId ? rawPlaceId : null;

  const explicitLocationSource = normalizeLocationSource(
    body.locationSource ?? nestedLocation?.source
  );
  const hasLat = locationLat !== null;
  const hasLng = locationLng !== null;

  const inferredLocationSource: PropertyLocationSource =
    explicitLocationSource ||
    (hasLat && hasLng ? (locationPlaceId ? "MAP_PICKER" : "CURRENT_DEVICE") : "MANUAL");

  if (!displayLocation) {
    return {
      location: "",
      locationLat,
      locationLng,
      locationPlaceId,
      locationSource: inferredLocationSource,
      error: "location is required",
    };
  }

  if (displayLocation.length > MAX_LOCATION_LENGTH) {
    return {
      location: "",
      locationLat,
      locationLng,
      locationPlaceId,
      locationSource: inferredLocationSource,
      error: `location maksimum ${MAX_LOCATION_LENGTH} simvol ola bilər`,
    };
  }

  if (locationPlaceId && locationPlaceId.length > MAX_LOCATION_PLACE_ID_LENGTH) {
    return {
      location: "",
      locationLat,
      locationLng,
      locationPlaceId: null,
      locationSource: inferredLocationSource,
      error: `locationPlaceId maksimum ${MAX_LOCATION_PLACE_ID_LENGTH} simvol ola bilər`,
    };
  }

  if (hasLat !== hasLng) {
    return {
      location: "",
      locationLat,
      locationLng,
      locationPlaceId,
      locationSource: inferredLocationSource,
      error: "locationLat və locationLng birlikdə göndərilməlidir",
    };
  }

  if (hasLat && (locationLat < -90 || locationLat > 90)) {
    return {
      location: "",
      locationLat,
      locationLng,
      locationPlaceId,
      locationSource: inferredLocationSource,
      error: "locationLat düzgün intervalda deyil",
    };
  }

  if (hasLng && (locationLng < -180 || locationLng > 180)) {
    return {
      location: "",
      locationLat,
      locationLng,
      locationPlaceId,
      locationSource: inferredLocationSource,
      error: "locationLng düzgün intervalda deyil",
    };
  }

  if (
    (inferredLocationSource === "CURRENT_DEVICE" || inferredLocationSource === "MAP_PICKER") &&
    (!hasLat || !hasLng)
  ) {
    return {
      location: "",
      locationLat,
      locationLng,
      locationPlaceId,
      locationSource: inferredLocationSource,
      error: "Seçilmiş location source üçün koordinatlar mütləqdir",
    };
  }

  return {
    location: displayLocation,
    locationLat,
    locationLng,
    locationPlaceId,
    locationSource: inferredLocationSource,
    error: null,
  };
}

function serializeProperty(item: PropertyWithRelations) {
  const images = item.images
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime())
    .map((image) => ({
      id: image.id,
      url: image.url,
      sortOrder: image.sortOrder,
      createdAt: image.createdAt,
    }));

  return {
    id: item.id,
    title: item.title,
    city: item.city,
    areaName: item.areaName,
    roomCount: item.roomCount,
    location: item.location,
    locationLat: item.locationLat ?? null,
    locationLng: item.locationLng ?? null,
    locationPlaceId: item.locationPlaceId ?? null,
    locationSource: item.locationSource ?? "MANUAL",
    locationMeta: {
      label: item.location,
      lat: item.locationLat ?? null,
      lng: item.locationLng ?? null,
      placeId: item.locationPlaceId ?? null,
      source: item.locationSource ?? "MANUAL",
    },
    rulesText: item.rulesText,
    isVisible: item.isVisible,
    serviceId: item.serviceId,
    serviceKey: item.service?.key ?? null,
    priceHour: getPricingUnitPrice(item.pricings, "HOURLY"),
    priceDay: getPricingUnitPrice(item.pricings, "DAILY"),
    priceWeek: getPricingUnitPrice(item.pricings, "WEEKLY"),
    priceMonth: getPricingUnitPrice(item.pricings, "MONTHLY"),
    priceYear: getPricingUnitPrice(item.pricings, "YEARLY"),
    imageCount: images.length,
    coverImageUrl: images[0]?.url ?? null,
    images,
    createdAt: item.createdAt,
    pricings: item.pricings.map((pricing) => ({
      id: pricing.id,
      type: pricing.type,
      unitPrice: Number(pricing.unitPrice),
      depositRequired: pricing.depositRequired,
    })),
  };
}

function validatePropertyInput(params: {
  title: string;
  city: string;
  areaName: string;
  location: string;
  rulesText: string;
  roomCountNumber: number;
  priceHour: number | null;
  priceDay: number | null;
  priceWeek: number | null;
  priceMonth: number | null;
  priceYear: number | null;
}): string | null {
  if (!params.title) return "title is required";
  if (!params.city) return "city is required";
  if (!params.areaName) return "areaName is required";
  if (!params.location) return "location is required";
  if (!params.rulesText) return "rulesText is required";

  if (params.title.length > MAX_TITLE_LENGTH) {
    return `title maksimum ${MAX_TITLE_LENGTH} simvol ola bilər`;
  }

  if (params.city.length > MAX_CITY_LENGTH) {
    return `city maksimum ${MAX_CITY_LENGTH} simvol ola bilər`;
  }

  if (params.areaName.length > MAX_AREA_NAME_LENGTH) {
    return `areaName maksimum ${MAX_AREA_NAME_LENGTH} simvol ola bilər`;
  }

  if (params.location.length > MAX_LOCATION_LENGTH) {
    return `location maksimum ${MAX_LOCATION_LENGTH} simvol ola bilər`;
  }

  if (params.rulesText.length > MAX_RULES_TEXT_LENGTH) {
    return `rulesText maksimum ${MAX_RULES_TEXT_LENGTH} simvol ola bilər`;
  }

  if (
    !Number.isFinite(params.roomCountNumber) ||
    !Number.isInteger(params.roomCountNumber) ||
    params.roomCountNumber <= 0
  ) {
    return "roomCount must be a positive integer";
  }

  const hasAnyPrice =
    params.priceHour !== null ||
    params.priceDay !== null ||
    params.priceWeek !== null ||
    params.priceMonth !== null ||
    params.priceYear !== null;

  if (!hasAnyPrice) {
    return "At least one price field is required";
  }

  return null;
}

async function getOwnedPropertyForRequest(
  req: Request,
  propertyId: string,
  opts?: {
    includeHidden?: boolean;
  }
): Promise<
  | { ok: false; denied: AccessDeniedResult }
  | {
      ok: true;
      owner: any;
      property: PropertyWithRelations;
    }
> {
  const baseAccess = await ensureOwnerAccess(req, {
    requireActiveSubscription: false,
  });

  if (!baseAccess.ok) {
    return { ok: false, denied: baseAccess };
  }

  const property = await withTimeout(
    prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerId: baseAccess.owner.id,
        ...(opts?.includeHidden ? {} : { isVisible: true }),
      },
      include: {
        pricings: true,
        images: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
        service: {
          select: { id: true, key: true },
        },
      },
    }),
    `getOwnedPropertyForRequest(${propertyId})`
  );

  if (!property) {
    return {
      ok: false,
      denied: {
        ok: false,
        status: 404,
        message: "PROPERTY_NOT_FOUND",
        state: "ACTIVE",
      },
    };
  }

  if (!property.service?.key) {
    return {
      ok: false,
      denied: {
        ok: false,
        status: 404,
        message: "service not found or inactive",
        state: "SERVICE_SELECTION_REQUIRED",
      },
    };
  }

  const serviceAccess = await ensureOwnerAccess(req, {
    serviceKey: property.service.key,
    requireActiveSubscription: true,
  });

  if (!serviceAccess.ok) {
    return { ok: false, denied: serviceAccess };
  }

  return {
    ok: true,
    owner: serviceAccess.owner,
    property,
  };
}

async function deleteOwnedProperty(propertyId: string): Promise<{
  mode: PropertyDeleteMode;
  bookingCount: number;
  draftCount: number;
}> {
  return withTimeout(
    prisma.$transaction(async (tx) => {
      const bookingCount = await tx.booking.count({
        where: { propertyId },
      });

      const draftCount = await tx.bookingDraft.count({
        where: { propertyId },
      });

      if (draftCount > 0) {
        await tx.bookingDraft.deleteMany({
          where: { propertyId },
        });
      }

      if (bookingCount > 0) {
        await tx.property.update({
          where: { id: propertyId },
          data: {
            isVisible: false,
          },
        });

        return {
          mode: "SOFT" as const,
          bookingCount,
          draftCount,
        };
      }

      await tx.propertyImage.deleteMany({
        where: { propertyId },
      });

      await tx.propertyPricing.deleteMany({
        where: { propertyId },
      });

      await tx.property.delete({
        where: { id: propertyId },
      });

      return {
        mode: "HARD" as const,
        bookingCount,
        draftCount,
      };
    }),
    `deleteOwnedProperty(${propertyId})`
  );
}

ownerPropertiesRouter.get("/properties", async (req: Request, res: Response) => {
  try {
    const serviceKey = normServiceKey(req.query.serviceKey);

    const access = await ensureOwnerAccess(req, {
      serviceKey,
      requireActiveSubscription: !!serviceKey,
    });

    if (!access.ok) {
      return sendAccessDenied(res, access);
    }

    const owner = access.owner;
    const serviceId = access.service?.id;

    const items = await withTimeout(
      prisma.property.findMany({
        where: {
          ownerId: owner.id,
          isVisible: true,
          ...(serviceId ? { serviceId } : {}),
        },
        orderBy: { createdAt: "desc" },
        include: {
          pricings: true,
          images: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
          service: {
            select: { id: true, key: true },
          },
        },
      }),
      "GET /owner/properties property.findMany"
    );

    if (items.length === 0) {
      return res.json({
        ok: true,
        state: access.state,
        items: [],
      });
    }

    const serviceIds = [
      ...new Set(
        items
          .map((item) => item.serviceId)
          .filter((value): value is string => typeof value === "string" && value.length > 0)
      ),
    ];

    const subs =
      serviceIds.length > 0
        ? await withTimeout(
            prisma.ownerSubscription.findMany({
              where: {
                ownerId: owner.id,
                serviceId: { in: serviceIds },
              },
              select: {
                serviceId: true,
                status: true,
                tier: true,
                paidUntil: true,
                updatedAt: true,
              },
            }),
            "GET /owner/properties ownerSubscription.findMany"
          )
        : [];

    const subMap = new Map<
      string,
      {
        status: string;
        tier: "STANDARD" | "PREMIUM";
        paidUntil: Date | null;
        updatedAt: Date;
      }
    >(
      subs.map((sub) => [
        sub.serviceId,
        {
          status: sub.status,
          tier: sub.tier,
          paidUntil: sub.paidUntil,
          updatedAt: sub.updatedAt,
        },
      ])
    );

    const now = new Date();
    const legacyPaidUntil = getLegacyPaidUntil(owner);
    const legacyActive = isLegacySubscriptionActive(owner, now);

    const sorted = [...items].sort((a, b) => {
      const aSub = a.serviceId ? subMap.get(a.serviceId) : undefined;
      const bSub = b.serviceId ? subMap.get(b.serviceId) : undefined;

      const aBucket = getSubscriptionSortBucket(
        aSub?.status ?? (legacyActive ? "ACTIVE" : ""),
        aSub?.tier ?? "STANDARD",
        aSub?.paidUntil ?? legacyPaidUntil,
        now
      );
      const bBucket = getSubscriptionSortBucket(
        bSub?.status ?? (legacyActive ? "ACTIVE" : ""),
        bSub?.tier ?? "STANDARD",
        bSub?.paidUntil ?? legacyPaidUntil,
        now
      );

      if (aBucket !== bBucket) {
        return aBucket - bBucket;
      }

      const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      if (aCreated !== bCreated) {
        return bCreated - aCreated;
      }

      return String(b.id).localeCompare(String(a.id));
    });

    return res.json({
      ok: true,
      state: access.state,
      items: sorted.map(serializeProperty),
    });
  } catch (e: any) {
    console.error("[ownerProperties] list error:", e);
    return res.status(500).json({
      ok: false,
      message: e?.message || "INTERNAL_ERROR",
    });
  }
});

ownerPropertiesRouter.post(
  "/properties/create",
  attachResolvedServiceKey,
  async (req: Request, res: Response) => {
    const reqId = `[ownerProperties.create] ${requestLabel(req)}`;

    try {
      console.log(`${reqId} start`, {
        bodyKeys: Object.keys(req.body ?? {}),
        query: req.query,
      });

      const body = asRecord(req.body ?? {});

      const serviceKey = normServiceKey(body.serviceKey || req.query.serviceKey);
      if (!serviceKey) return bad(res, "serviceKey is required");

      const title = normalizeString(body.title);
      const city = normalizeString(body.city);
      const areaName = normalizeString(body.areaName);
      const rulesText = normalizeMultilineText(body.rulesText);

      const locationInput = parseLocationInput(body);
      if (locationInput.error) {
        return bad(res, locationInput.error);
      }

      const imageInput = parsePropertyImages(body);
      if (!imageInput.provided) {
        return bad(res, "Ən azı 1 şəkil əlavə etmək mütləqdir.");
      }
      if (imageInput.error) {
        return bad(res, imageInput.error);
      }

      const roomCountNumber = Number(body.roomCount);

      const priceHour = toPositiveIntOrNull(body.priceHour);
      const priceDay = toPositiveIntOrNull(body.priceDay);
      const priceWeek = toPositiveIntOrNull(body.priceWeek);
      const priceMonth = toPositiveIntOrNull(body.priceMonth);
      const priceYear = toPositiveIntOrNull(body.priceYear);

      const validationError = validatePropertyInput({
        title,
        city,
        areaName,
        location: locationInput.location,
        rulesText,
        roomCountNumber,
        priceHour,
        priceDay,
        priceWeek,
        priceMonth,
        priceYear,
      });

      if (validationError) {
        return bad(res, validationError);
      }

      const access = await ensureOwnerAccess(req, {
        serviceKey,
        requireActiveSubscription: true,
      });

      if (!access.ok) {
        return sendAccessDenied(res, access);
      }

      const owner = access.owner;
      const service = access.service;

      if (!service) {
        return res.status(404).json({
          ok: false,
          message: "service not found or inactive",
          state: "SERVICE_SELECTION_REQUIRED",
        });
      }

      const result = await withTimeout(
        prisma.$transaction(async (tx) => {
          const property = await tx.property.create({
            data: {
              ownerId: owner.id,
              serviceId: service.id,
              title,
              roomCount: Math.trunc(roomCountNumber),
              city,
              areaName,
              location: locationInput.location,
              locationLat: locationInput.locationLat,
              locationLng: locationInput.locationLng,
              locationPlaceId: locationInput.locationPlaceId,
              locationSource: locationInput.locationSource,
              rulesText,
              isVisible: true,
            },
            select: { id: true },
          });

          const pricingData = buildPricingCreateInputs(property.id, {
            priceHour,
            priceDay,
            priceWeek,
            priceMonth,
            priceYear,
          });

          await tx.propertyPricing.createMany({
            data: pricingData,
          });

          await tx.propertyImage.createMany({
            data: imageInput.images.map((image) => ({
              propertyId: property.id,
              url: image.url,
              sortOrder: image.sortOrder,
            })),
          });

          return tx.property.findUnique({
            where: { id: property.id },
            include: {
              pricings: true,
              images: {
                orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
              },
              service: {
                select: { id: true, key: true },
              },
            },
          });
        }),
        `${reqId} prisma.$transaction`
      );

      if (!result) {
        return res.status(500).json({
          ok: false,
          message: "PROPERTY_CREATE_FAILED",
        });
      }

      return res.json({
        ok: true,
        state: "ACTIVE",
        propertyId: result.id,
        item: serializeProperty(result),
      });
    } catch (e: any) {
      console.error("[ownerProperties] create error:", e);
      return res.status(500).json({
        ok: false,
        message: e?.message || "INTERNAL_ERROR",
      });
    }
  }
);

ownerPropertiesRouter.get("/properties/:propertyId", async (req: Request, res: Response) => {
  try {
    const propertyId = normalizeString(req.params.propertyId);
    if (!propertyId) {
      return bad(res, "propertyId is required");
    }

    const resolved = await getOwnedPropertyForRequest(req, propertyId);
    if (!resolved.ok) {
      return sendAccessDenied(res, resolved.denied);
    }

    return res.json({
      ok: true,
      state: "ACTIVE",
      item: serializeProperty(resolved.property),
    });
  } catch (e: any) {
    console.error("[ownerProperties] detail error:", e);
    return res.status(500).json({
      ok: false,
      message: e?.message || "INTERNAL_ERROR",
    });
  }
});

ownerPropertiesRouter.patch(
  "/properties/:propertyId",
  attachResolvedServiceKey,
  async (req: Request, res: Response) => {
    const reqId = `[ownerProperties.update] ${requestLabel(req)}`;

    try {
      const propertyId = normalizeString(req.params.propertyId);
      if (!propertyId) {
        return bad(res, "propertyId is required");
      }

      const resolved = await getOwnedPropertyForRequest(req, propertyId);
      if (!resolved.ok) {
        return sendAccessDenied(res, resolved.denied);
      }

      const existing = resolved.property;
      const body = asRecord(req.body ?? {});

      const parsedDirectLocation = parseLocationInput({
        ...body,
        location:
          body.location !== undefined
            ? body.location
            : {
                label: existing.location,
                lat: existing.locationLat,
                lng: existing.locationLng,
                placeId: existing.locationPlaceId,
                source: existing.locationSource,
              },
        locationLat: body.locationLat !== undefined ? body.locationLat : existing.locationLat,
        locationLng: body.locationLng !== undefined ? body.locationLng : existing.locationLng,
        locationPlaceId:
          body.locationPlaceId !== undefined ? body.locationPlaceId : existing.locationPlaceId,
        locationSource:
          body.locationSource !== undefined ? body.locationSource : existing.locationSource,
      });

      if (parsedDirectLocation.error) {
        return bad(res, parsedDirectLocation.error);
      }

      const title =
        body.title !== undefined ? normalizeString(body.title) : normalizeString(existing.title);
      const city =
        body.city !== undefined ? normalizeString(body.city) : normalizeString(existing.city);
      const areaName =
        body.areaName !== undefined
          ? normalizeString(body.areaName)
          : normalizeString(existing.areaName);
      const rulesText =
        body.rulesText !== undefined
          ? normalizeMultilineText(body.rulesText)
          : normalizeMultilineText(existing.rulesText);

      const roomCountNumber =
        body.roomCount !== undefined ? Number(body.roomCount) : Number(existing.roomCount);

      const priceHour =
        body.priceHour !== undefined
          ? toPositiveIntOrNull(body.priceHour)
          : getPricingUnitPrice(existing.pricings, "HOURLY");
      const priceDay =
        body.priceDay !== undefined
          ? toPositiveIntOrNull(body.priceDay)
          : getPricingUnitPrice(existing.pricings, "DAILY");
      const priceWeek =
        body.priceWeek !== undefined
          ? toPositiveIntOrNull(body.priceWeek)
          : getPricingUnitPrice(existing.pricings, "WEEKLY");
      const priceMonth =
        body.priceMonth !== undefined
          ? toPositiveIntOrNull(body.priceMonth)
          : getPricingUnitPrice(existing.pricings, "MONTHLY");
      const priceYear =
        body.priceYear !== undefined
          ? toPositiveIntOrNull(body.priceYear)
          : getPricingUnitPrice(existing.pricings, "YEARLY");

      const imageInput = parsePropertyImages(body);
      if (imageInput.error) {
        return bad(res, imageInput.error);
      }

      const finalImages = imageInput.provided
        ? imageInput.images
        : existing.images
            .slice()
            .sort(
              (a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime()
            )
            .map((img, index) => ({
              url: img.url,
              sortOrder: index,
            }));

      if (finalImages.length < 1) {
        return bad(res, "Ən azı 1 şəkil əlavə etmək mütləqdir.");
      }

      if (finalImages.length > MAX_PROPERTY_IMAGES) {
        return bad(res, `Maksimum ${MAX_PROPERTY_IMAGES} şəkil əlavə etmək olar.`);
      }

      const validationError = validatePropertyInput({
        title,
        city,
        areaName,
        location: parsedDirectLocation.location,
        rulesText,
        roomCountNumber,
        priceHour,
        priceDay,
        priceWeek,
        priceMonth,
        priceYear,
      });

      if (validationError) {
        return bad(res, validationError);
      }

      const updated = await withTimeout(
        prisma.$transaction(async (tx) => {
          await tx.property.update({
            where: { id: propertyId },
            data: {
              title,
              roomCount: Math.trunc(roomCountNumber),
              city,
              areaName,
              location: parsedDirectLocation.location,
              locationLat: parsedDirectLocation.locationLat,
              locationLng: parsedDirectLocation.locationLng,
              locationPlaceId: parsedDirectLocation.locationPlaceId,
              locationSource: parsedDirectLocation.locationSource,
              rulesText,
            },
          });

          await tx.propertyPricing.deleteMany({
            where: { propertyId },
          });

          const pricingData = buildPricingCreateInputs(propertyId, {
            priceHour,
            priceDay,
            priceWeek,
            priceMonth,
            priceYear,
          });

          await tx.propertyPricing.createMany({
            data: pricingData,
          });

          if (imageInput.provided) {
            await tx.propertyImage.deleteMany({
              where: { propertyId },
            });

            await tx.propertyImage.createMany({
              data: finalImages.map((image) => ({
                propertyId,
                url: image.url,
                sortOrder: image.sortOrder,
              })),
            });
          }

          return tx.property.findUnique({
            where: { id: propertyId },
            include: {
              pricings: true,
              images: {
                orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
              },
              service: {
                select: { id: true, key: true },
              },
            },
          });
        }),
        `${reqId} prisma.$transaction`
      );

      if (!updated) {
        return res.status(404).json({
          ok: false,
          message: "PROPERTY_NOT_FOUND",
        });
      }

      return res.json({
        ok: true,
        state: "ACTIVE",
        propertyId: updated.id,
        item: serializeProperty(updated),
      });
    } catch (e: any) {
      console.error("[ownerProperties] update error:", e);
      return res.status(500).json({
        ok: false,
        message: e?.message || "INTERNAL_ERROR",
      });
    }
  }
);

ownerPropertiesRouter.delete("/properties/:propertyId", async (req: Request, res: Response) => {
  try {
    const propertyId = normalizeString(req.params.propertyId);
    if (!propertyId) {
      return bad(res, "propertyId is required");
    }

    const resolved = await getOwnedPropertyForRequest(req, propertyId, {
      includeHidden: true,
    });

    if (!resolved.ok) {
      return sendAccessDenied(res, resolved.denied);
    }

    const deleteResult = await deleteOwnedProperty(propertyId);

    return res.json({
      ok: true,
      state: "ACTIVE",
      deleted: true,
      deleteMode: deleteResult.mode,
      bookingCount: deleteResult.bookingCount,
      draftCount: deleteResult.draftCount,
      propertyId,
    });
  } catch (e: any) {
    console.error("[ownerProperties] delete error:", e);
    return res.status(500).json({
      ok: false,
      message: e?.message || "INTERNAL_ERROR",
    });
  }
});