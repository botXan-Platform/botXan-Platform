import { formatDateTime } from "i18n-core";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import type { AppMessagesCatalog } from "i18n-messages";
import { useI18n, type I18nContextValue } from "i18n-react";

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://127.0.0.1:3001";

const REQUEST_TIMEOUT_MS = 15000;

type PlanType = "STANDARD" | "PLUS";

type OwnerFlowState =
  | "PROFILE_REQUIRED"
  | "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED"
  | "SERVICE_SELECTION_REQUIRED"
  | "SUBSCRIPTION_REQUIRED"
  | "ACTIVE";

type ServiceItem = {
  id?: string;
  key?: string;
  serviceKey?: string;
  title?: string;
  name?: string;
  price?: number | string | null;
  description?: string | null;
  currency?: string | null;
  isActive?: boolean;
  pricing?: {
    standardMonthlyPrice?: number | null;
    plusMonthlyPrice?: number | null;
    legacyPrice?: number | null;
    standardYearlyPrice?: number | null;
    plusYearlyPrice?: number | null;
    legacyPeriodDays?: number | null;
  } | null;
  subscription?: {
    active?: boolean | null;
    status?: string | null;
    tier?: "STANDARD" | "PREMIUM" | null;
    billingCycle?: "MONTHLY" | "YEARLY" | null;
    paidUntil?: string | null;
    legacyActive?: boolean | null;
  } | null;
};

type OwnerStatusPayload = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  profileExists?: boolean | null;
  profileCompleted?: boolean | null;
  phoneVerified?: boolean | null;
  phoneVerifiedAt?: string | null;
  phoneVerificationStatus?: string | null;
};

type OwnerGatePayload = {
  state?: string | null;
  title?: string | null;
  message?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  serviceSelectionLocked?: boolean | null;
  dashboardLocked?: boolean | null;
  billingLocked?: boolean | null;
};

type ServicesResponseDTO = {
  ok?: boolean;
  items?: ServiceItem[];
  services?: ServiceItem[];
  owner?: OwnerStatusPayload | null;
  gate?: OwnerGatePayload | null;
  onboarding?: {
    state?: string | null;
    owner?: OwnerStatusPayload | null;
    gate?: OwnerGatePayload | null;
  } | null;
  state?: string | null;
  message?: string | null;
  error?: string | null;
};

type OwnerProfileDTO = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  profileExists?: boolean | null;
  profileCompleted?: boolean | null;
  phoneVerified?: boolean | null;
  phoneVerifiedAt?: string | null;
  phoneVerificationStatus?: string | null;
};

type OwnerProfileResponseDTO = {
  ok?: boolean;
  state?: string | null;
  owner?: OwnerProfileDTO | null;
  profileExists?: boolean | null;
  profileCompleted?: boolean | null;
  phoneVerified?: boolean | null;
  phoneVerifiedAt?: string | null;
  phoneVerificationStatus?: string | null;
  message?: string | null;
};

type GateCard = {
  state: OwnerFlowState;
  title: string;
  message: string;
  ctaLabel: string;
  ctaHref: string;
  tone: "warning" | "info" | "success";
};

type OwnerIdentity = {
  ownerId: string;
  ownerPhone: string;
  ownerEmail: string;
};

type PlanOption = {
  key: PlanType;
  label: string;
  badge: string;
  description: string;
  helper: string;
};

type TranslateFn = I18nContextValue<AppMessagesCatalog>["t"];

const SERVICE_STORAGE_KEYS = [
  "ownerServiceKey",
  "selectedServiceKey",
  "serviceKey",
  "activeServiceKey",
] as const;

const PLAN_STORAGE_KEYS = [
  "ownerPlanType",
  "selectedPlanType",
  "billingPlan",
  "selectedPlan",
] as const;

const PHONE_STORAGE_KEYS = [
  "ownerPhoneE164",
  "profilePhoneE164",
  "ownerPhone",
  "phoneE164",
  "phone",
] as const;

const OWNER_ID_STORAGE_KEYS = [
  "ownerId",
  "profileOwnerId",
  "ownerProfileId",
] as const;

const OWNER_EMAIL_STORAGE_KEYS = [
  "ownerEmail",
  "profileOwnerEmail",
] as const;

function normalizeQueryValue(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return (v[0] || "").trim();
  return (v || "").trim();
}

function normalizePlanValue(value: string): PlanType | "" {
  const normalizedValue = String(value || "").trim().toUpperCase();

  if (!normalizedValue) return "";
  if (normalizedValue === "STANDARD" || normalizedValue === "STANDART") {
    return "STANDARD";
  }
  if (normalizedValue === "PLUS" || normalizedValue === "PREMIUM") {
    return "PLUS";
  }

  return "";
}

function normalizeSubscriptionTier(value: unknown): PlanType | "" {
  const normalizedValue = String(value || "").trim().toUpperCase();

  if (!normalizedValue) return "";
  if (normalizedValue === "STANDARD" || normalizedValue === "STANDART") {
    return "STANDARD";
  }
  if (normalizedValue === "PLUS" || normalizedValue === "PREMIUM") {
    return "PLUS";
  }

  return "";
}

function normalizeServiceKey(value: string): string {
  const normalizedValue = String(value || "").trim().toUpperCase();
  if (!normalizedValue) return "";
  if (!/^[A-Z0-9_-]{2,64}$/.test(normalizedValue)) return "";
  return normalizedValue;
}

function normalizeOwnerFlowState(value: unknown): OwnerFlowState | "" {
  const normalizedValue = String(value || "").trim().toUpperCase();

  if (!normalizedValue) return "";
  if (
    normalizedValue === "PROFILE_REQUIRED" ||
    normalizedValue === "OWNER_PROFILE_REQUIRED"
  ) {
    return "PROFILE_REQUIRED";
  }
  if (
    normalizedValue === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED" ||
    normalizedValue === "PHONE_VERIFICATION_REQUIRED" ||
    normalizedValue === "PHONE_NOT_VERIFIED" ||
    normalizedValue === "PROFILE_CREATED_PHONE_NOT_VERIFIED" ||
    normalizedValue === "OTP_REQUIRED"
  ) {
    return "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED";
  }
  if (normalizedValue === "SERVICE_SELECTION_REQUIRED") {
    return "SERVICE_SELECTION_REQUIRED";
  }
  if (
    normalizedValue === "SUBSCRIPTION_REQUIRED" ||
    normalizedValue === "PAYMENT_REQUIRED"
  ) {
    return "SUBSCRIPTION_REQUIRED";
  }
  if (normalizedValue === "ACTIVE") {
    return "ACTIVE";
  }

  return "";
}

function normalizeAsciiHeaderValue(value: unknown): string {
  const rawValue = String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim();

  if (!rawValue) return "";

  let sanitizedValue = "";
  for (const character of rawValue) {
    const code = character.charCodeAt(0);
    if (code >= 0x20 && code <= 0x7e) {
      sanitizedValue += character;
    }
  }

  return sanitizedValue.trim();
}

function digitsOnly(input: string): string {
  return String(input || "").replace(/[^\d]/g, "");
}

function normalizePhoneForStorage(value: unknown): string {
  const rawValue = String(value ?? "").trim();
  if (!rawValue) return "";

  const normalizedValue = rawValue.startsWith("+")
    ? `+${digitsOnly(rawValue)}`
    : `+${digitsOnly(rawValue)}`;

  return /^\+[1-9]\d{7,14}$/.test(normalizedValue) ? normalizedValue : "";
}

function normalizeOwnerIdForStorage(value: unknown): string {
  const sanitizedValue = normalizeAsciiHeaderValue(value);
  if (!sanitizedValue) return "";
  if (!/^[A-Za-z0-9_-]{6,128}$/.test(sanitizedValue)) return "";
  return sanitizedValue;
}

function normalizeEmailForStorage(value: unknown): string {
  const sanitizedValue = normalizeAsciiHeaderValue(
    String(value ?? "").toLowerCase()
  );
  if (!sanitizedValue) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedValue)) return "";
  return sanitizedValue;
}

function sanitizeHeadersRecord(
  input: Record<string, string>
): Record<string, string> {
  const output: Record<string, string> = {};

  for (const [key, value] of Object.entries(input)) {
    const sanitizedValue = normalizeAsciiHeaderValue(value);
    if (sanitizedValue) {
      output[key] = sanitizedValue;
    }
  }

  return output;
}

function readFirstStorageValue(keys: readonly string[]): string {
  if (typeof window === "undefined") return "";

  for (const key of keys) {
    const value = window.localStorage.getItem(key)?.trim();
    if (value) return value;
  }

  return "";
}

function writeStorageValueToKeys(keys: readonly string[], value: string): void {
  if (typeof window === "undefined") return;

  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) return;

  for (const key of keys) {
    window.localStorage.setItem(key, normalizedValue);
  }
}

function removeStorageKeys(keys: readonly string[]): void {
  if (typeof window === "undefined") return;

  for (const key of keys) {
    window.localStorage.removeItem(key);
  }
}

function readServiceKeyFromStorage(): string {
  return normalizeServiceKey(readFirstStorageValue(SERVICE_STORAGE_KEYS));
}

function readPlanFromStorage(): PlanType | "" {
  return normalizePlanValue(readFirstStorageValue(PLAN_STORAGE_KEYS));
}

function readOwnerIdFromStorage(): string {
  return normalizeOwnerIdForStorage(readFirstStorageValue(OWNER_ID_STORAGE_KEYS));
}

function readOwnerPhoneFromStorage(): string {
  return normalizePhoneForStorage(readFirstStorageValue(PHONE_STORAGE_KEYS));
}

function readOwnerEmailFromStorage(): string {
  return normalizeEmailForStorage(readFirstStorageValue(OWNER_EMAIL_STORAGE_KEYS));
}

function readOwnerIdentityFromStorage(): OwnerIdentity {
  return {
    ownerId: readOwnerIdFromStorage(),
    ownerPhone: readOwnerPhoneFromStorage(),
    ownerEmail: readOwnerEmailFromStorage(),
  };
}

function buildOwnerHeaders(identity?: Partial<OwnerIdentity>): Record<string, string> {
  const currentIdentity = readOwnerIdentityFromStorage();

  const ownerId = normalizeOwnerIdForStorage(
    identity?.ownerId ?? currentIdentity.ownerId
  );
  const ownerPhone = normalizePhoneForStorage(
    identity?.ownerPhone ?? currentIdentity.ownerPhone
  );
  const ownerEmail = normalizeEmailForStorage(
    identity?.ownerEmail ?? currentIdentity.ownerEmail
  );

  return sanitizeHeadersRecord({
    ...(ownerId ? { "x-owner-id": ownerId } : {}),
    ...(ownerPhone ? { "x-owner-phone": ownerPhone } : {}),
    ...(ownerEmail ? { "x-owner-email": ownerEmail } : {}),
  });
}

function writeServiceKeyToStorage(serviceKey: string): void {
  const normalizedValue = normalizeServiceKey(serviceKey);
  if (!normalizedValue) return;
  writeStorageValueToKeys(SERVICE_STORAGE_KEYS, normalizedValue);
}

function writePlanToStorage(plan: PlanType): void {
  writeStorageValueToKeys(PLAN_STORAGE_KEYS, plan);
}

function clearOwnerIdStorage(): void {
  removeStorageKeys(OWNER_ID_STORAGE_KEYS);
}

function clearOwnerPhoneStorage(): void {
  removeStorageKeys(PHONE_STORAGE_KEYS);
}

function clearOwnerEmailStorage(): void {
  removeStorageKeys(OWNER_EMAIL_STORAGE_KEYS);
}

function clearOwnerIdentityStorage(): void {
  clearOwnerIdStorage();
  clearOwnerPhoneStorage();
  clearOwnerEmailStorage();
}

function writeOwnerIdentityToStorage(
  owner: OwnerStatusPayload | OwnerProfileDTO | null | undefined
): void {
  if (!owner) return;

  const ownerId = normalizeOwnerIdForStorage(owner.id);
  const ownerPhone = normalizePhoneForStorage(owner.phone);
  const ownerEmail = normalizeEmailForStorage(owner.email);

  if (ownerId) {
    writeStorageValueToKeys(OWNER_ID_STORAGE_KEYS, ownerId);
  }

  if (ownerPhone) {
    writeStorageValueToKeys(PHONE_STORAGE_KEYS, ownerPhone);
  }

  if (ownerEmail) {
    writeStorageValueToKeys(OWNER_EMAIL_STORAGE_KEYS, ownerEmail);
  }
}

function removeServiceKeyFromStorage(): void {
  removeStorageKeys(SERVICE_STORAGE_KEYS);
}

function formatMoney(
  price: number | null,
  currency: string | null | undefined,
  formattingLocale: string
): string {
  if (price === null || !Number.isFinite(price)) return "";

  const normalizedCurrency = String(currency || "AZN").trim() || "AZN";

  try {
    return new Intl.NumberFormat(formattingLocale, {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${price} ${normalizedCurrency}`;
  }
}

function resolveDisplayedPrice(service: ServiceItem, plan: PlanType): number | null {
  const pricing = service.pricing;

  if (plan === "PLUS") {
    if (
      typeof pricing?.plusMonthlyPrice === "number" &&
      pricing.plusMonthlyPrice > 0
    ) {
      return pricing.plusMonthlyPrice;
    }
    return null;
  }

  if (
    typeof pricing?.standardMonthlyPrice === "number" &&
    pricing.standardMonthlyPrice > 0
  ) {
    return pricing.standardMonthlyPrice;
  }

  if (typeof service.price === "number" && service.price > 0) {
    return service.price;
  }

  if (typeof service.price === "string" && service.price.trim()) {
    const parsedPrice = Number(service.price);
    if (Number.isFinite(parsedPrice) && parsedPrice > 0) {
      return parsedPrice;
    }
  }

  if (typeof pricing?.legacyPrice === "number" && pricing.legacyPrice > 0) {
    return pricing.legacyPrice;
  }

  return null;
}

function buildServicesSelfUrl(
  nextPath: string,
  serviceKey: string,
  plan: PlanType
): string {
  const params = new URLSearchParams();

  if (nextPath) params.set("next", nextPath);
  if (serviceKey) params.set("serviceKey", serviceKey);
  params.set("plan", plan);

  return `/services?${params.toString()}`;
}

function buildProfileUrl(
  nextPath: string,
  serviceKey: string,
  plan: PlanType
): string {
  const params = new URLSearchParams();

  if (serviceKey) params.set("serviceKey", serviceKey);
  params.set("plan", plan);
  params.set("next", buildServicesSelfUrl(nextPath, serviceKey, plan));

  return `/profile?${params.toString()}`;
}

function buildDashboardUrl(serviceKey: string, plan: PlanType): string {
  const params = new URLSearchParams();
  if (serviceKey) params.set("serviceKey", serviceKey);
  params.set("plan", plan);
  return `/dashboard?${params.toString()}`;
}

function buildBillingUrl(
  serviceKey: string,
  plan: PlanType,
  finalNextPath: string
): string {
  const params = new URLSearchParams();
  params.set("serviceKey", serviceKey);
  params.set("plan", plan);
  params.set("next", finalNextPath);
  return `/billing?${params.toString()}`;
}

function normalizeSafeNextPath(value: string): string {
  const trimmedValue = String(value || "").trim();
  if (!trimmedValue) return "";
  if (!trimmedValue.startsWith("/")) return "";
  if (trimmedValue.startsWith("//")) return "";
  return trimmedValue;
}

function resolveFinalPostBillingPath(
  nextPath: string,
  serviceKey: string,
  plan: PlanType
): string {
  const safeNextPath = normalizeSafeNextPath(nextPath);

  if (
    !safeNextPath ||
    safeNextPath.startsWith("/billing") ||
    safeNextPath.startsWith("/services") ||
    safeNextPath.startsWith("/profile") ||
    safeNextPath.startsWith("/pay")
  ) {
    return buildDashboardUrl(serviceKey, plan);
  }

  const [pathname, hashPart = ""] = safeNextPath.split("#");
  const [basePath, queryString = ""] = pathname.split("?");
  const params = new URLSearchParams(queryString);

  if (serviceKey) params.set("serviceKey", serviceKey);
  params.set("plan", plan);

  const normalizedQueryString = params.toString();
  const hash = hashPart ? `#${hashPart}` : "";

  return `${basePath}${normalizedQueryString ? `?${normalizedQueryString}` : ""}${hash}`;
}

function extractRawServiceList(
  data: ServicesResponseDTO | ServiceItem[] | null | undefined
): ServiceItem[] {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.services)) return data.services;

  return [];
}

function extractOwnerPayload(
  data: ServicesResponseDTO | null | undefined
): OwnerStatusPayload | null {
  return data?.onboarding?.owner || data?.owner || null;
}

function extractGatePayload(
  data: ServicesResponseDTO | null | undefined
): OwnerGatePayload | null {
  return data?.onboarding?.gate || data?.gate || null;
}

function resolveOwnerStateFromProfile(
  data: OwnerProfileResponseDTO | null | undefined
): OwnerFlowState {
  const explicitState = normalizeOwnerFlowState(data?.state);
  if (explicitState) return explicitState;

  const owner = data?.owner;
  const profileExists =
    typeof data?.profileExists === "boolean"
      ? data.profileExists
      : typeof owner?.profileExists === "boolean"
      ? owner.profileExists
      : null;

  const profileCompleted =
    typeof data?.profileCompleted === "boolean"
      ? data.profileCompleted
      : typeof owner?.profileCompleted === "boolean"
      ? owner.profileCompleted
      : null;

  if (profileExists === false || profileCompleted === false || !owner?.id) {
    return "PROFILE_REQUIRED";
  }

  const phoneVerified =
    typeof data?.phoneVerified === "boolean"
      ? data.phoneVerified
      : typeof owner?.phoneVerified === "boolean"
      ? owner.phoneVerified
      : null;

  const phoneVerifiedAt = String(
    data?.phoneVerifiedAt || owner?.phoneVerifiedAt || ""
  ).trim();

  const phoneStatus = String(
    data?.phoneVerificationStatus || owner?.phoneVerificationStatus || ""
  )
    .trim()
    .toUpperCase();

  if (
    phoneVerified === false ||
    (!phoneVerified &&
      !phoneVerifiedAt &&
      ["REQUIRED", "SENT", "EXPIRED", "FAILED"].includes(phoneStatus))
  ) {
    return "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED";
  }

  if (phoneVerified === true || !!phoneVerifiedAt || phoneStatus === "VERIFIED") {
    return "SERVICE_SELECTION_REQUIRED";
  }

  return "PROFILE_REQUIRED";
}

function isOwnerNotFoundMessage(value: unknown): boolean {
  const message = String(value || "").trim().toLowerCase();
  if (!message) return false;

  return (
    message === "owner not found" ||
    message === "owner_not_found" ||
    message.includes("owner not found") ||
    message.includes("owner profile not found") ||
    message === "owner_identity_required"
  );
}

function pickServiceKey(service: ServiceItem): string {
  return normalizeServiceKey(String(service.serviceKey || service.key || "").trim());
}

function pickServiceTitle(service: ServiceItem, t: TranslateFn): string {
  const rawTitle = String(service.title || service.name || "").trim();
  if (rawTitle) return rawTitle;
  return (
    pickServiceKey(service) ||
    t((messages) => messages.owner.services.cards.titleFallback)
  );
}

function pickServiceDescription(service: ServiceItem): string {
  return String(service.description || "").trim();
}

function resolveServicesLoadError(
  message: string,
  status: number,
  t: TranslateFn
): string {
  const trimmedMessage = String(message || "").trim();

  if (status >= 500) {
    return t((messages) => messages.owner.services.serviceList.loadingServices);
  }

  if (trimmedMessage) {
    return trimmedMessage;
  }

  if (status > 0) {
    return t(
      (messages) => messages.owner.services.errors.servicesLoadErrorWithStatus,
      { status }
    );
  }

  return t((messages) => messages.owner.services.errors.servicesLoadErrorFallback);
}

function getPlanLabel(plan: PlanType, t: TranslateFn): string {
  return plan === "PLUS"
    ? t((messages) => messages.owner.services.plans.plus.label)
    : t((messages) => messages.owner.services.plans.standard.label);
}

function resolveServiceActivePlan(
  service: ServiceItem | null | undefined
): PlanType | "" {
  return normalizeSubscriptionTier(service?.subscription?.tier);
}

function hasActiveSubscriptionForSelectedPlan(
  service: ServiceItem | null | undefined,
  selectedPlan: PlanType
): boolean {
  if (!service?.subscription?.active) return false;

  const activePlan = resolveServiceActivePlan(service);
  if (!activePlan) return true;

  return activePlan === selectedPlan;
}

function requiresPlanChangeForSelectedPlan(
  service: ServiceItem | null | undefined,
  selectedPlan: PlanType
): boolean {
  if (!service?.subscription?.active) return false;

  const activePlan = resolveServiceActivePlan(service);
  if (!activePlan) return false;

  return activePlan !== selectedPlan;
}

function buildPlanChangeMessage(
  t: TranslateFn,
  activePlan: PlanType,
  selectedPlan: PlanType
): string {
  return t((messages) => messages.owner.services.selection.planChangeMessage, {
    activePlan: getPlanLabel(activePlan, t),
    selectedPlan: getPlanLabel(selectedPlan, t),
  });
}

async function fetchJsonWithTimeout<TData>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ response: Response; data: TData }> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => ({}))) as TData;

    return { response, data };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function fetchOwnerProfileWithRecovery(): Promise<{
  response: Response;
  data: OwnerProfileResponseDTO;
}> {
  const initialIdentity = readOwnerIdentityFromStorage();

  const firstAttempt = await fetchJsonWithTimeout<OwnerProfileResponseDTO>(
    `${API}/owner/profile`,
    {
      method: "GET",
      headers: buildOwnerHeaders(initialIdentity),
    }
  );

  const firstData = firstAttempt.data || {};
  const firstMessage = String(firstData.message || "").trim();

  if (
    (!firstAttempt.response.ok || !firstData.ok) &&
    isOwnerNotFoundMessage(firstMessage) &&
    initialIdentity.ownerId &&
    (initialIdentity.ownerPhone || initialIdentity.ownerEmail)
  ) {
    clearOwnerIdStorage();

    const recoveredIdentity: Partial<OwnerIdentity> = {
      ownerPhone: initialIdentity.ownerPhone,
      ownerEmail: initialIdentity.ownerEmail,
    };

    const retryAttempt = await fetchJsonWithTimeout<OwnerProfileResponseDTO>(
      `${API}/owner/profile`,
      {
        method: "GET",
        headers: buildOwnerHeaders(recoveredIdentity),
      }
    );

    return {
      response: retryAttempt.response,
      data: retryAttempt.data || {},
    };
  }

  return {
    response: firstAttempt.response,
    data: firstData,
  };
}

async function fetchServicesWithRecovery(
  identityOverride?: Partial<OwnerIdentity>
): Promise<{
  response: Response;
  data: ServicesResponseDTO;
}> {
  const initialIdentity = {
    ...readOwnerIdentityFromStorage(),
    ...(identityOverride || {}),
  };

  const firstAttempt = await fetchJsonWithTimeout<ServicesResponseDTO>(
    `${API}/owner/services`,
    {
      method: "GET",
      headers: buildOwnerHeaders(initialIdentity),
    }
  );

  const firstData = firstAttempt.data || {};
  const firstMessage = String(firstData.message || firstData.error || "").trim();

  if (
    (!firstAttempt.response.ok || firstData.ok === false) &&
    isOwnerNotFoundMessage(firstMessage) &&
    initialIdentity.ownerId &&
    (initialIdentity.ownerPhone || initialIdentity.ownerEmail)
  ) {
    clearOwnerIdStorage();

    const recoveredIdentity: Partial<OwnerIdentity> = {
      ownerPhone: initialIdentity.ownerPhone,
      ownerEmail: initialIdentity.ownerEmail,
    };

    const retryAttempt = await fetchJsonWithTimeout<ServicesResponseDTO>(
      `${API}/owner/services`,
      {
        method: "GET",
        headers: buildOwnerHeaders(recoveredIdentity),
      }
    );

    return {
      response: retryAttempt.response,
      data: retryAttempt.data || {},
    };
  }

  return {
    response: firstAttempt.response,
    data: firstData,
  };
}

function resolveOwnerStateFromServices(
  data: ServicesResponseDTO | null | undefined,
  fallbackState: OwnerFlowState
): OwnerFlowState {
  const explicitState = normalizeOwnerFlowState(
    data?.onboarding?.state ||
      data?.state ||
      data?.gate?.state ||
      data?.onboarding?.gate?.state
  );

  if (explicitState) {
    return explicitState;
  }

  const list = extractRawServiceList(data).filter((item) => pickServiceKey(item));
  if (list.some((item) => !!item.subscription?.active)) {
    return "ACTIVE";
  }
  if (list.length > 0) {
    return "SUBSCRIPTION_REQUIRED";
  }

  return fallbackState;
}

export default function ServicesPage() {
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const { locale, direction, formattingLocale, t } =
    useI18n<AppMessagesCatalog>();

  const requestTimeoutLabel = t(
    (messages) => messages.owner.services.serviceList.requestTimeout
  );
  const ownerNotFoundLoadErrorLabel = t(
    (messages) => messages.owner.services.errors.ownerNotFoundLoadError
  );
  const redirectingLabel = t(
    (messages) => messages.owner.services.selection.redirecting
  );

  const planOptions = useMemo<readonly [PlanOption, PlanOption]>(
    () => [
      {
        key: "STANDARD",
        label: t((messages) => messages.owner.services.plans.standard.label),
        badge: t((messages) => messages.owner.services.plans.standard.badge),
        description: t(
          (messages) => messages.owner.services.plans.standard.description
        ),
        helper: t((messages) => messages.owner.services.plans.standard.helper),
      },
      {
        key: "PLUS",
        label: t((messages) => messages.owner.services.plans.plus.label),
        badge: t((messages) => messages.owner.services.plans.plus.badge),
        description: t(
          (messages) => messages.owner.services.plans.plus.description
        ),
        helper: t((messages) => messages.owner.services.plans.plus.helper),
      },
    ],
    [t]
  );

  const nextPath = useMemo(() => {
    const nextQueryValue = normalizeQueryValue(router.query.next);
    const safeNextPath = normalizeSafeNextPath(nextQueryValue);
    return safeNextPath || "/dashboard";
  }, [router.query.next]);

  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [selectedPlan, setSelectedPlan] = useState<PlanType>("STANDARD");
  const [selectedServiceKey, setSelectedServiceKey] = useState<string>("");

  const [ownerState, setOwnerState] =
    useState<OwnerFlowState>("PROFILE_REQUIRED");
  const [backendGate, setBackendGate] = useState<OwnerGatePayload | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;

    const planFromQuery = normalizePlanValue(
      normalizeQueryValue(router.query.plan)
    );
    const storedPlan = readPlanFromStorage();
    const effectivePlan = planFromQuery || storedPlan || "STANDARD";

    const serviceFromQuery = normalizeServiceKey(
      normalizeQueryValue(router.query.serviceKey)
    );
    const storedServiceKey = readServiceKeyFromStorage();
    const effectiveServiceKey = serviceFromQuery || storedServiceKey || "";

    setSelectedPlan(effectivePlan);
    setSelectedServiceKey(effectiveServiceKey);
  }, [router.isReady, router.query.plan, router.query.serviceKey]);

  useEffect(() => {
    if (!router.isReady) return;

    let cancelled = false;

    async function load(): Promise<void> {
      setLoading(true);
      setError(null);
      setBackendGate(null);

      try {
        const {
          response: profileResponse,
          data: profileData,
        } = await fetchOwnerProfileWithRecovery();

        const profileState = resolveOwnerStateFromProfile(profileData);

        if (!profileResponse.ok || !profileData.ok) {
          const rawMessage = String(profileData.message || "").trim();

          if (cancelled) return;

          if (
            isOwnerNotFoundMessage(rawMessage) ||
            profileState === "PROFILE_REQUIRED"
          ) {
            clearOwnerIdentityStorage();
            setOwnerState("PROFILE_REQUIRED");
            setServices([]);
            setBackendGate(null);
            setError(null);
            return;
          }

          throw new Error(rawMessage || ownerNotFoundLoadErrorLabel);
        }

        writeOwnerIdentityToStorage(profileData.owner);

        if (cancelled) return;

        setOwnerState(profileState);

        if (
          profileState === "PROFILE_REQUIRED" ||
          profileState === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED"
        ) {
          setServices([]);
          setBackendGate(null);
          setError(null);
          return;
        }

        const ownerIdentity = readOwnerIdentityFromStorage();
        const {
          response: servicesResponse,
          data: servicesData,
        } = await fetchServicesWithRecovery({
          ownerId: normalizeOwnerIdForStorage(
            profileData.owner?.id || ownerIdentity.ownerId
          ),
          ownerPhone: normalizePhoneForStorage(
            profileData.owner?.phone || ownerIdentity.ownerPhone
          ),
          ownerEmail: normalizeEmailForStorage(
            profileData.owner?.email || ownerIdentity.ownerEmail
          ),
        });

        const ownerFromServices = extractOwnerPayload(servicesData);
        const gateFromServices = extractGatePayload(servicesData);
        const servicesState = resolveOwnerStateFromServices(
          servicesData,
          profileState
        );

        writeOwnerIdentityToStorage(ownerFromServices);

        const rawList = extractRawServiceList(servicesData);
        const list = rawList.filter((item) => pickServiceKey(item));

        if (!servicesResponse.ok || servicesData.ok === false) {
          const rawMessage = String(
            servicesData.message || servicesData.error || ""
          ).trim();

          if (cancelled) return;

          if (isOwnerNotFoundMessage(rawMessage)) {
            clearOwnerIdentityStorage();
            setOwnerState("PROFILE_REQUIRED");
            setServices([]);
            setBackendGate(null);
            setError(null);
            return;
          }

          throw new Error(
            resolveServicesLoadError(rawMessage, servicesResponse.status, t)
          );
        }

        if (cancelled) return;

        if (
          servicesState === "PROFILE_REQUIRED" ||
          servicesState === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED"
        ) {
          setOwnerState(servicesState);
          setServices([]);
          setBackendGate(gateFromServices || null);
          setError(null);
          return;
        }

        setOwnerState(servicesState);
        setServices(list);
        setBackendGate(gateFromServices || null);
        setError(null);

        const activeStoredService = readServiceKeyFromStorage();
        if (
          activeStoredService &&
          !list.some((item) => pickServiceKey(item) === activeStoredService)
        ) {
          removeServiceKeyFromStorage();
          setSelectedServiceKey((previousValue) =>
            previousValue === activeStoredService ? "" : previousValue
          );
        }

        setSelectedServiceKey((previousValue) => {
          if (!previousValue) return previousValue;
          return list.some((item) => pickServiceKey(item) === previousValue)
            ? previousValue
            : "";
        });
      } catch (caughtError: unknown) {
        if (cancelled) return;

        if (
          typeof caughtError === "object" &&
          caughtError !== null &&
          "name" in caughtError &&
          caughtError.name === "AbortError"
        ) {
          setError(requestTimeoutLabel);
        } else {
          const rawMessage =
            typeof caughtError === "object" &&
            caughtError !== null &&
            "message" in caughtError
              ? String(caughtError.message || "").trim()
              : "";

          if (isOwnerNotFoundMessage(rawMessage)) {
            clearOwnerIdentityStorage();
            setServices([]);
            setOwnerState("PROFILE_REQUIRED");
            setBackendGate(null);
            setError(null);
            return;
          }

          setError(
            rawMessage ||
              t((messages) => messages.owner.services.serviceList.loadingServices)
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    ownerNotFoundLoadErrorLabel,
    requestTimeoutLabel,
    router.isReady,
    t,
  ]);

  useEffect(() => {
    writePlanToStorage(selectedPlan);
  }, [selectedPlan]);

  useEffect(() => {
    if (selectedServiceKey) {
      writeServiceKeyToStorage(selectedServiceKey);
    } else {
      removeServiceKeyFromStorage();
    }
  }, [selectedServiceKey]);

  function updateScrollState(): void {
    const element = scrollerRef.current;
    if (!element) {
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    const maxScrollLeft = Math.max(0, element.scrollWidth - element.clientWidth);
    setCanScrollPrev(element.scrollLeft > 8);
    setCanScrollNext(element.scrollLeft < maxScrollLeft - 8);
  }

  useEffect(() => {
    updateScrollState();

    const handleResize = (): void => updateScrollState();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [services.length, loading]);

  const selectedService = useMemo(() => {
    if (!selectedServiceKey) return null;
    return (
      services.find((item) => pickServiceKey(item) === selectedServiceKey) ||
      null
    );
  }, [services, selectedServiceKey]);

  const selectedPlanMeta = useMemo(() => {
    return (
      planOptions.find((item) => item.key === selectedPlan) ?? planOptions[0]
    );
  }, [planOptions, selectedPlan]);

  const canUseServiceSelection = useMemo(() => {
    return (
      ownerState === "SERVICE_SELECTION_REQUIRED" ||
      ownerState === "SUBSCRIPTION_REQUIRED" ||
      ownerState === "ACTIVE"
    );
  }, [ownerState]);

  const isLockedByProfileState = useMemo(() => {
    return (
      ownerState === "PROFILE_REQUIRED" ||
      ownerState === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED"
    );
  }, [ownerState]);

  const selectedServiceActivePlan = useMemo((): PlanType | "" => {
    return resolveServiceActivePlan(selectedService);
  }, [selectedService]);

  const selectedServiceHasSelectedPlanSubscription = useMemo(() => {
    return hasActiveSubscriptionForSelectedPlan(selectedService, selectedPlan);
  }, [selectedPlan, selectedService]);

  const selectedServiceRequiresPlanChange = useMemo(() => {
    return requiresPlanChangeForSelectedPlan(selectedService, selectedPlan);
  }, [selectedPlan, selectedService]);

  const selectedServicePlanChangeMessage = useMemo(() => {
    if (!selectedServiceRequiresPlanChange || !selectedServiceActivePlan) {
      return "";
    }
    return buildPlanChangeMessage(t, selectedServiceActivePlan, selectedPlan);
  }, [
    selectedPlan,
    selectedServiceActivePlan,
    selectedServiceRequiresPlanChange,
    t,
  ]);

  const gateCard = useMemo<GateCard | null>(() => {
    const fallbackHref = buildProfileUrl(nextPath, selectedServiceKey, selectedPlan);
    const ctaHref = String(backendGate?.ctaHref || "").trim() || fallbackHref;
    const ctaLabel = String(backendGate?.ctaLabel || "").trim();

    if (ownerState === "PROFILE_REQUIRED") {
      return {
        state: ownerState,
        tone: "warning",
        title:
          String(backendGate?.title || "").trim() ||
          t((messages) => messages.owner.services.gate.profileRequired.title),
        message:
          String(backendGate?.message || "").trim() ||
          t((messages) => messages.owner.services.gate.profileRequired.message),
        ctaLabel:
          ctaLabel ||
          t((messages) => messages.owner.services.gate.profileRequired.cta),
        ctaHref,
      };
    }

    if (ownerState === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED") {
      return {
        state: ownerState,
        tone: "info",
        title:
          String(backendGate?.title || "").trim() ||
          t(
            (messages) =>
              messages.owner.services.gate.phoneVerificationRequired.title
          ),
        message:
          String(backendGate?.message || "").trim() ||
          t(
            (messages) =>
              messages.owner.services.gate.phoneVerificationRequired.message
          ),
        ctaLabel:
          ctaLabel ||
          t(
            (messages) =>
              messages.owner.services.gate.phoneVerificationRequired.cta
          ),
        ctaHref,
      };
    }

    return null;
  }, [backendGate, nextPath, ownerState, selectedPlan, selectedServiceKey, t]);

  const profileCtaHref = useMemo(() => {
    return (
      gateCard?.ctaHref ||
      buildProfileUrl(nextPath, selectedServiceKey, selectedPlan)
    );
  }, [gateCard?.ctaHref, nextPath, selectedPlan, selectedServiceKey]);

  const finalPostBillingPath = useMemo(() => {
    if (!selectedServiceKey) return buildDashboardUrl("", selectedPlan);
    return resolveFinalPostBillingPath(nextPath, selectedServiceKey, selectedPlan);
  }, [nextPath, selectedPlan, selectedServiceKey]);

  const continueUrl = useMemo(() => {
    if (!selectedServiceKey || !selectedService) return "";

    if (selectedServiceHasSelectedPlanSubscription) {
      return finalPostBillingPath;
    }

    return buildBillingUrl(selectedServiceKey, selectedPlan, finalPostBillingPath);
  }, [
    finalPostBillingPath,
    selectedPlan,
    selectedService,
    selectedServiceHasSelectedPlanSubscription,
    selectedServiceKey,
  ]);

  const primaryButtonLabel = useMemo(() => {
    if (isLockedByProfileState) {
      return (
        gateCard?.ctaLabel ||
        t((messages) => messages.owner.services.selection.goToProfile)
      );
    }

    if (!selectedServiceKey) {
      return t((messages) => messages.owner.services.selection.chooseServiceButton);
    }

    if (selectedServiceRequiresPlanChange) {
      return t((messages) => messages.owner.services.selection.changePlanButton);
    }

    if (selectedServiceHasSelectedPlanSubscription) {
      return t((messages) => messages.owner.services.selection.goToDashboard);
    }

    return t((messages) => messages.owner.services.selection.goToBilling);
  }, [
    gateCard?.ctaLabel,
    isLockedByProfileState,
    selectedServiceHasSelectedPlanSubscription,
    selectedServiceKey,
    selectedServiceRequiresPlanChange,
    t,
  ]);

  const actionHeadline = useMemo(() => {
    if (isLockedByProfileState && gateCard) {
      return gateCard.title;
    }

    if (selectedService) {
      return t((messages) => messages.owner.services.selection.selectedHeadline, {
        serviceTitle: pickServiceTitle(selectedService, t),
        planLabel: selectedPlanMeta.label,
      });
    }

    return t((messages) => messages.owner.services.selection.notSelected);
  }, [gateCard, isLockedByProfileState, selectedPlanMeta.label, selectedService, t]);

  const actionSubtext = useMemo(() => {
    if (isLockedByProfileState && gateCard) {
      return gateCard.message;
    }

    if (selectedServiceRequiresPlanChange && selectedServicePlanChangeMessage) {
      return selectedServicePlanChangeMessage;
    }

    if (selectedService) {
      if (selectedServiceHasSelectedPlanSubscription) {
        return t((messages) => messages.owner.services.selection.billingCompletedFlow);
      }

      return t((messages) => messages.owner.services.selection.billingPendingFlow);
    }

    return t((messages) => messages.owner.services.selection.selectServiceFirst);
  }, [
    gateCard,
    isLockedByProfileState,
    selectedService,
    selectedServiceHasSelectedPlanSubscription,
    selectedServicePlanChangeMessage,
    selectedServiceRequiresPlanChange,
    t,
  ]);

  const currentStatusLabel = useMemo(() => {
    if (ownerState === "PROFILE_REQUIRED") {
      return t((messages) => messages.owner.services.status.profileRequired);
    }
    if (ownerState === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED") {
      return t((messages) => messages.owner.services.status.phoneRequired);
    }
    if (selectedServiceRequiresPlanChange) {
      return t((messages) => messages.owner.services.status.planChangeRequired);
    }
    if (selectedServiceHasSelectedPlanSubscription) {
      return t((messages) => messages.owner.services.status.active);
    }
    if (selectedServiceKey) {
      return t((messages) => messages.owner.services.status.billingRequired);
    }
    return t((messages) => messages.owner.services.status.serviceSelection);
  }, [
    ownerState,
    selectedServiceHasSelectedPlanSubscription,
    selectedServiceKey,
    selectedServiceRequiresPlanChange,
    t,
  ]);

const heroSummaryText = useMemo(() => {
  if (isLockedByProfileState) {
    return t((messages) => messages.owner.services.summary.previewMode);
  }

  if (selectedServiceRequiresPlanChange && selectedServiceActivePlan) {
    return t((messages) => messages.owner.services.summary.activePlanWithStatus, {
      activePlanLabel: getPlanLabel(selectedServiceActivePlan, t),
      statusLabel: t(
        (messages) => messages.owner.services.summary.planChangePending
      ),
    });
  }

  if (selectedServiceKey) {
    return t((messages) => messages.owner.services.summary.selectedPlanWithStatus, {
      planLabel: selectedPlanMeta.label,
      statusLabel: selectedServiceHasSelectedPlanSubscription
        ? t((messages) => messages.owner.services.summary.billingCompleted)
        : t((messages) => messages.owner.services.summary.billingPending),
    });
  }

  return t((messages) => messages.owner.services.summary.selectedPlanOnly, {
    planLabel: selectedPlanMeta.label,
  });
}, [
  isLockedByProfileState,
  selectedPlanMeta.label,
  selectedServiceActivePlan,
  selectedServiceHasSelectedPlanSubscription,
  selectedServiceKey,
  selectedServiceRequiresPlanChange,
  t,
]);


  function handleServiceSelect(serviceKey: string): void {
    if (!canUseServiceSelection) return;
    setSelectedServiceKey(normalizeServiceKey(serviceKey));
  }

  async function handlePrimaryAction(): Promise<void> {
    try {
      setSubmitting(true);

      if (isLockedByProfileState) {
        await router.push(profileCtaHref);
        return;
      }

      if (!selectedServiceKey || !continueUrl) return;

      writeServiceKeyToStorage(selectedServiceKey);
      writePlanToStorage(selectedPlan);
      await router.replace(continueUrl);
    } finally {
      setSubmitting(false);
    }
  }

  function resetServiceSelection(): void {
    if (!canUseServiceSelection) return;
    setSelectedServiceKey("");
    removeServiceKeyFromStorage();
  }

  function scrollCards(directionName: "prev" | "next"): void {
    const element = scrollerRef.current;
    if (!element) return;

    const delta = Math.max(320, Math.floor(element.clientWidth * 0.82));
    element.scrollBy({
      left: directionName === "next" ? delta : -delta,
      behavior: "smooth",
    });
  }

  return (
    <div className="page" dir={direction} lang={locale}>
      <div className="heroCard">
        <div className="heroText">
          <h1>{t((messages) => messages.owner.services.hero.pageTitle)}</h1>
          <p>
            {isLockedByProfileState
              ? t((messages) => messages.owner.services.hero.lockedDescription)
              : t((messages) => messages.owner.services.hero.activeDescription)}
          </p>
        </div>

        <div className="heroSummary">
          <span className="summaryLabel">
            {t((messages) => messages.owner.services.hero.currentStateLabel)}
          </span>
          <strong>{currentStatusLabel}</strong>
          <small>{heroSummaryText}</small>
        </div>
      </div>

      {gateCard ? (
        <div className={`gateCard ${gateCard.tone}`} role="status" aria-live="polite">
          <div className="gateCardBody">
            <div className="gateEyebrow">
              {t((messages) => messages.owner.services.gate.onboardingLabel)}
            </div>
            <h2>{gateCard.title}</h2>
            <p>{gateCard.message}</p>
          </div>

          <div className="gateCardActions">
            <button
              type="button"
              className="gatePrimaryButton"
              onClick={handlePrimaryAction}
              disabled={submitting}
            >
              {submitting ? redirectingLabel : gateCard.ctaLabel}
            </button>
          </div>
        </div>
      ) : null}

      <section className="section">
        <div className="sectionHeader">
          <div className="sectionHeaderCopy">
            <div className="sectionEyebrow">
              {t((messages) => messages.owner.services.plans.stepLabel)}
            </div>
            <h2>{t((messages) => messages.owner.services.plans.title)}</h2>
            <p>
              {canUseServiceSelection
                ? t((messages) => messages.owner.services.plans.activeDescription)
                : t((messages) => messages.owner.services.plans.lockedDescription)}
            </p>
          </div>
        </div>

        <div className="planGrid">
          {planOptions.map((plan) => {
            const isSelected = selectedPlan === plan.key;

            return (
              <button
                key={plan.key}
                type="button"
                aria-pressed={isSelected}
                className={`planCard ${isSelected ? "selected" : ""} ${
                  plan.key === "PLUS" ? "plus" : "standard"
                } ${!canUseServiceSelection ? "locked" : ""}`}
                onClick={() => {
                  if (!canUseServiceSelection) return;
                  setSelectedPlan(plan.key);
                }}
                disabled={!canUseServiceSelection}
              >
                <div className="planTopRow">
                  <span className="planBadge">{plan.badge}</span>
                  {isSelected ? (
                    <span className="planSelectedChip">
                      {t((messages) => messages.owner.services.plans.selectedChip)}
                    </span>
                  ) : null}
                </div>

                <div className="planTitleRow">
                  <h3>{plan.label}</h3>
                </div>

                <p className="planDescription">{plan.description}</p>
                <div className="planHelper">{plan.helper}</div>

                {!canUseServiceSelection ? (
                  <div className="lockedInlineNote">
                    {t((messages) => messages.owner.services.plans.lockedNote)}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader sectionHeaderWithActions">
          <div className="sectionHeaderCopy">
            <div className="sectionEyebrow">
              {t((messages) => messages.owner.services.serviceList.stepLabel)}
            </div>
            <h2>{t((messages) => messages.owner.services.serviceList.title)}</h2>
            <p>
              {canUseServiceSelection
                ? t(
                    (messages) =>
                      messages.owner.services.serviceList.activeDescription
                  )
                : t(
                    (messages) =>
                      messages.owner.services.serviceList.lockedDescription
                  )}
            </p>
          </div>

          {!loading && !error && services.length > 1 ? (
            <div
              className="carouselActions"
              aria-label={t(
                (messages) => messages.owner.services.serviceList.carouselAria
              )}
            >
              <button
                type="button"
                className="carouselButton"
                onClick={() => scrollCards("prev")}
                disabled={!canScrollPrev}
                aria-label={t(
                  (messages) => messages.owner.services.serviceList.previousServices
                )}
              >
                ‹
              </button>
              <button
                type="button"
                className="carouselButton"
                onClick={() => scrollCards("next")}
                disabled={!canScrollNext}
                aria-label={t(
                  (messages) => messages.owner.services.serviceList.nextServices
                )}
              >
                ›
              </button>
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="serviceScroller skeletonScroller">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="serviceCard skeletonCard">
                <div className="skeletonLine skeletonLineShort" />
                <div className="skeletonLine skeletonLineTitle" />
                <div className="skeletonLine" />
                <div className="skeletonLine skeletonLineMedium" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="feedbackCard errorCard">❌ {error}</div>
        ) : services.length === 0 ? (
          gateCard ? (
            <div className="feedbackCard">
              {t(
                (messages) => messages.owner.services.serviceList.profileCompletionInfo
              )}
            </div>
          ) : (
            <div className="feedbackCard">
              {t((messages) => messages.owner.services.serviceList.noServices)}
            </div>
          )
        ) : (
          <div ref={scrollerRef} className="serviceScroller" onScroll={updateScrollState}>
            {services
              .map((service) => {
                const serviceKey = pickServiceKey(service);
                const title = pickServiceTitle(service, t);
                const description = pickServiceDescription(service);
                const displayPrice = resolveDisplayedPrice(service, selectedPlan);

                return {
                  service,
                  serviceKey,
                  title,
                  description,
                  displayPrice,
                };
              })
              .filter((item) => item.serviceKey)
              .map(({ service, serviceKey, title, description, displayPrice }) => {
                const isSelected = selectedServiceKey === serviceKey;
                const isSubscribed = !!service.subscription?.active;
                const activePlan = resolveServiceActivePlan(service);
                const matchesSelectedPlan = hasActiveSubscriptionForSelectedPlan(
                  service,
                  selectedPlan
                );
                const requiresPlanChange = requiresPlanChangeForSelectedPlan(
                  service,
                  selectedPlan
                );
                const paidUntil = formatDateTime(
                  service.subscription?.paidUntil,
                  formattingLocale,
                  { fallback: "" }
                );
                const isDisabled = !canUseServiceSelection;

                return (
                  <button
                    key={serviceKey}
                    type="button"
                    aria-pressed={isSelected}
                    className={`serviceCard ${isSelected ? "selected" : ""} ${
                      isDisabled ? "locked" : ""
                    }`}
                    onClick={() => handleServiceSelect(serviceKey)}
                    disabled={isDisabled}
                  >
                    <div className="serviceCardTop">
                      <div className="serviceIcon">{title.slice(0, 1).toUpperCase()}</div>

                      <div className="serviceBadges">
                        {isSubscribed ? (
                          <>
                            <span
                              className={`statusBadge ${
                                requiresPlanChange ? "warning" : "active"
                              }`}
                            >
                              {requiresPlanChange
                                ? t(
                                    (messages) =>
                                      messages.owner.services.badges.changePlanBadge
                                  )
                                : t(
                                    (messages) =>
                                      messages.owner.services.badges.activeSubscription
                                  )}
                            </span>

                            {activePlan ? (
                              <span className="statusBadge muted">
                                {t(
                                  (messages) => messages.owner.services.badges.activePlanLabel
                                )}
                                : {getPlanLabel(activePlan, t)}
                              </span>
                            ) : null}
                          </>
                        ) : (
                          <span className="statusBadge muted">
                            {selectedPlan === "PLUS"
                              ? t(
                                  (messages) =>
                                    messages.owner.services.badges.continueWithPlus
                                )
                              : t(
                                  (messages) =>
                                    messages.owner.services.badges.continueWithStandard
                                )}
                          </span>
                        )}

                        {isSelected ? (
                          <span className="statusBadge selected">
                            {t((messages) => messages.owner.services.badges.selected)}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="serviceTitle">{title}</div>

                    <p className="serviceDescription">
                      {description ||
                        t(
                          (messages) => messages.owner.services.cards.fallbackDescription
                        )}
                    </p>

                    <div className="serviceMeta">
                      <div className="metaItem">
                        <span className="metaLabel">
                          {t((messages) => messages.owner.services.meta.planLabel)}
                        </span>
                        <strong>{selectedPlanMeta.label}</strong>
                      </div>

                      <div className="metaItem">
                        <span className="metaLabel">
                          {t((messages) => messages.owner.services.meta.priceLabel)}
                        </span>
                        <strong>
                          {displayPrice !== null
                            ? formatMoney(
                                displayPrice,
                                service.currency,
                                formattingLocale
                              )
                            : t(
                                (messages) =>
                                  messages.owner.services.meta.priceInactive
                              )}
                        </strong>
                      </div>
                    </div>

                    <div className="serviceFooter">
                      {isDisabled ? (
                        <span>
                          {t((messages) => messages.owner.services.cards.lockedFooter)}
                        </span>
                      ) : requiresPlanChange ? (
                        <span>
                          {activePlan
                            ? t(
                                (messages) =>
                                  messages.owner.services.cards
                                    .planChangeFooterWithActivePlan,
                                {
                                  activePlanLabel: getPlanLabel(activePlan, t),
                                }
                              )
                            : t(
                                (messages) =>
                                  messages.owner.services.cards.planChangeFooter
                              )}
                        </span>
                      ) : matchesSelectedPlan ? (
                        <span>
                          {paidUntil
                            ? t(
                                (messages) =>
                                  messages.owner.services.cards.activeFooterWithDate,
                                {
                                  paidUntil,
                                }
                              )
                            : t(
                                (messages) =>
                                  messages.owner.services.cards.activeFooterFallback
                              )}
                        </span>
                      ) : (
                        <span>
                          {t((messages) => messages.owner.services.cards.billingFooter)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
          </div>
        )}
      </section>

      <div className="stickyActionBar">
        <div className="actionCopy">
          <div className="actionEyebrow">
            {t((messages) => messages.owner.services.selection.flowLabel)}
          </div>

          <div className="actionHeadline">
            <strong>{actionHeadline}</strong>
          </div>

          <div className="actionSubtext">{actionSubtext}</div>
        </div>

        <div className="actionButtons">
          {canUseServiceSelection && selectedServiceKey ? (
            <button
              type="button"
              className="secondaryButton"
              onClick={resetServiceSelection}
              disabled={submitting}
            >
              {t((messages) => messages.owner.services.selection.resetService)}
            </button>
          ) : null}

          <button
            type="button"
            className="primaryButton"
            onClick={handlePrimaryAction}
            disabled={submitting || (!isLockedByProfileState && !selectedServiceKey)}
          >
            {submitting ? redirectingLabel : primaryButtonLabel}
          </button>
        </div>
      </div>

      <style jsx>{`
        .page {
          width: 100%;
          max-width: none;
          min-height: 100dvh;
          margin: 0;
          padding: 0 0 48px;
          color: #0f172a;
          background:
            radial-gradient(circle at top left, rgba(177, 209, 88, 0.18) 0%, transparent 22%),
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.1) 0%, transparent 22%),
            radial-gradient(circle at bottom left, rgba(34, 197, 94, 0.08) 0%, transparent 20%),
            linear-gradient(180deg, #eef2ea 0%, #e9eee7 52%, #e6ece4 100%);
        }

        .heroCard {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 14px;
          padding: 22px 16px 20px;
          margin-left: calc(50% - 50vw);
          margin-right: calc(50% - 50vw);
          border-top: 1px solid rgba(15, 23, 42, 0.08);
          border-bottom: 1px solid rgba(15, 23, 42, 0.08);
          border-left: none;
          border-right: none;
          border-radius: 0;
          background:
            radial-gradient(circle at 12% 18%, rgba(166, 214, 94, 0.18) 0%, transparent 22%),
            radial-gradient(circle at 88% 14%, rgba(59, 130, 246, 0.16) 0%, transparent 24%),
            linear-gradient(180deg, #f2f5ef 0%, #edf2ec 100%);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.34),
            0 18px 36px rgba(15, 23, 42, 0.05);
        }

        .heroText {
          min-width: 0;
          width: 100%;
          display: grid;
          gap: 0;
          align-content: start;
        }

        .heroText h1 {
          margin: 0 0 8px;
          font-size: 30px;
          line-height: 1.03;
          font-weight: 900;
          letter-spacing: -0.035em;
          color: #0f172a;
          word-break: break-word;
        }

        .heroText p {
          margin: 0;
          font-size: 14px;
          line-height: 1.7;
          color: #475569;
          max-width: 880px;
          word-break: break-word;
        }

        .heroSummary {
          align-self: stretch;
          width: 100%;
          min-width: 0;
          padding: 15px 16px;
          border-radius: 20px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 24%),
            radial-gradient(circle at bottom left, rgba(163, 230, 53, 0.08), transparent 20%),
            linear-gradient(180deg, #ffffff 0%, #f7fafc 100%);
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
        }

        .summaryLabel {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 34px;
          padding: 0 14px;
          border-radius: 999px;
          background: #0f172a;
          color: #ffffff;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .heroSummary strong {
          display: block;
          margin-top: 10px;
          font-size: 18px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.02em;
          word-break: break-word;
        }

        .heroSummary small {
          display: block;
          margin-top: 6px;
          color: #64748b;
          line-height: 1.58;
          word-break: break-word;
        }

        .gateCard {
          width: 100%;
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 18px;
          border-radius: 22px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 12px 26px rgba(15, 23, 42, 0.05);
        }

        .gateCard.warning {
          background: linear-gradient(180deg, #fffdf7 0%, #fff6e8 100%);
          border-color: rgba(245, 158, 11, 0.28);
        }

        .gateCard.info {
          background: linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%);
          border-color: rgba(59, 130, 246, 0.24);
        }

        .gateCard.success {
          background: linear-gradient(180deg, #f8fff9 0%, #edfdf2 100%);
          border-color: rgba(34, 197, 94, 0.24);
        }

        .gateCardBody {
          display: grid;
          gap: 8px;
          min-width: 0;
        }

        .gateEyebrow,
        .sectionEyebrow,
        .actionEyebrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: fit-content;
          min-height: 34px;
          padding: 0 14px;
          border-radius: 999px;
          background: #0f172a;
          color: #ffffff;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .gateCardBody h2 {
          margin: 0;
          font-size: 22px;
          line-height: 1.15;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.02em;
          word-break: break-word;
        }

        .gateCardBody p {
          margin: 0;
          color: #475569;
          line-height: 1.72;
          word-break: break-word;
        }

        .gateCardActions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          width: 100%;
        }

        .gatePrimaryButton {
          width: 100%;
          min-height: 48px;
          padding: 0 18px;
          border: 1px solid #0f172a;
          border-radius: 14px;
          background: #0f172a;
          color: #ffffff;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.14);
          transition: opacity 160ms ease, transform 160ms ease, box-shadow 160ms ease;
        }

        .gatePrimaryButton:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .section {
          width: 100%;
          margin-top: 16px;
          padding: 16px 12px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 22px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 24%),
            radial-gradient(circle at bottom left, rgba(163, 230, 53, 0.08), transparent 20%),
            linear-gradient(180deg, #ffffff 0%, #f7fafc 100%);
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
        }

        .sectionHeader {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 14px;
        }

        .sectionHeaderCopy {
          min-width: 0;
          width: 100%;
          display: grid;
          gap: 0;
        }

        .sectionHeader h2 {
          margin: 8px 0 6px;
          font-size: 22px;
          line-height: 1.08;
          font-weight: 900;
          letter-spacing: -0.03em;
          color: #0f172a;
          word-break: break-word;
        }

        .sectionHeader p {
          margin: 0;
          color: #475569;
          line-height: 1.68;
          max-width: 980px;
          word-break: break-word;
        }

        .sectionHeaderWithActions {
          justify-content: space-between;
        }

        .planGrid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .planCard {
          position: relative;
          width: 100%;
          min-width: 0;
          text-align: left;
          padding: 16px;
          border-radius: 22px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          cursor: pointer;
          transition:
            transform 180ms ease,
            box-shadow 180ms ease,
            border-color 180ms ease,
            opacity 180ms ease,
            filter 180ms ease,
            background 180ms ease;
          opacity: 0.8;
          overflow: hidden;
        }

        .planCard.selected {
          opacity: 1;
          transform: translateY(-1px);
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
        }

        .planCard.standard.selected {
          border-color: #0f172a;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
        }

        .planCard.plus.selected {
          border-color: rgba(59, 130, 246, 0.24);
          background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
        }

        .planCard.locked,
        .serviceCard.locked {
          opacity: 0.72;
          filter: saturate(0.85);
        }

        .planCard:disabled,
        .serviceCard:disabled {
          cursor: not-allowed;
        }

        .planTopRow {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: start;
          gap: 8px;
        }

        .planTitleRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          min-width: 0;
        }

        .serviceCardTop {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          gap: 12px;
          min-width: 0;
        }

        .planBadge,
        .planSelectedChip,
        .statusBadge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 28px;
          padding: 0 10px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 800;
          white-space: nowrap;
          max-width: 100%;
        }

        .planBadge {
          border: 1px solid rgba(15, 23, 42, 0.08);
          color: #334155;
          background: #f8fafc;
          width: fit-content;
          min-width: 0;
        }

        .planSelectedChip {
          color: #ffffff;
          background: #0f172a;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
          justify-self: end;
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .planCard.plus.selected .planSelectedChip {
          background: #0f172a;
        }

        .planTitleRow h3 {
          margin: 12px 0 0;
          font-size: 21px;
          font-weight: 900;
          letter-spacing: -0.02em;
          color: #0f172a;
          word-break: break-word;
        }

        .planDescription {
          margin: 10px 0 8px;
          color: #475569;
          line-height: 1.66;
          word-break: break-word;
        }

        .planHelper {
          color: #64748b;
          font-size: 13px;
          line-height: 1.58;
          word-break: break-word;
        }

        .lockedInlineNote {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(15, 23, 42, 0.08);
          color: #92400e;
          font-size: 13px;
          line-height: 1.6;
          font-weight: 700;
          word-break: break-word;
        }

        .carouselActions {
          display: flex;
          gap: 8px;
          align-self: flex-start;
        }

        .carouselButton {
          width: 40px;
          height: 40px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          border-radius: 999px;
          background: #ffffff;
          color: #0f172a;
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
          transition:
            background 160ms ease,
            opacity 160ms ease,
            border-color 160ms ease,
            box-shadow 160ms ease;
        }

        .carouselButton:disabled {
          opacity: 0.38;
          cursor: not-allowed;
        }

        .serviceScroller {
          display: flex;
          gap: 12px;
          width: 100%;
          overflow-x: auto;
          padding: 4px 0 8px;
          scroll-snap-type: x mandatory;
          scroll-padding-left: 0;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .serviceScroller::-webkit-scrollbar {
          display: none;
        }

        .serviceCard {
          flex: 0 0 auto;
          width: min(360px, calc(100vw - 40px));
          min-height: 260px;
          text-align: left;
          padding: 16px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 22px;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          scroll-snap-align: start;
          cursor: pointer;
          transition:
            transform 180ms ease,
            box-shadow 180ms ease,
            border-color 180ms ease,
            background 180ms ease,
            opacity 180ms ease,
            filter 180ms ease;
          overflow: hidden;
        }

        .serviceCard:hover,
        .serviceCard:focus-visible {
          transform: translateY(-2px);
          box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
        }

        .serviceCard.selected {
          border-color: #0f172a;
          background: linear-gradient(180deg, #ffffff 0%, #eef4ff 100%);
          box-shadow: 0 18px 34px rgba(15, 23, 42, 0.1);
        }

        .serviceCard:disabled:hover,
        .serviceCard:disabled:focus-visible,
        .planCard:disabled:hover,
        .planCard:disabled:focus-visible {
          transform: none;
          box-shadow: none;
        }

        .serviceIcon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #0f172a;
          color: #ffffff;
          font-weight: 800;
          font-size: 18px;
          flex-shrink: 0;
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.14);
        }

        .serviceBadges {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-start;
          align-items: flex-start;
          gap: 6px;
          max-width: 100%;
          min-width: 0;
        }

        .statusBadge.active {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid rgba(34, 197, 94, 0.24);
        }

        .statusBadge.muted {
          background: #f8fafc;
          color: #334155;
          border: 1px solid rgba(15, 23, 42, 0.08);
        }

        .statusBadge.warning {
          background: #fff7ed;
          color: #9a3412;
          border: 1px solid rgba(249, 115, 22, 0.24);
        }

        .statusBadge.selected {
          background: #0f172a;
          color: #ffffff;
          border: 1px solid #0f172a;
        }

        .serviceTitle {
          margin-top: 14px;
          font-size: 21px;
          line-height: 1.12;
          font-weight: 900;
          letter-spacing: -0.02em;
          color: #0f172a;
          word-break: break-word;
        }

        .serviceDescription {
          margin: 10px 0 0;
          min-height: 0;
          color: #475569;
          font-size: 14px;
          line-height: 1.68;
          word-break: break-word;
        }

        .serviceMeta {
          margin-top: 14px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .metaItem {
          min-width: 0;
          padding: 12px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.78);
          border: 1px solid rgba(15, 23, 42, 0.08);
          backdrop-filter: blur(6px);
        }

        .metaLabel {
          display: block;
          margin-bottom: 6px;
          font-size: 10.5px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .metaItem strong {
          display: block;
          font-size: 13.5px;
          color: #0f172a;
          line-height: 1.45;
          word-break: break-word;
        }

        .serviceFooter {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid rgba(15, 23, 42, 0.08);
          font-size: 12.5px;
          line-height: 1.62;
          color: #64748b;
          word-break: break-word;
        }

        .feedbackCard {
          padding: 16px;
          border-radius: 18px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          color: #334155;
        }

        .errorCard {
          color: #991b1b;
          background: linear-gradient(180deg, #fffafa 0%, #fef2f2 100%);
          border-color: rgba(239, 68, 68, 0.24);
        }

        .skeletonScroller {
          overflow: hidden;
        }

        .skeletonCard {
          cursor: default;
          pointer-events: none;
          background: #ffffff;
        }

        .skeletonLine {
          height: 12px;
          border-radius: 999px;
          background: linear-gradient(90deg, #eef2f7 0%, #e2e8f0 50%, #eef2f7 100%);
          background-size: 200% 100%;
          animation: shimmer 1.2s linear infinite;
          margin-top: 12px;
        }

        .skeletonLineShort {
          width: 28%;
          margin-top: 0;
        }

        .skeletonLineTitle {
          width: 56%;
          height: 20px;
          margin-top: 18px;
        }

        .skeletonLineMedium {
          width: 74%;
        }

        .stickyActionBar {
          width: 100%;
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px 14px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 22px;
          background: rgba(248, 250, 247, 0.9);
          backdrop-filter: blur(14px);
          box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
        }

        .actionCopy {
          min-width: 0;
          width: 100%;
        }

        .actionHeadline {
          margin-top: 6px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          font-size: 17px;
          line-height: 1.38;
          color: #0f172a;
          word-break: break-word;
        }

        .actionHeadline strong {
          display: block;
          min-width: 0;
          word-break: break-word;
        }

        .actionSubtext {
          margin-top: 6px;
          color: #64748b;
          font-size: 13.5px;
          line-height: 1.62;
          word-break: break-word;
        }

        .actionButtons {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          align-items: stretch;
        }

        .primaryButton,
        .secondaryButton {
          width: 100%;
          min-height: 48px;
          padding: 0 16px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          transition:
            opacity 160ms ease,
            transform 160ms ease,
            background 160ms ease,
            border-color 160ms ease,
            box-shadow 160ms ease;
        }

        .primaryButton {
          border: 1px solid #0f172a;
          background: #0f172a;
          color: #ffffff;
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.14);
        }

        .primaryButton:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .secondaryButton {
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        @media (max-width: 479px) {
          .heroText h1 {
            font-size: 27px;
          }

          .sectionHeader h2 {
            font-size: 21px;
          }

          .planTopRow {
            grid-template-columns: 1fr;
            gap: 7px;
          }

          .planSelectedChip {
            justify-self: start;
            max-width: 100%;
          }

          .planBadge,
          .planSelectedChip,
          .statusBadge {
            font-size: 10px;
            padding: 0 8px;
            min-height: 26px;
          }

          .serviceCard {
            width: calc(100vw - 32px);
          }

          .serviceMeta {
            grid-template-columns: 1fr;
          }

          .actionHeadline {
            font-size: 16px;
          }

          .stickyActionBar {
            padding: 14px 12px;
          }
        }

        @media (min-width: 768px) {
          .page {
            padding: 0 0 42px;
          }

          .heroCard {
            flex-direction: row;
            align-items: flex-start;
            justify-content: space-between;
            gap: 18px;
            padding: 38px 24px 34px;
          }

          .heroSummary {
            align-self: flex-start;
            width: auto;
            min-width: 220px;
            max-width: 360px;
          }

          .heroText h1 {
            font-size: 42px;
          }

          .heroText p {
            font-size: 15px;
          }

          .gateCard {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }

          .gateCardActions {
            width: auto;
            flex-shrink: 0;
            justify-content: flex-end;
          }

          .gatePrimaryButton {
            width: auto;
          }

          .planGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .sectionHeader {
            flex-direction: row;
            align-items: flex-end;
            justify-content: space-between;
          }

          .section {
            padding: 20px;
          }

          .planTopRow {
            grid-template-columns: minmax(0, 1fr) auto;
          }

          .serviceCardTop {
            flex-direction: row;
            align-items: flex-start;
            justify-content: space-between;
            gap: 10px;
          }

          .serviceBadges {
            justify-content: flex-end;
            max-width: calc(100% - 56px);
          }

          .serviceCard {
            width: clamp(340px, 32vw, 420px);
            padding: 18px;
          }

          .serviceDescription {
            min-height: 72px;
          }

          .serviceMeta {
            grid-template-columns: 1fr 1fr;
          }

          .stickyActionBar {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }

          .actionCopy {
            flex: 1 1 auto;
          }

          .actionButtons {
            width: auto;
            flex-direction: row;
            justify-content: flex-end;
            flex-shrink: 0;
          }

          .secondaryButton,
          .primaryButton {
            width: auto;
            min-width: 180px;
          }
        }

        @media (min-width: 1024px) {
          .page {
            padding: 0 0 48px;
          }

          .heroText p {
            font-size: 16px;
          }

          .section {
            padding: 22px;
          }

          .serviceCard {
            width: clamp(340px, 28vw, 440px);
          }
        }
      `}</style>
    </div>
  );
}