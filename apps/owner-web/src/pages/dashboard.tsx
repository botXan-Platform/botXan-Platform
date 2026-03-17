import type { CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDateTime, type Locale, type MessageKey } from "i18n-core";
import type { AppMessagesCatalog } from "i18n-messages";
import { useI18n } from "i18n-react";

type OwnerFlowState =
  | "PROFILE_REQUIRED"
  | "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED"
  | "SERVICE_SELECTION_REQUIRED"
  | "SUBSCRIPTION_REQUIRED"
  | "ACTIVE";

type PlanType = "STANDARD" | "PLUS";

type ProfileDTO = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  profileExists?: boolean;
  profileCompleted?: boolean;
  phoneVerified?: boolean;
  phoneVerifiedAt?: string | null;
  phoneVerificationStatus?: string | null;
};

type ProfileResponseDTO = {
  ok?: boolean;
  state?: string | null;
  owner?: ProfileDTO | null;
  profileExists?: boolean;
  profileCompleted?: boolean;
  phoneVerified?: boolean;
  phoneVerifiedAt?: string | null;
  phoneVerificationStatus?: string | null;
  message?: string;
  error?: string;
};

type ServiceItem = {
  id?: string;
  key?: string;
  serviceKey?: string;
  title?: string;
  name?: string;
  description?: string | null;
  subscription?: {
    active?: boolean;
    status?: string | null;
    tier?: "STANDARD" | "PREMIUM" | null;
    paidUntil?: string | null;
    legacyActive?: boolean;
    plan?: PlanType | string | null;
  } | null;
};

type ServicesResponseDTO = {
  ok?: boolean;
  state?: string | null;
  items?: ServiceItem[];
  services?: ServiceItem[];
  message?: string;
  error?: string;
  gate?: {
    state?: string | null;
    redirectUrl?: string | null;
  } | null;
  onboarding?: {
    state?: string | null;
  } | null;
};

type DashboardCardItem = {
  key: "properties" | "profile" | "billing" | "bookings";
  title: string;
  text: string;
  href: string;
  icon: string;
};

type DashboardTranslate = ReturnType<typeof useI18n<AppMessagesCatalog>>["t"];

type FetchJsonResult<T> = {
  response: Response;
  data: T;
};

const REQUEST_TIMEOUT_MS = 15000;
const REQUEST_TIMEOUT_ERROR_CODE = "__REQUEST_TIMEOUT__";
const REQUEST_TIMEOUT_MESSAGE = "Sorğu vaxt aşımına düşdü. Backend cavab vermədi.";

const SERVICE_STORAGE_KEYS = [
  "ownerServiceKey",
  "selectedServiceKey",
  "serviceKey",
  "activeServiceKey",
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

const PLAN_STORAGE_KEYS = [
  "ownerPlanType",
  "selectedPlanType",
  "billingPlan",
  "selectedPlan",
] as const;

const SERVICE_MESSAGE_KEYS = {
  RENT_HOME: "owner.dashboard.services.RENT_HOME",
  BARBER: "owner.dashboard.services.BARBER",
  CAR_RENTAL: "owner.dashboard.services.CAR_RENTAL",
  HOTEL: "owner.dashboard.services.HOTEL",
  BEAUTY_SALON: "owner.dashboard.services.BEAUTY_SALON",
  BABYSITTER: "owner.dashboard.services.BABYSITTER",
  CLEANING: "owner.dashboard.services.CLEANING",
  TECHNICAL_SERVICES: "owner.dashboard.services.TECHNICAL_SERVICES",
} as const satisfies Record<string, MessageKey<AppMessagesCatalog>>;

type SupportedServiceKey = keyof typeof SERVICE_MESSAGE_KEYS;

function isSupportedServiceKey(value: string): value is SupportedServiceKey {
  return Object.prototype.hasOwnProperty.call(SERVICE_MESSAGE_KEYS, value);
}

function apiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    "http://127.0.0.1:3001"
  ).trim();
}

function safeServiceKey(input: unknown): string {
  const value = String(input ?? "").trim().toUpperCase();

  if (!value) return "";
  if (!/^[A-Z0-9_-]{2,64}$/.test(value)) return "";

  return value;
}

function getQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0]?.trim() || "";
  return value?.trim() || "";
}

function digitsOnly(input: string): string {
  return String(input || "").replace(/[^\d]/g, "");
}

function isValidE164(value: string): boolean {
  const normalized = String(value || "").trim();
  return /^\+[1-9]\d{7,14}$/.test(normalized);
}

function normalizeQueryPath(value: string): string {
  const trimmed = String(value || "").trim();

  if (!trimmed) return "";
  if (!trimmed.startsWith("/")) return "";
  if (trimmed.startsWith("//")) return "";

  return trimmed;
}

function normalizeOwnerFlowState(value: unknown): OwnerFlowState | "" {
  const v = String(value || "").trim().toUpperCase();

  if (!v) return "";
  if (v === "PROFILE_REQUIRED" || v === "OWNER_PROFILE_REQUIRED") {
    return "PROFILE_REQUIRED";
  }
  if (
    v === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED" ||
    v === "PHONE_VERIFICATION_REQUIRED" ||
    v === "PHONE_NOT_VERIFIED" ||
    v === "OTP_REQUIRED"
  ) {
    return "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED";
  }
  if (v === "SERVICE_SELECTION_REQUIRED") {
    return "SERVICE_SELECTION_REQUIRED";
  }
  if (v === "SUBSCRIPTION_REQUIRED" || v === "PAYMENT_REQUIRED") {
    return "SUBSCRIPTION_REQUIRED";
  }
  if (v === "ACTIVE") {
    return "ACTIVE";
  }

  return "";
}

function normalizePlanValue(value: unknown): PlanType | "" {
  const v = String(value ?? "").trim().toUpperCase();

  if (!v) return "";
  if (v === "STANDARD" || v === "STANDART") return "STANDARD";
  if (v === "PLUS" || v === "PREMIUM") return "PLUS";

  return "";
}

function normalizeSubscriptionPlan(
  plan: unknown,
  tier: unknown,
): PlanType | "" {
  return normalizePlanValue(plan) || normalizePlanValue(tier);
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

function normalizeOwnerIdForStorage(value: unknown): string {
  const sanitized = normalizeAsciiHeaderValue(value);

  if (!sanitized) return "";
  if (!/^[A-Za-z0-9_-]{6,128}$/.test(sanitized)) return "";

  return sanitized;
}

function normalizeEmailForStorage(value: unknown): string {
  const sanitized = normalizeAsciiHeaderValue(
    String(value ?? "").toLowerCase(),
  );

  if (!sanitized) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) return "";

  return sanitized;
}

function normalizePhoneForStorage(value: unknown): string {
  const raw = String(value ?? "").trim();

  if (!raw) return "";

  const normalized = raw.startsWith("+")
    ? `+${digitsOnly(raw)}`
    : `+${digitsOnly(raw)}`;

  return isValidE164(normalized) ? normalized : "";
}

function readFirstStorageValue(keys: readonly string[]): string {
  if (typeof window === "undefined") return "";

  for (const key of keys) {
    const value = String(window.localStorage.getItem(key) || "").trim();
    if (value) return value;
  }

  return "";
}

function getServiceKeyFromStorage(): string {
  return safeServiceKey(readFirstStorageValue(SERVICE_STORAGE_KEYS));
}

function writeServiceKeyToStorage(serviceKey: string): void {
  if (typeof window === "undefined") return;

  const safe = safeServiceKey(serviceKey);
  if (!safe) return;

  window.localStorage.setItem(SERVICE_STORAGE_KEYS[0], safe);
}

function clearServiceKeyStorage(): void {
  if (typeof window === "undefined") return;

  for (const key of SERVICE_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }
}

function getOwnerPhoneFromStorage(): string {
  return normalizePhoneForStorage(readFirstStorageValue(PHONE_STORAGE_KEYS));
}

function getOwnerIdFromStorage(): string {
  return normalizeOwnerIdForStorage(readFirstStorageValue(OWNER_ID_STORAGE_KEYS));
}

function getOwnerEmailFromStorage(): string {
  return normalizeEmailForStorage(readFirstStorageValue(OWNER_EMAIL_STORAGE_KEYS));
}

function getPlanFromStorage(): PlanType | "" {
  return normalizePlanValue(readFirstStorageValue(PLAN_STORAGE_KEYS));
}

function writePlanToStorage(plan: PlanType): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PLAN_STORAGE_KEYS[0], plan);
}

function clearOwnerIdStorage(): void {
  if (typeof window === "undefined") return;

  for (const key of OWNER_ID_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }
}

function clearOwnerEmailStorage(): void {
  if (typeof window === "undefined") return;

  for (const key of OWNER_EMAIL_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }
}

function clearOwnerPhoneStorage(): void {
  if (typeof window === "undefined") return;

  for (const key of PHONE_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }
}

function clearOwnerIdentityStorage(): void {
  clearOwnerIdStorage();
  clearOwnerEmailStorage();
  clearOwnerPhoneStorage();
}

function writeOwnerIdToStorage(ownerId: string): void {
  if (typeof window === "undefined") return;

  const normalized = normalizeOwnerIdForStorage(ownerId);

  if (!normalized) {
    clearOwnerIdStorage();
    return;
  }

  window.localStorage.setItem(OWNER_ID_STORAGE_KEYS[0], normalized);
}

function writeOwnerEmailToStorage(email: string): void {
  if (typeof window === "undefined") return;

  const normalized = normalizeEmailForStorage(email);

  if (!normalized) {
    clearOwnerEmailStorage();
    return;
  }

  window.localStorage.setItem(OWNER_EMAIL_STORAGE_KEYS[0], normalized);
}

function writeOwnerPhoneToStorage(phone: string): void {
  if (typeof window === "undefined") return;

  const normalized = normalizePhoneForStorage(phone);

  if (!normalized) {
    clearOwnerPhoneStorage();
    return;
  }

  window.localStorage.setItem(PHONE_STORAGE_KEYS[0], normalized);
}

function syncIdentityFromProfile(owner: ProfileDTO | null | undefined): void {
  if (!owner) return;

  writeOwnerIdToStorage(String(owner.id || "").trim());
  writeOwnerEmailToStorage(String(owner.email || "").trim());
  writeOwnerPhoneToStorage(String(owner.phone || "").trim());
}

function sanitizeHeadersRecord(
  input: Record<string, string>,
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

function buildOwnerHeaders(): Record<string, string> {
  const ownerId = getOwnerIdFromStorage();
  const ownerPhone = getOwnerPhoneFromStorage();
  const ownerEmail = getOwnerEmailFromStorage();

  return sanitizeHeadersRecord({
    ...(ownerId ? { "x-owner-id": ownerId } : {}),
    ...(ownerPhone ? { "x-owner-phone": ownerPhone } : {}),
    ...(ownerEmail ? { "x-owner-email": ownerEmail } : {}),
  });
}

function humanizeServiceKey(
  input: string,
  t: DashboardTranslate,
): string {
  const serviceKey = safeServiceKey(input);

  if (!serviceKey) {
    return t("owner.dashboard.summary.serviceGenericLabel");
  }

  if (isSupportedServiceKey(serviceKey)) {
    return t(SERVICE_MESSAGE_KEYS[serviceKey]);
  }

  return serviceKey
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function humanizePlanValue(
  plan: PlanType | "",
  t: DashboardTranslate,
): string {
  if (plan === "PLUS") return t("owner.dashboard.meta.planPlusLabel");
  if (plan === "STANDARD") {
    return t("owner.dashboard.meta.planStandardLabel");
  }

  return "—";
}

function pickServiceKey(item: ServiceItem): string {
  return safeServiceKey(item.serviceKey || item.key || "");
}

function pickServiceTitle(
  item: ServiceItem,
  t: DashboardTranslate,
): string {
  const serviceKey = pickServiceKey(item);

  if (serviceKey) {
    return humanizeServiceKey(serviceKey, t);
  }

  const title = String(item.title || item.name || "").trim();

  return title || t("owner.dashboard.summary.serviceGenericLabel");
}

function buildDashboardPath(
  serviceKey: string,
  plan?: PlanType | "",
  locale?: Locale | "",
): string {
  const params = new URLSearchParams();

  if (serviceKey) params.set("serviceKey", serviceKey);
  if (plan) params.set("plan", plan);
  if (locale) params.set("lang", locale);

  return `/dashboard${params.toString() ? `?${params.toString()}` : ""}`;
}

function buildServicesUrl(
  nextPath: string,
  serviceKey: string,
  plan?: PlanType | "",
  locale?: Locale | "",
): string {
  const params = new URLSearchParams();
  const safeNext = normalizeQueryPath(nextPath);

  if (safeNext) params.set("next", safeNext);
  if (serviceKey) params.set("serviceKey", serviceKey);
  if (plan) params.set("plan", plan);
  if (locale) params.set("lang", locale);

  return `/services${params.toString() ? `?${params.toString()}` : ""}`;
}

function buildProfileUrl(
  serviceKey: string,
  nextPath: string,
  plan?: PlanType | "",
  locale?: Locale | "",
): string {
  const params = new URLSearchParams();

  if (serviceKey) params.set("serviceKey", serviceKey);
  if (plan) params.set("plan", plan);
  if (locale) params.set("lang", locale);

  const safeNext = normalizeQueryPath(nextPath);
  if (safeNext) {
    params.set("next", buildServicesUrl(safeNext, serviceKey, plan, locale));
  }

  return `/profile${params.toString() ? `?${params.toString()}` : ""}`;
}

function buildBillingUrl(
  serviceKey: string,
  nextPath: string,
  plan?: PlanType | "",
  locale?: Locale | "",
): string {
  const params = new URLSearchParams();

  if (serviceKey) params.set("serviceKey", serviceKey);
  if (plan) params.set("plan", plan);
  if (locale) params.set("lang", locale);

  const safeNext = normalizeQueryPath(nextPath);
  if (safeNext) {
    params.set("next", safeNext);
  }

  return `/billing${params.toString() ? `?${params.toString()}` : ""}`;
}

function buildPropertiesUrl(
  serviceKey: string,
  nextPath: string,
  plan?: PlanType | "",
  locale?: Locale | "",
): string {
  const params = new URLSearchParams();

  if (serviceKey) params.set("serviceKey", serviceKey);
  if (plan) params.set("plan", plan);
  if (locale) params.set("lang", locale);

  const safeNext = normalizeQueryPath(nextPath);
  if (safeNext) {
    params.set("next", safeNext);
  }

  return `/properties${params.toString() ? `?${params.toString()}` : ""}`;
}

function buildBookingsUrl(
  serviceKey: string,
  nextPath: string,
  plan?: PlanType | "",
  locale?: Locale | "",
): string {
  const params = new URLSearchParams();

  if (serviceKey) params.set("serviceKey", serviceKey);
  if (plan) params.set("plan", plan);
  if (locale) params.set("lang", locale);

  const safeNext = normalizeQueryPath(nextPath);
  if (safeNext) {
    params.set("next", safeNext);
  }

  return `/bookings${params.toString() ? `?${params.toString()}` : ""}`;
}

function buildProfileManageUrl(
  serviceKey: string,
  plan?: PlanType | "",
  locale?: Locale | "",
): string {
  const params = new URLSearchParams();

  if (serviceKey) params.set("serviceKey", serviceKey);
  if (plan) params.set("plan", plan);
  if (locale) params.set("lang", locale);

  return `/profile${params.toString() ? `?${params.toString()}` : ""}`;
}

function isOwnerProfileComplete(
  dto: ProfileResponseDTO | null | undefined,
): boolean {
  const owner = dto?.owner;

  return Boolean(
    dto?.profileCompleted ??
      owner?.profileCompleted ??
      (owner?.name && owner?.phone && owner?.email),
  );
}

function isOwnerPhoneVerified(
  dto: ProfileResponseDTO | null | undefined,
): boolean {
  const owner = dto?.owner;

  return Boolean(
    dto?.phoneVerified ?? owner?.phoneVerified ?? owner?.phoneVerifiedAt,
  );
}

function resolveProfileGateState(
  dto: ProfileResponseDTO | null | undefined,
): OwnerFlowState {
  const explicit = normalizeOwnerFlowState(dto?.state);
  if (explicit) return explicit;

  if (!dto?.owner || !isOwnerProfileComplete(dto)) {
    return "PROFILE_REQUIRED";
  }

  if (!isOwnerPhoneVerified(dto)) {
    return "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED";
  }

  return "SERVICE_SELECTION_REQUIRED";
}

function extractServices(
  dto: ServicesResponseDTO | null | undefined,
): ServiceItem[] {
  if (Array.isArray(dto?.items)) return dto.items;
  if (Array.isArray(dto?.services)) return dto.services;
  return [];
}

function isSubscriptionTimeActive(
  paidUntilValue: string | null | undefined,
): boolean {
  const paidUntilRaw = String(paidUntilValue || "").trim();
  if (!paidUntilRaw) return false;

  const paidUntil = new Date(paidUntilRaw);
  if (Number.isNaN(paidUntil.getTime())) return false;

  return paidUntil.getTime() > Date.now();
}

function isServiceSubscriptionActive(
  service: ServiceItem | null | undefined,
): boolean {
  if (!service?.subscription) return false;

  if (
    service.subscription.active === true ||
    service.subscription.legacyActive === true
  ) {
    return true;
  }

  const status = String(service.subscription.status || "")
    .trim()
    .toUpperCase();

  if (status !== "ACTIVE") return false;

  return isSubscriptionTimeActive(service.subscription.paidUntil);
}

function resolveServiceActivePlan(
  service: ServiceItem | null | undefined,
): PlanType | "" {
  return normalizeSubscriptionPlan(
    service?.subscription?.plan,
    service?.subscription?.tier,
  );
}

function hasActiveSubscriptionForSelectedPlan(
  service: ServiceItem | null | undefined,
  selectedPlan: PlanType | "",
): boolean {
  if (!service || !selectedPlan) return false;
  if (!isServiceSubscriptionActive(service)) return false;

  const activePlan = resolveServiceActivePlan(service);

  if (!activePlan) {
    return true;
  }

  return activePlan === selectedPlan;
}

function resolveDashboardState(
  profileDto: ProfileResponseDTO | null,
  servicesDto: ServicesResponseDTO | null,
  selectedServiceKey: string,
  selectedPlan: PlanType | "",
): OwnerFlowState {
  const profileState = resolveProfileGateState(profileDto);

  if (profileState === "PROFILE_REQUIRED") return "PROFILE_REQUIRED";
  if (profileState === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED") {
    return "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED";
  }

  const list = extractServices(servicesDto);
  const selected =
    list.find((item) => pickServiceKey(item) === selectedServiceKey) || null;

  if (!selectedServiceKey || !selected) {
    return "SERVICE_SELECTION_REQUIRED";
  }

  if (hasActiveSubscriptionForSelectedPlan(selected, selectedPlan)) {
    return "ACTIVE";
  }

  return "SUBSCRIPTION_REQUIRED";
}

function mapApiErrorMessage(
  raw: string,
  t: DashboardTranslate,
): string {
  const value = String(raw || "").trim();

  if (!value) return t("owner.dashboard.errors.dashboardStateLoadFailed");
  if (value === REQUEST_TIMEOUT_ERROR_CODE) {
    return REQUEST_TIMEOUT_MESSAGE;
  }
  if (value === "PROFILE_REQUIRED") {
    return t("owner.dashboard.errors.completeOwnerProfileFirst");
  }
  if (value === "PHONE_VERIFICATION_REQUIRED") {
    return t("owner.dashboard.errors.phoneVerificationRequired");
  }
  if (value === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED") {
    return t("owner.dashboard.errors.phoneVerificationRequired");
  }
  if (value === "SERVICE_SELECTION_REQUIRED") {
    return t("owner.dashboard.errors.serviceSelectionRequired");
  }
  if (value === "SUBSCRIPTION_REQUIRED") {
    return t("owner.dashboard.errors.activeSubscriptionNotFound");
  }
  if (value === "service not found or inactive") {
    return t("owner.dashboard.errors.serviceNotFoundOrInactive");
  }
  if (value === "OWNER_IDENTITY_REQUIRED" || value === "owner not found") {
    return t("owner.dashboard.errors.ownerIdentityRequired");
  }
  if (value === "INTERNAL_ERROR" || value === "internal_error") {
    return t("owner.dashboard.errors.serverErrorOccurred");
  }

  return value;
}

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === "AbortError";
  }
  if (error instanceof Error) {
    return error.name === "AbortError";
  }
  return false;
}

async function fetchJsonWithTimeout<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<FetchJsonResult<T>> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => ({}))) as T;

    return { response, data };
  } catch (error: unknown) {
    if (isAbortError(error)) {
      throw new Error(REQUEST_TIMEOUT_ERROR_CODE);
    }

    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

function getStateMeta(
  state: OwnerFlowState,
  serviceKey: string,
  dashboardPath: string,
  plan: PlanType | "",
  locale: Locale,
  t: DashboardTranslate,
): {
  badge: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  tone: "info" | "warning" | "danger" | "success";
} {
  if (state === "PROFILE_REQUIRED") {
    return {
      badge: t("owner.dashboard.states.profileRequired.badge"),
      title: t("owner.dashboard.states.profileRequired.title"),
      description: t("owner.dashboard.states.profileRequired.description"),
      ctaLabel: t("owner.dashboard.states.profileRequired.cta"),
      ctaHref: buildProfileUrl(serviceKey, dashboardPath, plan, locale),
      tone: "info",
    };
  }

  if (state === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED") {
    return {
      badge: t("owner.dashboard.states.phoneVerificationRequired.badge"),
      title: t("owner.dashboard.states.phoneVerificationRequired.title"),
      description: t(
        "owner.dashboard.states.phoneVerificationRequired.description",
      ),
      ctaLabel: t("owner.dashboard.states.phoneVerificationRequired.cta"),
      ctaHref: buildProfileUrl(serviceKey, dashboardPath, plan, locale),
      tone: "warning",
    };
  }

  if (state === "SERVICE_SELECTION_REQUIRED") {
    return {
      badge: t("owner.dashboard.states.serviceSelectionRequired.badge"),
      title: t("owner.dashboard.states.serviceSelectionRequired.title"),
      description: t(
        "owner.dashboard.states.serviceSelectionRequired.description",
      ),
      ctaLabel: t("owner.dashboard.states.serviceSelectionRequired.cta"),
      ctaHref: buildServicesUrl(dashboardPath, serviceKey, plan, locale),
      tone: "info",
    };
  }

  if (state === "SUBSCRIPTION_REQUIRED") {
    return {
      badge: t("owner.dashboard.states.subscriptionRequired.badge"),
      title: t("owner.dashboard.states.subscriptionRequired.title"),
      description: t(
        "owner.dashboard.states.subscriptionRequired.description",
      ),
      ctaLabel: t("owner.dashboard.states.subscriptionRequired.cta"),
      ctaHref: buildBillingUrl(serviceKey, dashboardPath, plan, locale),
      tone: "danger",
    };
  }

  return {
    badge: t("owner.dashboard.states.active.badge"),
    title: t("owner.dashboard.states.active.title"),
    description: t("owner.dashboard.states.active.description"),
    ctaLabel: t("owner.dashboard.states.active.cta"),
    ctaHref: buildServicesUrl(dashboardPath, serviceKey, plan, locale),
    tone: "success",
  };
}

export default function OwnerDashboard() {
  const router = useRouter();
  const { locale, formattingLocale, t } = useI18n<AppMessagesCatalog>();
  const API = useMemo(() => apiBase(), []);

  const [serviceKey, setServiceKey] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dashboardState, setDashboardState] =
    useState<OwnerFlowState>("PROFILE_REQUIRED");
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [ownerName, setOwnerName] = useState("");

  const resolvedServiceKey = useMemo(() => {
    const fromQuery = safeServiceKey(getQueryValue(router.query.serviceKey));
    return fromQuery || serviceKey;
  }, [router.query.serviceKey, serviceKey]);

  const selectedService = useMemo(() => {
    return (
      services.find((item) => pickServiceKey(item) === resolvedServiceKey) ||
      null
    );
  }, [resolvedServiceKey, services]);

  const currentPlan = useMemo<PlanType | "">(() => {
    const fromQuery = normalizePlanValue(getQueryValue(router.query.plan));

    if (fromQuery) return fromQuery;

    const fromStorage = getPlanFromStorage();
    if (fromStorage) return fromStorage;

    return resolveServiceActivePlan(selectedService);
  }, [router.query.plan, selectedService]);

  const dashboardPath = useMemo(() => {
    return buildDashboardPath(resolvedServiceKey, currentPlan, locale);
  }, [resolvedServiceKey, currentPlan, locale]);

  const effectiveServiceKeyForActions = useMemo(() => {
    if (
      dashboardState === "SERVICE_SELECTION_REQUIRED" &&
      !selectedService
    ) {
      return "";
    }

    return resolvedServiceKey;
  }, [dashboardState, resolvedServiceKey, selectedService]);

  const displayServiceName = useMemo(() => {
    if (selectedService) return pickServiceTitle(selectedService, t);
    return humanizeServiceKey(resolvedServiceKey, t);
  }, [resolvedServiceKey, selectedService, t]);

  const stateMeta = useMemo(() => {
    return getStateMeta(
      dashboardState,
      effectiveServiceKeyForActions,
      dashboardPath,
      currentPlan,
      locale,
      t,
    );
  }, [
    dashboardPath,
    dashboardState,
    effectiveServiceKeyForActions,
    currentPlan,
    locale,
    t,
  ]);

  const isDashboardActive = useMemo(() => {
    return dashboardState === "ACTIVE";
  }, [dashboardState]);

  const accessStatusLabel = useMemo(() => {
    return isDashboardActive
      ? t("owner.dashboard.meta.accessActiveLabel")
      : t("owner.dashboard.meta.accessLockedLabel");
  }, [isDashboardActive, t]);

  const dashboardCards = useMemo<DashboardCardItem[]>(() => {
    return [
      {
        key: "properties",
        title: t("owner.dashboard.cards.properties.title"),
        text: t("owner.dashboard.cards.properties.text"),
        href: buildPropertiesUrl(
          resolvedServiceKey,
          dashboardPath,
          currentPlan,
          locale,
        ),
        icon: "🏠",
      },
      {
        key: "profile",
        title: t("owner.dashboard.cards.profile.title"),
        text: t("owner.dashboard.cards.profile.text"),
        href: buildProfileManageUrl(resolvedServiceKey, currentPlan, locale),
        icon: "👤",
      },
      {
        key: "billing",
        title: t("owner.dashboard.cards.billing.title"),
        text: t("owner.dashboard.cards.billing.text"),
        href: buildBillingUrl(
          resolvedServiceKey,
          dashboardPath,
          currentPlan,
          locale,
        ),
        icon: "💳",
      },
      {
        key: "bookings",
        title: t("owner.dashboard.cards.bookings.title"),
        text: t("owner.dashboard.cards.bookings.text"),
        href: buildBookingsUrl(
          resolvedServiceKey,
          dashboardPath,
          currentPlan,
          locale,
        ),
        icon: "📥",
      },
    ];
  }, [resolvedServiceKey, dashboardPath, currentPlan, locale, t]);

  const loadDashboardGate = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const profileHeaders = buildOwnerHeaders();

      const { response: profileRes, data: profileJson } =
        await fetchJsonWithTimeout<ProfileResponseDTO>(`${API}/owner/profile`, {
          method: "GET",
          headers: profileHeaders,
        });

      const profileMessage = String(
        profileJson?.message || profileJson?.error || "",
      ).trim();

      const allowedProfileMessages = new Set(["PROFILE_REQUIRED", ""]);
      const profileHardError =
        !profileRes.ok && !allowedProfileMessages.has(profileMessage);

      if (profileHardError) {
        throw new Error(
          mapApiErrorMessage(
            profileMessage || `HTTP ${profileRes.status}`,
            t,
          ),
        );
      }

      const profileGateState = resolveProfileGateState(profileJson);

      if (profileJson?.owner) {
        syncIdentityFromProfile(profileJson.owner);
        setOwnerName(String(profileJson.owner.name || "").trim());
      } else {
        setOwnerName("");
        if (profileGateState === "PROFILE_REQUIRED") {
          clearOwnerIdentityStorage();
        }
      }

      if (
        profileGateState === "PROFILE_REQUIRED" ||
        profileGateState === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED"
      ) {
        setDashboardState(profileGateState);
        setServices([]);
        return;
      }

      const serviceHeaders = buildOwnerHeaders();

      const { response: servicesRes, data: servicesJson } =
        await fetchJsonWithTimeout<ServicesResponseDTO>(`${API}/owner/services`, {
          method: "GET",
          headers: serviceHeaders,
        });

      const servicesMessage = String(
        servicesJson?.message || servicesJson?.error || "",
      ).trim();

      const allowedServicesMessages = new Set([
        "PROFILE_REQUIRED",
        "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED",
        "PHONE_VERIFICATION_REQUIRED",
        "SUBSCRIPTION_REQUIRED",
        "SERVICE_SELECTION_REQUIRED",
        "",
      ]);

      const servicesHardError =
        !servicesRes.ok && !allowedServicesMessages.has(servicesMessage);

      if (servicesHardError) {
        throw new Error(
          mapApiErrorMessage(
            servicesMessage || `HTTP ${servicesRes.status}`,
            t,
          ),
        );
      }

      const nextServices = extractServices(servicesJson);
      setServices(nextServices);

      const state = resolveDashboardState(
        profileJson,
        servicesJson,
        resolvedServiceKey,
        currentPlan,
      );
      setDashboardState(state);

      const selectedStillExists = nextServices.some(
        (item) => pickServiceKey(item) === resolvedServiceKey,
      );

      if (state === "SERVICE_SELECTION_REQUIRED" && !selectedStillExists) {
        clearServiceKeyStorage();
      }
    } catch (errorValue: unknown) {
      const message =
        errorValue instanceof Error ? errorValue.message : "";
      setError(mapApiErrorMessage(message, t));
      setDashboardState("PROFILE_REQUIRED");
      setServices([]);
      setOwnerName("");
    } finally {
      setLoading(false);
    }
  }, [API, currentPlan, resolvedServiceKey, t]);

  const handleDashboardCardClick = useCallback(
    async (href: string) => {
      if (!isDashboardActive) return;

      if (resolvedServiceKey) {
        writeServiceKeyToStorage(resolvedServiceKey);
      }

      if (currentPlan) {
        writePlanToStorage(currentPlan);
      }

      await router.push(href);
    },
    [currentPlan, isDashboardActive, resolvedServiceKey, router],
  );

  useEffect(() => {
    if (!router.isReady) return;

    const fromQuery = safeServiceKey(getQueryValue(router.query.serviceKey));
    const fromStorage = getServiceKeyFromStorage();
    const resolved = fromQuery || fromStorage;

    if (!resolved) {
      setReady(true);
      const storedPlan = getPlanFromStorage();

      void router.replace(
        buildServicesUrl(
          buildDashboardPath("", storedPlan, locale),
          "",
          storedPlan,
          locale,
        ),
      );
      return;
    }

    writeServiceKeyToStorage(resolved);
    setServiceKey(resolved);
    setReady(true);
  }, [router.isReady, router.query.serviceKey, router, locale]);

  useEffect(() => {
    if (currentPlan) {
      writePlanToStorage(currentPlan);
    }
  }, [currentPlan]);

  useEffect(() => {
    if (!ready || !resolvedServiceKey) return;
    void loadDashboardGate();
  }, [ready, resolvedServiceKey, currentPlan, loadDashboardGate]);

  const renderSummaryCard = (loadingMode: boolean) => (
    <div
      style={{
        ...summaryPanelStyle,
        ...(loadingMode ? summaryPanelLoadingStyle : {}),
      }}
    >
      <div style={summaryHeaderStyle}>
        <div style={summaryLabelStyle}>
          {t("owner.dashboard.summary.activeServiceLabel")}
        </div>
        <div style={summaryTitleStyle}>
          {loadingMode
            ? t("owner.dashboard.summary.loadingStatus")
            : displayServiceName ||
              t("owner.dashboard.summary.activeServiceFallback")}
        </div>
        {!loadingMode && ownerName ? (
          <div style={summaryOwnerStyle}>
            {t("owner.dashboard.summary.ownerLabel")}: <strong>{ownerName}</strong>
          </div>
        ) : null}
      </div>

      {!loadingMode ? (
        <div style={summaryStatsGridStyle}>
          <div style={summaryStatCardStyle}>
            <div style={summaryMetaLabelStyle}>
              {t("owner.dashboard.meta.serviceCodeLabel")}
            </div>
            <div style={summaryMetaValueStyle}>{resolvedServiceKey || "—"}</div>
          </div>

          <div style={summaryStatCardStyle}>
            <div style={summaryMetaLabelStyle}>
              {t("owner.dashboard.meta.planLabel")}
            </div>
            <div style={summaryMetaValueStyle}>
              {humanizePlanValue(currentPlan, t)}
            </div>
          </div>

          <div style={summaryStatCardStyle}>
            <div style={summaryMetaLabelStyle}>
              {t("owner.dashboard.meta.accessLabel")}
            </div>
            <div
              style={{
                ...summaryMetaValueStyle,
                ...(isDashboardActive
                  ? summaryMetaValueSuccessStyle
                  : summaryMetaValueMutedStyle),
              }}
            >
              {accessStatusLabel}
            </div>
          </div>

          <div style={summaryStatCardStyle}>
            <div style={summaryMetaLabelStyle}>
              {t("owner.dashboard.summary.paidUntilLabel")}
            </div>
            <div style={summaryMetaValueStyle}>
              {selectedService?.subscription?.paidUntil
                ? formatDateTime(
                    selectedService.subscription.paidUntil,
                    formattingLocale,
                    { fallback: "—" },
                  )
                : "—"}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  if (!ready) {
    return (
      <div style={pageStyle}>
        <section style={heroSectionStyle}>
          <div style={heroInnerStyle}>
            <div style={heroGridStyle}>
              <div style={heroCopyColumnStyle}>
                <h1 style={titleStyle}>{t("owner.dashboard.hero.title")}</h1>
                <p style={subtitleStyle}>
                  {t("owner.dashboard.hero.checkingContext")}
                </p>
              </div>

              {renderSummaryCard(true)}
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!resolvedServiceKey) return null;

  return (
    <div style={pageStyle}>
      <section style={heroSectionStyle}>
        <div style={heroInnerStyle}>
          <div style={heroGridStyle}>
            <div style={heroCopyColumnStyle}>
              <h1 style={titleStyle}>{t("owner.dashboard.hero.title")}</h1>
              <p style={subtitleStyle}>
                {t("owner.dashboard.hero.subtitle")}
              </p>
            </div>

            {renderSummaryCard(false)}
          </div>
        </div>
      </section>

      <div style={shellStyle}>
        <div
          style={{
            ...gateCardStyle,
            ...(stateMeta.tone === "success"
              ? gateCardSuccessStyle
              : stateMeta.tone === "danger"
                ? gateCardDangerStyle
                : stateMeta.tone === "warning"
                  ? gateCardWarningStyle
                  : gateCardInfoStyle),
          }}
        >
          <div style={gateCardCopyStyle}>
            <div style={gateBadgeStyle}>{stateMeta.badge}</div>
            <h2 style={gateTitleStyle}>{stateMeta.title}</h2>
            <p style={gateTextStyle}>{stateMeta.description}</p>
          </div>

          <div style={gateActionWrapStyle}>
            <Link href={stateMeta.ctaHref} style={gateActionStyle}>
              {stateMeta.ctaLabel}
            </Link>
          </div>
        </div>

        {error ? (
          <div style={errorBoxStyle}>
            {t("owner.dashboard.errors.prefix")}: {error}
          </div>
        ) : null}

        <div style={gridStyle}>
          {dashboardCards.map((card) =>
            isDashboardActive ? (
              <button
                key={card.key}
                type="button"
                onClick={() => void handleDashboardCardClick(card.href)}
                style={cardButtonStyle}
              >
                <div style={cardTopRowStyle}>
                  <div style={cardIconWrapStyle}>
                    <div style={cardIconStyle}>{card.icon}</div>
                  </div>
                </div>

                <div style={cardBodyStyle}>
                  <h3 style={cardTitleStyle}>{card.title}</h3>
                  <p style={cardTextStyle}>{card.text}</p>
                </div>
              </button>
            ) : (
              <div key={card.key} style={{ ...cardStyle, ...cardLockedStyle }}>
                <div style={cardTopRowStyle}>
                  <div style={cardIconWrapStyle}>
                    <div style={cardIconStyle}>{card.icon}</div>
                  </div>

                  <div style={lockedChipStyle}>
                    {t("owner.dashboard.cards.lockedChip")}
                  </div>
                </div>

                <div style={cardBodyStyle}>
                  <h3 style={cardTitleStyle}>{card.title}</h3>
                  <p style={cardTextStyle}>
                    {card.key === "profile"
                      ? t("owner.dashboard.cards.lockedDescriptions.profile")
                      : card.key === "billing" &&
                          dashboardState === "SUBSCRIPTION_REQUIRED"
                        ? t("owner.dashboard.cards.lockedDescriptions.billing")
                        : card.key === "properties"
                          ? t(
                              "owner.dashboard.cards.lockedDescriptions.properties",
                            )
                          : t("owner.dashboard.cards.lockedDescriptions.default")}
                  </p>
                </div>
              </div>
            ),
          )}
        </div>

        <div style={noteBoxStyle}>
          {loading
            ? t("owner.dashboard.notes.loading")
            : isDashboardActive
              ? t("owner.dashboard.notes.active")
              : t("owner.dashboard.notes.locked")}
        </div>
      </div>
    </div>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100dvh",
  background: `
    radial-gradient(circle at top left, rgba(177, 209, 88, 0.16) 0%, transparent 22%),
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.10) 0%, transparent 22%),
    radial-gradient(circle at bottom left, rgba(34, 197, 94, 0.08) 0%, transparent 20%),
    linear-gradient(180deg, #eef2ea 0%, #e9eee7 52%, #e6ece4 100%)
  `,
};

const heroSectionStyle: CSSProperties = {
  width: "100%",
  borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
  background: `
    radial-gradient(circle at 12% 18%, rgba(166, 214, 94, 0.18) 0%, transparent 24%),
    radial-gradient(circle at 88% 14%, rgba(59, 130, 246, 0.16) 0%, transparent 24%),
    linear-gradient(180deg, #f2f5ef 0%, #edf2ec 100%)
  `,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28)",
};

const heroInnerStyle: CSSProperties = {
  width: "100%",
  maxWidth: "1440px",
  margin: "0 auto",
  padding:
    "clamp(14px, 3vw, 26px) clamp(16px, 3vw, 28px) clamp(18px, 4vw, 28px)",
  boxSizing: "border-box",
};

const heroGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
  gap: "clamp(14px, 2.2vw, 22px)",
  alignItems: "start",
};

const heroCopyColumnStyle: CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: 12,
  minWidth: 0,
  paddingTop: 2,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(2rem, 5vw, 3rem)",
  lineHeight: 1.04,
  fontWeight: 900,
  color: "#0f172a",
  letterSpacing: "-0.045em",
  overflowWrap: "anywhere",
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(0.97rem, 2.1vw, 1rem)",
  lineHeight: 1.8,
  color: "#475569",
  maxWidth: 860,
  minWidth: 0,
};

const summaryPanelStyle: CSSProperties = {
  minHeight: 214,
  minWidth: 0,
  borderRadius: 26,
  border: "1px solid rgba(15, 23, 42, 0.09)",
  background: `
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 24%),
    radial-gradient(circle at bottom left, rgba(163, 230, 53, 0.08), transparent 20%),
    linear-gradient(180deg, #ffffff 0%, #f5f8fb 100%)
  `,
  padding: "clamp(16px, 2.6vw, 22px)",
  boxShadow: "0 14px 28px rgba(15, 23, 42, 0.07)",
  display: "grid",
  gap: 16,
  boxSizing: "border-box",
};

const summaryPanelLoadingStyle: CSSProperties = {
  minHeight: 168,
};

const summaryHeaderStyle: CSSProperties = {
  display: "grid",
  gap: 8,
  minWidth: 0,
};

const summaryLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#334155",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};

const summaryTitleStyle: CSSProperties = {
  fontSize: "clamp(1.5rem, 3.4vw, 2rem)",
  fontWeight: 900,
  color: "#0f172a",
  letterSpacing: "-0.03em",
  lineHeight: 1.12,
  minWidth: 0,
  overflowWrap: "anywhere",
};

const summaryOwnerStyle: CSSProperties = {
  fontSize: 15,
  color: "#1e293b",
  lineHeight: 1.65,
  minWidth: 0,
  overflowWrap: "anywhere",
};

const summaryStatsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 148px), 1fr))",
  gap: 12,
  minWidth: 0,
};

const summaryStatCardStyle: CSSProperties = {
  borderRadius: 18,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background: "rgba(255,255,255,0.78)",
  padding: "14px 14px 13px",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)",
  display: "grid",
  gap: 7,
  minWidth: 0,
  boxSizing: "border-box",
};

const summaryMetaLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: "#64748b",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};

const summaryMetaValueStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
  color: "#0f172a",
  minWidth: 0,
  wordBreak: "break-word",
  overflowWrap: "anywhere",
  lineHeight: 1.5,
};

const summaryMetaValueSuccessStyle: CSSProperties = {
  color: "#15803d",
};

const summaryMetaValueMutedStyle: CSSProperties = {
  color: "#b45309",
};

const shellStyle: CSSProperties = {
  width: "100%",
  maxWidth: "1440px",
  margin: "0 auto",
  padding:
    "clamp(14px, 2.8vw, 24px) clamp(16px, 3vw, 28px) clamp(36px, 6vw, 52px)",
  display: "grid",
  gap: 18,
  boxSizing: "border-box",
};

const gateCardStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
  padding: "clamp(18px, 2.8vw, 24px)",
  borderRadius: 24,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  boxShadow: "0 12px 26px rgba(15, 23, 42, 0.05)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.96) 100%)",
  boxSizing: "border-box",
};

const gateCardInfoStyle: CSSProperties = {
  background: "linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%)",
  borderColor: "rgba(59, 130, 246, 0.24)",
};

const gateCardWarningStyle: CSSProperties = {
  background: "linear-gradient(180deg, #fffdf7 0%, #fff6e8 100%)",
  borderColor: "rgba(245, 158, 11, 0.28)",
};

const gateCardDangerStyle: CSSProperties = {
  background: "linear-gradient(180deg, #fffafa 0%, #fef1f1 100%)",
  borderColor: "rgba(239, 68, 68, 0.24)",
};

const gateCardSuccessStyle: CSSProperties = {
  background: "linear-gradient(180deg, #f8fff9 0%, #edfdf2 100%)",
  borderColor: "rgba(34, 197, 94, 0.24)",
};

const gateCardCopyStyle: CSSProperties = {
  flex: "1 1 420px",
  minWidth: 0,
};

const gateBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "fit-content",
  maxWidth: "100%",
  padding: "7px 11px",
  borderRadius: 999,
  background: "#0f172a",
  color: "#ffffff",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.02em",
  lineHeight: 1.3,
  overflowWrap: "anywhere",
  boxSizing: "border-box",
};

const gateTitleStyle: CSSProperties = {
  margin: "12px 0 0 0",
  fontSize: "clamp(1.35rem, 3vw, 1.75rem)",
  fontWeight: 900,
  color: "#0f172a",
  lineHeight: 1.2,
  letterSpacing: "-0.02em",
  minWidth: 0,
  overflowWrap: "anywhere",
};

const gateTextStyle: CSSProperties = {
  margin: "10px 0 0 0",
  fontSize: 14,
  lineHeight: 1.8,
  color: "#475569",
  minWidth: 0,
};

const gateActionWrapStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  alignItems: "stretch",
  justifyContent: "flex-start",
  maxWidth: "100%",
  minWidth: 0,
};

const gateActionStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 52,
  maxWidth: "100%",
  padding: "0 18px",
  borderRadius: 16,
  background: "#0f172a",
  color: "#ffffff",
  border: "1px solid #0f172a",
  fontWeight: 800,
  textDecoration: "none",
  textAlign: "center",
  lineHeight: 1.3,
  boxShadow: "0 10px 20px rgba(15, 23, 42, 0.14)",
  transition: "transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease",
  boxSizing: "border-box",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
  gap: 16,
  alignItems: "stretch",
};

const cardStyle: CSSProperties = {
  display: "grid",
  gap: 16,
  alignContent: "start",
  minHeight: 100,
  padding: "clamp(18px, 2.4vw, 24px)",
  borderRadius: 24,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  textDecoration: "none",
  color: "inherit",
  background: `
    radial-gradient(circle at top right, rgba(163, 230, 53, 0.10), transparent 22%),
    radial-gradient(circle at bottom left, rgba(37, 99, 235, 0.08), transparent 24%),
    linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)
  `,
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
  position: "relative",
  transition: "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
  minWidth: 0,
  boxSizing: "border-box",
};

const cardButtonStyle: CSSProperties = {
  ...cardStyle,
  width: "100%",
  textAlign: "left",
  cursor: "pointer",
  appearance: "none",
  font: "inherit",
};

const cardLockedStyle: CSSProperties = {
  opacity: 0.8,
  filter: "grayscale(0.08)",
  cursor: "not-allowed",
};

const cardTopRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  minWidth: 0,
  flexWrap: "wrap",
};

const cardBodyStyle: CSSProperties = {
  display: "grid",
  gap: 8,
  minWidth: 0,
};

const lockedChipStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 30,
  maxWidth: "100%",
  padding: "0 10px",
  borderRadius: 999,
  background: "#0f172a",
  color: "#ffffff",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.25,
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.14)",
  overflowWrap: "anywhere",
  boxSizing: "border-box",
};

const cardIconWrapStyle: CSSProperties = {
  width: 54,
  height: 54,
  flex: "0 0 auto",
  borderRadius: 16,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "linear-gradient(180deg, rgba(15,23,42,0.96) 0%, rgba(30,41,59,0.96) 100%)",
  boxShadow: "0 12px 22px rgba(15, 23, 42, 0.16)",
};

const cardIconStyle: CSSProperties = {
  fontSize: 24,
  lineHeight: 1,
  filter: "saturate(0.9)",
};

const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(1.06rem, 2.6vw, 1.25rem)",
  fontWeight: 900,
  color: "#0f172a",
  letterSpacing: "-0.02em",
  lineHeight: 1.28,
  minWidth: 0,
  overflowWrap: "anywhere",
};

const cardTextStyle: CSSProperties = {
  margin: 0,
  color: "#475569",
  fontSize: 14,
  lineHeight: 1.75,
  minWidth: 0,
  overflowWrap: "anywhere",
};

const noteBoxStyle: CSSProperties = {
  padding: "clamp(16px, 2.4vw, 20px)",
  borderRadius: 20,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background: `
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.10), transparent 22%),
    radial-gradient(circle at top left, rgba(163, 230, 53, 0.10), transparent 24%),
    linear-gradient(180deg, #ffffff 0%, #f5f9f3 100%)
  `,
  color: "#475569",
  fontSize: 14,
  lineHeight: 1.85,
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
  boxSizing: "border-box",
};

const errorBoxStyle: CSSProperties = {
  padding: "14px 16px",
  border: "1px solid rgba(239, 68, 68, 0.24)",
  background: "linear-gradient(180deg, #fffafa 0%, #fef2f2 100%)",
  color: "#991b1b",
  borderRadius: 16,
  fontWeight: 700,
  lineHeight: 1.65,
  boxShadow: "0 8px 20px rgba(127, 29, 29, 0.05)",
  boxSizing: "border-box",
  overflowWrap: "anywhere",
};