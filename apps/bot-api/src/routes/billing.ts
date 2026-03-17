import { createHash } from "crypto";
import { Router, type Request } from "express";
import prisma from "db";
import { env } from "../config/env.js";
import { sendTextMessage } from "../services/whatsapp/client.js";

import { mockProvider } from "../services/payments/mockProvider.js";
import { stripeProvider } from "../services/payments/stripeProvider.js";
import type { PaymentProvider, ProviderName } from "../services/payments/types.js";
import type { OwnerFlowState } from "./ownerProfile.js";

export const billingRouter = Router();

const DB_TIMEOUT_MS = 5000;
const OWNER_PHONE_VERIFICATION_TOKEN_PREFIX = "OWNER_PHONE_VERIFICATION_V1:";

type SubscriptionTier = "STANDARD" | "PREMIUM";
type BillingCycle = "MONTHLY" | "YEARLY";
type PublicPlan = "STANDARD" | "PLUS";
type BillingState = OwnerFlowState | "SUBSCRIPTION_REQUIRED" | "ACTIVE";

type VerificationStatus =
  | "REQUIRED"
  | "SENT"
  | "VERIFIED"
  | "EXPIRED"
  | "FAILED";

type OwnerVerificationSnapshot = {
  phoneVerified: boolean;
  phoneVerifiedAt: Date | null;
  phoneVerificationStatus: VerificationStatus;
  pendingPhone: string | null;
};

type BillingGate =
  | {
    ok: true;
    owner: any;
    ownerState: OwnerFlowState;
    verification: OwnerVerificationSnapshot;
  }
  | {
    ok: false;
    status: number;
    error: "PROFILE_REQUIRED" | "PHONE_VERIFICATION_REQUIRED";
    state: OwnerFlowState;
    verification?: OwnerVerificationSnapshot;
    owner?: {
      id: string | null;
      phone: string | null;
      name: string | null;
      email: string | null;
    } | null;
  };

type PlanPricingResult = {
  amount: number | null;
  currency: string;
  periodDays: number;
  requiredField: "standardMonthlyPrice" | "premiumMonthlyPrice" | null;
  code:
  | "OK"
  | "STANDARD_PRICING_NOT_CONFIGURED"
  | "PLUS_PRICING_NOT_CONFIGURED";
};

type CountryConfig = {
  iso2: string;
  dial: string;
  minNationalLength: number;
  maxNationalLength: number;
  allowedNationalPrefixes?: string[];
};

type OwnerResolveCriteria = {
  ownerIdCandidates: string[];
  emailCandidates: string[];
  phoneVariants: string[];
  phoneDigitsCandidates: string[];
};

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

/**
 * Provider allow-list (server controlled).
 * NOTE: Portmanat/Crypto later.
 */
function getProvider(name?: ProviderName): PaymentProvider {
  const requested = (name ?? "").trim() as ProviderName;
  const envDefault = (process.env.BILLING_PROVIDER ?? "mock") as ProviderName;
  const chosen = requested || envDefault;

  if (chosen === "stripe") return stripeProvider;
  if (chosen === "mock") return mockProvider;

  return mockProvider;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function formatUtcInstant(d: Date): string {
  return d.toISOString();
}

function addDaysToInstant(base: Date, periodDays: number): Date {
  const normalizedPeriodDays =
    Number.isFinite(periodDays) && Number(periodDays) > 0 ? Math.trunc(Number(periodDays)) : 0;

  return new Date(base.getTime() + normalizedPeriodDays * DAY_IN_MS);
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

function normalizeIso2(input: unknown): string {
  return String(input ?? "").trim().toUpperCase();
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

function normalizePhone(input: unknown, phoneCountryIso2?: unknown): string {
  return normalizePhoneToE164(input, phoneCountryIso2);
}

function normalizeServiceKey(input: unknown): string {
  const value = String(input ?? "").trim().toUpperCase();
  if (!value) return "";
  if (!/^[A-Z0-9_-]{2,64}$/.test(value)) return "";
  return value;
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

function buildLookupFingerprint(input: {
  ownerId?: unknown;
  phone?: unknown;
  email?: unknown;
}): string {
  const ownerId = normalizeString(input.ownerId);
  const phone = normalizePhone(input.phone);
  const email = normalizeEmail(input.email);

  return createHash("sha256")
    .update([ownerId, phone, email].join("|"))
    .digest("hex");
}

function buildOwnerResolveCriteria(req: Request, fallbackPhone?: unknown): OwnerResolveCriteria {
  const headerOwnerIdRaw = req.headers["x-owner-id"] || req.headers["x-ownerid"];
  const queryOwnerId = normalizeString(req.query?.ownerId);
  const bodyOwnerId = normalizeString(req.body?.ownerId);

  const ownerIdCandidates = [headerOwnerIdRaw, queryOwnerId, bodyOwnerId]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => normalizeAsciiHeaderValue(value))
    .filter(Boolean);

  const headerPhoneRaw = req.headers["x-owner-phone"] || req.headers["x-ownerphone"];
  const phoneCountryIso2 = req.body?.phoneCountryIso2 ?? req.query?.phoneCountryIso2;
  const queryPhone = normalizePhone(req.query?.phone, phoneCountryIso2);
  const bodyPhone = normalizePhone(req.body?.phone, phoneCountryIso2);
  const directPhone = normalizePhone(fallbackPhone, phoneCountryIso2);

  const phoneCandidates = [headerPhoneRaw, queryPhone, bodyPhone, directPhone]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => normalizePhone(value, phoneCountryIso2))
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

function hasOwnerCoreProfile(owner: any): boolean {
  const name = normalizeString(owner?.name);
  const phone = normalizePhone(owner?.phone);
  const email = normalizeEmail(owner?.email);

  return !!name && !!phone && !!email;
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

async function resolveOwnerFromRequest(req: Request, fallbackPhone?: unknown) {
  const criteria = buildOwnerResolveCriteria(req, fallbackPhone);
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
    "billing.resolveOwnerFromRequest.findMany"
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

function fillUrlTemplate(template: string, invoiceId: string): string {
  const safeInvoiceId = encodeURIComponent(String(invoiceId || "").trim());

  return String(template || "")
    .replaceAll("{INVOICE_ID}", safeInvoiceId)
    .replaceAll("%7BINVOICE_ID%7D", safeInvoiceId)
    .replaceAll("%7binvoice_id%7d", safeInvoiceId);
}

function getWebAppBaseUrl(): string {
  const primary = String(process.env.WEB_APP_URL ?? "").trim();
  if (primary) return primary;

  const list = String(process.env.WEB_APP_URLS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return list[0] ?? "http://localhost:3000";
}

function parseUrlSafe(input: string): URL | null {
  try {
    return new URL(String(input || "").trim());
  } catch {
    return null;
  }
}

function isSafeReturnTemplate(tpl: string): boolean {
  const base = parseUrlSafe(getWebAppBaseUrl());
  const candidate = parseUrlSafe(tpl);

  if (!base || !candidate) return false;
  if (!["http:", "https:"].includes(candidate.protocol)) return false;

  return candidate.origin === base.origin;
}

function getReceiptFallback(invoiceId: string, status?: "success" | "cancel"): string {
  const qs = new URLSearchParams();
  qs.set("invoiceId", invoiceId);
  if (status) qs.set("status", status);
  return `${getWebAppBaseUrl()}/receipt?${qs.toString()}`;
}

function resolveSafeRedirect(url: string, fallback: string): string {
  const candidate = String(url ?? "").trim();
  if (!candidate) return fallback;
  return isSafeReturnTemplate(candidate) ? candidate : fallback;
}

function normalizePublicPlan(input: unknown): PublicPlan | "" {
  const value = String(input ?? "").trim().toUpperCase();

  if (!value) return "";
  if (value === "STANDARD" || value === "STANDART") return "STANDARD";
  if (value === "PLUS" || value === "PREMIUM") return "PLUS";

  return "";
}

function normalizeTier(input: unknown): SubscriptionTier {
  const value = String(input ?? "").trim().toUpperCase();
  return value === "PREMIUM" ? "PREMIUM" : "STANDARD";
}

/**
 * New rule:
 * - only monthly renewals can be created
 * - yearly remains readable only for legacy invoices/subscriptions
 */
function normalizeBillingCycle(_input: unknown): BillingCycle {
  return "MONTHLY";
}

function resolveRequestedTier(body: any): SubscriptionTier {
  const plan = normalizePublicPlan(body?.plan);
  if (plan === "PLUS") return "PREMIUM";
  if (plan === "STANDARD") return "STANDARD";

  return normalizeTier(body?.subscriptionTier);
}

function resolveRequestedPublicPlan(body: any): PublicPlan {
  const plan = normalizePublicPlan(body?.plan);
  if (plan) return plan;

  const tier = normalizeTier(body?.subscriptionTier);
  return tier === "PREMIUM" ? "PLUS" : "STANDARD";
}

function getLegacyMonthlyPeriodDays(periodDays?: number | null): number {
  if (typeof periodDays === "number" && periodDays > 0) return periodDays;
  return 30;
}

function resolvePlanPricing(
  service: {
    price: number | null;
    currency: string;
    periodDays: number;
    standardMonthlyPrice: number | null;
    premiumMonthlyPrice: number | null;
  },
  tier: SubscriptionTier
): PlanPricingResult {
  let amount: number | null = null;
  let periodDays = 30;

  if (tier === "PREMIUM") {
    amount = service.premiumMonthlyPrice;
    periodDays = 30;

    return {
      amount: amount && amount > 0 ? amount : null,
      currency: service.currency,
      periodDays,
      requiredField: amount && amount > 0 ? null : "premiumMonthlyPrice",
      code: amount && amount > 0 ? "OK" : "PLUS_PRICING_NOT_CONFIGURED",
    };
  }

  amount = service.standardMonthlyPrice;
  periodDays = 30;

  if (!amount || amount <= 0) {
    amount = service.price;
    periodDays = getLegacyMonthlyPeriodDays(service.periodDays);
  }

  return {
    amount: amount && amount > 0 ? amount : null,
    currency: service.currency,
    periodDays,
    requiredField: amount && amount > 0 ? null : "standardMonthlyPrice",
    code: amount && amount > 0 ? "OK" : "STANDARD_PRICING_NOT_CONFIGURED",
  };
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

function isBlockingSamePlanActiveSubscription(
  sub:
    | {
      status: string;
      paidUntil: Date | null;
      tier?: unknown;
    }
    | null
    | undefined,
  requestedTier: SubscriptionTier
) {
  if (!isSubscriptionCurrentlyActive(sub)) return false;
  return normalizeTier(sub?.tier) === requestedTier;
}

function isActivePlanChange(
  sub:
    | {
      status: string;
      paidUntil: Date | null;
      tier?: unknown;
    }
    | null
    | undefined,
  requestedTier: SubscriptionTier
) {
  if (!isSubscriptionCurrentlyActive(sub)) return false;
  return normalizeTier(sub?.tier) !== requestedTier;
}

function publicPlanFromTier(tier: SubscriptionTier): PublicPlan {
  return tier === "PREMIUM" ? "PLUS" : "STANDARD";
}

function buildPlanLabel(tier: SubscriptionTier, billingCycle: BillingCycle): string {
  const publicPlan = publicPlanFromTier(tier);
  const label = publicPlan === "PLUS" ? "Plus" : "Standart";

  if (billingCycle === "YEARLY") {
    return `${label} illik (legacy)`;
  }

  return `${label} aylıq`;
}

function buildReceiptNumber(invoiceId: string, paidAt?: Date | null): string {
  const stamp = paidAt ? paidAt.toISOString().slice(0, 10).replaceAll("-", "") : "draft";
  const tail = String(invoiceId || "").replaceAll("-", "").slice(-8).toUpperCase();
  return `RCPT-${stamp}-${tail || "UNKNOWN"}`;
}

function buildOwnerLite(owner: any) {
  if (!owner) return null;

  return {
    id: owner.id ?? null,
    phone: normalizePhone(owner.phone) || owner.phone || null,
    name: owner.name ?? null,
    email: owner.email ?? null,
  };
}

function buildBillingState(
  ownerState: OwnerFlowState,
  serviceIsActive: boolean,
  subscription:
    | {
      status: string;
      paidUntil: Date | null;
      tier?: unknown;
    }
    | null
    | undefined,
  requestedTier?: SubscriptionTier | null
): BillingState {
  if (ownerState === "PROFILE_REQUIRED") return "PROFILE_REQUIRED";
  if (ownerState === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED") {
    return "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED";
  }

  if (!serviceIsActive) {
    return "SUBSCRIPTION_REQUIRED";
  }

  if (!requestedTier) {
    return isSubscriptionCurrentlyActive(subscription) ? "ACTIVE" : "SUBSCRIPTION_REQUIRED";
  }

  if (isBlockingSamePlanActiveSubscription(subscription, requestedTier)) {
    return "ACTIVE";
  }

  return "SUBSCRIPTION_REQUIRED";
}

function buildServiceStatusPayload(service: {
  key: string;
  currency: string;
  isActive: boolean;
  price: number | null;
  periodDays: number;
  standardMonthlyPrice: number | null;
  standardYearlyPrice: number | null;
  premiumMonthlyPrice: number | null;
  premiumYearlyPrice: number | null;
}) {
  return {
    key: service.key,
    currency: service.currency,
    isActive: !!service.isActive,
    legacy: {
      price: service.price,
      periodDays: service.periodDays,
    },
    pricing: {
      standardMonthlyPrice: service.standardMonthlyPrice,
      standardYearlyPrice: service.standardYearlyPrice,
      premiumMonthlyPrice: service.premiumMonthlyPrice,
      premiumYearlyPrice: service.premiumYearlyPrice,
      plusMonthlyPrice: service.premiumMonthlyPrice,
      plusYearlyPrice: service.premiumYearlyPrice,
      legacyPrice: service.price,
    },
    diagnostics: {
      standardConfigured:
        (typeof service.standardMonthlyPrice === "number" &&
          service.standardMonthlyPrice > 0) ||
        (typeof service.price === "number" && service.price > 0),
      plusConfigured:
        typeof service.premiumMonthlyPrice === "number" && service.premiumMonthlyPrice > 0,
    },
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
  const normalized = normalizePhone(phone) || normalizeString(phone);
  return createHash("sha256").update(normalized).digest("hex");
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
    "billing.findPersistedVerificationToken"
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

function resolveOwnerFlowStateWithVerification(
  owner: any,
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

async function ensureBillingOwnerGate(
  req: Request,
  phoneFallback?: unknown
): Promise<BillingGate> {
  const owner = await resolveOwnerFromRequest(req, phoneFallback);

  if (!owner) {
    return {
      ok: false,
      status: 403,
      error: "PROFILE_REQUIRED",
      state: "PROFILE_REQUIRED",
      owner: null,
    };
  }

  const verification = await getEffectiveOwnerVerificationSnapshot(owner);
  const ownerState = resolveOwnerFlowStateWithVerification(owner, verification);

  if (ownerState === "PROFILE_REQUIRED") {
    return {
      ok: false,
      status: 403,
      error: "PROFILE_REQUIRED",
      state: "PROFILE_REQUIRED",
      verification,
      owner: buildOwnerLite(owner),
    };
  }

  if (ownerState === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED") {
    return {
      ok: false,
      status: 403,
      error: "PHONE_VERIFICATION_REQUIRED",
      state: "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED",
      verification,
      owner: buildOwnerLite(owner),
    };
  }

  return {
    ok: true,
    owner,
    ownerState,
    verification,
  };
}

type InvoiceCoverageHistoryRow = {
  id: string;
  createdAt: Date;
  paidAt: Date | null;
  periodDays: number;
  subscriptionTier: SubscriptionTier;
};

function resolveInvoiceCoverageBase(
  currentPaidUntil: Date | null,
  currentTier: SubscriptionTier | null,
  invoicePaidAt: Date,
  invoiceTier: SubscriptionTier
): Date {
  const hasActiveCoverage =
    !!currentPaidUntil && currentPaidUntil.getTime() > invoicePaidAt.getTime();
  const isPlanChange = !!currentTier && hasActiveCoverage && currentTier !== invoiceTier;

  if (!isPlanChange && currentPaidUntil && hasActiveCoverage) {
    return currentPaidUntil;
  }

  return invoicePaidAt;
}

function buildInvoiceCoverageTimeline(
  invoices: InvoiceCoverageHistoryRow[]
): Map<string, Date> {
  const timeline = new Map<string, Date>();

  const ordered = [...invoices].sort((a, b) => {
    const aTime = (a.paidAt ?? a.createdAt).getTime();
    const bTime = (b.paidAt ?? b.createdAt).getTime();

    if (aTime !== bTime) return aTime - bTime;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  let currentPaidUntil: Date | null = null;
  let currentTier: SubscriptionTier | null = null;

  for (const invoice of ordered) {
    const paidAt = invoice.paidAt ?? invoice.createdAt;
    const invoiceTier = normalizeTier(invoice.subscriptionTier);
    const base = resolveInvoiceCoverageBase(
      currentPaidUntil,
      currentTier,
      paidAt,
      invoiceTier
    );
    const next = addDaysToInstant(base, invoice.periodDays);

    timeline.set(invoice.id, next);
    currentPaidUntil = next;
    currentTier = invoiceTier;
  }

  return timeline;
}

async function resolveInvoicePaidUntilSnapshot(invoice: {
  id: string;
  status: string;
  createdAt: Date;
  paidAt: Date | null;
  periodDays: number;
  subscriptionId: string | null;
  subscriptionTier: SubscriptionTier;
}): Promise<Date | null> {
  if (invoice.status !== "PAID") {
    return null;
  }

  if (!invoice.subscriptionId) {
    const base = invoice.paidAt ?? invoice.createdAt;
    return addDaysToInstant(base, invoice.periodDays);
  }

  const paidInvoices = await withTimeout(
    prisma.invoice.findMany({
      where: {
        subscriptionId: invoice.subscriptionId,
        status: "PAID",
      },
      select: {
        id: true,
        createdAt: true,
        paidAt: true,
        periodDays: true,
        subscriptionTier: true,
      },
      orderBy: [{ paidAt: "asc" }, { createdAt: "asc" }],
    }),
    "billing.invoice.findMany(paidHistory)"
  );

  if (!paidInvoices.length) {
    const base = invoice.paidAt ?? invoice.createdAt;
    return addDaysToInstant(base, invoice.periodDays);
  }

  return buildInvoiceCoverageTimeline(
    paidInvoices.map((item) => ({
      id: item.id,
      createdAt: item.createdAt,
      paidAt: item.paidAt,
      periodDays: item.periodDays,
      subscriptionTier: item.subscriptionTier as SubscriptionTier,
    }))
  ).get(invoice.id) ?? null;
}

async function safeSendPaymentConfirmation(params: {
  ownerPhone: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  next: Date;
}) {
  try {
    await sendTextMessage(
      params.ownerPhone,
      `✅ Ödəniş təsdiqləndi.\nPlan: ${buildPlanLabel(
        params.tier,
        params.billingCycle
      )}\nYeni bitmə vaxtı (UTC): ${formatUtcInstant(params.next)}`
    );
  } catch (e) {
    console.error("[billing] sendTextMessage failed:", e);
  }
}

async function finalizeInvoicePayment(invoiceId: string, providerRefFallback: string) {
  return withTimeout(
    prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { owner: true, subscription: true, service: true },
      });

      if (!invoice) return { error: "not_found" as const };

      if (invoice.status === "PAID") {
        return {
          already: true as const,
          next: invoice.subscription?.paidUntil ?? null,
          ownerPhone: invoice.owner.phone,
          shouldNotify: false as const,
          tier: invoice.subscriptionTier as SubscriptionTier,
          billingCycle: invoice.billingCycle as BillingCycle,
        };
      }

      if (invoice.status !== "PENDING") {
        return { invalid: true as const };
      }

      const paidAt = new Date();

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "PAID",
          paidAt,
          providerRef: invoice.providerRef ?? providerRefFallback,
        },
      });

      if (!invoice.subscriptionId) {
        return {
          success: true as const,
          next: null as Date | null,
          ownerPhone: invoice.owner.phone,
          shouldNotify: false as const,
          tier: invoice.subscriptionTier as SubscriptionTier,
          billingCycle: invoice.billingCycle as BillingCycle,
        };
      }

      const currentSub = await tx.ownerSubscription.findUnique({
        where: { id: invoice.subscriptionId },
      });

      const invoiceTier = normalizeTier(invoice.subscriptionTier);
      const currentTier = normalizeTier(currentSub?.tier);
      const isPlanChange = !!currentSub && isSubscriptionCurrentlyActive(currentSub) && currentTier !== invoiceTier;

      const base =
        !isPlanChange &&
          currentSub?.paidUntil &&
          currentSub.paidUntil > paidAt
          ? currentSub.paidUntil
          : paidAt;

      const next = addDaysToInstant(base, invoice.periodDays);

      await tx.ownerSubscription.update({
        where: { id: invoice.subscriptionId },
        data: {
          paidUntil: next,
          status: "ACTIVE",
          tier: invoice.subscriptionTier,
          billingCycle: invoice.billingCycle,
        },
      });

      return {
        success: true as const,
        next,
        ownerPhone: invoice.owner.phone,
        shouldNotify: true as const,
        tier: invoice.subscriptionTier as SubscriptionTier,
        billingCycle: invoice.billingCycle as BillingCycle,
      };
    }),
    "billing.finalizeInvoicePayment.transaction"
  );
}

/**
 * ===============================
 * POST /billing/renew
 * ===============================
 */
billingRouter.post("/renew", async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone, req.body?.phoneCountryIso2);
    const serviceKey = normalizeServiceKey(req.body?.serviceKey);
    const requestedPlan = resolveRequestedPublicPlan(req.body);
    const subscriptionTier = resolveRequestedTier(req.body);
    const billingCycle = normalizeBillingCycle(req.body?.billingCycle);
    const providerName = (String(req.body?.providerName ?? "").trim() ||
      undefined) as ProviderName | undefined;

    const successUrlTemplate = String(req.body?.successUrlTemplate ?? "").trim();
    const cancelUrlTemplate = String(req.body?.cancelUrlTemplate ?? "").trim();

    if (!serviceKey) {
      return res.status(400).json({
        ok: false,
        error: "serviceKey is required",
      });
    }

    const gate = await ensureBillingOwnerGate(req, phone);

    if (!gate.ok) {
      return res.status(gate.status).json({
        ok: false,
        error: gate.error,
        state: gate.state,
        verification: gate.verification ?? null,
        owner: gate.owner ?? null,
      });
    }

    const owner = gate.owner;

    const safeSuccessTpl =
      successUrlTemplate && isSafeReturnTemplate(successUrlTemplate)
        ? successUrlTemplate
        : `${getWebAppBaseUrl()}/receipt?invoiceId={INVOICE_ID}&status=success`;

    const safeCancelTpl =
      cancelUrlTemplate && isSafeReturnTemplate(cancelUrlTemplate)
        ? cancelUrlTemplate
        : `${getWebAppBaseUrl()}/receipt?invoiceId={INVOICE_ID}&status=cancel`;

    const service = await withTimeout(
      prisma.service.findFirst({
        where: { key: serviceKey, isActive: true },
        select: {
          id: true,
          key: true,
          currency: true,
          periodDays: true,
          price: true,
          standardMonthlyPrice: true,
          standardYearlyPrice: true,
          premiumMonthlyPrice: true,
          premiumYearlyPrice: true,
        },
      }),
      "billing.renew.service.findFirst"
    );

    if (!service) {
      return res.status(404).json({
        ok: false,
        error: "service not found or inactive",
      });
    }

    const existingSub = await withTimeout(
      prisma.ownerSubscription.findFirst({
        where: {
          ownerId: owner.id,
          serviceId: service.id,
        },
        orderBy: [{ paidUntil: "desc" }],
        select: {
          id: true,
          status: true,
          paidUntil: true,
          tier: true,
          billingCycle: true,
        },
      }),
      "billing.renew.ownerSubscription.findFirst"
    );

    if (isBlockingSamePlanActiveSubscription(existingSub, subscriptionTier)) {
      return res.status(409).json({
        ok: false,
        error: "SUBSCRIPTION_ALREADY_ACTIVE",
        state: "ACTIVE" as BillingState,
        subscription: {
          status: existingSub?.status ?? "NONE",
          tier: existingSub?.tier ?? "STANDARD",
          billingCycle: existingSub?.billingCycle ?? "MONTHLY",
          paidUntil: existingSub?.paidUntil ?? null,
          plan: publicPlanFromTier((normalizeTier(existingSub?.tier) as SubscriptionTier) ?? "STANDARD"),
        },
      });
    }

    const pricing = resolvePlanPricing(service, subscriptionTier);

    if (!pricing.amount || pricing.amount <= 0) {
      const isPlusIssue = pricing.code === "PLUS_PRICING_NOT_CONFIGURED";

      return res.status(400).json({
        ok: false,
        error: isPlusIssue
          ? "SERVICE_PLUS_PRICING_NOT_CONFIGURED"
          : "SERVICE_STANDARD_PRICING_NOT_CONFIGURED",
        state: "SUBSCRIPTION_REQUIRED" as BillingState,
        plan: requestedPlan,
        subscriptionTier,
        requiredField: pricing.requiredField,
        service: {
          key: service.key,
          standardMonthlyPrice: service.standardMonthlyPrice,
          premiumMonthlyPrice: service.premiumMonthlyPrice,
          legacyPrice: service.price,
        },
      });
    }

    const provider = getProvider(providerName);

    /**
     * Production-safe behavior:
     * - do NOT mutate an active subscription before payment succeeds
     * - reuse existing subscription row if present
     * - only create a new subscription row if none exists
     */
    const subscription = existingSub
      ? { id: existingSub.id }
      : await withTimeout(
        prisma.ownerSubscription.create({
          data: {
            owner: { connect: { id: owner.id } },
            service: { connect: { id: service.id } },
            status: "EXPIRED",
            tier: subscriptionTier,
            billingCycle,
          },
          select: { id: true },
        }),
        "billing.renew.ownerSubscription.create"
      );

    const invoice = await withTimeout(
      prisma.invoice.create({
        data: {
          owner: { connect: { id: owner.id } },
          subscription: { connect: { id: subscription.id } },
          service: { connect: { id: service.id } },
          amount: pricing.amount,
          currency: pricing.currency,
          provider: provider.name,
          status: "PENDING",
          periodDays: pricing.periodDays,
          subscriptionTier,
          billingCycle,
        },
        select: {
          id: true,
          amount: true,
          currency: true,
          periodDays: true,
          subscriptionTier: true,
          billingCycle: true,
        },
      }),
      "billing.renew.invoice.create"
    );

    const checkout = await provider.createCheckout({
      invoiceId: invoice.id,
      amount: invoice.amount,
      currency: invoice.currency,
      ownerPhone: owner.phone,
      periodDays: invoice.periodDays,
      successUrlTemplate: fillUrlTemplate(safeSuccessTpl, invoice.id),
      cancelUrlTemplate: fillUrlTemplate(safeCancelTpl, invoice.id),
    });

    if (!checkout?.url) {
      return res.status(502).json({
        ok: false,
        error: "checkout_not_created",
      });
    }

    if (checkout.providerRef) {
      await withTimeout(
        prisma.invoice.update({
          where: { id: invoice.id },
          data: { providerRef: checkout.providerRef },
        }),
        "billing.renew.invoice.update(providerRef)"
      );
    }

    return res.json({
      ok: true,
      state: "SUBSCRIPTION_REQUIRED" as BillingState,
      invoiceId: invoice.id,
      receiptNumber: buildReceiptNumber(invoice.id, null),
      provider: provider.name,
      checkoutUrl: checkout.url,
      providerRef: checkout.providerRef ?? null,
      subscriptionTier: invoice.subscriptionTier,
      billingCycle: invoice.billingCycle,
      plan: publicPlanFromTier(invoice.subscriptionTier as SubscriptionTier),
      amount: invoice.amount,
      currency: invoice.currency,
      periodDays: invoice.periodDays,
      owner: {
        id: owner.id,
        phone: normalizePhone(owner.phone) || owner.phone || null,
        name: owner.name ?? null,
        email: owner.email ?? null,
      },
      verification: gate.verification,
      upgrade: isActivePlanChange(existingSub, subscriptionTier),
      debug: {
        ownerLookupFingerprint: buildLookupFingerprint({
          ownerId: req.body?.ownerId ?? req.query?.ownerId ?? req.headers["x-owner-id"],
          phone: req.body?.phone ?? req.query?.phone ?? req.headers["x-owner-phone"],
          email: req.body?.email ?? req.query?.email ?? req.headers["x-owner-email"],
        }),
      },
    });
  } catch (e) {
    console.error("[billing] /renew failed:", e);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
});

/**
 * GET /billing/invoice?id=...
 */
billingRouter.get("/invoice", async (req, res) => {
  try {
    const invoiceId = String(req.query?.id ?? "").trim();
    if (!invoiceId) return res.status(400).json({ ok: false, error: "id is required" });

    const invoice = await withTimeout(
      prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          service: true,
          owner: true,
          subscription: true,
        },
      }),
      "billing.invoice.findUnique"
    );

    if (!invoice) return res.status(404).json({ ok: false, error: "not_found" });

    const paidUntilSnapshot = await resolveInvoicePaidUntilSnapshot({
      id: invoice.id,
      status: invoice.status,
      createdAt: invoice.createdAt,
      paidAt: invoice.paidAt,
      periodDays: invoice.periodDays,
      subscriptionId: invoice.subscriptionId,
      subscriptionTier: invoice.subscriptionTier as SubscriptionTier,
    });

    const requestOwner = await resolveOwnerFromRequest(req);
    if (requestOwner && requestOwner.id !== invoice.ownerId) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    return res.json({
      ok: true,
      id: invoice.id,
      receiptNumber: buildReceiptNumber(invoice.id, invoice.paidAt),
      status: invoice.status,
      amount: invoice.amount,
      currency: invoice.currency,
      provider: invoice.provider,
      providerRef: invoice.providerRef ?? null,
      paidAt: invoice.paidAt,
      periodDays: invoice.periodDays,
      subscriptionTier: invoice.subscriptionTier,
      billingCycle: invoice.billingCycle,
      plan: publicPlanFromTier(invoice.subscriptionTier as SubscriptionTier),
      serviceKey: invoice.service?.key ?? null,
      serviceName: invoice.service?.name ?? null,
      ownerId: invoice.owner?.id ?? null,
      ownerName: invoice.owner?.name ?? null,
      ownerPhone: normalizePhone(invoice.owner?.phone) || invoice.owner?.phone || null,
      ownerEmail: invoice.owner?.email ?? null,
      paidUntil: paidUntilSnapshot,
    });
  } catch (e) {
    console.error("[billing] /invoice failed:", e);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
});

/**
 * GET /billing/status?phone=...&serviceKey=...&plan=...
 */
billingRouter.get("/status", async (req, res) => {
  try {
    const phone = normalizePhone(req.query?.phone, req.query?.phoneCountryIso2);
    const serviceKey = normalizeServiceKey(req.query?.serviceKey);
    const requestedPlan = normalizePublicPlan(req.query?.plan);
    const requestedTier: SubscriptionTier | null = requestedPlan
      ? requestedPlan === "PLUS"
        ? "PREMIUM"
        : "STANDARD"
      : null;

    if (!serviceKey) {
      return res.status(400).json({ ok: false, error: "serviceKey is required" });
    }

    const gate = await ensureBillingOwnerGate(req, phone);

    const service = await withTimeout(
      prisma.service.findFirst({
        where: { key: serviceKey },
        select: {
          id: true,
          key: true,
          currency: true,
          periodDays: true,
          price: true,
          isActive: true,
          standardMonthlyPrice: true,
          standardYearlyPrice: true,
          premiumMonthlyPrice: true,
          premiumYearlyPrice: true,
        },
      }),
      "billing.status.service.findFirst"
    );

    if (!service) {
      return res.status(404).json({ ok: false, error: "service not found" });
    }

    if (!gate.ok) {
      return res.json({
        ok: true,
        state: gate.state,
        ownerState: gate.state,
        owner: gate.owner ?? null,
        verification: gate.verification ?? null,
        service: buildServiceStatusPayload(service),
        subscription: {
          status: "NONE",
          tier: "STANDARD",
          billingCycle: "MONTHLY",
          plan: "STANDARD" as PublicPlan,
          paidUntil: null,
          isActive: false,
          daysLeft: null,
        },
        lastInvoice: null,
      });
    }

    const owner = gate.owner;

    const sub = await withTimeout(
      prisma.ownerSubscription.findFirst({
        where: {
          ownerId: owner.id,
          serviceId: service.id,
        },
        orderBy: [{ paidUntil: "desc" }],
        select: {
          id: true,
          status: true,
          paidUntil: true,
          tier: true,
          billingCycle: true,
        },
      }),
      "billing.status.ownerSubscription.findFirst"
    );

    const now = new Date();
    const paidUntil = sub?.paidUntil ?? null;
    const isActive =
      !!service.isActive &&
      !!(sub?.status === "ACTIVE" && paidUntil && paidUntil.getTime() > now.getTime());

    let daysLeft: number | null = null;
    if (paidUntil) {
      const diffMs = paidUntil.getTime() - now.getTime();
      daysLeft = diffMs > 0 ? Math.ceil(diffMs / (24 * 60 * 60 * 1000)) : 0;
    }

    const lastInvoice = sub?.id
      ? await withTimeout(
        prisma.invoice.findFirst({
          where: { subscriptionId: sub.id },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            amount: true,
            currency: true,
            provider: true,
            providerRef: true,
            paidAt: true,
            subscriptionTier: true,
            billingCycle: true,
          },
        }),
        "billing.status.invoice.findFirst(last)"
      )
      : null;

    const state = buildBillingState(gate.ownerState, !!service.isActive, sub, requestedTier);

    return res.json({
      ok: true,
      state,
      ownerState: gate.ownerState,
      verification: gate.verification,
      owner: {
        id: owner.id,
        phone: normalizePhone(owner.phone) || owner.phone || null,
        name: owner.name ?? null,
        email: owner.email ?? null,
      },
      ownerPhone: normalizePhone(owner.phone) || owner.phone,
      ownerName: owner.name ?? null,
      ownerEmail: owner.email ?? null,
      service: buildServiceStatusPayload(service),
      subscription: {
        status: sub?.status ?? "NONE",
        tier: sub?.tier ?? "STANDARD",
        billingCycle: sub?.billingCycle ?? "MONTHLY",
        plan: publicPlanFromTier((normalizeTier(sub?.tier) as SubscriptionTier) ?? "STANDARD"),
        paidUntil,
        isActive,
        daysLeft,
      },
      lastInvoice: lastInvoice
        ? {
          ...lastInvoice,
          plan: publicPlanFromTier(lastInvoice.subscriptionTier as SubscriptionTier),
          receiptNumber: buildReceiptNumber(lastInvoice.id, lastInvoice.paidAt),
        }
        : null,
      debug: {
        ownerLookupFingerprint: buildLookupFingerprint({
          ownerId: req.query?.ownerId ?? req.body?.ownerId ?? req.headers["x-owner-id"],
          phone: req.query?.phone ?? req.body?.phone ?? req.headers["x-owner-phone"],
          email: req.query?.email ?? req.body?.email ?? req.headers["x-owner-email"],
        }),
      },
    });
  } catch (e) {
    console.error("[billing] /status failed:", e);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
});

/**
 * ===============================
 * MOCK CHECKOUT
 * ===============================
 */
billingRouter.get("/mock/checkout", async (req, res) => {
  try {
    const invoiceId = String(req.query?.invoiceId ?? "").trim();
    const successUrl = String(req.query?.successUrl ?? "").trim();
    const cancelUrl = String(req.query?.cancelUrl ?? "").trim();

    if (!invoiceId) return res.status(400).send("Missing invoiceId");

    const invoice = await withTimeout(
      prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { owner: true, service: true },
      }),
      "billing.mock.checkout.invoice.findUnique"
    );

    if (!invoice) return res.status(404).send("Invoice not found");

    const requestOwner = await resolveOwnerFromRequest(req);
    if (requestOwner && requestOwner.id !== invoice.ownerId) {
      return res.status(403).send("forbidden");
    }

    const payQs = new URLSearchParams();
    payQs.set("invoiceId", invoice.id);
    if (successUrl) payQs.set("successUrl", successUrl);
    if (cancelUrl) payQs.set("cancelUrl", cancelUrl);

    const cancelQs = new URLSearchParams();
    cancelQs.set("invoiceId", invoice.id);
    if (cancelUrl) cancelQs.set("cancelUrl", cancelUrl);

    const payUrl = `${env.PUBLIC_BASE_URL}/billing/mock/paid?${payQs.toString()}`;
    const cancelActionUrl = `${env.PUBLIC_BASE_URL}/billing/mock/cancel?${cancelQs.toString()}`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Secure Mock Checkout</title>
  </head>
  <body style="font-family:system-ui;padding:24px">
    <h2>Mock Checkout</h2>
    <p>Receipt: <b>${escapeHtml(buildReceiptNumber(invoice.id, invoice.paidAt))}</b></p>
    <p>Owner: ${escapeHtml(invoice.owner?.name || invoice.owner?.phone || "N/A")}</p>
    <p>Owner phone: ${escapeHtml(invoice.owner?.phone || "N/A")}</p>
    <p>Owner email: ${escapeHtml(invoice.owner?.email || "N/A")}</p>
    <p>Service: ${escapeHtml(invoice.service?.key ?? "N/A")}</p>
    <p>Plan: <b>${escapeHtml(
      buildPlanLabel(
        invoice.subscriptionTier as SubscriptionTier,
        invoice.billingCycle as BillingCycle
      )
    )}</b></p>
    <p>Amount: <b>${invoice.amount}</b> ${escapeHtml(invoice.currency)}</p>
    <p>Provider: ${escapeHtml(invoice.provider || "N/A")}</p>
    <p>Provider ref: ${escapeHtml(invoice.providerRef || "mock-pending")}</p>
    <p>Period: ${invoice.periodDays} days</p>
    <br/>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <a href="${payUrl}" style="padding:10px 14px;background:#111;color:#fff;border-radius:8px;text-decoration:none">
        Pay (simulate)
      </a>
      <a href="${cancelActionUrl}" style="padding:10px 14px;background:#fff;color:#111;border:1px solid #ddd;border-radius:8px;text-decoration:none">
        Cancel
      </a>
    </div>
  </body>
</html>`);
  } catch (e) {
    console.error("[billing] mock checkout failed:", e);
    return res.status(500).send("internal_error");
  }
});

billingRouter.get("/mock/paid", async (req, res) => {
  try {
    const invoiceId = String(req.query?.invoiceId ?? "").trim();
    const successUrl = String(req.query?.successUrl ?? "").trim();

    if (!invoiceId) return res.status(400).send("Missing invoiceId");

    const result = await finalizeInvoicePayment(invoiceId, `mock-${Date.now()}`);

    if ("error" in result) return res.status(404).send("Invoice not found");
    if ("invalid" in result) return res.status(409).send("Invalid invoice state");

    if (result.shouldNotify && result.next && result.ownerPhone) {
      void safeSendPaymentConfirmation({
        ownerPhone: result.ownerPhone,
        tier: result.tier,
        billingCycle: result.billingCycle,
        next: result.next,
      });
    }

    const fallback = getReceiptFallback(invoiceId, "success");
    const hydratedSuccessUrl = successUrl ? fillUrlTemplate(successUrl, invoiceId) : "";
    const target = resolveSafeRedirect(hydratedSuccessUrl, fallback);

    return res.redirect(302, target);
  } catch (e) {
    console.error("[billing] mock paid failed:", e);
    return res.status(500).send("internal_error");
  }
});

billingRouter.get("/mock/cancel", async (req, res) => {
  try {
    const invoiceId = String(req.query?.invoiceId ?? "").trim();
    const cancelUrl = String(req.query?.cancelUrl ?? "").trim();

    if (!invoiceId) return res.status(400).send("Missing invoiceId");

    await withTimeout(
      prisma.invoice.updateMany({
        where: {
          id: invoiceId,
          status: "PENDING",
        },
        data: {
          status: "CANCELED",
        },
      }),
      "billing.mock.cancel.invoice.updateMany"
    );

    const fallback = getReceiptFallback(invoiceId, "cancel");
    const hydratedCancelUrl = cancelUrl ? fillUrlTemplate(cancelUrl, invoiceId) : "";
    const target = resolveSafeRedirect(hydratedCancelUrl, fallback);

    return res.redirect(302, target);
  } catch (e) {
    console.error("[billing] mock cancel failed:", e);
    return res.status(500).send("internal_error");
  }
});

/**
 * ===============================
 * STRIPE WEBHOOK (FINALIZE PAYMENT)
 * ===============================
 */
billingRouter.post("/stripe/webhook", async (req, res) => {
  try {
    const parsed = await stripeProvider.verifyAndParseWebhook(req);

    if (!parsed.ok) {
      if (parsed.ignored) return res.status(200).json({ ok: true, ignored: true });
      return res.status(400).json({ ok: false, error: parsed.reason });
    }

    const { invoiceId, providerRef } = parsed;

    const result = await finalizeInvoicePayment(
      invoiceId,
      providerRef ?? `stripe-${Date.now()}`
    );

    if ("error" in result) return res.status(404).json({ ok: false, error: "not_found" });
    if ("invalid" in result) return res.status(409).json({ ok: false, error: "invalid_state" });

    if (result.shouldNotify && result.next && result.ownerPhone) {
      void safeSendPaymentConfirmation({
        ownerPhone: result.ownerPhone,
        tier: result.tier,
        billingCycle: result.billingCycle,
        next: result.next,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[billing] stripe webhook failed:", e);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
});

/**
 * Stripe success/cancel redirects
 */
billingRouter.get("/stripe/success", async (req, res) => {
  const invoiceId = String(req.query?.invoiceId ?? "").trim();
  if (!invoiceId) return res.status(400).send("Missing invoiceId");

  const target = getReceiptFallback(invoiceId, "success");
  return res.redirect(302, target);
});

billingRouter.get("/stripe/cancel", async (req, res) => {
  const invoiceId = String(req.query?.invoiceId ?? "").trim();
  if (!invoiceId) return res.status(400).send("Missing invoiceId");

  const target = getReceiptFallback(invoiceId, "cancel");
  return res.redirect(302, target);
});