// apps/bot-api/src/index.ts

/**
 * CRITICAL:
 * - `packages/db` Prisma client `process.env.DATABASE_URL` oxuyur və import zamanı crash edir.
 * - Ona görə dotenv load **mütləq** Prisma/import edən router-lərdən ƏVVƏL işləməlidir.
 * - ESM-də static import-lar modul body-dən əvvəl evaluate olunduğu üçün bütün router importlarını
 *   dotenv-dən SONRA dinamik import edirik.
 */

import dotenv from "dotenv";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import express from "express";
import crypto from "crypto";
import cors from "cors";

// ---- ENV bootstrap (packages/db/.env single source of truth) ----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// src/index.ts -> apps/bot-api/src
// packages/db/.env -> repoRoot/packages/db/.env
const dbEnvPath = path.resolve(__dirname, "../../../packages/db/.env");

// Only load if not already set (prod environments can inject it)
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: dbEnvPath });
}

// ---- constants ----
const DB_TIMEOUT_MS = 5000;
const MAX_UPLOAD_FILE_BYTES = 5 * 1024 * 1024;
const MAX_UPLOAD_MULTIPART_BYTES = MAX_UPLOAD_FILE_BYTES + 512 * 1024;
const UPLOADS_ROOT = path.resolve(__dirname, "../uploads");
const OWNER_PHONE_VERIFICATION_TOKEN_PREFIX = "OWNER_PHONE_VERIFICATION_V1:";

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

type ParsedMultipartFile = {
  fieldName: string;
  filename: string;
  contentType: string;
  buffer: Buffer;
};

type ParsedMultipartResult = {
  fields: Record<string, string>;
  files: ParsedMultipartFile[];
};

type UploadKind = "owner-profile-photo" | "property-image" | "generic";

type ServiceGateState =
  | "PROFILE_REQUIRED"
  | "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED"
  | "SERVICE_SELECTION_REQUIRED";

type OwnerServicesGatePayload = {
  state: ServiceGateState;
  title: string;
  message: string;
  ctaLabel: string;
  ctaHref: string;
  serviceSelectionLocked: boolean;
  dashboardLocked: boolean;
  billingLocked: boolean;
};

type OwnerResolveCriteria = {
  ownerIdCandidates: string[];
  emailCandidates: string[];
  phoneVariants: string[];
  phoneDigitsCandidates: string[];
};

type VerificationStatus =
  | "REQUIRED"
  | "SENT"
  | "VERIFIED"
  | "EXPIRED"
  | "FAILED";

type PersistedPhoneVerificationPayload = {
  version: 1;
  kind: "OWNER_PHONE_VERIFICATION";
  phoneHash: string;
  status: VerificationStatus;
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

type OwnerVerificationSnapshot = {
  phoneVerified: boolean;
  phoneVerifiedAt: Date | null;
  phoneVerificationStatus: VerificationStatus;
  pendingPhone: string | null;
};

// ---- helpers ----
function rawBodySaver(req: any, _res: any, buf: any) {
  if (buf && buf.length) req.rawBody = buf.toString("utf8");
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

function normalizeString(input: unknown): string {
  return String(input ?? "").trim();
}

function normalizeEmail(input: unknown): string {
  return String(input ?? "").trim().toLowerCase();
}

function digitsOnly(input: string): string {
  return String(input || "").replace(/[^\d]/g, "");
}

function normalizePhone(input: unknown): string {
  const raw = String(input ?? "").trim();
  if (!raw) return "";

  const digits = digitsOnly(raw);
  if (!digits) return "";

  return `+${digits}`;
}

function getPhoneVariants(input: unknown): string[] {
  const normalized = normalizePhone(input);
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

  for (const value of getPhoneVariants(input)) {
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

function getContentType(req: express.Request): string {
  return String(req.headers["content-type"] ?? "").trim().toLowerCase();
}

function getBoundaryFromContentType(contentType: string): string {
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  return String(match?.[1] || match?.[2] || "").trim();
}

function parseHeadersBlock(block: string): Record<string, string> {
  const out: Record<string, string> = {};

  for (const line of block.split("\r\n")) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;

    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (key) {
      out[key] = value;
    }
  }

  return out;
}

function parseMultipartFormData(
  bodyBuffer: Buffer,
  contentType: string
): { ok: true; value: ParsedMultipartResult } | { ok: false; message: string } {
  const boundary = getBoundaryFromContentType(contentType);
  if (!boundary) {
    return { ok: false, message: "Multipart boundary tapılmadı." };
  }

  const text = bodyBuffer.toString("latin1");
  const boundaryToken = `--${boundary}`;
  const rawParts = text.split(boundaryToken);

  const fields: Record<string, string> = {};
  const files: ParsedMultipartFile[] = [];

  for (let part of rawParts) {
    if (!part) continue;
    if (part === "--" || part === "--\r\n") continue;

    if (part.startsWith("\r\n")) part = part.slice(2);
    if (part.endsWith("\r\n")) part = part.slice(0, -2);
    if (part.endsWith("--")) part = part.slice(0, -2);

    if (!part) continue;

    const headerEndIndex = part.indexOf("\r\n\r\n");
    if (headerEndIndex < 0) {
      continue;
    }

    const headerText = part.slice(0, headerEndIndex);
    const payloadText = part.slice(headerEndIndex + 4);

    const headers = parseHeadersBlock(headerText);
    const disposition = headers["content-disposition"] || "";

    const nameMatch = disposition.match(/name="([^"]+)"/i);
    if (!nameMatch?.[1]) continue;

    const fieldName = nameMatch[1];
    const filenameMatch = disposition.match(/filename="([^"]*)"/i);
    const filename = filenameMatch?.[1] ? path.basename(filenameMatch[1]) : "";
    const contentTypeHeader = String(headers["content-type"] || "").trim().toLowerCase();

    if (filename) {
      files.push({
        fieldName,
        filename,
        contentType: contentTypeHeader,
        buffer: Buffer.from(payloadText, "latin1"),
      });
      continue;
    }

    fields[fieldName] = payloadText;
  }

  return {
    ok: true,
    value: { fields, files },
  };
}

function detectImageMimeType(buffer: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

function getExtensionForMimeType(mimeType: string): string {
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  return "";
}

function sanitizeFileBaseName(filename: string): string {
  const base = path.basename(filename, path.extname(filename));
  const safe = base
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return safe || "image";
}

function normalizeUploadKind(input: unknown): UploadKind {
  const value = normalizeString(input).toLowerCase();

  if (
    value === "owner-profile-photo" ||
    value === "owner_profile_photo" ||
    value === "profile-photo" ||
    value === "profile_photo" ||
    value === "avatar"
  ) {
    return "owner-profile-photo";
  }

  if (
    value === "property-image" ||
    value === "property_image" ||
    value === "property-gallery" ||
    value === "property_gallery" ||
    value === "listing-image" ||
    value === "listing_image"
  ) {
    return "property-image";
  }

  return "generic";
}

function getUploadSubdir(kind: UploadKind): string {
  if (kind === "owner-profile-photo") return "owner-profiles";
  if (kind === "property-image") return "property-images";
  return "misc";
}

async function ensureDirectory(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

async function writeBufferUniq(dir: string, fileName: string, buffer: Buffer): Promise<string> {
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext);

  for (let i = 0; i < 5; i += 1) {
    const candidate =
      i === 0 ? `${base}${ext}` : `${base}-${crypto.randomBytes(3).toString("hex")}${ext}`;
    const absolute = path.join(dir, candidate);

    try {
      await fs.writeFile(absolute, buffer, { flag: "wx" });
      return candidate;
    } catch (error: any) {
      if (error?.code !== "EEXIST") {
        throw error;
      }
    }
  }

  throw new Error("UPLOAD_WRITE_FAILED");
}

function buildPublicUploadPath(subdir: string, fileName: string): string {
  return `/uploads/${subdir}/${fileName}`;
}

function isMultipartRequest(req: express.Request): boolean {
  return getContentType(req).includes("multipart/form-data");
}

function hasOwnerCoreProfile(owner: any): boolean {
  const name = normalizeString(owner?.name);
  const phone = normalizePhone(owner?.phone);
  const email = normalizeEmail(owner?.email);

  return !!name && !!phone && !!email;
}

function isOwnerVerificationComplete(verification: OwnerVerificationSnapshot): boolean {
  const phoneVerified = verification.phoneVerified === true;
  const phoneVerifiedAtValid =
    !!verification.phoneVerifiedAt &&
    verification.phoneVerifiedAt instanceof Date &&
    !Number.isNaN(verification.phoneVerifiedAt.getTime());
  const status = normalizeString(verification.phoneVerificationStatus).toUpperCase();

  return phoneVerified || phoneVerifiedAtValid || status === "VERIFIED";
}

function getRelativeProfileUrl(serviceKey?: string): string {
  const params = new URLSearchParams();
  if (serviceKey) params.set("serviceKey", serviceKey);
  return `/profile${params.toString() ? `?${params.toString()}` : ""}`;
}

function getRelativeServicesUrl(serviceKey?: string): string {
  const params = new URLSearchParams();
  if (serviceKey) params.set("serviceKey", serviceKey);
  return `/services${params.toString() ? `?${params.toString()}` : ""}`;
}

function buildServicesGatePayload(
  state: ServiceGateState,
  serviceKey?: string
): OwnerServicesGatePayload {
  if (state === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED") {
    return {
      state,
      title: "Telefon təsdiqi tələb olunur",
      message:
        "Profil yadda saxlanılıb, amma telefon OTP ilə təsdiqlənməyib. Telefon təsdiqi tamamlanmadan xidmət seçimi, billing və dashboard bağlı qalır.",
      ctaLabel: "Profilə keç və OTP-ni tamamla",
      ctaHref: getRelativeProfileUrl(serviceKey),
      serviceSelectionLocked: true,
      dashboardLocked: true,
      billingLocked: true,
    };
  }

  if (state === "SERVICE_SELECTION_REQUIRED") {
    return {
      state,
      title: "Xidmət seç",
      message:
        "Profil və telefon təsdiqi tamamdır. İndi xidmət seçimi açıqdır. Dashboard isə yalnız uğurlu billingdən sonra açılmalıdır.",
      ctaLabel: "Xidmət seçimini davam et",
      ctaHref: getRelativeServicesUrl(serviceKey),
      serviceSelectionLocked: false,
      dashboardLocked: true,
      billingLocked: false,
    };
  }

  return {
    state: "PROFILE_REQUIRED",
    title: "Owner profili tələb olunur",
    message:
      "Xidmətlərdən yararlanmaq üçün ilk öncə owner profili tamamlanmalıdır. Profil və telefon mərhələsi bitmədən xidmət seçimi və dashboard açılmır.",
    ctaLabel: "Profil səhifəsinə keç",
    ctaHref: getRelativeProfileUrl(serviceKey),
    serviceSelectionLocked: true,
    dashboardLocked: true,
    billingLocked: true,
  };
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

function hashPhoneFingerprint(phone: string): string {
  const normalized = normalizePhone(phone) || normalizeString(phone);
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

function isVerificationStatus(value: unknown): value is VerificationStatus {
  return (
    value === "REQUIRED" ||
    value === "SENT" ||
    value === "VERIFIED" ||
    value === "EXPIRED" ||
    value === "FAILED"
  );
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

    const rawStatus = String(parsed.status || "");
    if (!isVerificationStatus(rawStatus)) {
      return null;
    }

    return {
      version: 1,
      kind: "OWNER_PHONE_VERIFICATION",
      phoneHash: parsed.phoneHash,
      status: rawStatus,
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
  const verifiedAt = token.payload.verifiedAt ? new Date(token.payload.verifiedAt) : null;
  const normalizedPhone = normalizePhone(phoneE164) || normalizeString(phoneE164);

  if (token.payload.status === "VERIFIED") {
    return {
      phoneVerified: true,
      phoneVerifiedAt:
        verifiedAt && !Number.isNaN(verifiedAt.getTime()) ? verifiedAt : token.createdAt,
      phoneVerificationStatus: "VERIFIED",
      pendingPhone: null,
    };
  }

  const status: VerificationStatus =
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

async function findPersistedVerificationToken(
  ownerId: string,
  phoneE164: string
): Promise<PersistedPhoneVerificationToken | null> {
  const normalizedOwnerId = normalizeString(ownerId);
  const normalizedPhone = normalizePhone(phoneE164) || normalizeString(phoneE164);

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
    "index.findPersistedVerificationToken"
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

async function getEffectiveOwnerVerificationSnapshot(owner: any): Promise<OwnerVerificationSnapshot> {
  const ownerId = normalizeString(owner?.id);
  const ownerPhone = normalizePhone(owner?.phone) || normalizeString(owner?.phone);

  if (!ownerId || !ownerPhone) {
    return getDbVerificationSnapshot(owner);
  }

  const persisted = await findPersistedVerificationToken(ownerId, ownerPhone);
  if (persisted) {
    return buildSnapshotFromPersistedToken(ownerPhone, persisted);
  }

  return getDbVerificationSnapshot(owner);
}

function buildOwnerResolveCriteria(req: express.Request): OwnerResolveCriteria {
  const headerOwnerIdRaw = req.headers["x-owner-id"] || req.headers["x-ownerid"];
  const queryOwnerId = normalizeString(req.query?.ownerId);
  const bodyOwnerId = normalizeString((req as any).body?.ownerId);

  const ownerIdCandidates = [headerOwnerIdRaw, queryOwnerId, bodyOwnerId]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => normalizeAsciiHeaderValue(value))
    .filter(Boolean);

  const headerPhoneRaw = req.headers["x-owner-phone"] || req.headers["x-ownerphone"];
  const queryPhone = normalizePhone(req.query?.phone);
  const bodyPhone = normalizePhone((req as any).body?.phone);

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
  const bodyEmail = normalizeEmail((req as any).body?.email);

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

const app = express();

app.use(
  express.json({
    verify: rawBodySaver,
  })
);

const extraAllowed = (process.env.WEB_APP_URLS ?? process.env.WEB_APP_URL ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);

      if (
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
      ) {
        return cb(null, true);
      }

      if (extraAllowed.includes(origin)) return cb(null, true);

      return cb(null, false);
    },
    credentials: true,
  })
);

// static uploads
await ensureDirectory(UPLOADS_ROOT);

app.use(
  "/uploads",
  express.static(UPLOADS_ROOT, {
    index: false,
    fallthrough: false,
    redirect: false,
    etag: true,
    maxAge: "7d",
  })
);

// ---- dynamic bootstrap (after dotenv) ----
const [{ env }, prismaMod, routers, workerMod] = await Promise.all([
  import("./config/env.js"),
  import("db"),
  Promise.all([
    import("./routes/health.js"),
    import("./routes/webhook.js"),
    import("./routes/messages.js"),
    import("./routes/webhookSimulator.js"),
    import("./routes/booking.js"),
    import("./routes/ownerProperties.js"),
    import("./routes/favorites.js"),
    import("./routes/billing.js"),
    import("./routes/ownerBookings.js"),
    import("./routes/ownerProfile.js"),
  ]),
  import("./workers/messageWorker.js"),
]);

const prisma = prismaMod.default;

// ROUTERS (resolved from the array above, in exact same order)
const [
  { healthRouter },
  { webhookRouter },
  { messagesRouter },
  { webhookSimulatorRouter },
  { bookingRouter },
  { ownerPropertiesRouter },
  { favoritesRouter },
  { billingRouter },
  { ownerBookingsRouter },
  { ownerProfileRouter },
] = routers;

const { startMessageWorker } = workerMod;

async function resolveOwnerFromRequest(req: express.Request) {
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
    "index.resolveOwnerFromRequest.findMany"
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

async function mediaUploadHandler(req: express.Request, res: express.Response) {
  try {
    const contentType = getContentType(req);
    if (!contentType.includes("multipart/form-data")) {
      return res.status(400).json({
        ok: false,
        message: "multipart/form-data tələb olunur",
      });
    }

    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    if (!raw.length) {
      return res.status(400).json({
        ok: false,
        message: "Yüklənəcək fayl tapılmadı",
      });
    }

    const parsed = parseMultipartFormData(raw, contentType);
    if (!parsed.ok) {
      return res.status(400).json({
        ok: false,
        message: parsed.message,
      });
    }

    const firstFile =
      parsed.value.files.find((file) => file.fieldName === "file") || parsed.value.files[0];

    if (!firstFile) {
      return res.status(400).json({
        ok: false,
        message: "Fayl hissəsi tapılmadı",
      });
    }

    if (firstFile.buffer.length <= 0) {
      return res.status(400).json({
        ok: false,
        message: "Boş fayl yükləmək olmaz",
      });
    }

    if (firstFile.buffer.length > MAX_UPLOAD_FILE_BYTES) {
      return res.status(400).json({
        ok: false,
        message: `Şəkil maksimum ${Math.round(
          MAX_UPLOAD_FILE_BYTES / (1024 * 1024)
        )} MB ola bilər`,
      });
    }

    const detectedMimeType = detectImageMimeType(firstFile.buffer);
    if (!detectedMimeType) {
      return res.status(400).json({
        ok: false,
        message: "Yalnız JPG, PNG və WEBP şəkilləri qəbul olunur",
      });
    }

    if (firstFile.contentType && !ALLOWED_IMAGE_MIME_TYPES.has(firstFile.contentType)) {
      return res.status(400).json({
        ok: false,
        message: "Yalnız JPG, PNG və WEBP şəkilləri qəbul olunur",
      });
    }

    const fields = parsed.value.fields;
    const kind = normalizeUploadKind(fields.kind || req.query.kind);
    const subdir = getUploadSubdir(kind);
    const targetDir = path.join(UPLOADS_ROOT, subdir);

    await ensureDirectory(targetDir);

    const baseName = sanitizeFileBaseName(firstFile.filename);
    const ext = getExtensionForMimeType(detectedMimeType);
    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(5).toString("hex");
    const requestedName = `${baseName}-${timestamp}-${randomSuffix}${ext}`;

    const savedFileName = await writeBufferUniq(targetDir, requestedName, firstFile.buffer);
    const publicPath = buildPublicUploadPath(subdir, savedFileName);

    return res.json({
      ok: true,
      kind,
      url: publicPath,
      path: publicPath,
      mediaUrl: publicPath,
      fileUrl: publicPath,
      profilePhotoUrl: kind === "owner-profile-photo" ? publicPath : undefined,
      mimeType: detectedMimeType,
      sizeBytes: firstFile.buffer.length,
    });
  } catch (e: any) {
    console.error("[media upload] error:", e);
    return res.status(500).json({
      ok: false,
      message: e?.message || "INTERNAL_ERROR",
    });
  }
}

//
// ROUTES
//

app.use(healthRouter);
app.use(webhookRouter);
app.use(messagesRouter);
app.use(webhookSimulatorRouter);
app.use("/booking", bookingRouter);
app.use("/owner", ownerPropertiesRouter);
app.use(favoritesRouter);
app.use("/billing", billingRouter);
app.use("/owner", ownerBookingsRouter);
app.use("/owner", ownerProfileRouter);

// upload routes
app.post(
  ["/owner/profile/photo/upload", "/owner/media/upload", "/media/upload"],
  express.raw({
    type: (req) => isMultipartRequest(req as express.Request),
    limit: MAX_UPLOAD_MULTIPART_BYTES,
  }),
  mediaUploadHandler
);

/**
 * ✅ GET /owner/services
 * Owner panel üçün service list (serviceKey selection).
 *
 * - active servislər qaytarılır (isActive=true)
 * - owner identity ilə tapılır (x-owner-id / x-owner-phone / x-owner-email / query)
 * - subscription info qaytarılır
 * - OTP verification state token-based persistence-dən oxunur
 * - dashboard unlock bu endpoint-də deyil, service-specific billing/subscription status ilə həll olunur
 */
app.get("/owner/services", async (req, res) => {
  try {
    const requestedServiceKey = normalizeString(req.query.serviceKey).toUpperCase();
    const owner = await resolveOwnerFromRequest(req);

    const services = await withTimeout(
      prisma.service.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          key: true,
          name: true,
          description: true,
          price: true,
          currency: true,
          periodDays: true,
          isActive: true,
          standardMonthlyPrice: true,
          standardYearlyPrice: true,
          premiumMonthlyPrice: true,
          premiumYearlyPrice: true,
        },
      }),
      "GET /owner/services service.findMany"
    );

    if (!owner) {
      const gate = buildServicesGatePayload("PROFILE_REQUIRED", requestedServiceKey || "");

      return res.json({
        ok: true,
        state: "PROFILE_REQUIRED",
        owner: null,
        verification: {
          phoneVerified: false,
          phoneVerifiedAt: null,
          phoneVerificationStatus: "REQUIRED",
          pendingPhone: null,
        },
        gate,
        onboarding: {
          state: "PROFILE_REQUIRED",
          owner: null,
          gate,
        },
        items: services.map((s) => {
          const standardMonthlyPrice =
            typeof s.standardMonthlyPrice === "number" && s.standardMonthlyPrice > 0
              ? s.standardMonthlyPrice
              : typeof s.price === "number" && s.price > 0
                ? s.price
                : null;

          const plusMonthlyPrice =
            typeof s.premiumMonthlyPrice === "number" && s.premiumMonthlyPrice > 0
              ? s.premiumMonthlyPrice
              : null;

          const standardYearlyPrice =
            typeof s.standardYearlyPrice === "number" && s.standardYearlyPrice > 0
              ? s.standardYearlyPrice
              : null;

          const plusYearlyPrice =
            typeof s.premiumYearlyPrice === "number" && s.premiumYearlyPrice > 0
              ? s.premiumYearlyPrice
              : null;

          return {
            id: s.id,
            serviceKey: s.key,
            key: s.key,
            name: s.name,
            title: s.name,
            description: s.description,
            price: standardMonthlyPrice,
            currency: s.currency,
            periodDays: 30,
            isActive: s.isActive,
            pricing: {
              standardMonthlyPrice,
              plusMonthlyPrice,
              legacyPrice: typeof s.price === "number" && s.price > 0 ? s.price : null,
              standardYearlyPrice,
              plusYearlyPrice,
              legacyPeriodDays: s.periodDays,
            },
            subscription: {
              active: false,
              status: null,
              tier: null,
              billingCycle: null,
              paidUntil: null,
              legacyActive: false,
            },
          };
        }),
      });
    }

    const verification = await getEffectiveOwnerVerificationSnapshot(owner);
    const profileCompleted = hasOwnerCoreProfile(owner);
    const verificationCompleted = isOwnerVerificationComplete(verification);
    const legacyActive = !!owner.paidUntil && owner.paidUntil.getTime() > Date.now();

    const subs = await withTimeout(
      prisma.ownerSubscription.findMany({
        where: { ownerId: owner.id },
        select: {
          serviceId: true,
          status: true,
          tier: true,
          billingCycle: true,
          paidUntil: true,
        },
      }),
      "GET /owner/services ownerSubscription.findMany"
    );

    const subMap = new Map<
      string,
      {
        status: "ACTIVE" | "EXPIRED" | "CANCELED";
        tier: "STANDARD" | "PREMIUM";
        billingCycle: "MONTHLY" | "YEARLY";
        paidUntil: Date | null;
      }
    >();

    for (const s of subs) {
      subMap.set(s.serviceId, {
        status: s.status,
        tier: s.tier,
        billingCycle: s.billingCycle,
        paidUntil: s.paidUntil ?? null,
      });
    }

    const items = services.map((s) => {
      const sub = subMap.get(s.id);

      const isSubActive =
        !!sub &&
        sub.status === "ACTIVE" &&
        !!sub.paidUntil &&
        sub.paidUntil.getTime() > Date.now();

      const standardMonthlyPrice =
        typeof s.standardMonthlyPrice === "number" && s.standardMonthlyPrice > 0
          ? s.standardMonthlyPrice
          : typeof s.price === "number" && s.price > 0
            ? s.price
            : null;

      const plusMonthlyPrice =
        typeof s.premiumMonthlyPrice === "number" && s.premiumMonthlyPrice > 0
          ? s.premiumMonthlyPrice
          : null;

      const standardYearlyPrice =
        typeof s.standardYearlyPrice === "number" && s.standardYearlyPrice > 0
          ? s.standardYearlyPrice
          : null;

      const plusYearlyPrice =
        typeof s.premiumYearlyPrice === "number" && s.premiumYearlyPrice > 0
          ? s.premiumYearlyPrice
          : null;

      return {
        id: s.id,
        serviceKey: s.key,
        key: s.key,
        name: s.name,
        title: s.name,
        description: s.description,
        price: standardMonthlyPrice,
        currency: s.currency,
        periodDays: 30,
        isActive: s.isActive,
        pricing: {
          standardMonthlyPrice,
          plusMonthlyPrice,
          legacyPrice: typeof s.price === "number" && s.price > 0 ? s.price : null,
          standardYearlyPrice,
          plusYearlyPrice,
          legacyPeriodDays: s.periodDays,
        },
        subscription: {
          active: isSubActive,
          status: sub?.status ?? null,
          tier: sub?.tier ?? null,
          billingCycle: sub?.billingCycle ?? null,
          paidUntil: sub?.paidUntil ? sub.paidUntil.toISOString() : null,
          legacyActive,
        },
      };
    });

    const state: ServiceGateState = !profileCompleted
      ? "PROFILE_REQUIRED"
      : !verificationCompleted
        ? "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED"
        : "SERVICE_SELECTION_REQUIRED";

    const gate = buildServicesGatePayload(state, requestedServiceKey || "");

    return res.json({
      ok: true,
      state,
      owner: {
        id: owner.id,
        name: owner.name ?? null,
        phone: normalizePhone(owner.phone) || owner.phone || null,
        email: owner.email ?? null,
        profileExists: true,
        profileCompleted,
        phoneVerified: verification.phoneVerified,
        phoneVerifiedAt: verification.phoneVerifiedAt
          ? verification.phoneVerifiedAt.toISOString()
          : null,
        phoneVerificationStatus: verification.phoneVerificationStatus,
      },
      verification: {
        phoneVerified: verification.phoneVerified,
        phoneVerifiedAt: verification.phoneVerifiedAt
          ? verification.phoneVerifiedAt.toISOString()
          : null,
        phoneVerificationStatus: verification.phoneVerificationStatus,
        pendingPhone: verification.pendingPhone,
      },
      gate,
      onboarding: {
        state,
        owner: {
          id: owner.id,
          name: owner.name ?? null,
          phone: normalizePhone(owner.phone) || owner.phone || null,
          email: owner.email ?? null,
          profileExists: true,
          profileCompleted,
          phoneVerified: verification.phoneVerified,
          phoneVerifiedAt: verification.phoneVerifiedAt
            ? verification.phoneVerifiedAt.toISOString()
            : null,
          phoneVerificationStatus: verification.phoneVerificationStatus,
        },
        gate,
      },
      items,
    });
  } catch (e) {
    console.error("[GET /owner/services] error:", e);
    return res.status(500).json({ ok: false, message: "INTERNAL_ERROR" });
  }
});

//
// WORKER
//

const workerId = `bot-api-${process.pid}-${crypto.randomBytes(4).toString("hex")}`;

startMessageWorker({
  workerId,
  pollIntervalMs: 1000,
  batchSize: 10,
}).catch((e: any) => {
  console.error("[worker] failed to start:", e);
});

//
// SERVER
//

const PORT = env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ bot-api listening on http://localhost:${PORT}`);
});