import { createHash, randomInt, randomUUID } from "crypto";
import { Router, type Request, type Response } from "express";
import prisma from "db";

export const ownerProfileRouter = Router();

const DB_TIMEOUT_MS = 5000;
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_STATE_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;
const DEV_RETURN_OTP = process.env.NODE_ENV !== "production";

const OWNER_NAME_MAX_LENGTH = 120;
const OWNER_EMAIL_MAX_LENGTH = 254;
const OWNER_BIO_MAX_LENGTH = 1000;
const OWNER_PROFILE_PHOTO_MAX_LENGTH = 2048;

const OWNER_PHONE_VERIFICATION_TOKEN_PREFIX = "OWNER_PHONE_VERIFICATION_V1:";

type CountryConfig = {
  iso2: string;
  dial: string;
  minNationalLength: number;
  maxNationalLength: number;
  allowedNationalPrefixes?: string[];
};

type ValueCheck<T> =
  | { ok: true; value: T }
  | { ok: false; code: string; extra?: Record<string, unknown> };

export type OwnerFlowState =
  | "PROFILE_REQUIRED"
  | "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED"
  | "SERVICE_SELECTION_REQUIRED";

export type OwnerVerificationSnapshot = {
  phoneVerified: boolean;
  phoneVerifiedAt: Date | null;
  phoneVerificationStatus:
  | "REQUIRED"
  | "SENT"
  | "VERIFIED"
  | "EXPIRED"
  | "FAILED";
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

type OwnerResolveCriteria = {
  ownerIdCandidates: string[];
  emailCandidates: string[];
  phoneVariants: string[];
  phoneDigitsCandidates: string[];
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

function fail(
  res: Response,
  code: string,
  status = 400,
  extra?: Record<string, unknown>
) {
  return res.status(status).json({ ok: false, message: code, ...(extra || {}) });
}

function digitsOnly(s: string) {
  return String(s ?? "").replace(/[^\d]/g, "");
}

function includesAny(haystack: string, needles: readonly string[]): boolean {
  const normalized = String(haystack || "").toLowerCase();
  return needles.some((needle) => normalized.includes(String(needle || "").toLowerCase()));
}

function normalizeIso2(input: unknown): string {
  return String(input ?? "").trim().toUpperCase();
}

function normalizeString(input: unknown): string {
  return String(input ?? "").trim();
}

function normalizeEmail(input: unknown): string {
  return String(input ?? "").trim().toLowerCase();
}

function normalizeName(input: unknown): string {
  return normalizeString(input).replace(/\s+/g, " ");
}

function normalizeBio(input: unknown): string {
  return String(input ?? "")
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

function getNationalDigitsFromE164(phone: string, country: CountryConfig): string {
  const allDigits = digitsOnly(phone);
  const dialDigits = digitsOnly(country.dial);

  if (!allDigits.startsWith(dialDigits)) return "";
  return allDigits.slice(dialDigits.length);
}

function validateNationalDigitsForCountry(
  country: CountryConfig,
  nationalDigits: string
): { ok: true } | { ok: false; code: string; extra?: Record<string, unknown> } {
  if (!nationalDigits) {
    return { ok: false, code: "OWNER_PHONE_REQUIRED" };
  }

  if (!/^\d+$/.test(nationalDigits)) {
    return { ok: false, code: "OWNER_PHONE_DIGITS_ONLY" };
  }

  if (nationalDigits.length < country.minNationalLength) {
    return {
      ok: false,
      code: "OWNER_PHONE_TOO_SHORT",
      extra: { count: country.minNationalLength },
    };
  }

  if (nationalDigits.length > country.maxNationalLength) {
    return {
      ok: false,
      code: "OWNER_PHONE_TOO_LONG",
      extra: { count: country.maxNationalLength },
    };
  }

  if (country.allowedNationalPrefixes?.length) {
    const isAllowedPrefix = country.allowedNationalPrefixes.some((prefix) =>
      nationalDigits.startsWith(prefix)
    );

    if (!isAllowedPrefix) {
      return {
        ok: false,
        code: "OWNER_PHONE_OPERATOR_CODE_REQUIRED",
      };
    }
  }

  return { ok: true };
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

function validatePhone(raw: unknown, phoneCountryIso2?: unknown) {
  const trimmed = String(raw ?? "").trim();

  if (!trimmed) {
    return { ok: false as const, code: "OWNER_PHONE_REQUIRED" };
  }

  const e164 = normalizePhoneToE164(trimmed, phoneCountryIso2);
  if (!e164) {
    return { ok: false as const, code: "OWNER_PHONE_INVALID" };
  }

  const country = findCountryByIso2(phoneCountryIso2) || findCountryByE164(e164);

  if (country) {
    const nationalDigits = getNationalDigitsFromE164(e164, country);
    const nationalCheck = validateNationalDigitsForCountry(country, nationalDigits);

    if (!nationalCheck.ok) {
      return nationalCheck;
    }
  }

  return { ok: true as const, e164 };
}

function getPhoneVariants(phone: string): string[] {
  const normalized = String(phone ?? "").trim();
  if (!normalized) return [];

  const digits = digitsOnly(normalized);
  if (!digits) return [];

  const variants = new Set<string>();
  const last9 = digits.length >= 9 ? digits.slice(-9) : "";

  variants.add(normalized);
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

function getPhoneDigitsVariants(phone: string): string[] {
  const digitsVariants = new Set<string>();

  for (const variant of getPhoneVariants(phone)) {
    const digits = digitsOnly(variant);
    if (!digits) continue;

    digitsVariants.add(digits);

    if (digits.length >= 9) {
      digitsVariants.add(digits.slice(-9));
    }

    if (digits.startsWith("994") && digits.length === 12) {
      digitsVariants.add(`0${digits.slice(3)}`);
    }
  }

  return [...digitsVariants].filter(Boolean);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
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

function hasOwnerCoreProfile(owner: unknown): boolean {
  const name = getOptionalString(owner, "name");
  const phone = getOptionalString(owner, "phone");
  const email = getOptionalString(owner, "email");

  return !!name && !!phone && !!email;
}

function hashOtpCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function createOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function normalizeProfilePhotoValue(input: unknown): string | null {
  const value = normalizeString(input);

  if (!value) return null;
  if (value.length > OWNER_PROFILE_PHOTO_MAX_LENGTH) return null;
  if (/[\u0000-\u001F\u007F<>"'`]/.test(value)) return null;
  if (/^(javascript|data|vbscript):/i.test(value)) return null;

  return value;
}

function validateProfilePhotoValue(input: unknown): ValueCheck<string | null> {
  if (input == null || normalizeString(input) === "") {
    return { ok: true, value: null };
  }

  const normalized = normalizeProfilePhotoValue(input);
  if (!normalized) {
    return {
      ok: false,
      code: "OWNER_PROFILE_PHOTO_INVALID",
    };
  }

  return { ok: true, value: normalized };
}

function validateBioValue(input: unknown): ValueCheck<string | null> {
  if (input == null || String(input).trim() === "") {
    return { ok: true, value: null };
  }

  const bio = normalizeBio(input);

  if (!bio) {
    return { ok: true, value: null };
  }

  if (bio.length > OWNER_BIO_MAX_LENGTH) {
    return {
      ok: false,
      code: "OWNER_BIO_TOO_LONG",
      extra: { count: OWNER_BIO_MAX_LENGTH },
    };
  }

  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(bio)) {
    return {
      ok: false,
      code: "OWNER_BIO_INVALID_CHARS",
    };
  }

  return { ok: true, value: bio };
}

function toValidDateOrNull(input: unknown): Date | null {
  if (!input) return null;
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }

  const parsed = new Date(String(input));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function hashPhoneFingerprint(phone: string): string {
  const normalized = normalizePhoneToE164(phone) || normalizeString(phone);
  return createHash("sha256").update(normalized).digest("hex");
}

function encodeVerificationTokenPayload(payload: PersistedPhoneVerificationPayload): string {
  return `${OWNER_PHONE_VERIFICATION_TOKEN_PREFIX}${Buffer.from(
    JSON.stringify(payload),
    "utf8"
  ).toString("base64")}`;
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
      nonce: typeof parsed.nonce === "string" && parsed.nonce ? parsed.nonce : randomUUID(),
    };
  } catch {
    return null;
  }
}

function buildVerificationPayload(
  phoneE164: string,
  status: OwnerVerificationSnapshot["phoneVerificationStatus"],
  options?: {
    otpHash?: string | null;
    attempts?: number;
    lastSentAt?: Date | null;
    verifiedAt?: Date | null;
  }
): PersistedPhoneVerificationPayload {
  return {
    version: 1,
    kind: "OWNER_PHONE_VERIFICATION",
    phoneHash: hashPhoneFingerprint(phoneE164),
    status,
    otpHash: options?.otpHash ?? null,
    attempts: Math.max(0, Math.trunc(Number(options?.attempts ?? 0) || 0)),
    lastSentAt: options?.lastSentAt ? options.lastSentAt.toISOString() : null,
    verifiedAt: options?.verifiedAt ? options.verifiedAt.toISOString() : null,
    nonce: randomUUID(),
  };
}

function buildOwnerVerificationDbState(
  phoneE164: string,
  status: OwnerVerificationSnapshot["phoneVerificationStatus"],
  options?: {
    verifiedAt?: Date | null;
  }
) {
  if (status === "VERIFIED") {
    return {
      phoneVerified: true,
      phoneVerifiedAt: options?.verifiedAt ?? new Date(),
      phoneVerificationStatus: "VERIFIED",
      pendingPhone: null,
      phone: phoneE164,
    };
  }

  return {
    phoneVerified: false,
    phoneVerifiedAt: null,
    phoneVerificationStatus: status,
    pendingPhone: phoneE164,
    phone: phoneE164,
  };
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

  if (["SENT"].includes(status)) {
    return {
      phoneVerified: false,
      phoneVerifiedAt: null,
      phoneVerificationStatus: "SENT",
      pendingPhone: getOptionalString(owner, "pendingPhone") || null,
    };
  }

  if (["EXPIRED"].includes(status)) {
    return {
      phoneVerified: false,
      phoneVerifiedAt: null,
      phoneVerificationStatus: "EXPIRED",
      pendingPhone: getOptionalString(owner, "pendingPhone") || null,
    };
  }

  if (["FAILED"].includes(status)) {
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

async function withTimeout<T>(promise: Promise<T>, label: string, ms = DB_TIMEOUT_MS): Promise<T> {
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
    "ownerProfile.findPersistedVerificationToken"
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

async function persistVerificationToken(
  ownerId: string,
  phoneE164: string,
  status: OwnerVerificationSnapshot["phoneVerificationStatus"],
  options?: {
    existingTokenId?: string | null;
    otpHash?: string | null;
    attempts?: number;
    lastSentAt?: Date | null;
    verifiedAt?: Date | null;
    expiresAt?: Date;
  }
): Promise<PersistedPhoneVerificationToken> {
  const normalizedOwnerId = normalizeString(ownerId);
  const normalizedPhone = normalizePhoneToE164(phoneE164) || normalizeString(phoneE164);

  if (!normalizedOwnerId || !normalizedPhone) {
    throw new Error("persistVerificationToken requires ownerId and phoneE164");
  }

  const now = new Date();
  const expiresAt = options?.expiresAt ?? new Date(Date.now() + OTP_STATE_RETENTION_MS);
  const code = encodeVerificationTokenPayload(
    buildVerificationPayload(normalizedPhone, status, {
      otpHash: options?.otpHash ?? null,
      attempts: options?.attempts ?? 0,
      lastSentAt: options?.lastSentAt ?? null,
      verifiedAt: options?.verifiedAt ?? null,
    })
  );

  const record = await withTimeout(
    prisma.$transaction(async (tx) => {
      await tx.ownerToken.updateMany({
        where: {
          ownerId: normalizedOwnerId,
          isActive: true,
          code: { startsWith: OWNER_PHONE_VERIFICATION_TOKEN_PREFIX },
          ...(options?.existingTokenId ? { id: { not: options.existingTokenId } } : {}),
        },
        data: {
          isActive: false,
          revokedAt: now,
        },
      });

      const savedToken = options?.existingTokenId
        ? await tx.ownerToken.update({
          where: { id: options.existingTokenId },
          data: {
            code,
            expiresAt,
            isActive: true,
            revokedAt: null,
          },
          select: {
            id: true,
            ownerId: true,
            createdAt: true,
            expiresAt: true,
            code: true,
          },
        })
        : await tx.ownerToken.create({
          data: {
            ownerId: normalizedOwnerId,
            code,
            expiresAt,
            isActive: true,
          },
          select: {
            id: true,
            ownerId: true,
            createdAt: true,
            expiresAt: true,
            code: true,
          },
        });

      await tx.owner.update({
        where: { id: normalizedOwnerId },
        data: buildOwnerVerificationDbState(normalizedPhone, status, {
          verifiedAt: options?.verifiedAt ?? null,
        }),
      });

      return savedToken;
    }),
    "ownerProfile.persistVerificationToken"
  );

  const payload = decodeVerificationTokenPayload(record.code);
  if (!payload) {
    throw new Error("Persisted verification token payload could not be decoded");
  }

  return {
    id: record.id,
    ownerId: record.ownerId,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
    payload,
  };
}

async function setVerificationRequired(ownerId: string, phoneE164: string) {
  return persistVerificationToken(ownerId, phoneE164, "REQUIRED", {
    expiresAt: new Date(Date.now() + OTP_STATE_RETENTION_MS),
  });
}

async function getPersistedOwnerVerificationSnapshot(
  owner: unknown
): Promise<OwnerVerificationSnapshot | null> {
  const record = asRecord(owner);
  const ownerId = normalizeString(record.id);
  const ownerPhone = normalizePhoneToE164(record.phone) || normalizeString(record.phone);

  if (!ownerId || !ownerPhone) {
    return null;
  }

  const token = await findPersistedVerificationToken(ownerId, ownerPhone);
  if (!token) {
    return null;
  }

  const snapshot = buildSnapshotFromPersistedToken(ownerPhone, token);

  if (
    snapshot.phoneVerificationStatus === "EXPIRED" &&
    token.payload.status !== "EXPIRED"
  ) {
    await persistVerificationToken(ownerId, ownerPhone, "EXPIRED", {
      existingTokenId: token.id,
      attempts: token.payload.attempts,
      lastSentAt: toValidDateOrNull(token.payload.lastSentAt),
      verifiedAt: null,
      otpHash: null,
      expiresAt: new Date(Date.now() + OTP_STATE_RETENTION_MS),
    });
  }

  return snapshot;
}

async function getEffectiveOwnerVerificationSnapshot(
  owner: unknown
): Promise<OwnerVerificationSnapshot> {
  const persisted = await getPersistedOwnerVerificationSnapshot(owner);
  if (persisted) {
    return persisted;
  }

  return getDbVerificationSnapshot(owner);
}

export function getOwnerVerificationSnapshot(owner: unknown): OwnerVerificationSnapshot {
  return getDbVerificationSnapshot(owner);
}

export function isOwnerPhoneVerified(owner: unknown): boolean {
  return getOwnerVerificationSnapshot(owner).phoneVerified;
}

export function resolveOwnerFlowState(owner: unknown): OwnerFlowState {
  if (!owner || !hasOwnerCoreProfile(owner)) {
    return "PROFILE_REQUIRED";
  }

  if (!isOwnerPhoneVerified(owner)) {
    return "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED";
  }

  return "SERVICE_SELECTION_REQUIRED";
}

function resolveOwnerFlowStateWithVerification(
  owner: unknown,
  verification: OwnerVerificationSnapshot
): OwnerFlowState {
  if (!owner || !hasOwnerCoreProfile(owner)) {
    return "PROFILE_REQUIRED";
  }

  if (!verification.phoneVerified) {
    return "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED";
  }

  return "SERVICE_SELECTION_REQUIRED";
}

function formatDateOrNull(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

async function normalizeOwnerForResponse(
  owner: any,
  verificationInput?: OwnerVerificationSnapshot
) {
  const verification = verificationInput ?? (await getEffectiveOwnerVerificationSnapshot(owner));
  const bioCheck = validateBioValue(owner?.bio);
  const photoCheck = validateProfilePhotoValue(owner?.profilePhotoUrl);

  const safeBio = bioCheck.ok ? bioCheck.value : null;
  const safeProfilePhotoUrl = photoCheck.ok ? photoCheck.value : null;

  return {
    id: owner.id,
    name: owner.name ?? null,
    phone: owner.phone ? normalizePhoneToE164(owner.phone) || owner.phone : null,
    email: owner.email ?? null,
    bio: safeBio,
    profilePhotoUrl: safeProfilePhotoUrl,
    hasProfilePhoto: !!safeProfilePhotoUrl,
    profileExists: true,
    profileCompleted: hasOwnerCoreProfile(owner),
    phoneVerified: verification.phoneVerified,
    phoneVerifiedAt: formatDateOrNull(verification.phoneVerifiedAt),
    phoneVerificationStatus: verification.phoneVerificationStatus,
    pendingPhone: verification.pendingPhone,
  };
}

function buildMissingProfileResponse() {
  return {
    ok: true,
    state: "PROFILE_REQUIRED" as OwnerFlowState,
    owner: null,
    profileExists: false,
    profileCompleted: false,
    phoneVerified: false,
    phoneVerifiedAt: null,
    phoneVerificationStatus: "REQUIRED",
    verification: {
      canSendOtp: false,
      canVerifyOtp: false,
    },
  };
}

async function buildProfileResponse(
  owner: any,
  verificationInput?: OwnerVerificationSnapshot
) {
  const normalizedOwner = await normalizeOwnerForResponse(owner, verificationInput);
  const state = resolveOwnerFlowStateWithVerification(owner, {
    phoneVerified: normalizedOwner.phoneVerified,
    phoneVerifiedAt: normalizedOwner.phoneVerifiedAt
      ? new Date(normalizedOwner.phoneVerifiedAt)
      : null,
    phoneVerificationStatus: normalizedOwner.phoneVerificationStatus,
    pendingPhone: normalizedOwner.pendingPhone,
  });

  return {
    ok: true,
    state,
    owner: normalizedOwner,
    profileExists: true,
    profileCompleted: normalizedOwner.profileCompleted,
    phoneVerified: normalizedOwner.phoneVerified,
    phoneVerifiedAt: normalizedOwner.phoneVerifiedAt,
    phoneVerificationStatus: normalizedOwner.phoneVerificationStatus,
    verification: {
      canSendOtp:
        !!normalizedOwner.phone &&
        !!normalizedOwner.profileCompleted &&
        !normalizedOwner.phoneVerified,
      canVerifyOtp:
        normalizedOwner.phoneVerificationStatus === "SENT" ||
        normalizedOwner.phoneVerificationStatus === "EXPIRED" ||
        normalizedOwner.phoneVerificationStatus === "FAILED" ||
        normalizedOwner.phoneVerificationStatus === "REQUIRED",
    },
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
  const queryPhone = normalizeString(req.query?.phone);
  const bodyPhone = normalizeString(req.body?.phone);
  const phoneCountryIso2 = req.body?.phoneCountryIso2 || req.query?.phoneCountryIso2;

  const phoneCandidates = [headerPhoneRaw, queryPhone, bodyPhone]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => normalizePhoneToE164(value, phoneCountryIso2))
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

function buildOwnerSearchWhere(criteria: OwnerResolveCriteria) {
  const or: any[] = [];

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

function scoreResolvedOwner(owner: any, criteria: OwnerResolveCriteria): number {
  let score = 0;

  const ownerId = normalizeAsciiHeaderValue(owner?.id);
  const ownerEmail = normalizeEmail(owner?.email);
  const ownerPhoneVariants = getPhoneVariants(owner?.phone || "");
  const ownerPhoneDigitsVariants = getPhoneDigitsVariants(owner?.phone || "");

  if (ownerId && criteria.ownerIdCandidates.includes(ownerId)) {
    score += 10000;
  }

  if (ownerEmail && criteria.emailCandidates.includes(ownerEmail)) {
    score += 500;
  }

  if (
    ownerPhoneVariants.some((phone) => criteria.phoneVariants.includes(phone)) ||
    ownerPhoneDigitsVariants.some((digits) => criteria.phoneDigitsCandidates.includes(digits))
  ) {
    score += 300;
  }

  if (hasOwnerCoreProfile(owner)) {
    score += 5;
  }

  return score;
}

async function resolveOwnerFromRequest(req: Request): Promise<any | null> {
  const criteria = buildOwnerResolveCriteria(req);

  if (criteria.ownerIdCandidates.length > 0) {
    const byId = await withTimeout(
      prisma.owner.findFirst({
        where: {
          id: { in: criteria.ownerIdCandidates },
        },
        orderBy: { createdAt: "desc" },
      }),
      "resolveOwnerFromRequest.findFirstById"
    );

    if (byId) {
      return byId;
    }
  }

  const whereOr = buildOwnerSearchWhere(criteria);

  if (whereOr.length === 0) {
    return null;
  }

  const owners = await withTimeout(
    prisma.owner.findMany({
      where: { OR: whereOr },
      take: 25,
      orderBy: { createdAt: "desc" },
    }),
    "resolveOwnerFromRequest.findMany"
  );

  if (!owners.length) {
    return null;
  }

  const ranked = owners
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

async function ensurePhoneIsAvailable(phoneE164: string, excludeOwnerId?: string) {
  const variants = getPhoneVariants(phoneE164);
  const digitsVariants = getPhoneDigitsVariants(phoneE164);

  if (variants.length === 0 && digitsVariants.length === 0) return null;

  return withTimeout(
    prisma.owner.findFirst({
      where: {
        ...(excludeOwnerId ? { id: { not: excludeOwnerId } } : {}),
        OR: [
          ...variants.map((phone) => ({ phone })),
          ...digitsVariants.map((digits) => ({ phone: { endsWith: digits } })),
        ],
      },
      select: { id: true },
    }),
    "ensurePhoneIsAvailable.findFirst"
  );
}

async function ensureEmailIsAvailable(email: string, excludeOwnerId?: string) {
  if (!email) return null;

  try {
    return await withTimeout(
      prisma.owner.findFirst({
        where: {
          ...(excludeOwnerId ? { id: { not: excludeOwnerId } } : {}),
          email: {
            equals: email,
            mode: "insensitive",
          },
        },
        select: { id: true },
      }),
      "ensureEmailIsAvailable.findFirstInsensitive"
    );
  } catch {
    return withTimeout(
      prisma.owner.findFirst({
        where: {
          ...(excludeOwnerId ? { id: { not: excludeOwnerId } } : {}),
          email,
        },
        select: { id: true },
      }),
      "ensureEmailIsAvailable.findFirst"
    );
  }
}

function collectConflictHints(error: any): string[] {
  const hints: string[] = [];

  const metaTarget = error?.meta?.target;
  if (Array.isArray(metaTarget)) {
    hints.push(...metaTarget.map((item) => String(item || "")));
  } else if (metaTarget != null) {
    hints.push(String(metaTarget));
  }

  if (error?.meta?.cause != null) {
    hints.push(String(error.meta.cause));
  }

  if (error?.constraint != null) {
    hints.push(String(error.constraint));
  }

  if (error?.message != null) {
    hints.push(String(error.message));
  }

  return hints.filter(Boolean).map((item) => item.toLowerCase());
}

function mapOwnerProfilePersistenceError(error: any): string | null {
  const code = String(error?.code || "").trim();
  const hints = collectConflictHints(error);
  const joined = hints.join(" | ");

  const hasUniqueSignal =
    code === "P2002" ||
    includesAny(joined, [
      "unique",
      "duplicate",
      "already exists",
      "already used",
      "already taken",
      "violates unique constraint",
      "dup key",
      "conflict",
      "mövcuddur",
      "istifadə olunur",
      "təkrarlan",
    ]);

  if (!hasUniqueSignal) {
    return null;
  }

  const hasEmail = includesAny(joined, ["email", "owner_email", "owners_email", ".email"]);
  const hasPhone = includesAny(joined, ["phone", "owner_phone", "owners_phone", ".phone"]);

  if (hasPhone) {
    return "OWNER_PHONE_ALREADY_USED";
  }

  if (hasEmail) {
    return "OWNER_EMAIL_ALREADY_USED";
  }

  return "OWNER_IDENTITY_ALREADY_EXISTS";
}

// GET /owner/profile
ownerProfileRouter.get("/profile", async (req: Request, res: Response) => {
  try {
    const owner: any = await resolveOwnerFromRequest(req);

    if (!owner) {
      return res.json(buildMissingProfileResponse());
    }

    return res.json(await buildProfileResponse(owner));
  } catch (e: any) {
    console.error("[ownerProfile] get error:", e);
    return res.status(500).json({
      ok: false,
      message: "INTERNAL_ERROR",
    });
  }
});

// POST /owner/profile
ownerProfileRouter.post("/profile", async (req: Request, res: Response) => {
  try {
    const nameRaw = normalizeName(req.body?.name);
    const phoneRaw = normalizeString(req.body?.phone);
    const emailRaw = normalizeEmail(req.body?.email);
    const phoneCountryIso2 = req.body?.phoneCountryIso2;

    if (!nameRaw) {
      return fail(res, "OWNER_NAME_REQUIRED");
    }

    if (nameRaw.length > OWNER_NAME_MAX_LENGTH) {
      return fail(res, "OWNER_NAME_TOO_LONG", 400, {
        count: OWNER_NAME_MAX_LENGTH,
      });
    }

    if (!emailRaw) {
      return fail(res, "OWNER_EMAIL_REQUIRED");
    }

    if (emailRaw.length > OWNER_EMAIL_MAX_LENGTH) {
      return fail(res, "OWNER_EMAIL_TOO_LONG", 400, {
        count: OWNER_EMAIL_MAX_LENGTH,
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
      return fail(res, "OWNER_EMAIL_INVALID");
    }

    const phoneCheck = validatePhone(phoneRaw, phoneCountryIso2);
    if (!phoneCheck.ok) {
      return fail(res, phoneCheck.code, 400, phoneCheck.extra);
    }

    const bioProvided = hasOwn(req.body, "bio");
    const bioCheck = validateBioValue(req.body?.bio);
    if (!bioCheck.ok) {
      return fail(res, bioCheck.code, 400, bioCheck.extra);
    }

    const profilePhotoProvided = hasOwn(req.body, "profilePhotoUrl");
    const profilePhotoCheck = validateProfilePhotoValue(req.body?.profilePhotoUrl);
    if (!profilePhotoCheck.ok) {
      return fail(res, profilePhotoCheck.code, 400, profilePhotoCheck.extra);
    }

    const existingOwner: any = await resolveOwnerFromRequest(req);

    const emailConflict = await ensureEmailIsAvailable(emailRaw, existingOwner?.id);
    if (emailConflict) {
      return fail(res, "OWNER_EMAIL_ALREADY_USED", 409);
    }

    const phoneConflict = await ensurePhoneIsAvailable(phoneCheck.e164, existingOwner?.id);
    if (phoneConflict) {
      return fail(res, "OWNER_PHONE_ALREADY_USED", 409);
    }

    const previousPhone = existingOwner?.phone
      ? normalizePhoneToE164(existingOwner.phone) || String(existingOwner.phone).trim()
      : "";

    let savedOwner: any;

    if (existingOwner) {
      savedOwner = await withTimeout(
        prisma.owner.update({
          where: { id: existingOwner.id },
          data: {
            name: nameRaw,
            phone: phoneCheck.e164,
            email: emailRaw,
            ...(bioProvided ? { bio: bioCheck.value } : {}),
            ...(profilePhotoProvided ? { profilePhotoUrl: profilePhotoCheck.value } : {}),
          },
        }),
        "ownerProfile.update"
      );
    } else {
      savedOwner = await withTimeout(
        prisma.owner.create({
          data: {
            name: nameRaw,
            phone: phoneCheck.e164,
            email: emailRaw,
            bio: bioCheck.value,
            profilePhotoUrl: profilePhotoCheck.value,
          },
        }),
        "ownerProfile.create"
      );
    }

    const currentPhone = normalizePhoneToE164(savedOwner.phone) || phoneCheck.e164;
    const phoneChanged = previousPhone !== currentPhone;

    if (phoneChanged) {
      await setVerificationRequired(savedOwner.id, currentPhone);
    } else {
      const persistedToken = await findPersistedVerificationToken(savedOwner.id, currentPhone);
      const dbSnapshot = getDbVerificationSnapshot(savedOwner);

      if (!persistedToken && !dbSnapshot.phoneVerified) {
        await setVerificationRequired(savedOwner.id, currentPhone);
      }
    }

    const verification = await getEffectiveOwnerVerificationSnapshot(savedOwner);
    const response = await buildProfileResponse(savedOwner, verification);

    return res.json({
      ...response,
      message:
        response.state === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED"
          ? "OWNER_PROFILE_SAVED_PHONE_VERIFICATION_REQUIRED"
          : "OWNER_PROFILE_SAVED",
    });
  } catch (e: any) {
    console.error("[ownerProfile] post error:", e);

    const mappedConflict = mapOwnerProfilePersistenceError(e);
    if (mappedConflict) {
      return res.status(409).json({
        ok: false,
        message: mappedConflict,
      });
    }

    return res.status(500).json({
      ok: false,
      message: "INTERNAL_ERROR",
    });
  }
});

/**
 * POST /owner/profile/phone/send-otp
 * BODY/HEADERS resolve existing owner identity
 */
ownerProfileRouter.post("/profile/phone/send-otp", async (req: Request, res: Response) => {
  try {
    const owner: any = await resolveOwnerFromRequest(req);

    if (!owner) {
      return fail(res, "PROFILE_REQUIRED", 403, {
        state: "PROFILE_REQUIRED",
      });
    }

    if (!hasOwnerCoreProfile(owner)) {
      return fail(res, "PROFILE_REQUIRED", 403, {
        state: "PROFILE_REQUIRED",
      });
    }

    const verification = await getEffectiveOwnerVerificationSnapshot(owner);
    const normalizedOwner = await normalizeOwnerForResponse(owner, verification);

    if (!normalizedOwner.phone) {
      return fail(res, "OWNER_PHONE_NOT_FOUND", 400, {
        state: "PROFILE_REQUIRED",
      });
    }

    if (normalizedOwner.phoneVerified) {
      return res.json({
        ok: true,
        state: "SERVICE_SELECTION_REQUIRED" as OwnerFlowState,
        phoneVerified: true,
        phoneVerificationStatus: "VERIFIED",
        message: "OWNER_PHONE_ALREADY_VERIFIED",
      });
    }

    const ownerId = String(owner.id);
    const phoneE164 = normalizedOwner.phone;
    const existingSession = await findPersistedVerificationToken(ownerId, phoneE164);
    const lastSentAt = toValidDateOrNull(existingSession?.payload.lastSentAt);

    if (lastSentAt && Date.now() - lastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
      const secondsLeft = Math.ceil(
        (OTP_RESEND_COOLDOWN_MS - (Date.now() - lastSentAt.getTime())) / 1000
      );

      return fail(res, "OWNER_OTP_RESEND_COOLDOWN", 429, {
        state: "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED",
        phoneVerificationStatus:
          buildSnapshotFromPersistedToken(phoneE164, existingSession!).phoneVerificationStatus,
        cooldownSeconds: secondsLeft,
      });
    }

    const code = createOtpCode();
    const sentAt = new Date();
    const expiresAt = new Date(sentAt.getTime() + OTP_TTL_MS);

    await persistVerificationToken(ownerId, phoneE164, "SENT", {
      existingTokenId: existingSession?.id,
      otpHash: hashOtpCode(code),
      attempts: 0,
      lastSentAt: sentAt,
      verifiedAt: null,
      expiresAt,
    });

    console.log(`[ownerProfile] OTP generated for owner ${ownerId} (${phoneE164}): ${code}`);

    return res.json({
      ok: true,
      state: "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED" as OwnerFlowState,
      phoneVerified: false,
      phoneVerificationStatus: "SENT",
      expiresAt: expiresAt.toISOString(),
      cooldownSeconds: Math.ceil(OTP_RESEND_COOLDOWN_MS / 1000),
      message: "OWNER_OTP_SENT",
      ...(DEV_RETURN_OTP ? { testOtp: code } : {}),
    });
  } catch (e: any) {
    console.error("[ownerProfile] send otp error:", e);
    return res.status(500).json({
      ok: false,
      message: "INTERNAL_ERROR",
    });
  }
});

/**
 * POST /owner/profile/phone/verify-otp
 * BODY: { code }
 */
ownerProfileRouter.post("/profile/phone/verify-otp", async (req: Request, res: Response) => {
  try {
    const code = normalizeString(req.body?.code);

    if (!/^\d{4,8}$/.test(code)) {
      return fail(res, "OWNER_OTP_INVALID", 400, {
        state: "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED",
      });
    }

    const owner: any = await resolveOwnerFromRequest(req);

    if (!owner) {
      return fail(res, "PROFILE_REQUIRED", 403, {
        state: "PROFILE_REQUIRED",
      });
    }

    const verification = await getEffectiveOwnerVerificationSnapshot(owner);
    const normalizedOwner = await normalizeOwnerForResponse(owner, verification);

    if (!normalizedOwner.phone) {
      return fail(res, "OWNER_PHONE_NOT_FOUND", 400, {
        state: "PROFILE_REQUIRED",
      });
    }

    if (normalizedOwner.phoneVerified) {
      return res.json({
        ok: true,
        state: "SERVICE_SELECTION_REQUIRED" as OwnerFlowState,
        phoneVerified: true,
        phoneVerificationStatus: "VERIFIED",
        message: "OWNER_PHONE_ALREADY_VERIFIED",
      });
    }

    const session = await findPersistedVerificationToken(String(owner.id), normalizedOwner.phone);

    if (!session || !session.payload.otpHash) {
      return fail(res, "OWNER_OTP_NOT_SENT", 400, {
        state: "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED",
        phoneVerificationStatus:
          session && normalizedOwner.phone
            ? buildSnapshotFromPersistedToken(normalizedOwner.phone, session).phoneVerificationStatus
            : "REQUIRED",
      });
    }

    const currentStatus = buildSnapshotFromPersistedToken(normalizedOwner.phone, session);

    if (
      currentStatus.phoneVerificationStatus === "EXPIRED" ||
      session.expiresAt.getTime() <= Date.now()
    ) {
      await persistVerificationToken(String(owner.id), normalizedOwner.phone, "EXPIRED", {
        existingTokenId: session.id,
        attempts: session.payload.attempts,
        lastSentAt: toValidDateOrNull(session.payload.lastSentAt),
        verifiedAt: null,
        otpHash: null,
        expiresAt: new Date(Date.now() + OTP_STATE_RETENTION_MS),
      });

      return fail(res, "OWNER_OTP_EXPIRED", 400, {
        state: "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED",
        phoneVerificationStatus: "EXPIRED",
      });
    }

    if (session.payload.attempts >= OTP_MAX_ATTEMPTS) {
      await persistVerificationToken(String(owner.id), normalizedOwner.phone, "FAILED", {
        existingTokenId: session.id,
        attempts: session.payload.attempts,
        lastSentAt: toValidDateOrNull(session.payload.lastSentAt),
        verifiedAt: null,
        otpHash: null,
        expiresAt: new Date(Date.now() + OTP_STATE_RETENTION_MS),
      });

      return fail(res, "OWNER_OTP_TOO_MANY_ATTEMPTS", 429, {
        state: "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED",
        phoneVerificationStatus: "FAILED",
      });
    }

    const incomingHash = hashOtpCode(code);

    if (incomingHash !== session.payload.otpHash) {
      const nextAttempts = session.payload.attempts + 1;
      const failed = nextAttempts >= OTP_MAX_ATTEMPTS;

      await persistVerificationToken(
        String(owner.id),
        normalizedOwner.phone,
        failed ? "FAILED" : "SENT",
        {
          existingTokenId: session.id,
          attempts: nextAttempts,
          lastSentAt: toValidDateOrNull(session.payload.lastSentAt),
          verifiedAt: null,
          otpHash: failed ? null : session.payload.otpHash,
          expiresAt: failed ? new Date(Date.now() + OTP_STATE_RETENTION_MS) : session.expiresAt,
        }
      );

      return fail(
        res,
        failed ? "OWNER_OTP_TOO_MANY_ATTEMPTS" : "OWNER_OTP_WRONG",
        failed ? 429 : 400,
        {
          state: "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED",
          phoneVerificationStatus: failed ? "FAILED" : "SENT",
          attemptsLeft: Math.max(0, OTP_MAX_ATTEMPTS - nextAttempts),
        }
      );
    }

    const verifiedAt = new Date();

    await persistVerificationToken(String(owner.id), normalizedOwner.phone, "VERIFIED", {
      existingTokenId: session.id,
      attempts: session.payload.attempts,
      lastSentAt: toValidDateOrNull(session.payload.lastSentAt),
      verifiedAt,
      otpHash: null,
      expiresAt: new Date(Date.now() + OTP_STATE_RETENTION_MS),
    });

    return res.json({
      ok: true,
      state: "SERVICE_SELECTION_REQUIRED" as OwnerFlowState,
      phoneVerified: true,
      phoneVerifiedAt: verifiedAt.toISOString(),
      phoneVerificationStatus: "VERIFIED",
      message: "OWNER_PHONE_VERIFIED",
    });
  } catch (e: any) {
    console.error("[ownerProfile] verify otp error:", e);
    return res.status(500).json({
      ok: false,
      message: "INTERNAL_ERROR",
    });
  }
});