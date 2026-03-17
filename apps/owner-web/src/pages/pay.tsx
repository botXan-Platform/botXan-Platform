import type { CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDateTime, type FormattingLocale } from "i18n-core";

function apiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    "http://127.0.0.1:3001"
  ).trim();
}

type AppLocale = "az";

const PAGE_LOCALE: AppLocale = "az";
const PAGE_DIRECTION: CSSProperties["direction"] = "ltr";
const PAGE_FORMATTING_LOCALE = "az-AZ" as FormattingLocale;

const REQUEST_TIMEOUT_MS = 15000;
const REQUEST_TIMEOUT_ERROR = "__REQUEST_TIMEOUT__";

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

const PLAN_STORAGE_KEYS = [
  "ownerPlanType",
  "selectedPlanType",
  "billingPlan",
  "selectedPlan",
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

type PlanType = "STANDARD" | "PLUS";
type ApiSubscriptionTier = "STANDARD" | "PREMIUM";
type BillingCycle = "MONTHLY" | "YEARLY";
type CheckoutProvider = "stripe" | "mock";
type BillingState =
  | "PROFILE_REQUIRED"
  | "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED"
  | "SERVICE_SELECTION_REQUIRED"
  | "SUBSCRIPTION_REQUIRED"
  | "ACTIVE";

type VerificationDTO = {
  phoneVerified?: boolean;
  phoneVerifiedAt?: string | null;
  phoneVerificationStatus?: string | null;
};

type OwnerDTO = {
  id?: string | null;
  phone?: string | null;
  name?: string | null;
  email?: string | null;
};

type ServicePricing = {
  standardMonthlyPrice?: number | null;
  standardYearlyPrice?: number | null;
  premiumMonthlyPrice?: number | null;
  premiumYearlyPrice?: number | null;
  plusMonthlyPrice?: number | null;
  plusYearlyPrice?: number | null;
  legacyPrice?: number | null;
};

type BillingStatusDTO = {
  ok?: boolean;
  state?: BillingState | string | null;
  owner?: OwnerDTO | null;
  ownerPhone?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  verification?: VerificationDTO | null;
  service?: {
    key?: string | null;
    currency?: string | null;
    isActive?: boolean | null;
    legacy?: {
      price?: number | null;
      periodDays?: number | null;
    } | null;
    pricing?: ServicePricing | null;
    diagnostics?: {
      standardConfigured?: boolean | null;
      plusConfigured?: boolean | null;
    } | null;
  } | null;
  subscription?: {
    status?: string | null;
    tier?: ApiSubscriptionTier | null;
    billingCycle?: BillingCycle | null;
    paidUntil?: string | null;
    isActive?: boolean | null;
    daysLeft?: number | null;
    plan?: PlanType | string | null;
  } | null;
  lastInvoice?: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    provider: string;
    providerRef?: string | null;
    paidAt: string | null;
    subscriptionTier: ApiSubscriptionTier;
    billingCycle: BillingCycle;
    plan?: PlanType;
    receiptNumber?: string;
  } | null;
  error?: string | null;
  message?: string | null;
};

type BillingErrorPayload = {
  error?: string | null;
  message?: string | null;
  subscription?: {
    paidUntil?: string | null;
  } | null;
};

type BillingRenewDTO = {
  ok?: boolean;
  checkoutUrl?: string | null;
  error?: string | null;
  message?: string | null;
  subscription?: {
    paidUntil?: string | null;
  } | null;
};

type FetchJsonResult<T> = {
  response: Response;
  data: T;
};

const PAGE_COPY = {
  pageBadge: "Ödəniş",
  pageTitle: "Ödəniş üsulunu seçin",
  loading: "Yüklənir...",
  pageSubtitle:
    "botXan ödəniş səhifəsi checkout-u yalnız backend abunəlik qapısı açıq olanda başladır. Profil və telefon təsdiqi tamamlanmadan ödəniş başlanmasına icazə verilmir.",
  serviceLabel: "Xidmət",
  planLabel: "Plan",
  phoneLabel: "Telefon",
  verificationLabel: "Telefon təsdiqi",
  verificationStatusLabel: "Təsdiq statusu",
  paidUntilLabel: "Bitmə vaxtı",
  errorTitle: "Xəta",
  selectedSubscriptionTitle: "Seçilmiş abunəlik",
  selectedChoiceLabel: "Aktiv seçim",
  planPriceInactive: "Bu plan üçün qiymət hazırda aktiv deyil.",
  providersTitle: "Aktiv provider-lər",
  refreshStatus: "Statusu yenilə",
  refreshingStatus: "Yoxlanılır...",
  billingBack: "Abunəlik səhifəsinə qayıt",
  changePlanAndService: "Planı və xidməti dəyiş",
  goToProfile: "Profilə keç",
  dashboardBack: "İdarəetmə panelinə qayıt",
  dashboardLocked: "İdarəetmə paneli bağlıdır",
  stripeDescription:
    "Seçilmiş xidmət və plan üçün kart ödənişi checkout səhifəsinə yönləndirir.",
  stripeAction: "Stripe ilə ödə",
  stripeRedirecting: "Yönləndirilir...",
  mockTitle: "Mock payment",
  mockDescription:
    "Test axını üçün seçilmiş xidmət və planla mock checkout səhifəsinə yönləndirir.",
  mockAction: "Mock (test) ilə ödə",
  mockRedirecting: "Yönləndirilir...",
  portmanatTitle: "Portmanat",
  cryptoTitle: "Kripto",
  comingSoon: "Yaxın vaxtda",
  phoneVerified: "Təsdiqlənib",
  phoneNotVerified: "Təsdiqlənməyib",
  verificationRequiredText: "Tələb olunur",
  verificationSentText: "Göndərilib",
  verificationVerifiedText: "Təsdiqlənib",
  verificationExpiredText: "Vaxtı bitib",
  verificationFailedText: "Uğursuz",
  activeMonthlySuffix: "aylıq",
  plusPricingInactiveWarning:
    "Plus plan backend tərəfindən tanınır, amma bu xidmət üçün qiymət konfiqurasiya edilməyib.",
  standardPricingInactiveWarning:
    "Standart plan qiyməti aktiv deyil. Xidmət qiymətləndirmə sahələrini yoxlamaq lazımdır.",
  premiumMonthlyPriceField: "premiumMonthlyPrice",
  plusMonthlyPriceField: "plusMonthlyPrice",
  gateVerificationBadge: "Telefon təsdiqi tələb olunur",
  gateVerificationTitle: "Ödəniş bağlıdır",
  gateVerificationDescription:
    "Telefon OTP ilə təsdiqlənmədən checkout başlatmaq olmaz. Əvvəlcə profil mərhələsində təsdiqi tamamlayın.",
  gateServiceBadge: "Xidmət seçimi tələb olunur",
  gateServiceTitle: "Ödəniş mərhələsinə tez gəlinib",
  gateServiceDescription:
    "Profil və telefon təsdiqi tamamdır, lakin xidmət və plan seçimi mərhələsi tamamlanmayıb. Əvvəlcə xidmətlər səhifəsinə qayıdın.",
  gateCheckoutBadge: "Checkout açıqdır",
  gateCheckoutTitle: "Ödənişə keçmək olar",
  gateCheckoutDescription:
    "Profil və telefon təsdiqi tamamdır. İndi bu xidmət üçün seçilmiş planla checkout başlada bilərsiniz.",
  gateActiveBadge: "Aktivdir",
  gateActiveTitle: "Abunəlik artıq aktivdir",
  gateActiveDescription:
    "Bu xidmət üçün seçilmiş plan üzrə aktiv və bitmə tarixi gələcəkdə olan abunəlik mövcuddur. Aktiv müddət bitmədən eyni plan üçün yeni checkout başlatmaq olmur.",
  gateProfileBadge: "Profil tələb olunur",
  gateProfileTitle: "Sahibkar qeydiyyatı tamamlanmayıb",
  gateProfileDescription:
    "Ödəniş axını sahibkar profili və telefon təsdiqi tamamlanmadan açılmır.",
  planChangeBadge: "Plan dəyişikliyi",
  planChangeTitle: "Plan yenilənməsi üçün ödəniş tələb olunur",
  planChangeDescriptionPrefix: "Hazırda sizin",
  planChangeDescriptionMiddle: "planı üzrə aktiv abunəliyiniz var. Davam etsəniz",
  planChangeDescriptionSuffix:
    "planı üçün yeni ödəniş yaradılacaq, əvvəlki aktiv plan ləğv ediləcək və yeni 30 günlük abunəlik aktivləşəcək.",
  planChangeInfoPrefix: "Hazırda aktiv planınız",
  planChangeInfoMiddle: "planıdır. Seçilmiş",
  planChangeInfoSuffix:
    "planı üçün ödəniş etdikdən sonra əvvəlki plan ləğv olunacaq və yeni 30 günlük abunəlik aktiv olacaq.",
  serviceNotSelected: "Xidmət seçilməyib.",
  profileRequired: "Əvvəlcə sahibkar profilini tamamlayın.",
  phoneVerificationRequired:
    "Telefon OTP təsdiqi tamamlanmadan checkout başlatmaq olmaz.",
  serviceSelectionRequired:
    "Əvvəlcə xidmətlər səhifəsində xidmət və plan seçimini tamamlayın.",
  stageNotAllowed: "Bu mərhələdə checkout açıla bilməz.",
  verifiedPhoneMissing:
    "Təsdiqlənmiş sahibkar telefonu tapılmadı. Abunəlik səhifəsinə qayıdın.",
  plusPriceInactive: "Bu xidmət üçün Plus plan qiyməti aktiv deyil.",
  standardPriceInactive: "Bu xidmət üçün Standart plan qiyməti aktiv deyil.",
  redirectUrlError: "Yönləndirmə ünvanı yaradıla bilmədi. Səhifəni yeniləyin.",
  statusLoadTimeout: "Sorğu vaxt aşımına düşdü. Backend cavab vermədi.",
  checkoutTimeout: "Sorğu vaxt aşımına düşdü. Backend cavab vermədi.",
  statusLoadFailed: "Status yüklənmədi",
  ownerProfileRequiredError: "Əvvəlcə sahibkar profilini tamamlayın.",
  phoneOtpRequiredError: "Telefon OTP təsdiqi tamamlanmayıb.",
  servicesStepRequiredError: "Əvvəlcə xidmətlər mərhələsini tamamlayın.",
  ownerNotFoundError:
    "Sahibkar tapılmadı. Profil və abunəlik mərhələsinə qayıdın.",
  serviceNotFoundError:
    "Xidmət tapılmadı və ya aktiv deyil. Xidmətlər səhifəsinə qayıdın.",
  plusPricingNotConfiguredError:
    "Bu xidmət üçün Plus plan qiyməti aktiv edilməyib.",
  standardPricingNotConfiguredError:
    "Bu xidmət üçün Standart plan qiyməti aktiv edilməyib.",
  pricingInactiveError: "Bu plan üçün qiymət aktiv edilməyib.",
  subscriptionAlreadyActiveErrorPrefix: "Statusunuz aktivdir. Abunəlik ",
  subscriptionAlreadyActiveErrorNoDate:
    "Statusunuz aktivdir. Eyni plan üzrə aktiv abunəlik bitmədən yenidən ödəniş etmək mümkün deyil.",
  checkoutNotCreatedError:
    "Checkout yaradıla bilmədi. Bir qədər sonra yenidən cəhd edin.",
  internalError: "Server xətası baş verdi. Bir qədər sonra yenidən cəhd edin.",
  paymentInitErrorPrefix: "Ödəniş başladılmadı",
  unknownValue: "-",
  planStandard: "Standart",
  planPlus: "Plus",
  planStandardDescription:
    "Standart plan seçilib. Elanlar əsas sıralama məntiqi ilə göstəriləcək.",
  planPlusDescription:
    "Plus plan seçilib. Eyni kateqoriya və eyni filtrlər daxilində elanlar standart planlardan əvvəl göstəriləcək.",
  serviceFallback: "Xidmət",
  serviceRentHome: "Ev kirayəsi",
  serviceBarber: "Bərbər xidməti",
  serviceCarRental: "Avtomobil icarəsi",
  serviceHotel: "Otel xidməti",
  serviceBeautySalon: "Gözəllik salonu",
  serviceBabysitter: "Uşaq baxıcısı xidməti",
  serviceCleaning: "Təmizlik xidmətləri",
  serviceTechnicalServices: "Texniki xidmətlər",
} as const;

type UiText = typeof PAGE_COPY;

function normalizeQueryValue(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return (v[0] || "").trim();
  return (v || "").trim();
}

function digitsOnly(input: string): string {
  return String(input || "").replace(/[^\d]/g, "");
}

function safeServiceKey(v: unknown): string {
  const s = String(v ?? "").trim().toUpperCase();
  if (!s) return "";
  if (!/^[A-Z0-9_-]{2,64}$/.test(s)) return "";
  return s;
}

function isValidE164(v: string): boolean {
  const s = String(v || "").trim();
  return /^\+[1-9]\d{7,14}$/.test(s);
}

function normalizePhoneCandidate(input: string): string {
  const raw = String(input || "").trim();
  if (!raw) return "";

  if (raw.startsWith("+")) {
    const normalized = `+${digitsOnly(raw)}`;
    return isValidE164(normalized) ? normalized : "";
  }

  const digits = digitsOnly(raw);
  if (!digits) return "";

  const normalized = `+${digits}`;
  return isValidE164(normalized) ? normalized : "";
}

function normalizePlanValue(input: unknown): PlanType | "" {
  const value = String(input ?? "").trim().toUpperCase();

  if (!value) return "";
  if (value === "STANDARD" || value === "STANDART") return "STANDARD";
  if (value === "PLUS" || value === "PREMIUM") return "PLUS";

  return "";
}

function normalizeAsciiHeaderValue(value: unknown): string {
  const raw = String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim();

  if (!raw) return "";

  let out = "";
  for (const ch of raw) {
    const code = ch.charCodeAt(0);
    if (code >= 0x20 && code <= 0x7e) out += ch;
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
  const sanitized = normalizeAsciiHeaderValue(String(value ?? "").toLowerCase());
  if (!sanitized) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) return "";
  return sanitized;
}

function sanitizeHeadersRecord(
  input: Record<string, string>,
): Record<string, string> {
  const output: Record<string, string> = {};

  for (const [key, value] of Object.entries(input)) {
    const sanitizedValue = normalizeAsciiHeaderValue(value);
    if (sanitizedValue) output[key] = sanitizedValue;
  }

  return output;
}

function mapPlanToApiTier(plan: PlanType): ApiSubscriptionTier {
  return plan === "PLUS" ? "PREMIUM" : "STANDARD";
}

function mapApiTierToPlan(
  tier: ApiSubscriptionTier | string | null | undefined,
): PlanType | "" {
  return normalizePlanValue(tier);
}

function readFirstStorageValue(keys: readonly string[]): string {
  if (typeof window === "undefined") return "";

  for (const key of keys) {
    const value = String(window.localStorage.getItem(key) || "").trim();
    if (value) return value;
  }

  return "";
}

function writeStorageValueToKeys(keys: readonly string[], value: string): void {
  if (typeof window === "undefined") return;

  const normalized = String(value || "").trim();
  if (!normalized) return;

  for (const key of keys) {
    window.localStorage.setItem(key, normalized);
  }
}

function removeStorageKeys(keys: readonly string[]): void {
  if (typeof window === "undefined") return;

  for (const key of keys) {
    window.localStorage.removeItem(key);
  }
}

function readServiceKeyFromStorage(): string {
  return safeServiceKey(readFirstStorageValue(SERVICE_STORAGE_KEYS));
}

function readPhoneFromStorage(): string {
  return normalizePhoneCandidate(readFirstStorageValue(PHONE_STORAGE_KEYS));
}

function readPlanFromStorage(): PlanType | "" {
  return normalizePlanValue(readFirstStorageValue(PLAN_STORAGE_KEYS));
}

function readOwnerIdFromStorage(): string {
  return normalizeOwnerIdForStorage(readFirstStorageValue(OWNER_ID_STORAGE_KEYS));
}

function readOwnerEmailFromStorage(): string {
  return normalizeEmailForStorage(readFirstStorageValue(OWNER_EMAIL_STORAGE_KEYS));
}

function writePhoneToStorage(phone: string): void {
  const normalized = normalizePhoneCandidate(phone);
  if (!normalized) return;
  writeStorageValueToKeys(PHONE_STORAGE_KEYS, normalized);
}

function writeServiceKeyToStorage(serviceKey: string): void {
  const safe = safeServiceKey(serviceKey);
  if (!safe) return;
  writeStorageValueToKeys(SERVICE_STORAGE_KEYS, safe);
}

function clearServiceKeyStorage(): void {
  removeStorageKeys(SERVICE_STORAGE_KEYS);
}

function writePlanToStorage(plan: PlanType): void {
  writeStorageValueToKeys(PLAN_STORAGE_KEYS, plan);
}

function writeOwnerIdToStorage(ownerId: string): void {
  const safe = normalizeOwnerIdForStorage(ownerId);
  if (!safe) return;
  writeStorageValueToKeys(OWNER_ID_STORAGE_KEYS, safe);
}

function writeOwnerEmailToStorage(email: string): void {
  const safe = normalizeEmailForStorage(email);
  if (!safe) return;
  writeStorageValueToKeys(OWNER_EMAIL_STORAGE_KEYS, safe);
}

function buildOwnerHeaders(): Record<string, string> {
  const ownerId = readOwnerIdFromStorage();
  const ownerPhone = readPhoneFromStorage();
  const ownerEmail = readOwnerEmailFromStorage();

  return sanitizeHeadersRecord({
    ...(ownerId ? { "x-owner-id": ownerId } : {}),
    ...(ownerPhone ? { "x-owner-phone": ownerPhone } : {}),
    ...(ownerEmail ? { "x-owner-email": ownerEmail } : {}),
  });
}

function syncOwnerIdentity(owner: OwnerDTO | null | undefined): void {
  if (!owner) return;

  if (owner.id) writeOwnerIdToStorage(String(owner.id).trim());
  if (owner.email) writeOwnerEmailToStorage(String(owner.email).trim());
  if (owner.phone) writePhoneToStorage(String(owner.phone).trim());
}

function syncBillingIdentity(data: BillingStatusDTO | null | undefined): void {
  if (!data) return;

  syncOwnerIdentity(data.owner || null);

  if (data.ownerEmail) writeOwnerEmailToStorage(String(data.ownerEmail).trim());
  if (data.ownerPhone) writePhoneToStorage(String(data.ownerPhone).trim());
}

function formatSharedDateTime(
  value: string | null | undefined,
  formattingLocale: FormattingLocale,
  fallback: string,
): string {
  return formatDateTime(value, formattingLocale, { fallback });
}

function formatPaidUntil(
  value: string | null | undefined,
  formattingLocale: FormattingLocale,
  text: UiText,
): string {
  return formatSharedDateTime(value, formattingLocale, text.unknownValue);
}

function formatDisplayNumber(
  value: number,
  formattingLocale: FormattingLocale,
  options?: Intl.NumberFormatOptions,
): string {
  if (!Number.isFinite(value)) return PAGE_COPY.unknownValue;

  try {
    return new Intl.NumberFormat(formattingLocale, options).format(value);
  } catch {
    return String(value);
  }
}

function formatPriceValue(
  value: number,
  formattingLocale: FormattingLocale,
): string {
  return formatDisplayNumber(value, formattingLocale, {
    maximumFractionDigits: 2,
  });
}

function humanizeServiceKey(serviceKey: string, text: UiText): string {
  const map: Record<string, string> = {
    RENT_HOME: text.serviceRentHome,
    BARBER: text.serviceBarber,
    CAR_RENTAL: text.serviceCarRental,
    HOTEL: text.serviceHotel,
    BEAUTY_SALON: text.serviceBeautySalon,
    BABYSITTER: text.serviceBabysitter,
    CLEANING: text.serviceCleaning,
    TECHNICAL_SERVICES: text.serviceTechnicalServices,
  };

  const safe = safeServiceKey(serviceKey);
  if (!safe) return text.serviceFallback;
  if (map[safe]) return map[safe];

  return safe
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function normalizeBackendError(raw: string): string {
  const value = String(raw || "").trim();
  if (!value) return "";
  return value.toUpperCase();
}

function planLabel(plan: PlanType, text: UiText): string {
  return plan === "PLUS" ? text.planPlus : text.planStandard;
}

function buildPlanChangeMessage(
  text: UiText,
  activePlan: PlanType,
  selectedPlan: PlanType,
): string {
  return `${text.planChangeInfoPrefix} ${planLabel(activePlan, text)} ${text.planChangeInfoMiddle} ${planLabel(selectedPlan, text)} ${text.planChangeInfoSuffix}`;
}

function buildActiveSubscriptionMessage(
  paidUntil: string | null | undefined,
  formattingLocale: FormattingLocale,
  text: UiText,
): string {
  const formatted = formatPaidUntil(paidUntil, formattingLocale, text);
  return formatted && formatted !== text.unknownValue
    ? `${text.subscriptionAlreadyActiveErrorPrefix}${formatted}.`
    : text.subscriptionAlreadyActiveErrorNoDate;
}

function getVerificationStatusLabel(
  value: string | null | undefined,
  text: UiText,
): string {
  const normalized = String(value || "").trim().toUpperCase();

  if (normalized === "VERIFIED") return text.verificationVerifiedText;
  if (normalized === "SENT") return text.verificationSentText;
  if (normalized === "EXPIRED") return text.verificationExpiredText;
  if (normalized === "FAILED") return text.verificationFailedText;
  if (normalized === "REQUIRED") return text.verificationRequiredText;

  return text.unknownValue;
}

function extractErrorMessage(
  data: BillingErrorPayload | null | undefined,
  status: number,
  formattingLocale: FormattingLocale,
  text: UiText,
): string {
  const raw = String(data?.message || data?.error || "").trim();
  const normalized = normalizeBackendError(raw);

  if (normalized === "PROFILE_REQUIRED" || normalized === "OWNER_PROFILE_REQUIRED") {
    return text.ownerProfileRequiredError;
  }

  if (
    normalized === "PHONE_VERIFICATION_REQUIRED" ||
    normalized === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED"
  ) {
    return text.phoneOtpRequiredError;
  }

  if (normalized === "SERVICE_SELECTION_REQUIRED") {
    return text.servicesStepRequiredError;
  }

  if (raw === "owner not found") {
    return text.ownerNotFoundError;
  }

  if (raw === "service not found" || raw === "service not found or inactive") {
    return text.serviceNotFoundError;
  }

  if (normalized === "SERVICE_PLUS_PRICING_NOT_CONFIGURED") {
    return text.plusPricingNotConfiguredError;
  }

  if (normalized === "SERVICE_STANDARD_PRICING_NOT_CONFIGURED") {
    return text.standardPricingNotConfiguredError;
  }

  if (raw === "service pricing not configured") {
    return text.pricingInactiveError;
  }

  if (normalized === "SUBSCRIPTION_ALREADY_ACTIVE") {
    return buildActiveSubscriptionMessage(
      data?.subscription?.paidUntil,
      formattingLocale,
      text,
    );
  }

  if (raw === "checkout_not_created") {
    return text.checkoutNotCreatedError;
  }

  if (normalized === "INTERNAL_ERROR") {
    return text.internalError;
  }

  if (raw) return raw;
  return `${text.paymentInitErrorPrefix} (HTTP ${status})`;
}

function buildHref(
  pathname: string,
  params: Record<string, string | undefined>,
): string {
  const searchParams = new URLSearchParams();
  searchParams.set("lang", PAGE_LOCALE);

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.trim()) {
      searchParams.set(key, value);
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

function buildBillingUrl(
  serviceKey: string,
  phoneE164: string,
  plan: PlanType,
): string {
  return buildHref("/billing", {
    serviceKey: serviceKey || undefined,
    phone: phoneE164 || undefined,
    plan,
  });
}

function buildServicesUrl(
  serviceKey: string,
  phoneE164: string,
  plan: PlanType,
): string {
  const next = buildBillingUrl(serviceKey, phoneE164, plan);

  return buildHref("/services", {
    next,
    serviceKey: serviceKey || undefined,
    plan,
  });
}

function buildProfileUrl(
  serviceKey: string,
  plan: PlanType,
): string {
  const next = buildHref("/billing", {
    serviceKey: serviceKey || undefined,
    plan,
  });

  return buildHref("/profile", {
    next,
    serviceKey: serviceKey || undefined,
    plan,
  });
}

function buildDashboardUrl(
  serviceKey: string,
  plan: PlanType,
): string {
  return buildHref("/dashboard", {
    serviceKey: serviceKey || undefined,
    plan,
  });
}

function normalizeSafeRelativePath(value: string): string {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  if (!normalized.startsWith("/")) return "";
  if (normalized.startsWith("//")) return "";
  return normalized;
}

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function withPageLocaleOnRelativeUrl(urlValue: string): string {
  const trimmed = String(urlValue || "").trim();
  if (!trimmed || isAbsoluteUrl(trimmed) || typeof window === "undefined") {
    return trimmed;
  }

  try {
    const url = new URL(trimmed, window.location.origin);
    url.searchParams.set("lang", PAGE_LOCALE);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return trimmed;
  }
}

function planDescription(plan: PlanType, text: UiText): string {
  return plan === "PLUS" ? text.planPlusDescription : text.planStandardDescription;
}

function normalizeBillingState(input: unknown): BillingState {
  const value = String(input || "").trim().toUpperCase();

  if (
    value === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED" ||
    value === "PHONE_VERIFICATION_REQUIRED"
  ) {
    return "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED";
  }
  if (value === "SERVICE_SELECTION_REQUIRED") {
    return "SERVICE_SELECTION_REQUIRED";
  }
  if (value === "SUBSCRIPTION_REQUIRED") {
    return "SUBSCRIPTION_REQUIRED";
  }
  if (value === "ACTIVE") {
    return "ACTIVE";
  }

  return "PROFILE_REQUIRED";
}

function isSubscriptionStillActive(paidUntil: string | null | undefined): boolean {
  const raw = String(paidUntil || "").trim();
  if (!raw) return false;

  const dt = new Date(raw);
  return !Number.isNaN(dt.getTime()) && dt.getTime() > Date.now();
}

function resolveStatusSubscriptionPlan(data: BillingStatusDTO | null): PlanType | "" {
  return (
    normalizePlanValue(data?.subscription?.plan) ||
    mapApiTierToPlan(data?.subscription?.tier)
  );
}

function hasAnyActiveSubscription(data: BillingStatusDTO | null): boolean {
  if (!data?.subscription) return false;

  const status = String(data.subscription.status || "").trim().toUpperCase();
  if (isSubscriptionStillActive(data.subscription.paidUntil)) return true;
  if (data.subscription.isActive) return true;
  if (status === "ACTIVE") return true;

  return false;
}

function hasActiveSubscriptionForPlan(
  data: BillingStatusDTO | null,
  selectedPlan: PlanType,
): boolean {
  if (!data?.subscription) return false;

  const activePlan = resolveStatusSubscriptionPlan(data);
  if (!activePlan) return false;
  if (activePlan !== selectedPlan) return false;

  return hasAnyActiveSubscription(data);
}

function requiresPlanChange(
  data: BillingStatusDTO | null,
  selectedPlan: PlanType,
): boolean {
  if (!hasAnyActiveSubscription(data)) return false;

  const activePlan = resolveStatusSubscriptionPlan(data);
  if (!activePlan) return false;

  return activePlan !== selectedPlan;
}

function resolveBillingState(
  data: BillingStatusDTO | null,
  selectedPlan: PlanType,
): BillingState {
  const explicit = normalizeBillingState(data?.state);

  if (explicit === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED") {
    return "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED";
  }

  if (explicit === "SERVICE_SELECTION_REQUIRED") {
    return "SERVICE_SELECTION_REQUIRED";
  }

  if (data?.verification && data.verification.phoneVerified === false) {
    return "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED";
  }

  if (!data?.owner) {
    return "PROFILE_REQUIRED";
  }

  if (!data?.service?.key) {
    return "SERVICE_SELECTION_REQUIRED";
  }

  if (hasActiveSubscriptionForPlan(data, selectedPlan)) {
    return "ACTIVE";
  }

  return "SUBSCRIPTION_REQUIRED";
}

function normalizePrice(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function getSelectedPlanPrice(
  service: BillingStatusDTO["service"],
  plan: PlanType,
): number | null {
  if (!service) return null;

  const pricing = service.pricing;

  if (plan === "PLUS") {
    return (
      normalizePrice(pricing?.plusMonthlyPrice) ??
      normalizePrice(pricing?.premiumMonthlyPrice)
    );
  }

  return (
    normalizePrice(pricing?.standardMonthlyPrice) ??
    normalizePrice(service.legacy?.price) ??
    normalizePrice(pricing?.legacyPrice)
  );
}

function getStateMeta(
  state: BillingState,
  text: UiText,
  options?: {
    requiresPlanChange?: boolean;
    activePlan?: PlanType | "";
    selectedPlan?: PlanType;
  },
) {
  if (
    options?.requiresPlanChange &&
    options.activePlan &&
    options.selectedPlan
  ) {
    return {
      badge: text.planChangeBadge,
      title: text.planChangeTitle,
      description: `${text.planChangeDescriptionPrefix} ${planLabel(options.activePlan, text)} ${text.planChangeDescriptionMiddle} ${planLabel(options.selectedPlan, text)} ${text.planChangeDescriptionSuffix}`,
      tone: "warning" as const,
    };
  }

  if (state === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED") {
    return {
      badge: text.gateVerificationBadge,
      title: text.gateVerificationTitle,
      description: text.gateVerificationDescription,
      tone: "warning" as const,
    };
  }

  if (state === "SERVICE_SELECTION_REQUIRED") {
    return {
      badge: text.gateServiceBadge,
      title: text.gateServiceTitle,
      description: text.gateServiceDescription,
      tone: "info" as const,
    };
  }

  if (state === "SUBSCRIPTION_REQUIRED") {
    return {
      badge: text.gateCheckoutBadge,
      title: text.gateCheckoutTitle,
      description: text.gateCheckoutDescription,
      tone: "success" as const,
    };
  }

  if (state === "ACTIVE") {
    return {
      badge: text.gateActiveBadge,
      title: text.gateActiveTitle,
      description: text.gateActiveDescription,
      tone: "success" as const,
    };
  }

  return {
    badge: text.gateProfileBadge,
    title: text.gateProfileTitle,
    description: text.gateProfileDescription,
    tone: "info" as const,
  };
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

async function fetchJsonWithTimeout<T = Record<string, unknown>>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<FetchJsonResult<T>> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    const data = (await response.json().catch(() => ({}))) as T;
    return { response, data };
  } catch (error: unknown) {
    if (isAbortError(error)) {
      throw new Error(REQUEST_TIMEOUT_ERROR);
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export default function PayPage() {
  const router = useRouter();
  const API = useMemo(() => apiBase(), []);
  const text: UiText = PAGE_COPY;
  const direction = PAGE_DIRECTION;
  const formattingLocale = PAGE_FORMATTING_LOCALE;

  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState<"" | CheckoutProvider>("");
  const [loadingState, setLoadingState] = useState(false);
  const [error, setError] = useState("");

  const [serviceKey, setServiceKey] = useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [plan, setPlan] = useState<PlanType>("STANDARD");
  const [statusData, setStatusData] = useState<BillingStatusDTO | null>(null);

  const successTpl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams();
    params.set("invoiceId", "{INVOICE_ID}");
    params.set("status", "success");
    params.set("lang", PAGE_LOCALE);
    return `${window.location.origin}/receipt?${params.toString()}`;
  }, []);

  const cancelTpl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams();
    params.set("invoiceId", "{INVOICE_ID}");
    params.set("status", "cancel");
    params.set("lang", PAGE_LOCALE);
    return `${window.location.origin}/receipt?${params.toString()}`;
  }, []);

  const activePlan = useMemo(
    () => resolveStatusSubscriptionPlan(statusData),
    [statusData],
  );

  const resolvedState = useMemo(
    () => resolveBillingState(statusData, plan),
    [statusData, plan],
  );

  const resolvedOwnerPhone = useMemo(() => {
    return normalizePhoneCandidate(
      String(
        statusData?.owner?.phone ||
          statusData?.ownerPhone ||
          phoneE164 ||
          readPhoneFromStorage() ||
          "",
      ).trim(),
    );
  }, [statusData?.owner?.phone, statusData?.ownerPhone, phoneE164]);

  const selectedPlanPrice = useMemo(() => {
    return getSelectedPlanPrice(statusData?.service, plan);
  }, [statusData?.service, plan]);

  const samePlanStillActive = useMemo(() => {
    return hasActiveSubscriptionForPlan(statusData, plan);
  }, [statusData, plan]);

  const planChangeRequired = useMemo(() => {
    return requiresPlanChange(statusData, plan);
  }, [statusData, plan]);

  const plusConfigured =
    typeof statusData?.service?.diagnostics?.plusConfigured === "boolean"
      ? Boolean(statusData.service.diagnostics.plusConfigured)
      : plan === "PLUS"
        ? selectedPlanPrice !== null
        : false;

  const standardConfigured =
    typeof statusData?.service?.diagnostics?.standardConfigured === "boolean"
      ? Boolean(statusData.service.diagnostics.standardConfigured)
      : plan === "STANDARD"
        ? selectedPlanPrice !== null
        : false;

  const planChangeInfo = useMemo(() => {
    if (!planChangeRequired || !activePlan) return "";
    return buildPlanChangeMessage(text, activePlan, plan);
  }, [activePlan, plan, planChangeRequired, text]);

  useEffect(() => {
    if (!router.isReady) return;

    const queryServiceKey = safeServiceKey(normalizeQueryValue(router.query.serviceKey));
    const storedServiceKey = readServiceKeyFromStorage();
    const resolvedServiceKey = queryServiceKey || storedServiceKey;

    const queryPlan =
      normalizePlanValue(normalizeQueryValue(router.query.plan)) ||
      normalizePlanValue(normalizeQueryValue(router.query.subscriptionTier));
    const storedPlan = readPlanFromStorage();
    const resolvedPlan = queryPlan || storedPlan || "STANDARD";

    const queryPhone = normalizePhoneCandidate(normalizeQueryValue(router.query.phone));
    const storedPhone = readPhoneFromStorage();
    const resolvedPhone = queryPhone || storedPhone;

    setPlan(resolvedPlan);
    writePlanToStorage(resolvedPlan);

    if (!resolvedServiceKey) {
      setReady(true);
      clearServiceKeyStorage();
      void router.replace(buildServicesUrl("", "", resolvedPlan), undefined, {
        shallow: true,
        scroll: false,
      });
      return;
    }

    setServiceKey(resolvedServiceKey);
    writeServiceKeyToStorage(resolvedServiceKey);

    if (!resolvedPhone) {
      setPhoneE164("");
      setReady(true);
      void router.replace(
        buildBillingUrl(resolvedServiceKey, "", resolvedPlan),
        undefined,
        { shallow: true, scroll: false },
      );
      return;
    }

    setPhoneE164(resolvedPhone);
    writePhoneToStorage(resolvedPhone);
    setReady(true);

    const currentLang = normalizeQueryValue(router.query.lang);
    if (currentLang !== PAGE_LOCALE) {
      const currentPath =
        normalizeSafeRelativePath(router.asPath) ||
        buildHref("/pay", {
          serviceKey: resolvedServiceKey,
          phone: resolvedPhone,
          plan: resolvedPlan,
        });

      void router.replace(withPageLocaleOnRelativeUrl(currentPath), undefined, {
        shallow: true,
        scroll: false,
      });
    }
  }, [
    router,
    router.asPath,
    router.isReady,
    router.query.lang,
    router.query.phone,
    router.query.plan,
    router.query.serviceKey,
    router.query.subscriptionTier,
  ]);

  const loadStatus = useCallback(async () => {
    if (!serviceKey) return;

    setError("");
    setLoadingState(true);

    try {
      const params = new URLSearchParams();
      params.set("serviceKey", serviceKey);
      params.set("plan", plan);

      const fallbackPhone = normalizePhoneCandidate(phoneE164 || readPhoneFromStorage());
      if (fallbackPhone) {
        params.set("phone", fallbackPhone);
      }

      const { response, data } = await fetchJsonWithTimeout<BillingStatusDTO>(
        `${API}/billing/status?${params.toString()}`,
        {
          method: "GET",
          headers: buildOwnerHeaders(),
        },
      );

      const parsed = data || {};

      if (!response.ok || !parsed?.ok) {
        throw new Error(
          extractErrorMessage(parsed, response.status, formattingLocale, text),
        );
      }

      syncBillingIdentity(parsed);

      const ownerPhone = normalizePhoneCandidate(
        String(parsed.owner?.phone || parsed.ownerPhone || fallbackPhone || "").trim(),
      );
      if (ownerPhone) {
        setPhoneE164(ownerPhone);
        writePhoneToStorage(ownerPhone);
      }

      setStatusData(parsed);
    } catch (e: unknown) {
      setStatusData(null);

      if (e instanceof Error && e.message === REQUEST_TIMEOUT_ERROR) {
        setError(text.statusLoadTimeout);
      } else if (e instanceof Error) {
        setError(e.message || text.statusLoadFailed);
      } else {
        setError(text.statusLoadFailed);
      }
    } finally {
      setLoadingState(false);
    }
  }, [API, serviceKey, phoneE164, plan, formattingLocale, text]);

  useEffect(() => {
    if (!ready || !serviceKey) return;
    void loadStatus();
  }, [ready, serviceKey, phoneE164, plan, loadStatus]);

  const start = useCallback(
    async (providerName: CheckoutProvider) => {
      setError("");

      if (!serviceKey) {
        setError(text.serviceNotSelected);
        return;
      }

      if (resolvedState === "PROFILE_REQUIRED") {
        setError(text.profileRequired);
        return;
      }

      if (resolvedState === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED") {
        setError(text.phoneVerificationRequired);
        return;
      }

      if (resolvedState === "SERVICE_SELECTION_REQUIRED") {
        setError(text.serviceSelectionRequired);
        return;
      }

      if (samePlanStillActive) {
        setError(
          buildActiveSubscriptionMessage(
            statusData?.subscription?.paidUntil,
            formattingLocale,
            text,
          ),
        );
        return;
      }

      if (resolvedState !== "SUBSCRIPTION_REQUIRED") {
        setError(text.stageNotAllowed);
        return;
      }

      if (!resolvedOwnerPhone || !isValidE164(resolvedOwnerPhone)) {
        setError(text.verifiedPhoneMissing);
        return;
      }

      if (!selectedPlanPrice || selectedPlanPrice <= 0) {
        setError(plan === "PLUS" ? text.plusPriceInactive : text.standardPriceInactive);
        return;
      }

      if (!successTpl || !cancelTpl) {
        setError(text.redirectUrlError);
        return;
      }

      setBusy(providerName);

      try {
        const { response, data } = await fetchJsonWithTimeout<BillingRenewDTO>(
          `${API}/billing/renew`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...buildOwnerHeaders(),
            },
            body: JSON.stringify({
              phone: resolvedOwnerPhone,
              serviceKey,
              subscriptionTier: mapPlanToApiTier(plan),
              billingCycle: "MONTHLY" as BillingCycle,
              plan,
              providerName,
              successUrlTemplate: successTpl,
              cancelUrlTemplate: cancelTpl,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(
            extractErrorMessage(data, response.status, formattingLocale, text),
          );
        }

        const checkoutUrl = String(data?.checkoutUrl ?? "").trim();
        if (!checkoutUrl) {
          throw new Error(text.checkoutNotCreatedError);
        }

        if (typeof window === "undefined") {
          throw new Error(text.redirectUrlError);
        }

        window.location.assign(checkoutUrl);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === REQUEST_TIMEOUT_ERROR) {
          setError(text.checkoutTimeout);
        } else if (e instanceof Error) {
          setError(e.message || text.paymentInitErrorPrefix);
        } else {
          setError(text.paymentInitErrorPrefix);
        }
        setBusy("");
        await loadStatus();
      }
    },
    [
      API,
      cancelTpl,
      formattingLocale,
      loadStatus,
      plan,
      resolvedOwnerPhone,
      resolvedState,
      samePlanStillActive,
      selectedPlanPrice,
      serviceKey,
      statusData?.subscription?.paidUntil,
      successTpl,
      text,
    ],
  );

  if (!ready) {
    return (
      <div style={{ ...pageStyle, direction }}>
        <div style={shellStyle}>
          <div style={heroCardStyle}>
            <div style={heroInnerStyle}>
              <div style={heroHeaderStackStyle}>
                <h1 style={titleStyle}>{text.pageTitle}</h1>
                <div style={mutedStyle}>{text.loading}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!serviceKey) return null;

  const disabled = busy.length > 0 || loadingState;
  const displayServiceName = humanizeServiceKey(serviceKey, text);
  const billingHref = buildBillingUrl(serviceKey, resolvedOwnerPhone, plan);
  const servicesHref = buildServicesUrl(serviceKey, resolvedOwnerPhone, plan);
  const profileHref = buildProfileUrl(serviceKey, plan);
  const dashboardHref = buildDashboardUrl(serviceKey, plan);

  const stateMeta = getStateMeta(resolvedState, text, {
    requiresPlanChange: planChangeRequired,
    activePlan,
    selectedPlan: plan,
  });

  const canStartCheckout =
    !disabled &&
    resolvedState === "SUBSCRIPTION_REQUIRED" &&
    isValidE164(resolvedOwnerPhone) &&
    selectedPlanPrice !== null &&
    selectedPlanPrice > 0;

  return (
    <div style={{ ...pageStyle, direction }}>
      <div style={shellStyle}>
        <div style={heroCardStyle}>
          <div style={heroInnerStyle}>
            <div style={heroHeaderStackStyle}>
              <h1 style={titleStyle}>{text.pageTitle}</h1>
              <p style={subtitleStyle}>{text.pageSubtitle}</p>
            </div>

            <div style={summaryGridStyle}>
              <div style={summaryCardStyle}>
                <div style={summaryLabelStyle}>{text.serviceLabel}</div>
                <div style={summaryValueStyle}>{displayServiceName}</div>
              </div>

              <div style={summaryCardStyle}>
                <div style={summaryLabelStyle}>{text.planLabel}</div>
                <div style={summaryValueStyle}>{planLabel(plan, text)}</div>
              </div>

              <div style={summaryCardStyle}>
                <div style={summaryLabelStyle}>{text.phoneLabel}</div>
                <div style={summaryValueStyle}>
                  {resolvedOwnerPhone || text.unknownValue}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            ...gateCardStyle,
            ...(stateMeta.tone === "warning"
              ? gateWarningStyle
              : stateMeta.tone === "success"
                ? gateSuccessStyle
                : gateInfoStyle),
          }}
        >
          <div style={gateBadgeStyle}>{stateMeta.badge}</div>
          <h2 style={gateTitleStyle}>{stateMeta.title}</h2>
          <p style={gateDescriptionStyle}>{stateMeta.description}</p>

          {statusData?.verification ? (
            <div style={verificationGridStyle}>
              <div style={verificationCardStyle}>
                <div style={summaryLabelStyle}>{text.verificationLabel}</div>
                <div style={summaryValueStyle}>
                  {statusData.verification.phoneVerified
                    ? text.phoneVerified
                    : text.phoneNotVerified}
                </div>
              </div>

              <div style={verificationCardStyle}>
                <div style={summaryLabelStyle}>{text.verificationStatusLabel}</div>
                <div style={summaryValueStyle}>
                  {getVerificationStatusLabel(
                    statusData.verification.phoneVerificationStatus,
                    text,
                  )}
                </div>
              </div>

              <div style={verificationCardStyle}>
                <div style={summaryLabelStyle}>{text.paidUntilLabel}</div>
                <div style={summaryValueStyle}>
                  {formatPaidUntil(
                    statusData.subscription?.paidUntil,
                    formattingLocale,
                    text,
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {planChangeRequired && planChangeInfo ? (
          <div style={planChangeBoxStyle}>{planChangeInfo}</div>
        ) : null}

        {error ? (
          <div style={errorBoxStyle}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>{text.errorTitle}</div>
            <div>{error}</div>
          </div>
        ) : null}

        <div style={sectionTitleStyle}>{text.selectedSubscriptionTitle}</div>

        <div style={selectionCardStyle}>
          <div style={selectionCardTopStyle}>
            <div style={selectionCopyStyle}>
              <div style={summaryLabelStyle}>{text.selectedChoiceLabel}</div>
              <div style={selectionHeadlineStyle}>
                {displayServiceName} • {planLabel(plan, text)}
              </div>
            </div>

            <div style={planPillStyle}>{planLabel(plan, text)}</div>
          </div>

          <div style={selectionDescriptionStyle}>{planDescription(plan, text)}</div>

          <div style={selectionHintStyle}>
            {selectedPlanPrice !== null
              ? `${formatPriceValue(selectedPlanPrice, formattingLocale)} ${
                  statusData?.service?.currency ?? "AZN"
                } • ${text.activeMonthlySuffix}`
              : text.planPriceInactive}
          </div>

          {plan === "PLUS" && !plusConfigured ? (
            <div style={warningBoxStyle}>
              <div>{text.plusPricingInactiveWarning}</div>
              <div style={inlineCodesRowStyle}>
                <code style={inlineCodeStyle}>{text.premiumMonthlyPriceField}</code>
                <code style={inlineCodeStyle}>{text.plusMonthlyPriceField}</code>
              </div>
            </div>
          ) : null}

          {plan === "STANDARD" && !standardConfigured ? (
            <div style={warningBoxStyle}>{text.standardPricingInactiveWarning}</div>
          ) : null}
        </div>

        <div style={sectionTitleStyle}>{text.providersTitle}</div>

        <div style={providersGridStyle}>
          <button
            type="button"
            onClick={() => void start("stripe")}
            disabled={!canStartCheckout}
            style={{
              ...providerButtonStyle,
              opacity: canStartCheckout ? 1 : 0.72,
              cursor: canStartCheckout ? "pointer" : "not-allowed",
            }}
          >
            <div>
              <div style={providerTitleStyle}>Stripe</div>
              <div style={providerTextStyle}>{text.stripeDescription}</div>
            </div>
            <div style={providerActionStyle}>
              {busy === "stripe" ? text.stripeRedirecting : text.stripeAction}
            </div>
          </button>

          <button
            type="button"
            onClick={() => void start("mock")}
            disabled={!canStartCheckout}
            style={{
              ...providerButtonStyle,
              opacity: canStartCheckout ? 1 : 0.72,
              cursor: canStartCheckout ? "pointer" : "not-allowed",
            }}
          >
            <div>
              <div style={providerTitleStyle}>{text.mockTitle}</div>
              <div style={providerTextStyle}>{text.mockDescription}</div>
            </div>
            <div style={providerActionStyle}>
              {busy === "mock" ? text.mockRedirecting : text.mockAction}
            </div>
          </button>

          <div style={comingSoonCardStyle}>
            <div>
              <div style={providerTitleStyle}>{text.portmanatTitle}</div>
              <div style={providerTextStyle}>{text.comingSoon}</div>
            </div>
            <div style={comingSoonTagStyle}>{text.comingSoon}</div>
          </div>

          <div style={comingSoonCardStyle}>
            <div>
              <div style={providerTitleStyle}>{text.cryptoTitle}</div>
              <div style={providerTextStyle}>{text.comingSoon}</div>
            </div>
            <div style={comingSoonTagStyle}>{text.comingSoon}</div>
          </div>
        </div>

        <div style={actionsRowStyle}>
          <button
            type="button"
            onClick={() => void loadStatus()}
            style={{
              ...secondaryButtonStyle,
              ...(loadingState ? disabledButtonStyle : {}),
            }}
            disabled={loadingState}
          >
            {loadingState ? text.refreshingStatus : text.refreshStatus}
          </button>

          <Link href={billingHref} style={secondaryLinkStyle}>
            {text.billingBack}
          </Link>

          <Link href={servicesHref} style={secondaryLinkStyle}>
            {text.changePlanAndService}
          </Link>

          {(resolvedState === "PROFILE_REQUIRED" ||
            resolvedState === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED") && (
            <Link href={profileHref} style={secondaryLinkStyle}>
              {text.goToProfile}
            </Link>
          )}

          {resolvedState === "ACTIVE" && !planChangeRequired ? (
            <Link href={dashboardHref} style={primaryLinkStyle}>
              {text.dashboardBack}
            </Link>
          ) : (
            <span style={disabledPillStyle}>{text.dashboardLocked}</span>
          )}
        </div>
      </div>
    </div>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100dvh",
  background: `
    radial-gradient(circle at top left, rgba(177, 209, 88, 0.18) 0%, transparent 22%),
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.10) 0%, transparent 22%),
    radial-gradient(circle at bottom left, rgba(34, 197, 94, 0.08) 0%, transparent 20%),
    linear-gradient(180deg, #eef2ea 0%, #e9eee7 52%, #e6ece4 100%)
  `,
  padding: "0 0 40px",
  overflowX: "clip",
};

const shellStyle: CSSProperties = {
  width: "100%",
  maxWidth: "1280px",
  margin: "0 auto",
  padding: "0 16px",
  display: "grid",
  gap: 20,
  boxSizing: "border-box",
};

const heroCardStyle: CSSProperties = {
  position: "relative",
  marginLeft: "calc(50% - 50vw)",
  marginRight: "calc(50% - 50vw)",
  background: `
    radial-gradient(circle at 12% 18%, rgba(166, 214, 94, 0.18) 0%, transparent 22%),
    radial-gradient(circle at 88% 14%, rgba(59, 130, 246, 0.16) 0%, transparent 24%),
    linear-gradient(180deg, #f2f5ef 0%, #edf2ec 100%)
  `,
  borderTop: "1px solid rgba(15, 23, 42, 0.08)",
  borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.34), 0 18px 36px rgba(15, 23, 42, 0.05)",
  overflow: "hidden",
};

const heroInnerStyle: CSSProperties = {
  width: "100%",
  maxWidth: "1280px",
  margin: "0 auto",
  padding: "clamp(24px, 4vw, 36px) 16px clamp(24px, 4vw, 32px)",
  display: "grid",
  gap: 18,
  boxSizing: "border-box",
};

const heroHeaderStackStyle: CSSProperties = {
  display: "grid",
  gap: 10,
  minWidth: 0,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(2rem, 5vw, 2.75rem)",
  lineHeight: 1.08,
  fontWeight: 900,
  color: "#0f172a",
  letterSpacing: "-0.04em",
  overflowWrap: "anywhere",
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(0.96rem, 2.1vw, 1rem)",
  lineHeight: 1.82,
  color: "#475569",
  maxWidth: 920,
  minWidth: 0,
};

const mutedStyle: CSSProperties = {
  marginTop: 0,
  color: "#64748b",
  lineHeight: 1.7,
};

const gateCardStyle: CSSProperties = {
  borderRadius: 24,
  padding: "clamp(18px, 2.7vw, 24px)",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  boxShadow: "0 12px 26px rgba(15, 23, 42, 0.05)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.96) 100%)",
  boxSizing: "border-box",
};

const gateInfoStyle: CSSProperties = {
  background: "linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%)",
  borderColor: "rgba(59, 130, 246, 0.24)",
};

const gateWarningStyle: CSSProperties = {
  background: "linear-gradient(180deg, #fffdf7 0%, #fff6e8 100%)",
  borderColor: "rgba(245, 158, 11, 0.28)",
};

const gateSuccessStyle: CSSProperties = {
  background: "linear-gradient(180deg, #f8fff9 0%, #edfdf2 100%)",
  borderColor: "rgba(34, 197, 94, 0.24)",
};

const gateBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 10px",
  borderRadius: 999,
  background: "#0f172a",
  color: "#ffffff",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.02em",
  lineHeight: 1.35,
  overflowWrap: "anywhere",
};

const gateTitleStyle: CSSProperties = {
  margin: "12px 0 0 0",
  fontSize: "clamp(1.35rem, 3vw, 1.7rem)",
  lineHeight: 1.2,
  fontWeight: 900,
  color: "#0f172a",
  letterSpacing: "-0.02em",
  overflowWrap: "anywhere",
};

const gateDescriptionStyle: CSSProperties = {
  margin: "10px 0 0 0",
  fontSize: 14,
  lineHeight: 1.8,
  color: "#475569",
};

const planChangeBoxStyle: CSSProperties = {
  padding: "14px 15px",
  border: "1px solid rgba(249, 115, 22, 0.24)",
  background: "linear-gradient(180deg, #fffaf5 0%, #fff7ed 100%)",
  color: "#9a3412",
  borderRadius: 16,
  lineHeight: 1.7,
  fontWeight: 700,
  boxShadow: "0 8px 20px rgba(154, 52, 18, 0.05)",
  boxSizing: "border-box",
  overflowWrap: "anywhere",
};

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: 16,
};

const verificationGridStyle: CSSProperties = {
  marginTop: 16,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: 16,
};

const summaryCardStyle: CSSProperties = {
  borderRadius: 22,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background: `
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.10), transparent 24%),
    radial-gradient(circle at bottom left, rgba(163, 230, 53, 0.08), transparent 20%),
    linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)
  `,
  padding: 18,
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
  minWidth: 0,
  boxSizing: "border-box",
};

const verificationCardStyle: CSSProperties = {
  borderRadius: 22,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background: `
    radial-gradient(circle at top right, rgba(163, 230, 53, 0.08), transparent 22%),
    radial-gradient(circle at bottom left, rgba(37, 99, 235, 0.08), transparent 24%),
    linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)
  `,
  padding: 18,
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
  minWidth: 0,
  boxSizing: "border-box",
};

const summaryLabelStyle: CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  marginBottom: 8,
  fontWeight: 800,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  lineHeight: 1.45,
};

const summaryValueStyle: CSSProperties = {
  fontSize: 18,
  color: "#0f172a",
  fontWeight: 900,
  wordBreak: "break-word",
  overflowWrap: "anywhere",
  letterSpacing: "-0.02em",
  lineHeight: 1.35,
};

const errorBoxStyle: CSSProperties = {
  padding: "14px 16px",
  border: "1px solid rgba(239, 68, 68, 0.24)",
  background: "linear-gradient(180deg, #fffafa 0%, #fef2f2 100%)",
  color: "#991b1b",
  borderRadius: 16,
  fontWeight: 700,
  boxShadow: "0 8px 20px rgba(127, 29, 29, 0.05)",
  lineHeight: 1.7,
  boxSizing: "border-box",
  overflowWrap: "anywhere",
};

const warningBoxStyle: CSSProperties = {
  padding: "14px 15px",
  border: "1px solid rgba(245, 158, 11, 0.28)",
  background: "linear-gradient(180deg, #fffdf7 0%, #fff7e8 100%)",
  color: "#92400e",
  borderRadius: 16,
  lineHeight: 1.7,
  fontWeight: 700,
  boxShadow: "0 8px 20px rgba(146, 64, 14, 0.05)",
  boxSizing: "border-box",
};

const inlineCodesRowStyle: CSSProperties = {
  marginTop: 10,
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const inlineCodeStyle: CSSProperties = {
  display: "inline-block",
  maxWidth: "100%",
  padding: "2px 8px",
  borderRadius: 8,
  background: "#ffffff",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  color: "#0f172a",
  fontWeight: 900,
  boxShadow: "0 4px 10px rgba(15, 23, 42, 0.04)",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
  boxSizing: "border-box",
};

const sectionTitleStyle: CSSProperties = {
  fontSize: "clamp(1.05rem, 2vw, 1.15rem)",
  fontWeight: 900,
  color: "#0f172a",
  marginTop: 4,
  letterSpacing: "-0.02em",
  lineHeight: 1.3,
};

const selectionCardStyle: CSSProperties = {
  borderRadius: 24,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background: `
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.10), transparent 24%),
    radial-gradient(circle at bottom left, rgba(163, 230, 53, 0.08), transparent 20%),
    linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)
  `,
  padding: "clamp(18px, 2.5vw, 22px)",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
  display: "grid",
  gap: 14,
  boxSizing: "border-box",
};

const selectionCardTopStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const selectionCopyStyle: CSSProperties = {
  minWidth: 0,
  flex: "1 1 260px",
};

const selectionHeadlineStyle: CSSProperties = {
  fontSize: "clamp(1.15rem, 2.6vw, 1.35rem)",
  lineHeight: 1.28,
  fontWeight: 900,
  color: "#0f172a",
  letterSpacing: "-0.02em",
  overflowWrap: "anywhere",
};

const planPillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 36,
  maxWidth: "100%",
  padding: "0 14px",
  borderRadius: 999,
  background: "#0f172a",
  border: "1px solid #0f172a",
  color: "#ffffff",
  fontSize: 13,
  fontWeight: 800,
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.12)",
  lineHeight: 1.3,
  textAlign: "center",
};

const selectionDescriptionStyle: CSSProperties = {
  fontSize: 15,
  lineHeight: 1.8,
  color: "#475569",
};

const selectionHintStyle: CSSProperties = {
  fontSize: 13,
  lineHeight: 1.7,
  color: "#64748b",
  overflowWrap: "anywhere",
};

const providersGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
  gap: 16,
};

const providerButtonStyle: CSSProperties = {
  width: "100%",
  textAlign: "left",
  padding: 18,
  borderRadius: 22,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background: `
    radial-gradient(circle at top right, rgba(163, 230, 53, 0.08), transparent 22%),
    radial-gradient(circle at bottom left, rgba(37, 99, 235, 0.08), transparent 24%),
    linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)
  `,
  minHeight: 184,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: 18,
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
  boxSizing: "border-box",
};

const providerTitleStyle: CSSProperties = {
  fontWeight: 900,
  fontSize: 20,
  color: "#0f172a",
  letterSpacing: "-0.02em",
  lineHeight: 1.3,
  overflowWrap: "anywhere",
};

const providerTextStyle: CSSProperties = {
  marginTop: 10,
  fontSize: 14,
  lineHeight: 1.7,
  color: "#475569",
};

const providerActionStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 48,
  width: "100%",
  borderRadius: 14,
  background: "#0f172a",
  color: "#ffffff",
  fontWeight: 900,
  padding: "12px 14px",
  border: "1px solid #0f172a",
  boxShadow: "0 10px 20px rgba(15, 23, 42, 0.14)",
  textAlign: "center",
  lineHeight: 1.3,
  boxSizing: "border-box",
};

const comingSoonCardStyle: CSSProperties = {
  padding: 18,
  borderRadius: 22,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background: "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
  minHeight: 184,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: 18,
  boxShadow: "0 10px 22px rgba(15, 23, 42, 0.05)",
  boxSizing: "border-box",
};

const comingSoonTagStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 48,
  width: "100%",
  borderRadius: 14,
  background: "#ffffff",
  border: "1px dashed rgba(15, 23, 42, 0.16)",
  color: "#64748b",
  fontWeight: 800,
  padding: "12px 14px",
  textAlign: "center",
  lineHeight: 1.3,
  boxSizing: "border-box",
};

const actionsRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: 10,
};

const primaryLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  minHeight: 48,
  padding: "14px 16px",
  borderRadius: 14,
  background: "#0f172a",
  color: "#ffffff",
  border: "1px solid #0f172a",
  fontWeight: 800,
  cursor: "pointer",
  textDecoration: "none",
  textAlign: "center",
  lineHeight: 1.3,
  boxShadow: "0 10px 20px rgba(15, 23, 42, 0.14)",
  boxSizing: "border-box",
};

const secondaryLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  minHeight: 48,
  padding: "14px 16px",
  borderRadius: 14,
  background: "#ffffff",
  color: "#0f172a",
  border: "1px solid rgba(15, 23, 42, 0.10)",
  fontWeight: 800,
  cursor: "pointer",
  textDecoration: "none",
  textAlign: "center",
  lineHeight: 1.3,
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.06)",
  boxSizing: "border-box",
};

const secondaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  minHeight: 48,
  padding: "14px 16px",
  borderRadius: 14,
  background: "#ffffff",
  color: "#0f172a",
  border: "1px solid rgba(15, 23, 42, 0.10)",
  fontWeight: 800,
  cursor: "pointer",
  textAlign: "center",
  lineHeight: 1.3,
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.06)",
  boxSizing: "border-box",
};

const disabledButtonStyle: CSSProperties = {
  opacity: 0.68,
  cursor: "not-allowed",
};

const disabledPillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  minHeight: 48,
  padding: "14px 16px",
  borderRadius: 14,
  background: "#f8fafc",
  color: "#94a3b8",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  fontWeight: 800,
  cursor: "not-allowed",
  textAlign: "center",
  lineHeight: 1.3,
  boxSizing: "border-box",
};