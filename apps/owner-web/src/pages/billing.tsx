import type { CSSProperties } from "react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { formatDateTime } from "i18n-core";

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
const PAGE_FORMATTING_LOCALE = "az-AZ";

const REQUEST_TIMEOUT_MS = 15000;

type PlanType = "STANDARD" | "PLUS";
type SubscriptionTier = "STANDARD" | "PREMIUM";
type BillingCycle = "MONTHLY" | "YEARLY";
type BillingState =
  | "PROFILE_REQUIRED"
  | "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED"
  | "SERVICE_SELECTION_REQUIRED"
  | "SUBSCRIPTION_REQUIRED"
  | "ACTIVE";

type ServicePricing = {
  standardMonthlyPrice?: number | null;
  standardYearlyPrice?: number | null;
  premiumMonthlyPrice?: number | null;
  premiumYearlyPrice?: number | null;
  plusMonthlyPrice?: number | null;
  plusYearlyPrice?: number | null;
  legacyPrice?: number | null;
};

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
    tier?: SubscriptionTier | null;
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
    subscriptionTier: SubscriptionTier;
    billingCycle: BillingCycle;
    plan?: PlanType;
    receiptNumber?: string;
  } | null;
  error?: string | null;
  message?: string | null;
};

type OwnerIdentity = {
  ownerId: string;
  ownerPhone: string;
  ownerEmail: string;
};

const PAGE_COPY = {
  pageTitle: "Abunəlik",
  pageLoading: "Yüklənir...",
  pageSubtitle:
    "botXan abunəlik səhifəsi sahibkar onboarding vəziyyəti ilə işləyir. Profil və telefon təsdiqi tamamlanmadan ödəniş axını açılmır. Xidmət seçildikdən sonra növbəti addım abunəlikdir. Yalnız uğurlu ödənişdən sonra idarəetmə paneli və davam axını açılır.",
  dashboardBack: "İdarəetmə panelinə qayıt",
  dashboardLocked: "İdarəetmə paneli bağlıdır",
  changePlanAndService: "Planı və xidməti dəyiş",
  goToProfile: "Profilə keç",
  continue: "Davam et",
  ownerSectionTitle: "Sahibkar və xidmət məlumatları",
  selectedPlanStatusTitle: "Seçilmiş plan üzrə status və qiymət",
  subscriptionStatusTitle: "Abunəlik statusu",
  errorTitle: "Xəta",
  lastInvoiceLabel: "Son qaimə",
  noInvoiceYet: "Hələ qaimə yoxdur.",
  identityHint:
    "Abunəlik bu mərhələdə profildəki sahibkar identifikasiyasından istifadə edir. Telefon dəyərinin əl ilə dəyişdirilməsi açıq deyil.",
  refreshStatus: "Statusu yenilə",
  refreshingStatus: "Yoxlanılır...",
  goToPayment: "Ödənişə keç",
  renewOrPay: "Yenilə / Ödə",
  activeStatusLocked: "Abunəlik aktivdir",
  planServiceNotSelected: "Xidmət seçilməyib.",
  profileMustBeCompleted: "Əvvəlcə sahibkar profilini tamamlayın.",
  phoneOtpRequired:
    "Telefon OTP təsdiqi tamamlanmadan ödənişə keçmək olmaz.",
  serviceStageRequired: "Əvvəlcə xidmət mərhələsini tamamlayın.",
  activeSubscriptionPreventsPayment:
    "Statusunuz aktivdir. Aktiv abunəlik bitmədən eyni plan üzrə yenidən ödəniş etmək mümkün deyil.",
  verifiedOwnerPhoneMissing:
    "Abunəlik üçün təsdiqlənmiş sahibkar telefonu tapılmadı.",
  plusPriceInactive: "Bu xidmət üçün Plus plan qiyməti aktiv deyil.",
  standardPriceInactive:
    "Bu xidmət üçün Standart plan qiyməti aktiv deyil.",
  pricingWillAppearLater: "Qiymət status yoxlandıqdan sonra görünəcək.",
  plusPricingNotConfigured:
    "Bu xidmət üçün Plus plan qiyməti hələ konfiqurasiya edilməyib.",
  standardPricingNotConfigured:
    "Bu xidmət üçün Standart plan qiyməti hələ konfiqurasiya edilməyib.",
  pricingActiveDaysSuffix: "30 gün",
  pricingInactive: "Qiymət aktiv deyil.",
  verificationRequiredBadge: "Telefon təsdiqi tələb olunur",
  verificationRequiredTitle: "OTP təsdiqi tamamlanmayıb",
  verificationRequiredDescription:
    "Telefon OTP ilə təsdiqlənmədən abunəlik bağlı qalır. Abunəliyi başlatmaq və idarəetmə panelinə keçmək mümkün deyil.",
  serviceSelectionRequiredBadge: "Xidmət seçimi tələb olunur",
  serviceSelectionRequiredTitle: "Xidmətlər mərhələsi tamamlanmayıb",
  serviceSelectionRequiredDescription:
    "Profil və telefon təsdiqi tamamdır, lakin seçilmiş xidmət konteksti hazır deyil. Əvvəlcə xidmətlər mərhələsinə qayıdın.",
  paymentRequiredBadge: "Ödəniş tələb olunur",
  paymentRequiredTitle: "Abunəlik açıqdır",
  paymentRequiredDescription:
    "Profil və telefon təsdiqi tamamdır. İndi seçilmiş xidmət üzrə abunəliyi başlada bilərsiniz. İdarəetmə paneli yalnız uğurlu ödənişdən sonra açılır.",
  activeBadge: "Aktivdir",
  activeTitle: "Abunəlik aktivdir",
  activeDescription:
    "Bu xidmət üçün aktiv abunəlik mövcuddur. İdarəetmə paneli və növbəti sahibkar axını açıqdır.",
  profileRequiredBadge: "Profil tələb olunur",
  profileRequiredTitle: "Sahibkar qeydiyyatı tamamlanmayıb",
  profileRequiredDescription:
    "Profil və telefon təsdiqi tamamlanmadan abunəlik bağlı qalır. İlk addım profil mərhələsidir.",
  planChangeBadge: "Plan dəyişikliyi",
  planChangeTitle: "Plan yenilənməsi üçün ödəniş tələb olunur",
  planChangeDescriptionPrefix: "Hazırda sizin",
  planChangeDescriptionMiddle:
    "planı üzrə aktiv abunəliyiniz var. Davam etsəniz",
  planChangeDescriptionSuffix:
    "planı üçün yeni ödəniş yaradılacaq, əvvəlki aktiv plan ləğv ediləcək və yeni 30 günlük abunəlik aktivləşəcək.",
  planChangeInfoPrefix: "Hazırda aktiv planınız",
  planChangeInfoMiddle: "planıdır. Seçilmiş",
  planChangeInfoSuffix:
    "planı üçün ödəniş etdikdən sonra əvvəlki plan ləğv olunacaq və yeni 30 günlük plan aktiv olacaq.",
  phoneVerificationLabel: "Telefon təsdiqi",
  verificationStatusLabel: "Təsdiq statusu",
  verifiedAtLabel: "Təsdiq vaxtı",
  verifiedYes: "Təsdiqlənib",
  verifiedNo: "Təsdiqlənməyib",
  verificationRequiredText: "Tələb olunur",
  verificationSentText: "Göndərilib",
  verificationVerifiedText: "Təsdiqlənib",
  verificationExpiredText: "Vaxtı bitib",
  verificationFailedText: "Uğursuz",
  ownerLabel: "Sahibkar",
  ownerPhoneLabel: "Sahibkar telefonu",
  ownerEmailLabel: "Sahibkar e-poçtu",
  serviceLabel: "Xidmət",
  serviceKeyLabel: "Xidmət açarı",
  serviceActiveLabel: "Xidmət aktivdir",
  yesLabel: "Bəli",
  noLabel: "Xeyr",
  serviceNameFallback: "Xidmət",
  planStandardLabel: "Standart",
  planPlusLabel: "Plus",
  planStandardDescription:
    "Standart plan seçilib. Elanlar əsas sıralama məntiqi ilə göstəriləcək.",
  planPlusDescription:
    "Plus plan seçilib. Eyni kateqoriya və eyni filtrlər daxilində elanlar standart planlı elanlardan əvvəl göstəriləcək.",
  plusPricingWarningPrefix:
    "Plus plan backend tərəfindən tanınır, lakin bu xidmət üçün",
  plusPricingWarningMiddle: "və ya",
  plusPricingWarningSuffix: "konfiqurasiya edilməyib.",
  standardPricingWarning:
    "Standart plan qiyməti aktiv deyil. Xidmət qiymətləndirmə sahələrini yoxlamaq lazımdır.",
  currentBillingStateLabel: "Cari abunəlik vəziyyəti",
  currentSubscriptionStatusLabel: "Cari abunəlik statusu",
  currentActivePlanLabel: "Cari aktiv plan",
  paidUntilLabel: "Bitmə vaxtı",
  daysLeftLabel: "Qalan gün",
  selectedPlanLabel: "Seçilmiş plan",
  receiptPrefix: "Qəbz nömrəsi",
  receiptView: "Qəbzə bax",
  paidAtPrefix: "Ödəniş vaxtı",
  activeInfo:
    "Statusunuz aktivdir. İdarəetmə paneli və davam axını açıqdır.",
  subscriptionRequiredInfo:
    "Abunəlik aktiv deyil. Seçilmiş planla davam etmək üçün ödənişə keçə bilərsiniz.",
  billingLockedInfo:
    "Abunəlik bağlıdır. Əvvəlcə profil və telefon təsdiqi mərhələsini tamamlayın.",
  billingContextNotReadyInfo:
    "Abunəlik konteksti hazır deyil. Əvvəlcə xidmətlər mərhələsinə qayıdın.",
  activeStatusText: "AKTİV",
  inactiveStatusText: "QEYRİ-AKTİV",
  planStandardCycleMonthly: "Standart",
  planPlusCycleMonthly: "Plus",
  cycleYearlyLegacy: "İllik (köhnə model)",
  cycleMonthly: "Aylıq",
  unknownValue: "-",
  loadingError: "Abunəlik məlumatları yüklənmədi.",
  ownerNotFound:
    "Sahibkar tapılmadı. Əvvəlcə profil məlumatlarını tamamlayın.",
  profileRequiredError: "Əvvəlcə sahibkar profilini tamamlayın.",
  phoneVerificationRequiredError: "Telefon təsdiqi tamamlanmayıb.",
  serviceSelectionRequiredError:
    "Əvvəlcə xidmət seçimini tamamlayın.",
  serviceNotFound: "Xidmət tapılmadı və ya aktiv deyil.",
  serviceKeyRequired: "Xidmət seçilməyib.",
  plusPriceNotConfiguredError:
    "Bu xidmət üçün Plus plan qiyməti hələ aktiv edilməyib.",
  standardPriceNotConfiguredError:
    "Bu xidmət üçün Standart plan qiyməti hələ aktiv edilməyib.",
  subscriptionAlreadyActiveError:
    "Bu xidmət üçün artıq aktiv abunəliyiniz var.",
  checkoutNotCreatedError:
    "Ödəniş sessiyası yaradıla bilmədi. Bir qədər sonra yenidən cəhd edin.",
  forbiddenError: "Bu abunəlik məlumatına giriş icazəniz yoxdur.",
  internalError:
    "Server xətası baş verdi. Bir qədər sonra yenidən cəhd edin.",
  requestTimedOut: "Sorğu vaxt aşımına düşdü. Backend cavab vermədi.",
  genericLoadError: "Yükləmə xətası",
  invoiceStatusPaid: "Ödənilib",
  invoiceStatusPending: "Gözləmədə",
  invoiceStatusFailed: "Uğursuz",
  invoiceStatusCancelled: "Ləğv edilib",
  invoiceStatusUnknown: "Naməlum",
  billingStateProfileRequired: "Profil tələb olunur",
  billingStatePhoneVerificationRequired: "Telefon təsdiqi tələb olunur",
  billingStateServiceSelectionRequired: "Xidmət seçimi tələb olunur",
  billingStateSubscriptionRequired: "Abunəlik tələb olunur",
  billingStateActive: "Aktivdir",
  subscriptionStatusActive: "Aktivdir",
  subscriptionStatusPending: "Gözləmədə",
  subscriptionStatusExpired: "Müddəti bitib",
  subscriptionStatusCancelled: "Ləğv edilib",
  subscriptionStatusFailed: "Uğursuz",
  subscriptionStatusInactive: "Qeyri-aktivdir",
} as const;

const SERVICE_LABELS_AZ = {
  RENT_HOME: "Ev kirayəsi",
  BARBER: "Bərbərlik xidməti",
  CAR_RENTAL: "Avtomobil icarəsi",
  HOTEL: "Otel xidməti",
  BEAUTY_SALON: "Gözəllik salonu",
  BEAUTY: "Gözəllik salonu",
  BABYSITTER: "Uşaq baxıcısı xidməti",
  CLEANING: "Təmizlik xidmətləri",
  TECHNICAL_SERVICES: "Texniki xidmətlər",
  SOBER_DRIVER: "Ayıq sürücü xidməti",
} as const;

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

function getQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0]?.trim() || "";
  return value?.trim() || "";
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

function digitsOnly(input: string): string {
  return String(input || "").replace(/[^\d]/g, "");
}

function safeServiceKey(value: unknown): string {
  const normalizedValue = String(value ?? "").trim().toUpperCase();

  if (!normalizedValue) return "";
  if (!/^[A-Z0-9_-]{2,64}$/.test(normalizedValue)) return "";

  return normalizedValue;
}

function isValidE164(value: string): boolean {
  const normalizedValue = String(value || "").trim();
  return /^\+[1-9]\d{7,14}$/.test(normalizedValue);
}

function normalizePhoneCandidate(input: string): string {
  const rawValue = String(input || "").trim();
  if (!rawValue) return "";

  const normalizedValue = rawValue.startsWith("+")
    ? `+${digitsOnly(rawValue)}`
    : `+${digitsOnly(rawValue)}`;

  return isValidE164(normalizedValue) ? normalizedValue : "";
}

function normalizePlanValue(value: unknown): PlanType | "" {
  const normalizedValue = String(value ?? "").trim().toUpperCase();

  if (!normalizedValue) return "";
  if (normalizedValue === "STANDARD" || normalizedValue === "STANDART") {
    return "STANDARD";
  }
  if (normalizedValue === "PLUS" || normalizedValue === "PREMIUM") {
    return "PLUS";
  }

  return "";
}

function normalizeSubscriptionPlan(
  plan: unknown,
  tier: unknown,
): PlanType | "" {
  return normalizePlanValue(plan) || normalizePlanValue(tier);
}

function normalizeBillingStateValue(value: unknown): BillingState | "" {
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

function normalizeOwnerIdForStorage(value: unknown): string {
  const sanitizedValue = normalizeAsciiHeaderValue(value);
  if (!sanitizedValue) return "";
  if (!/^[A-Za-z0-9_-]{6,128}$/.test(sanitizedValue)) return "";
  return sanitizedValue;
}

function normalizeEmailForStorage(value: unknown): string {
  const sanitizedValue = normalizeAsciiHeaderValue(
    String(value ?? "").toLowerCase(),
  );

  if (!sanitizedValue) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedValue)) return "";

  return sanitizedValue;
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

function readServiceKeyFromStorage(): string {
  return safeServiceKey(readFirstStorageValue(SERVICE_STORAGE_KEYS));
}

function writeServiceKeyToStorage(serviceKey: string): void {
  const normalizedValue = safeServiceKey(serviceKey);
  if (!normalizedValue) return;

  writeStorageValueToKeys(SERVICE_STORAGE_KEYS, normalizedValue);
}

function clearServiceKeyStorage(): void {
  removeStorageKeys(SERVICE_STORAGE_KEYS);
}

function readProfilePhoneFromStorage(): string {
  return normalizePhoneCandidate(readFirstStorageValue(PHONE_STORAGE_KEYS));
}

function writeProfilePhoneToStorage(phoneE164: string): void {
  const normalizedValue = normalizePhoneCandidate(phoneE164);
  if (!normalizedValue) return;

  writeStorageValueToKeys(PHONE_STORAGE_KEYS, normalizedValue);
}

function readPlanFromStorage(): PlanType | "" {
  return normalizePlanValue(readFirstStorageValue(PLAN_STORAGE_KEYS));
}

function writePlanToStorage(plan: PlanType): void {
  writeStorageValueToKeys(PLAN_STORAGE_KEYS, plan);
}

function readOwnerIdFromStorage(): string {
  return normalizeOwnerIdForStorage(readFirstStorageValue(OWNER_ID_STORAGE_KEYS));
}

function writeOwnerIdToStorage(ownerId: string): void {
  const normalizedValue = normalizeOwnerIdForStorage(ownerId);
  if (!normalizedValue) return;

  writeStorageValueToKeys(OWNER_ID_STORAGE_KEYS, normalizedValue);
}

function clearOwnerIdStorage(): void {
  removeStorageKeys(OWNER_ID_STORAGE_KEYS);
}

function readOwnerEmailFromStorage(): string {
  return normalizeEmailForStorage(readFirstStorageValue(OWNER_EMAIL_STORAGE_KEYS));
}

function writeOwnerEmailToStorage(email: string): void {
  const normalizedValue = normalizeEmailForStorage(email);
  if (!normalizedValue) return;

  writeStorageValueToKeys(OWNER_EMAIL_STORAGE_KEYS, normalizedValue);
}

function clearOwnerEmailStorage(): void {
  removeStorageKeys(OWNER_EMAIL_STORAGE_KEYS);
}

function clearOwnerPhoneStorage(): void {
  removeStorageKeys(PHONE_STORAGE_KEYS);
}

function clearOwnerIdentityStorage(): void {
  clearOwnerIdStorage();
  clearOwnerEmailStorage();
  clearOwnerPhoneStorage();
}

function readOwnerIdentityFromStorage(): OwnerIdentity {
  return {
    ownerId: readOwnerIdFromStorage(),
    ownerPhone: readProfilePhoneFromStorage(),
    ownerEmail: readOwnerEmailFromStorage(),
  };
}

function buildOwnerHeaders(
  identity?: Partial<OwnerIdentity>,
): Record<string, string> {
  const currentIdentity = readOwnerIdentityFromStorage();

  const ownerId = normalizeOwnerIdForStorage(
    identity?.ownerId ?? currentIdentity.ownerId,
  );
  const ownerPhone = normalizePhoneCandidate(
    identity?.ownerPhone ?? currentIdentity.ownerPhone,
  );
  const ownerEmail = normalizeEmailForStorage(
    identity?.ownerEmail ?? currentIdentity.ownerEmail,
  );

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
  if (owner.phone) writeProfilePhoneToStorage(String(owner.phone).trim());
}

function syncBillingIdentity(dto: BillingStatusDTO | null | undefined): void {
  if (!dto) return;

  syncOwnerIdentity(dto.owner || null);

  if (dto.ownerPhone) {
    writeProfilePhoneToStorage(String(dto.ownerPhone).trim());
  }
  if (dto.ownerEmail) {
    writeOwnerEmailToStorage(String(dto.ownerEmail).trim());
  }
}

function hasOwnerIdentity(dto: BillingStatusDTO | null | undefined): boolean {
  const ownerId = normalizeOwnerIdForStorage(dto?.owner?.id);
  const ownerPhone = normalizePhoneCandidate(
    String(dto?.owner?.phone || dto?.ownerPhone || "").trim(),
  );
  const ownerEmail = normalizeEmailForStorage(
    String(dto?.owner?.email || dto?.ownerEmail || "").trim(),
  );

  return Boolean(ownerId || ownerPhone || ownerEmail);
}

function isFuturePaidUntil(value: unknown): boolean {
  const rawValue = String(value || "").trim();
  if (!rawValue) return false;

  const date = new Date(rawValue);
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
}

function hasAnyActiveSubscriptionFromPayload(
  dto: BillingStatusDTO | null | undefined,
): boolean {
  if (dto?.subscription?.isActive) return true;

  const status = String(dto?.subscription?.status || "").trim().toUpperCase();
  if (status === "ACTIVE") return true;

  return isFuturePaidUntil(dto?.subscription?.paidUntil);
}

function hasSelectedPlanActiveSubscription(
  dto: BillingStatusDTO | null | undefined,
  selectedPlan: PlanType,
): boolean {
  if (!hasAnyActiveSubscriptionFromPayload(dto)) return false;

  const activePlan = normalizeSubscriptionPlan(
    dto?.subscription?.plan,
    dto?.subscription?.tier,
  );

  if (!activePlan) return false;
  return activePlan === selectedPlan;
}

function resolveBillingStateFromPayload(
  dto: BillingStatusDTO | null | undefined,
  serviceKey: string,
  selectedPlan: PlanType,
): BillingState {
  const explicitState = normalizeBillingStateValue(dto?.state);

  if (
    explicitState === "PROFILE_REQUIRED" ||
    explicitState === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED" ||
    explicitState === "SERVICE_SELECTION_REQUIRED" ||
    explicitState === "SUBSCRIPTION_REQUIRED"
  ) {
    return explicitState;
  }

  if (!hasOwnerIdentity(dto)) {
    return "PROFILE_REQUIRED";
  }

  const verification = dto?.verification;
  const phoneVerified =
    typeof verification?.phoneVerified === "boolean"
      ? verification.phoneVerified
      : null;
  const phoneVerifiedAt = String(verification?.phoneVerifiedAt || "").trim();
  const phoneStatus = String(verification?.phoneVerificationStatus || "")
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

  if (!safeServiceKey(dto?.service?.key || serviceKey)) {
    return "SERVICE_SELECTION_REQUIRED";
  }

  if (hasSelectedPlanActiveSubscription(dto, selectedPlan)) {
    return "ACTIVE";
  }

  if (explicitState === "ACTIVE") {
    const activePlan = normalizeSubscriptionPlan(
      dto?.subscription?.plan,
      dto?.subscription?.tier,
    );

    if (activePlan && activePlan !== selectedPlan) {
      return "SUBSCRIPTION_REQUIRED";
    }

    if (!activePlan && hasAnyActiveSubscriptionFromPayload(dto)) {
      return "ACTIVE";
    }
  }

  return "SUBSCRIPTION_REQUIRED";
}

function isOwnerIdentityError(value: unknown): boolean {
  const normalizedValue = String(value || "").trim().toLowerCase();
  if (!normalizedValue) return false;

  return (
    normalizedValue === "owner not found" ||
    normalizedValue === "owner_identity_required" ||
    normalizedValue.includes("owner not found") ||
    normalizedValue.includes("owner profile not found")
  );
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : error instanceof Error
      ? error.name === "AbortError"
      : false;
}

function formatDisplayNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  if (!Number.isFinite(value)) {
    return PAGE_COPY.unknownValue;
  }

  try {
    return new Intl.NumberFormat(PAGE_FORMATTING_LOCALE, options).format(value);
  } catch {
    return String(value);
  }
}

function formatPriceValue(value: number): string {
  return formatDisplayNumber(value, {
    maximumFractionDigits: 2,
  });
}

function formatSharedDate(value: string | null | undefined): string {
  return formatDateTime(value, PAGE_FORMATTING_LOCALE, {
    fallback: PAGE_COPY.unknownValue,
  });
}

function mapBillingError(rawValue: string): string {
  const value = String(rawValue || "").trim();
  const normalizedValue = value.toUpperCase();

  if (isOwnerIdentityError(value)) {
    return PAGE_COPY.ownerNotFound;
  }
  if (
    normalizedValue === "PROFILE_REQUIRED" ||
    normalizedValue === "OWNER_PROFILE_REQUIRED"
  ) {
    return PAGE_COPY.profileRequiredError;
  }
  if (
    normalizedValue === "PHONE_VERIFICATION_REQUIRED" ||
    normalizedValue === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED"
  ) {
    return PAGE_COPY.phoneVerificationRequiredError;
  }
  if (normalizedValue === "SERVICE_SELECTION_REQUIRED") {
    return PAGE_COPY.serviceSelectionRequiredError;
  }
  if (
    normalizedValue === "SERVICE NOT FOUND" ||
    normalizedValue === "SERVICE_NOT_FOUND" ||
    normalizedValue === "SERVICE NOT FOUND OR INACTIVE" ||
    normalizedValue === "SERVICE_NOT_FOUND_OR_INACTIVE"
  ) {
    return PAGE_COPY.serviceNotFound;
  }
  if (
    normalizedValue === "SERVICEKEY IS REQUIRED" ||
    normalizedValue === "SERVICE_KEY_REQUIRED" ||
    normalizedValue === "SERVICEKEY_REQUIRED"
  ) {
    return PAGE_COPY.serviceKeyRequired;
  }
  if (normalizedValue === "SERVICE_PLUS_PRICING_NOT_CONFIGURED") {
    return PAGE_COPY.plusPriceNotConfiguredError;
  }
  if (normalizedValue === "SERVICE_STANDARD_PRICING_NOT_CONFIGURED") {
    return PAGE_COPY.standardPriceNotConfiguredError;
  }
  if (normalizedValue === "SUBSCRIPTION_ALREADY_ACTIVE") {
    return PAGE_COPY.subscriptionAlreadyActiveError;
  }
  if (normalizedValue === "CHECKOUT_NOT_CREATED") {
    return PAGE_COPY.checkoutNotCreatedError;
  }
  if (normalizedValue === "FORBIDDEN") {
    return PAGE_COPY.forbiddenError;
  }
  if (normalizedValue === "INTERNAL_ERROR") {
    return PAGE_COPY.internalError;
  }

  return value || PAGE_COPY.genericLoadError;
}

function normalizePrice(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsedValue = Number(value);
    if (Number.isFinite(parsedValue) && parsedValue > 0) {
      return parsedValue;
    }
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

function getPlanLabel(plan: PlanType): string {
  return plan === "PLUS"
    ? PAGE_COPY.planPlusLabel
    : PAGE_COPY.planStandardLabel;
}

function getCurrentSubscriptionLabel(
  tier: SubscriptionTier | undefined | null,
  cycle: BillingCycle | undefined | null,
): string {
  if (!tier || !cycle) return PAGE_COPY.unknownValue;

  const planLabel =
    tier === "PREMIUM"
      ? PAGE_COPY.planPlusCycleMonthly
      : PAGE_COPY.planStandardCycleMonthly;
  const cycleLabel =
    cycle === "YEARLY"
      ? PAGE_COPY.cycleYearlyLegacy
      : PAGE_COPY.cycleMonthly;

  return `${planLabel} / ${cycleLabel}`;
}

function getInvoicePlanLabel(
  tier: SubscriptionTier,
  cycle: BillingCycle,
): string {
  const planLabel =
    tier === "PREMIUM"
      ? PAGE_COPY.planPlusCycleMonthly
      : PAGE_COPY.planStandardCycleMonthly;
  const cycleLabel =
    cycle === "YEARLY"
      ? PAGE_COPY.cycleYearlyLegacy
      : PAGE_COPY.cycleMonthly;

  return `${planLabel} / ${cycleLabel}`;
}

function getPlanDescription(plan: PlanType): string {
  return plan === "PLUS"
    ? PAGE_COPY.planPlusDescription
    : PAGE_COPY.planStandardDescription;
}

function getPlanBadgeColor(plan: PlanType): CSSProperties {
  if (plan === "PLUS") {
    return {
      background: "#eef2ff",
      border: "1px solid #c7d2fe",
      color: "#3730a3",
    };
  }

  return {
    background: "#f3f4f6",
    border: "1px solid #e5e7eb",
    color: "#111827",
  };
}

function getVerificationStatusLabel(
  value: string | null | undefined,
): string {
  const normalizedValue = String(value || "").trim().toUpperCase();

  if (normalizedValue === "VERIFIED") {
    return PAGE_COPY.verificationVerifiedText;
  }
  if (normalizedValue === "SENT") {
    return PAGE_COPY.verificationSentText;
  }
  if (normalizedValue === "EXPIRED") {
    return PAGE_COPY.verificationExpiredText;
  }
  if (normalizedValue === "FAILED") {
    return PAGE_COPY.verificationFailedText;
  }
  if (normalizedValue === "REQUIRED") {
    return PAGE_COPY.verificationRequiredText;
  }

  return PAGE_COPY.unknownValue;
}

function getBillingStateLabel(state: BillingState): string {
  if (state === "ACTIVE") return PAGE_COPY.billingStateActive;
  if (state === "SUBSCRIPTION_REQUIRED") {
    return PAGE_COPY.billingStateSubscriptionRequired;
  }
  if (state === "SERVICE_SELECTION_REQUIRED") {
    return PAGE_COPY.billingStateServiceSelectionRequired;
  }
  if (state === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED") {
    return PAGE_COPY.billingStatePhoneVerificationRequired;
  }
  return PAGE_COPY.billingStateProfileRequired;
}

function getSubscriptionStatusLabel(value: unknown): string {
  const normalizedValue = String(value || "").trim().toUpperCase();

  if (normalizedValue === "ACTIVE") {
    return PAGE_COPY.subscriptionStatusActive;
  }
  if (normalizedValue === "PENDING" || normalizedValue === "CREATED") {
    return PAGE_COPY.subscriptionStatusPending;
  }
  if (normalizedValue === "EXPIRED") {
    return PAGE_COPY.subscriptionStatusExpired;
  }
  if (normalizedValue === "CANCELED" || normalizedValue === "CANCELLED") {
    return PAGE_COPY.subscriptionStatusCancelled;
  }
  if (normalizedValue === "FAILED") {
    return PAGE_COPY.subscriptionStatusFailed;
  }
  if (normalizedValue === "INACTIVE" || normalizedValue === "PASSIVE") {
    return PAGE_COPY.subscriptionStatusInactive;
  }

  return normalizedValue || PAGE_COPY.unknownValue;
}

function humanizeServiceKey(serviceKey: string): string {
  const normalizedValue = safeServiceKey(serviceKey);

  if (!normalizedValue) {
    return PAGE_COPY.serviceNameFallback;
  }

  if (
    Object.prototype.hasOwnProperty.call(SERVICE_LABELS_AZ, normalizedValue)
  ) {
    return SERVICE_LABELS_AZ[
      normalizedValue as keyof typeof SERVICE_LABELS_AZ
    ];
  }

  return normalizedValue
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function normalizeSafeNextPath(value: string): string {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) return "";
  if (!normalizedValue.startsWith("/")) return "";
  if (normalizedValue.startsWith("//")) return "";
  return normalizedValue;
}

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function withPageLocaleOnRelativeUrl(urlValue: string): string {
  const trimmedValue = String(urlValue || "").trim();
  if (
    !trimmedValue ||
    isAbsoluteUrl(trimmedValue) ||
    typeof window === "undefined"
  ) {
    return trimmedValue;
  }

  try {
    const url = new URL(trimmedValue, window.location.origin);
    url.searchParams.set("lang", PAGE_LOCALE);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return trimmedValue;
  }
}

function buildHref(
  pathname: string,
  params: Record<string, string | undefined> = {},
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

function buildDashboardUrl(
  serviceKey: string,
  plan: PlanType,
): string {
  return buildHref("/dashboard", {
    serviceKey: serviceKey || undefined,
    plan,
  });
}

function resolvePostBillingNextPath(
  nextPath: string,
  serviceKey: string,
  plan: PlanType,
): string {
  const safeNextPath = withPageLocaleOnRelativeUrl(
    normalizeSafeNextPath(nextPath),
  );

  if (
    !safeNextPath ||
    safeNextPath.startsWith("/billing") ||
    safeNextPath.startsWith("/services") ||
    safeNextPath.startsWith("/profile") ||
    safeNextPath.startsWith("/pay")
  ) {
    return buildDashboardUrl(serviceKey, plan);
  }

  const [pathnameAndQuery, hashPart = ""] = safeNextPath.split("#");
  const [pathname, queryString = ""] = pathnameAndQuery.split("?");
  const searchParams = new URLSearchParams(queryString);

  if (serviceKey) searchParams.set("serviceKey", serviceKey);
  searchParams.set("plan", plan);
  searchParams.set("lang", PAGE_LOCALE);

  const resolvedQueryString = searchParams.toString();
  const hash = hashPart ? `#${hashPart}` : "";

  return `${pathname}${resolvedQueryString ? `?${resolvedQueryString}` : ""}${hash}`;
}

function buildPayUrl(
  phoneE164: string,
  serviceKey: string,
  plan: PlanType,
  nextPath: string,
): string {
  return buildHref("/pay", {
    phone: phoneE164 || undefined,
    serviceKey: serviceKey || undefined,
    plan,
    next: nextPath || undefined,
  });
}

function buildBillingUrl(
  serviceKey: string,
  plan: PlanType,
  nextPath: string,
): string {
  return buildHref("/billing", {
    serviceKey: serviceKey || undefined,
    plan,
    next: nextPath || undefined,
  });
}

function buildServicesUrl(
  serviceKey: string,
  plan: PlanType,
  nextPath: string,
): string {
  const next = buildBillingUrl(serviceKey, plan, nextPath);

  return buildHref("/services", {
    next,
    serviceKey: serviceKey || undefined,
    plan,
  });
}

function buildProfileUrl(
  serviceKey: string,
  plan: PlanType,
  nextPath: string,
): string {
  const next = buildBillingUrl(serviceKey, plan, nextPath);

  return buildHref("/profile", {
    next,
    serviceKey: serviceKey || undefined,
    plan,
  });
}

function buildReceiptUrl(invoiceId: string): string {
  return buildHref("/receipt", {
    invoiceId,
  });
}

function getInvoiceStatusLabel(status: string | null | undefined): string {
  const normalizedValue = String(status || "").trim().toUpperCase();

  if (normalizedValue === "PAID" || normalizedValue === "SUCCESS") {
    return PAGE_COPY.invoiceStatusPaid;
  }
  if (normalizedValue === "PENDING" || normalizedValue === "CREATED") {
    return PAGE_COPY.invoiceStatusPending;
  }
  if (normalizedValue === "CANCELED" || normalizedValue === "CANCELLED") {
    return PAGE_COPY.invoiceStatusCancelled;
  }
  if (normalizedValue === "FAILED") {
    return PAGE_COPY.invoiceStatusFailed;
  }

  return normalizedValue || PAGE_COPY.invoiceStatusUnknown;
}

function buildPlanChangeMessage(
  activePlan: PlanType,
  selectedPlan: PlanType,
): string {
  const activeLabel = getPlanLabel(activePlan);
  const selectedLabel = getPlanLabel(selectedPlan);

  return `${PAGE_COPY.planChangeInfoPrefix} ${activeLabel} ${PAGE_COPY.planChangeInfoMiddle} ${selectedLabel} ${PAGE_COPY.planChangeInfoSuffix}`;
}

function getStateMeta(state: BillingState): {
  badge: string;
  title: string;
  description: string;
  tone: "warning" | "info" | "success";
} {
  if (state === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED") {
    return {
      badge: PAGE_COPY.verificationRequiredBadge,
      title: PAGE_COPY.verificationRequiredTitle,
      description: PAGE_COPY.verificationRequiredDescription,
      tone: "warning",
    };
  }

  if (state === "SERVICE_SELECTION_REQUIRED") {
    return {
      badge: PAGE_COPY.serviceSelectionRequiredBadge,
      title: PAGE_COPY.serviceSelectionRequiredTitle,
      description: PAGE_COPY.serviceSelectionRequiredDescription,
      tone: "info",
    };
  }

  if (state === "SUBSCRIPTION_REQUIRED") {
    return {
      badge: PAGE_COPY.paymentRequiredBadge,
      title: PAGE_COPY.paymentRequiredTitle,
      description: PAGE_COPY.paymentRequiredDescription,
      tone: "success",
    };
  }

  if (state === "ACTIVE") {
    return {
      badge: PAGE_COPY.activeBadge,
      title: PAGE_COPY.activeTitle,
      description: PAGE_COPY.activeDescription,
      tone: "success",
    };
  }

  return {
    badge: PAGE_COPY.profileRequiredBadge,
    title: PAGE_COPY.profileRequiredTitle,
    description: PAGE_COPY.profileRequiredDescription,
    tone: "info",
  };
}

async function fetchJsonWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<{ response: Response; data: BillingStatusDTO }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    const data = (await response.json().catch(() => ({}))) as BillingStatusDTO;
    return { response, data };
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchBillingStatusWithRecovery(
  api: string,
  serviceKey: string,
  phoneCandidate: string,
  selectedPlan: PlanType,
): Promise<{ response: Response; data: BillingStatusDTO }> {
  const searchParams = new URLSearchParams();
  searchParams.set("serviceKey", serviceKey);
  searchParams.set("plan", selectedPlan);

  if (phoneCandidate) {
    searchParams.set("phone", phoneCandidate);
  }

  const url = `${api}/billing/status?${searchParams.toString()}`;
  const currentIdentity = readOwnerIdentityFromStorage();

  const firstAttempt = await fetchJsonWithTimeout(url, {
    method: "GET",
    headers: buildOwnerHeaders(currentIdentity),
  });

  const firstData = firstAttempt.data || {};
  const firstError = String(firstData.error || firstData.message || "").trim();

  if (
    (!firstAttempt.response.ok || !firstData.ok) &&
    isOwnerIdentityError(firstError) &&
    currentIdentity.ownerId &&
    (currentIdentity.ownerPhone || currentIdentity.ownerEmail)
  ) {
    clearOwnerIdStorage();

    const recoveredIdentity: Partial<OwnerIdentity> = {
      ownerPhone: currentIdentity.ownerPhone,
      ownerEmail: currentIdentity.ownerEmail,
    };

    const retryAttempt = await fetchJsonWithTimeout(url, {
      method: "GET",
      headers: buildOwnerHeaders(recoveredIdentity),
    });

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

export default function BillingPage() {
  const router = useRouter();
  const API = useMemo(() => apiBase(), []);
  const direction = PAGE_DIRECTION;

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serviceKey, setServiceKey] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("STANDARD");
  const [data, setData] = useState<BillingStatusDTO | null>(null);
  const [err, setErr] = useState("");

  const resolvedNextPath = useMemo(() => {
    const safeNextPath = normalizeSafeNextPath(getQueryValue(router.query.next));
    if (safeNextPath) {
      return withPageLocaleOnRelativeUrl(safeNextPath);
    }

    return buildDashboardUrl(serviceKey, selectedPlan);
  }, [router.query.next, serviceKey, selectedPlan]);

  const resolvedState = useMemo(() => {
    return resolveBillingStateFromPayload(data, serviceKey, selectedPlan);
  }, [data, serviceKey, selectedPlan]);

  const activeSubscriptionPlan = useMemo<PlanType | "">(() => {
    return normalizeSubscriptionPlan(
      data?.subscription?.plan,
      data?.subscription?.tier,
    );
  }, [data?.subscription?.plan, data?.subscription?.tier]);

  const hasActiveSubscription = useMemo(() => {
    return hasAnyActiveSubscriptionFromPayload(data);
  }, [data]);

  const requiresPlanChange = useMemo(() => {
    return Boolean(
      hasActiveSubscription &&
        activeSubscriptionPlan &&
        activeSubscriptionPlan !== selectedPlan,
    );
  }, [activeSubscriptionPlan, hasActiveSubscription, selectedPlan]);

  const selectedPlanMatchesActiveSubscription = useMemo(() => {
    if (!hasActiveSubscription) return false;
    if (!activeSubscriptionPlan) return false;
    return activeSubscriptionPlan === selectedPlan;
  }, [activeSubscriptionPlan, hasActiveSubscription, selectedPlan]);

  const selectedPlanPrice = useMemo(() => {
    return getSelectedPlanPrice(data?.service, selectedPlan);
  }, [data?.service, selectedPlan]);

  const resolvedOwnerPhone = useMemo(() => {
    return normalizePhoneCandidate(
      String(
        data?.owner?.phone ||
          data?.ownerPhone ||
          readProfilePhoneFromStorage() ||
          "",
      ).trim(),
    );
  }, [data?.owner?.phone, data?.ownerPhone]);

  const displayServiceName = useMemo(() => {
    return humanizeServiceKey(serviceKey);
  }, [serviceKey]);

  const continueAfterBillingHref = useMemo(() => {
    return resolvePostBillingNextPath(
      resolvedNextPath,
      serviceKey,
      selectedPlan,
    );
  }, [resolvedNextPath, serviceKey, selectedPlan]);

  const servicesHref = useMemo(() => {
    return buildServicesUrl(serviceKey, selectedPlan, resolvedNextPath);
  }, [serviceKey, selectedPlan, resolvedNextPath]);

  const profileHref = useMemo(() => {
    return buildProfileUrl(serviceKey, selectedPlan, resolvedNextPath);
  }, [serviceKey, selectedPlan, resolvedNextPath]);

  const dashboardHref = useMemo(() => {
    return buildDashboardUrl(serviceKey, selectedPlan);
  }, [serviceKey, selectedPlan]);

  const baseStateMeta = useMemo(() => {
    return getStateMeta(resolvedState);
  }, [resolvedState]);

  const stateMeta = useMemo(() => {
    if (!requiresPlanChange || !activeSubscriptionPlan) {
      return baseStateMeta;
    }

    const activeLabel = getPlanLabel(activeSubscriptionPlan);
    const selectedLabel = getPlanLabel(selectedPlan);

    return {
      badge: PAGE_COPY.planChangeBadge,
      title: PAGE_COPY.planChangeTitle,
      description: `${PAGE_COPY.planChangeDescriptionPrefix} ${activeLabel} ${PAGE_COPY.planChangeDescriptionMiddle} ${selectedLabel} ${PAGE_COPY.planChangeDescriptionSuffix}`,
      tone: "warning" as const,
    };
  }, [activeSubscriptionPlan, baseStateMeta, requiresPlanChange, selectedPlan]);

  const profileBlocked =
    resolvedState === "PROFILE_REQUIRED" ||
    resolvedState === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED";
  const serviceBlocked = resolvedState === "SERVICE_SELECTION_REQUIRED";
  const plusConfigured = Boolean(data?.service?.diagnostics?.plusConfigured);
  const standardConfigured = Boolean(
    data?.service?.diagnostics?.standardConfigured,
  );

  const canPay =
    !loading &&
    resolvedState === "SUBSCRIPTION_REQUIRED" &&
    Boolean(serviceKey) &&
    selectedPlanPrice !== null &&
    selectedPlanPrice > 0 &&
    Boolean(resolvedOwnerPhone);

  const canContinue =
    !loading &&
    resolvedState === "ACTIVE" &&
    selectedPlanMatchesActiveSubscription &&
    hasActiveSubscription &&
    Boolean(serviceKey) &&
    Boolean(continueAfterBillingHref) &&
    !requiresPlanChange;

  const pricingHint = useMemo(() => {
    if (!data?.service) {
      return PAGE_COPY.pricingWillAppearLater;
    }

    if (selectedPlan === "PLUS" && !plusConfigured) {
      return PAGE_COPY.plusPricingNotConfigured;
    }

    if (selectedPlan === "STANDARD" && !standardConfigured) {
      return PAGE_COPY.standardPricingNotConfigured;
    }

    if (selectedPlanPrice !== null) {
      return `${formatPriceValue(selectedPlanPrice)} ${
        data.service.currency ?? "AZN"
      } • ${PAGE_COPY.pricingActiveDaysSuffix}`;
    }

    return PAGE_COPY.pricingInactive;
  }, [
    data?.service,
    plusConfigured,
    selectedPlan,
    selectedPlanPrice,
    standardConfigured,
  ]);

  const planChangeInfo = useMemo(() => {
    if (!requiresPlanChange || !activeSubscriptionPlan) return "";
    return buildPlanChangeMessage(activeSubscriptionPlan, selectedPlan);
  }, [activeSubscriptionPlan, requiresPlanChange, selectedPlan]);

  useEffect(() => {
    if (!router.isReady) return;

    const queryServiceKey = safeServiceKey(getQueryValue(router.query.serviceKey));
    const storedServiceKey = readServiceKeyFromStorage();
    const resolvedServiceKey = queryServiceKey || storedServiceKey;

    const queryPlan =
      normalizePlanValue(getQueryValue(router.query.plan)) ||
      normalizePlanValue(getQueryValue(router.query.subscriptionTier));
    const storedPlan = readPlanFromStorage();
    const resolvedPlan = queryPlan || storedPlan || "STANDARD";

    const rawNextPath = normalizeSafeNextPath(getQueryValue(router.query.next));
    const nextPathForRedirect = rawNextPath
      ? withPageLocaleOnRelativeUrl(rawNextPath)
      : buildDashboardUrl(resolvedServiceKey, resolvedPlan);

    setSelectedPlan(resolvedPlan);

    if (!resolvedServiceKey) {
      setReady(true);
      clearServiceKeyStorage();
      void router.replace(
        buildServicesUrl("", resolvedPlan, nextPathForRedirect),
        undefined,
        { shallow: true, scroll: false },
      );
      return;
    }

    setServiceKey(resolvedServiceKey);
    setReady(true);

    const currentLang = getQueryValue(router.query.lang);
    if (currentLang !== PAGE_LOCALE) {
      const currentPath =
        normalizeSafeNextPath(router.asPath) ||
        buildBillingUrl(resolvedServiceKey, resolvedPlan, nextPathForRedirect);

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
    router.query.next,
    router.query.plan,
    router.query.serviceKey,
    router.query.subscriptionTier,
  ]);

  useEffect(() => {
    writePlanToStorage(selectedPlan);
  }, [selectedPlan]);

  useEffect(() => {
    if (serviceKey) {
      writeServiceKeyToStorage(serviceKey);
    } else {
      clearServiceKeyStorage();
    }
  }, [serviceKey]);

  const loadStatus = useCallback(async (): Promise<void> => {
    setErr("");
    setLoading(true);

    try {
      const phoneCandidate = normalizePhoneCandidate(readProfilePhoneFromStorage());

      const { response, data: payload } = await fetchBillingStatusWithRecovery(
        API,
        serviceKey,
        phoneCandidate,
        selectedPlan,
      );

      if (!response.ok || !payload?.ok) {
        const rawMessage = String(
          payload?.error || payload?.message || `HTTP ${response.status}`,
        ).trim();

        if (isOwnerIdentityError(rawMessage)) {
          clearOwnerIdentityStorage();
        }

        throw new Error(rawMessage || PAGE_COPY.loadingError);
      }

      syncBillingIdentity(payload);

      setData(payload);
    } catch (error: unknown) {
      setData(null);

      if (isAbortError(error)) {
        setErr(PAGE_COPY.requestTimedOut);
      } else if (error instanceof Error) {
        setErr(mapBillingError(error.message));
      } else {
        setErr(PAGE_COPY.loadingError);
      }
    } finally {
      setLoading(false);
    }
  }, [API, selectedPlan, serviceKey]);

  useEffect(() => {
    if (!ready || !serviceKey) return;
    void loadStatus();
  }, [ready, serviceKey, selectedPlan, loadStatus]);

  function goToPay(): void {
    setErr("");

    if (!serviceKey) {
      setErr(PAGE_COPY.planServiceNotSelected);
      return;
    }

    if (profileBlocked) {
      setErr(
        resolvedState === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED"
          ? PAGE_COPY.phoneOtpRequired
          : PAGE_COPY.profileMustBeCompleted,
      );
      return;
    }

    if (serviceBlocked) {
      setErr(PAGE_COPY.serviceStageRequired);
      return;
    }

    if (resolvedState === "ACTIVE") {
      setErr(PAGE_COPY.activeSubscriptionPreventsPayment);
      return;
    }

    if (!resolvedOwnerPhone) {
      setErr(PAGE_COPY.verifiedOwnerPhoneMissing);
      return;
    }

    if (!selectedPlanPrice || selectedPlanPrice <= 0) {
      setErr(
        selectedPlan === "PLUS"
          ? PAGE_COPY.plusPriceInactive
          : PAGE_COPY.standardPriceInactive,
      );
      return;
    }

    writeProfilePhoneToStorage(resolvedOwnerPhone);
    writeServiceKeyToStorage(serviceKey);
    writePlanToStorage(selectedPlan);

    void router.push(
      buildPayUrl(
        resolvedOwnerPhone,
        serviceKey,
        selectedPlan,
        continueAfterBillingHref,
      ),
    );
  }

  if (!ready) {
    return (
      <div style={{ ...pageStyle, direction }}>
        <div style={shellStyle}>
          <div style={heroCardStyle}>
            <div style={heroInnerStyle}>
              <h1 style={titleStyle}>{PAGE_COPY.pageTitle}</h1>
              <div style={mutedStyle}>{PAGE_COPY.pageLoading}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!serviceKey) return null;

  return (
    <div style={{ ...pageStyle, direction }}>
      <div style={shellStyle}>
        <div style={heroCardStyle}>
          <div style={heroInnerStyle}>
            <div style={heroHeaderStackStyle}>
              <h1 style={titleStyle}>{PAGE_COPY.pageTitle}</h1>
              <p style={subtitleStyle}>{PAGE_COPY.pageSubtitle}</p>
            </div>

            <div style={topActionsStyle}>
              {resolvedState === "ACTIVE" && !requiresPlanChange ? (
                <Link href={dashboardHref} style={secondaryLinkStyle}>
                  {PAGE_COPY.dashboardBack}
                </Link>
              ) : (
                <span style={disabledPillStyle}>{PAGE_COPY.dashboardLocked}</span>
              )}

              <Link href={servicesHref} style={secondaryLinkStyle}>
                {PAGE_COPY.changePlanAndService}
              </Link>

              {profileBlocked ? (
                <Link href={profileHref} style={secondaryLinkStyle}>
                  {PAGE_COPY.goToProfile}
                </Link>
              ) : null}

              {canContinue && continueAfterBillingHref !== dashboardHref ? (
                <Link href={continueAfterBillingHref} style={secondaryLinkStyle}>
                  {PAGE_COPY.continue}
                </Link>
              ) : null}
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

          {data?.verification ? (
            <div style={verificationRowStyle}>
              <div style={verificationItemStyle}>
                <div style={detailLabelStyle}>{PAGE_COPY.phoneVerificationLabel}</div>
                <div style={detailValueStyle}>
                  {data.verification.phoneVerified
                    ? PAGE_COPY.verifiedYes
                    : PAGE_COPY.verifiedNo}
                </div>
              </div>

              <div style={verificationItemStyle}>
                <div style={detailLabelStyle}>{PAGE_COPY.verificationStatusLabel}</div>
                <div style={detailValueStyle}>
                  {getVerificationStatusLabel(
                    data.verification.phoneVerificationStatus,
                  )}
                </div>
              </div>

              <div style={verificationItemStyle}>
                <div style={detailLabelStyle}>
                  {requiresPlanChange ||
                  resolvedState === "SUBSCRIPTION_REQUIRED" ||
                  resolvedState === "ACTIVE"
                    ? PAGE_COPY.paidUntilLabel
                    : PAGE_COPY.verifiedAtLabel}
                </div>
                <div style={detailValueStyle}>
                  {formatSharedDate(
                    requiresPlanChange ||
                      resolvedState === "SUBSCRIPTION_REQUIRED" ||
                      resolvedState === "ACTIVE"
                      ? data.subscription?.paidUntil
                      : data.verification.phoneVerifiedAt,
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div style={cardStyle}>
          <div style={sectionTitleStyle}>{PAGE_COPY.ownerSectionTitle}</div>

          <div style={detailsGridStyleWide}>
            <DetailRow
              label={PAGE_COPY.ownerLabel}
              value={String(data?.owner?.name || data?.ownerName || PAGE_COPY.unknownValue)}
            />
            <DetailRow
              label={PAGE_COPY.ownerPhoneLabel}
              value={resolvedOwnerPhone || PAGE_COPY.unknownValue}
            />
            <DetailRow
              label={PAGE_COPY.ownerEmailLabel}
              value={String(
                data?.owner?.email || data?.ownerEmail || PAGE_COPY.unknownValue,
              )}
            />
            <DetailRow label={PAGE_COPY.serviceLabel} value={displayServiceName} />
            <DetailRow label={PAGE_COPY.serviceKeyLabel} value={serviceKey} />
            <DetailRow
              label={PAGE_COPY.serviceActiveLabel}
              value={data?.service?.isActive ? PAGE_COPY.yesLabel : PAGE_COPY.noLabel}
            />
          </div>

          <div style={hintBoxStyle}>{PAGE_COPY.identityHint}</div>
        </div>

        <div style={cardStyle}>
          <div style={sectionTitleStyle}>{PAGE_COPY.selectedPlanStatusTitle}</div>

          <div style={selectionInfoCardStyle}>
            <div style={selectionTopRowStyle}>
              <div style={selectionCopyStyle}>
                <div style={fieldLabelStyle}>{PAGE_COPY.serviceLabel}</div>
                <div style={selectionTitleStyle}>
                  {displayServiceName} • {getPlanLabel(selectedPlan)}
                </div>
              </div>

              <div style={{ ...planPillStyle, ...getPlanBadgeColor(selectedPlan) }}>
                {getPlanLabel(selectedPlan)}
              </div>
            </div>

            <div style={selectionMetaStyle}>{pricingHint}</div>
            <div style={selectionDescriptionStyle}>
              {getPlanDescription(selectedPlan)}
            </div>

            {requiresPlanChange && planChangeInfo ? (
              <div style={planChangeBoxStyle}>{planChangeInfo}</div>
            ) : null}

            {selectedPlan === "PLUS" && !plusConfigured ? (
              <div style={pricingWarningStyle}>
                {PAGE_COPY.plusPricingWarningPrefix}
                <code style={inlineCodeStyle}>premiumMonthlyPrice</code>
                {PAGE_COPY.plusPricingWarningMiddle}
                <code style={inlineCodeStyle}>plusMonthlyPrice</code>
                {PAGE_COPY.plusPricingWarningSuffix}
              </div>
            ) : null}

            {selectedPlan === "STANDARD" && !standardConfigured ? (
              <div style={pricingWarningStyle}>{PAGE_COPY.standardPricingWarning}</div>
            ) : null}

            <div style={actionsRowStyle}>
              <button
                type="button"
                onClick={() => void loadStatus()}
                style={{
                  ...primaryButtonStyle,
                  ...(loading ? disabledLightButtonStyle : {}),
                }}
                disabled={loading}
              >
                {loading ? PAGE_COPY.refreshingStatus : PAGE_COPY.refreshStatus}
              </button>

              <button
                type="button"
                onClick={goToPay}
                style={{
                  ...darkButtonStyle,
                  ...(!canPay ? disabledDarkButtonStyle : {}),
                }}
                disabled={!canPay}
                title={
                  profileBlocked
                    ? PAGE_COPY.profileMustBeCompleted
                    : serviceBlocked
                      ? PAGE_COPY.serviceStageRequired
                      : resolvedState === "ACTIVE"
                        ? PAGE_COPY.activeSubscriptionPreventsPayment
                        : selectedPlanPrice === null
                          ? selectedPlan === "PLUS"
                            ? PAGE_COPY.plusPriceInactive
                            : PAGE_COPY.standardPriceInactive
                          : ""
                }
              >
                {resolvedState === "ACTIVE"
                  ? PAGE_COPY.activeStatusLocked
                  : PAGE_COPY.goToPayment}
              </button>

              {canContinue ? (
                <Link href={continueAfterBillingHref} style={secondaryLinkStyle}>
                  {PAGE_COPY.continue}
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {err ? (
          <div style={errorBoxStyle}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>
              {PAGE_COPY.errorTitle}
            </div>
            <div>{err}</div>
          </div>
        ) : null}

        {data ? (
          <div style={cardStyle}>
            <div style={statusHeaderRowStyle}>
              <div style={sectionTitleStyle}>{PAGE_COPY.subscriptionStatusTitle}</div>

              <div
                style={{
                  ...statusBadgeStyle,
                  ...(resolvedState === "ACTIVE"
                    ? activeBadgeStyle
                    : inactiveBadgeStyle),
                }}
              >
                {resolvedState === "ACTIVE"
                  ? PAGE_COPY.activeStatusText
                  : PAGE_COPY.inactiveStatusText}
              </div>
            </div>

            {requiresPlanChange ? (
              <div style={planChangeBoxStyle}>{planChangeInfo}</div>
            ) : resolvedState === "ACTIVE" ? (
              <div style={activeInfoBoxStyle}>{PAGE_COPY.activeInfo}</div>
            ) : resolvedState === "SUBSCRIPTION_REQUIRED" ? (
              <div style={inactiveInfoBoxStyle}>
                {PAGE_COPY.subscriptionRequiredInfo}
              </div>
            ) : profileBlocked ? (
              <div style={inactiveInfoBoxStyle}>{PAGE_COPY.billingLockedInfo}</div>
            ) : resolvedState === "SERVICE_SELECTION_REQUIRED" ? (
              <div style={inactiveInfoBoxStyle}>
                {PAGE_COPY.billingContextNotReadyInfo}
              </div>
            ) : null}

            <div style={detailsGridStyle}>
              <DetailRow
                label={PAGE_COPY.currentBillingStateLabel}
                value={getBillingStateLabel(resolvedState)}
              />
              <DetailRow
                label={PAGE_COPY.currentSubscriptionStatusLabel}
                value={getSubscriptionStatusLabel(data.subscription?.status)}
              />
              <DetailRow
                label={PAGE_COPY.currentActivePlanLabel}
                value={getCurrentSubscriptionLabel(
                  data.subscription?.tier ?? undefined,
                  data.subscription?.billingCycle ?? undefined,
                )}
              />
              <DetailRow
                label={PAGE_COPY.paidUntilLabel}
                value={formatSharedDate(data.subscription?.paidUntil)}
              />
              <DetailRow
                label={PAGE_COPY.daysLeftLabel}
                value={
                  typeof data.subscription?.daysLeft === "number"
                    ? formatDisplayNumber(data.subscription.daysLeft, {
                        maximumFractionDigits: 0,
                      })
                    : PAGE_COPY.unknownValue
                }
              />
              <DetailRow
                label={PAGE_COPY.selectedPlanLabel}
                value={getPlanLabel(selectedPlan)}
              />
            </div>

            <div style={{ marginTop: 20 }}>
              <div style={fieldLabelStyle}>{PAGE_COPY.lastInvoiceLabel}</div>

              {data.lastInvoice ? (
                <div style={invoiceCardStyle}>
                  <div style={invoiceTopRowStyle}>
                    <div style={invoiceCopyStyle}>
                      <div style={invoiceStatusStyle}>
                        {getInvoiceStatusLabel(data.lastInvoice.status)}
                      </div>
                      <div style={invoiceMetaStyle}>
                        {formatPriceValue(data.lastInvoice.amount)}{" "}
                        {data.lastInvoice.currency} • {data.lastInvoice.provider}
                      </div>
                      <div style={invoiceMetaStyle}>
                        {getInvoicePlanLabel(
                          data.lastInvoice.subscriptionTier,
                          data.lastInvoice.billingCycle,
                        )}
                      </div>
                      {data.lastInvoice.receiptNumber ? (
                        <div style={invoiceMetaStyle}>
                          {PAGE_COPY.receiptPrefix}: {data.lastInvoice.receiptNumber}
                        </div>
                      ) : null}
                    </div>

                    <Link
                      href={buildReceiptUrl(data.lastInvoice.id)}
                      style={secondaryLinkStyle}
                    >
                      {PAGE_COPY.receiptView}
                    </Link>
                  </div>

                  <div style={invoiceMetaStyle}>
                    {PAGE_COPY.paidAtPrefix}:{" "}
                    {formatSharedDate(data.lastInvoice.paidAt)}
                  </div>

                  {resolvedState === "SUBSCRIPTION_REQUIRED" ? (
                    <div style={actionsRowStyle}>
                      <button
                        type="button"
                        onClick={goToPay}
                        style={{
                          ...darkButtonStyle,
                          ...(!canPay ? disabledDarkButtonStyle : {}),
                        }}
                        disabled={!canPay}
                      >
                        {PAGE_COPY.renewOrPay}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div style={hintBoxStyle}>{PAGE_COPY.noInvoiceYet}</div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={detailItemStyle}>
      <div style={detailLabelStyle}>{label}</div>
      <div style={detailValueStyle}>{value}</div>
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
  padding: "0 0 32px",
  overflowX: "clip",
};

const shellStyle: CSSProperties = {
  width: "100%",
  maxWidth: 1280,
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
  maxWidth: 1280,
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
  fontSize: "clamp(2rem, 5vw, 2.9rem)",
  lineHeight: 1.06,
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

const topActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: 10,
};

const cardStyle: CSSProperties = {
  background: `
    radial-gradient(circle at top right, rgba(163, 230, 53, 0.08), transparent 22%),
    radial-gradient(circle at bottom left, rgba(37, 99, 235, 0.08), transparent 24%),
    linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)
  `,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: 22,
  padding: "clamp(18px, 2.5vw, 22px)",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
  boxSizing: "border-box",
};

const gateCardStyle: CSSProperties = {
  borderRadius: 24,
  padding: "clamp(18px, 2.7vw, 24px)",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  boxShadow: "0 12px 26px rgba(15, 23, 42, 0.05)",
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
  fontWeight: 900,
  lineHeight: 1.2,
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

const verificationRowStyle: CSSProperties = {
  marginTop: 16,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
  gap: 12,
};

const verificationItemStyle: CSSProperties = {
  padding: "12px 13px",
  borderRadius: 14,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(6px)",
  minWidth: 0,
  boxSizing: "border-box",
};

const sectionTitleStyle: CSSProperties = {
  fontSize: "clamp(1.05rem, 2vw, 1.15rem)",
  fontWeight: 900,
  color: "#0f172a",
  letterSpacing: "-0.02em",
  lineHeight: 1.3,
};

const fieldLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: "#334155",
  lineHeight: 1.5,
};

const planPillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 34,
  maxWidth: "100%",
  padding: "0 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.12)",
  lineHeight: 1.3,
  textAlign: "center",
  overflowWrap: "anywhere",
};

const selectionInfoCardStyle: CSSProperties = {
  marginTop: 16,
  borderRadius: 22,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background: `
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.10), transparent 24%),
    radial-gradient(circle at bottom left, rgba(163, 230, 53, 0.08), transparent 20%),
    linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)
  `,
  padding: "clamp(16px, 2.3vw, 20px)",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
  boxSizing: "border-box",
};

const selectionTopRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
};

const selectionCopyStyle: CSSProperties = {
  minWidth: 0,
  flex: "1 1 260px",
};

const selectionTitleStyle: CSSProperties = {
  marginTop: 6,
  fontSize: "clamp(1.15rem, 2.6vw, 1.3rem)",
  fontWeight: 900,
  color: "#0f172a",
  letterSpacing: "-0.02em",
  lineHeight: 1.3,
  overflowWrap: "anywhere",
};

const selectionMetaStyle: CSSProperties = {
  marginTop: 8,
  color: "#64748b",
  fontSize: 14,
  lineHeight: 1.7,
  overflowWrap: "anywhere",
};

const selectionDescriptionStyle: CSSProperties = {
  marginTop: 10,
  color: "#475569",
  fontSize: 14,
  lineHeight: 1.8,
};

const pricingWarningStyle: CSSProperties = {
  marginTop: 12,
  padding: "14px 15px",
  borderRadius: 14,
  border: "1px solid rgba(245, 158, 11, 0.28)",
  background: "linear-gradient(180deg, #fffdf7 0%, #fff7e8 100%)",
  color: "#92400e",
  fontWeight: 700,
  lineHeight: 1.7,
  boxSizing: "border-box",
  overflowWrap: "anywhere",
};

const planChangeBoxStyle: CSSProperties = {
  marginTop: 12,
  padding: "14px 15px",
  borderRadius: 14,
  border: "1px solid rgba(249, 115, 22, 0.24)",
  background: "linear-gradient(180deg, #fffaf5 0%, #fff7ed 100%)",
  color: "#9a3412",
  fontWeight: 700,
  lineHeight: 1.7,
  boxSizing: "border-box",
  overflowWrap: "anywhere",
};

const inlineCodeStyle: CSSProperties = {
  display: "inline-block",
  maxWidth: "100%",
  padding: "2px 8px",
  borderRadius: 8,
  background: "#ffffff",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  color: "#0f172a",
  fontWeight: 800,
  margin: "0 4px",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
  boxSizing: "border-box",
};

const actionsRowStyle: CSSProperties = {
  marginTop: 18,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: 10,
};

const primaryButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: 48,
  padding: "12px 16px",
  borderRadius: 14,
  background: "#ffffff",
  color: "#0f172a",
  border: "1px solid rgba(15, 23, 42, 0.10)",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.06)",
  textAlign: "center",
  lineHeight: 1.3,
  boxSizing: "border-box",
};

const disabledLightButtonStyle: CSSProperties = {
  opacity: 0.68,
  cursor: "not-allowed",
};

const darkButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: 48,
  padding: "12px 16px",
  borderRadius: 14,
  background: "#0f172a",
  color: "#ffffff",
  border: "1px solid #0f172a",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 10px 20px rgba(15, 23, 42, 0.14)",
  textAlign: "center",
  lineHeight: 1.3,
  boxSizing: "border-box",
};

const disabledDarkButtonStyle: CSSProperties = {
  background: "#94a3b8",
  border: "1px solid #94a3b8",
  cursor: "not-allowed",
};

const secondaryLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  minHeight: 48,
  padding: "12px 16px",
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

const disabledPillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  minHeight: 48,
  padding: "12px 16px",
  borderRadius: 14,
  background: "#f8fafc",
  color: "#94a3b8",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  fontWeight: 800,
  textAlign: "center",
  lineHeight: 1.3,
  cursor: "not-allowed",
  boxSizing: "border-box",
};

const errorBoxStyle: CSSProperties = {
  padding: "14px 16px",
  border: "1px solid rgba(239, 68, 68, 0.24)",
  background: "linear-gradient(180deg, #fffafa 0%, #fef2f2 100%)",
  color: "#991b1b",
  borderRadius: 16,
  fontWeight: 700,
  lineHeight: 1.7,
  boxSizing: "border-box",
  overflowWrap: "anywhere",
};

const statusHeaderRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 16,
};

const statusBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 36,
  maxWidth: "100%",
  padding: "6px 12px",
  borderRadius: 999,
  fontWeight: 900,
  lineHeight: 1.3,
  textAlign: "center",
  overflowWrap: "anywhere",
};

const activeBadgeStyle: CSSProperties = {
  background: "#f0fdf4",
  color: "#166534",
  border: "1px solid rgba(34, 197, 94, 0.24)",
};

const inactiveBadgeStyle: CSSProperties = {
  background: "#fef2f2",
  color: "#991b1b",
  border: "1px solid rgba(239, 68, 68, 0.24)",
};

const activeInfoBoxStyle: CSSProperties = {
  marginBottom: 16,
  padding: "14px 15px",
  borderRadius: 14,
  border: "1px solid rgba(34, 197, 94, 0.24)",
  background: "linear-gradient(180deg, #f8fff9 0%, #edfdf2 100%)",
  color: "#166534",
  fontWeight: 700,
  lineHeight: 1.7,
  boxSizing: "border-box",
};

const inactiveInfoBoxStyle: CSSProperties = {
  marginBottom: 16,
  padding: "14px 15px",
  borderRadius: 14,
  border: "1px solid rgba(245, 158, 11, 0.28)",
  background: "linear-gradient(180deg, #fffdf7 0%, #fff7e8 100%)",
  color: "#92400e",
  fontWeight: 700,
  lineHeight: 1.7,
  boxSizing: "border-box",
};

const detailsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
  gap: 12,
};

const detailsGridStyleWide: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
  gap: 12,
  marginTop: 16,
};

const detailItemStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  padding: "14px 15px",
  borderRadius: 16,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background: "rgba(255,255,255,0.78)",
  minWidth: 0,
  boxSizing: "border-box",
};

const detailLabelStyle: CSSProperties = {
  fontWeight: 800,
  color: "#334155",
  fontSize: 13,
  lineHeight: 1.5,
};

const detailValueStyle: CSSProperties = {
  color: "#0f172a",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
  lineHeight: 1.7,
};

const invoiceCardStyle: CSSProperties = {
  marginTop: 10,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: 18,
  padding: "16px 16px 17px",
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.05)",
  boxSizing: "border-box",
};

const invoiceTopRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "flex-start",
};

const invoiceCopyStyle: CSSProperties = {
  minWidth: 0,
  flex: "1 1 260px",
};

const invoiceStatusStyle: CSSProperties = {
  fontWeight: 900,
  color: "#0f172a",
  lineHeight: 1.4,
  overflowWrap: "anywhere",
};

const invoiceMetaStyle: CSSProperties = {
  marginTop: 4,
  color: "#64748b",
  fontSize: 14,
  lineHeight: 1.65,
  overflowWrap: "anywhere",
};

const hintBoxStyle: CSSProperties = {
  marginTop: 14,
  padding: "14px 15px",
  borderRadius: 14,
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  color: "#64748b",
  lineHeight: 1.75,
  boxSizing: "border-box",
};