import type { CSSProperties } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import type { Locale } from "i18n-core";
import type { AppMessagesCatalog } from "i18n-messages";
import { buildLocaleQuery, useI18n } from "i18n-react";

function apiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    "http://127.0.0.1:3001"
  ).trim();
}

const REQUEST_TIMEOUT_MS = 15000;

const PAGE_COPY = {
  loadingContext: "Xidmət konteksti yoxlanılır...",
  pageTitle: "Elanlarım",
  pageSubtitleSuffix: "xidməti üzrə elanlar burada göstərilir.",
  selectedService: "Seçilmiş xidmət",
  createNewListing: "Yeni elan yarat",
  backToDashboard: "İdarəetmə panelinə qayıt",
  changeService: "Xidməti dəyiş",
  successTitle: "Uğurlu",
  errorTitle: "Xəta",
  goToBilling: "Billing səhifəsinə keç",
  loadingItems: "Elanlar yüklənir...",
  emptyTitle: "Bu xidmət üzrə hələ elan yoxdur",
  emptySubtitle: "İlk elanı yaratmaq üçün aşağıdakı düymədən istifadə edin.",
  imageLoadFailed: "Şəkil yüklənmədi",
  noImage: "Şəkil yoxdur",
  imageCountSuffix: "şəkil",
  hidden: "Gizlidir",
  visible: "Aktiv görünür",
  cityAreaSeparator: " / ",
  roomSuffix: "otaq",
  locationLabel: "Konum",
  sourceLabel: "Mənbə",
  coordinatesLabel: "Koordinatlar",
  edit: "Redaktə et",
  deleting: "Silinir...",
  delete: "Sil",
  deleteConfirmSuffix: "elanını silmək istəyirsiniz?",
  deleteRemovedAlready: "elanı artıq aktiv deyildi və siyahıdan çıxarıldı.",
  deleteSuccess: "elanı silindi.",
  subscriptionRequired: "Bu xidmət üçün aktiv abunəlik tələb olunur.",
  loadFailed: "Elanlar yüklənmədi.",
  serviceNotFound: "Xidmət tapılmadı və ya aktiv deyil.",
  profileRequired: "Əvvəl sahibkar profilini tamamlayın.",
  phoneVerificationRequired: "Telefon təsdiqi tamamlanmalıdır.",
  serviceSelectionRequired: "Əvvəl xidmət seçimi tamamlanmalıdır.",
  propertyNotFound: "Elan tapılmadı və ya artıq aktiv deyil.",
  internalError: "Server xətası baş verdi. Bir az sonra yenidən cəhd edin.",
  pricingEmpty: "Qiymət məlumatı yoxdur",
  hourly: "Saatlıq",
  daily: "Günlük",
  weekly: "Həftəlik",
  monthly: "Aylıq",
  yearly: "İllik",
  priceLabel: "Qiymət",
  currentDeviceLocation: "Cari cihaz konumu",
  mapPicker: "Xəritə seçimi",
  manualLocation: "Əl ilə daxil edilmiş konum",
  serviceFallback: "Xidmət",
} as const;

const SERVICE_LABELS_AZ = {
  RENT_HOME: "Ev kirayəsi",
  BARBER: "Bərbər",
  CAR_RENTAL: "Avtomobil icarəsi",
  HOTEL: "Otelçilik",
  BEAUTY_SALON: "Gözəllik salonu",
  BABYSITTER: "Uşaq baxıcısı",
  CLEANING: "Təmizlik xidmətləri",
  TECHNICAL_SERVICES: "Texniki xidmətlər",
} as const;

type PropertyPricing = {
  id?: string;
  type?: string;
  unitPrice?: number | null;
};

type PropertyImage = {
  id?: string;
  url?: string | null;
  imageUrl?: string | null;
  src?: string | null;
  path?: string | null;
  filePath?: string | null;
  sortOrder?: number | null;
  order?: number | null;
  position?: number | null;
};

type LocationSource = "MANUAL" | "CURRENT_DEVICE" | "MAP_PICKER";

type Property = {
  id: string;
  title: string;
  city: string;
  areaName: string;
  roomCount: number;
  location?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  locationPlaceId?: string | null;
  locationSource?: LocationSource | null;
  rulesText?: string | null;
  isVisible?: boolean;
  pricings?: PropertyPricing[];
  serviceKey?: string | null;
  priceHour?: number | null;
  priceDay?: number | null;
  priceWeek?: number | null;
  priceMonth?: number | null;
  priceYear?: number | null;
  imageCount?: number | null;
  images?: PropertyImage[] | null;
  imageUrl?: string | null;
  imageUrls?: Array<string | null> | null;
  coverImageUrl?: string | null;
  coverPhotoUrl?: string | null;
  primaryImageUrl?: string | null;
  primaryPhotoUrl?: string | null;
};

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

function getQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0]?.trim() || "";
  }

  return value?.trim() || "";
}

function safeServiceKey(value: unknown): string {
  const normalizedValue = String(value ?? "").trim().toUpperCase();

  if (!normalizedValue) return "";
  if (!/^[A-Z0-9_-]{2,64}$/.test(normalizedValue)) return "";

  return normalizedValue;
}

function digitsOnly(input: string): string {
  return String(input || "").replace(/[^\d]/g, "");
}

function isValidE164(value: string): boolean {
  const normalizedValue = String(value || "").trim();
  return /^\+[1-9]\d{7,14}$/.test(normalizedValue);
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

function normalizePhoneForStorage(value: unknown): string {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) return "";

  const normalizedValue = rawValue.startsWith("+")
    ? `+${digitsOnly(rawValue)}`
    : `+${digitsOnly(rawValue)}`;

  return isValidE164(normalizedValue) ? normalizedValue : "";
}

function readFirstStorageValue(keys: readonly string[]): string {
  if (typeof window === "undefined") return "";

  for (const key of keys) {
    const value = String(window.localStorage.getItem(key) || "").trim();
    if (value) return value;
  }

  return "";
}

function writeStorageValue(keys: readonly string[], value: string): void {
  if (typeof window === "undefined") return;

  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) return;

  for (const key of keys) {
    window.localStorage.setItem(key, normalizedValue);
  }
}

function getServiceKeyFromStorage(): string {
  return safeServiceKey(readFirstStorageValue(SERVICE_STORAGE_KEYS));
}

function getPhoneFromStorage(): string {
  return normalizePhoneForStorage(readFirstStorageValue(PHONE_STORAGE_KEYS));
}

function getOwnerIdFromStorage(): string {
  return normalizeOwnerIdForStorage(readFirstStorageValue(OWNER_ID_STORAGE_KEYS));
}

function getOwnerEmailFromStorage(): string {
  return normalizeEmailForStorage(readFirstStorageValue(OWNER_EMAIL_STORAGE_KEYS));
}

function writeServiceKeyToStorage(serviceKey: string): void {
  const normalizedValue = safeServiceKey(serviceKey);
  if (!normalizedValue) return;

  writeStorageValue(SERVICE_STORAGE_KEYS, normalizedValue);
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
  const ownerPhone = getPhoneFromStorage();
  const ownerEmail = getOwnerEmailFromStorage();

  return sanitizeHeadersRecord({
    ...(ownerId ? { "x-owner-id": ownerId } : {}),
    ...(ownerPhone ? { "x-owner-phone": ownerPhone } : {}),
    ...(ownerEmail ? { "x-owner-email": ownerEmail } : {}),
  });
}

function buildHref(
  pathname: string,
  locale: Locale,
  params: Record<string, string | undefined> = {},
): string {
  const queryRecord = buildLocaleQuery({}, locale);

  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;
    queryRecord[key] = value;
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(queryRecord)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, item);
      }
      continue;
    }

    if (typeof value === "string") {
      searchParams.set(key, value);
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

function buildServicesUrl(
  nextPath: string,
  locale: Locale,
  serviceKey?: string,
): string {
  return buildHref("/services", locale, {
    next: nextPath || undefined,
    serviceKey: serviceKey || undefined,
  });
}

function buildProfileUrl(
  serviceKey: string,
  nextPath: string,
  locale: Locale,
): string {
  return buildHref("/profile", locale, {
    serviceKey: serviceKey || undefined,
    next: nextPath || undefined,
  });
}

function buildPropertiesUrl(serviceKey: string, locale: Locale): string {
  return buildHref("/properties", locale, {
    serviceKey: serviceKey || undefined,
  });
}

function buildDashboardUrl(serviceKey: string, locale: Locale): string {
  return buildHref("/dashboard", locale, {
    serviceKey: serviceKey || undefined,
  });
}

function buildCreateUrl(serviceKey: string, locale: Locale): string {
  return buildHref("/properties/create", locale, {
    serviceKey: serviceKey || undefined,
  });
}

function buildEditUrl(
  serviceKey: string,
  propertyId: string,
  locale: Locale,
): string {
  return buildHref("/properties/create", locale, {
    serviceKey: serviceKey || undefined,
    propertyId: propertyId || undefined,
    mode: "edit",
  });
}

function buildBillingUrl(serviceKey: string, locale: Locale): string {
  return buildHref("/billing", locale, {
    serviceKey: serviceKey || undefined,
  });
}

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function humanizeServiceKey(serviceKey: string): string {
  const normalizedServiceKey = safeServiceKey(serviceKey);

  if (!normalizedServiceKey) {
    return PAGE_COPY.serviceFallback;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      SERVICE_LABELS_AZ,
      normalizedServiceKey,
    )
  ) {
    return SERVICE_LABELS_AZ[
      normalizedServiceKey as keyof typeof SERVICE_LABELS_AZ
    ];
  }

  return normalizedServiceKey
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function getReadableError(rawValue: string): string {
  const value = String(rawValue || "").trim();

  if (!value) return PAGE_COPY.loadFailed;
  if (value === "SUBSCRIPTION_REQUIRED") {
    return PAGE_COPY.subscriptionRequired;
  }
  if (value === "service not found or inactive") {
    return PAGE_COPY.serviceNotFound;
  }
  if (value === "PROFILE_REQUIRED") {
    return PAGE_COPY.profileRequired;
  }
  if (value === "PHONE_VERIFICATION_REQUIRED") {
    return PAGE_COPY.phoneVerificationRequired;
  }
  if (value === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED") {
    return PAGE_COPY.phoneVerificationRequired;
  }
  if (value === "SERVICE_SELECTION_REQUIRED") {
    return PAGE_COPY.serviceSelectionRequired;
  }
  if (value === "PROPERTY_NOT_FOUND") {
    return PAGE_COPY.propertyNotFound;
  }
  if (value === "internal_error" || value === "INTERNAL_ERROR") {
    return PAGE_COPY.internalError;
  }

  return value;
}

function formatDisplayNumber(
  value: number,
  formattingLocale: string,
  options?: Intl.NumberFormatOptions,
): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  try {
    return new Intl.NumberFormat(formattingLocale, options).format(value);
  } catch {
    return String(value);
  }
}

function formatPriceValue(value: number, formattingLocale: string): string {
  return formatDisplayNumber(value, formattingLocale, {
    maximumFractionDigits: 2,
  });
}

function getPricingSummary(
  property: Property,
  formattingLocale: string,
): string {
  const topLevelPrices = [
    typeof property.priceHour === "number" && property.priceHour > 0
      ? `${PAGE_COPY.hourly}: ${formatPriceValue(property.priceHour, formattingLocale)}`
      : null,
    typeof property.priceDay === "number" && property.priceDay > 0
      ? `${PAGE_COPY.daily}: ${formatPriceValue(property.priceDay, formattingLocale)}`
      : null,
    typeof property.priceWeek === "number" && property.priceWeek > 0
      ? `${PAGE_COPY.weekly}: ${formatPriceValue(property.priceWeek, formattingLocale)}`
      : null,
    typeof property.priceMonth === "number" && property.priceMonth > 0
      ? `${PAGE_COPY.monthly}: ${formatPriceValue(property.priceMonth, formattingLocale)}`
      : null,
    typeof property.priceYear === "number" && property.priceYear > 0
      ? `${PAGE_COPY.yearly}: ${formatPriceValue(property.priceYear, formattingLocale)}`
      : null,
  ].filter(Boolean) as string[];

  if (topLevelPrices.length > 0) {
    return topLevelPrices.join(" • ");
  }

  const pricings = property.pricings;
  if (!Array.isArray(pricings) || pricings.length === 0) {
    return PAGE_COPY.pricingEmpty;
  }

  const labels: Record<string, string> = {
    HOURLY: PAGE_COPY.hourly,
    DAILY: PAGE_COPY.daily,
    WEEKLY: PAGE_COPY.weekly,
    MONTHLY: PAGE_COPY.monthly,
    YEARLY: PAGE_COPY.yearly,
  };

  const normalizedPricing = pricings
    .filter(
      (item) =>
        typeof item?.unitPrice === "number" && Number.isFinite(item.unitPrice),
    )
    .sort((a, b) => String(a.type || "").localeCompare(String(b.type || "")))
    .map((item) => {
      const typeKey = String(item.type || "").toUpperCase();
      const label = labels[typeKey] || item.type || PAGE_COPY.priceLabel;

      return `${label}: ${formatPriceValue(item.unitPrice as number, formattingLocale)}`;
    });

  return normalizedPricing.length > 0
    ? normalizedPricing.join(" • ")
    : PAGE_COPY.pricingEmpty;
}

function normalizeImageUrl(value: unknown): string {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) return "";
  if (/[\u0000-\u001F\u007F<>"'`]/.test(rawValue)) return "";
  if (/^(javascript|data|vbscript):/i.test(rawValue)) return "";

  return rawValue;
}

function toAbsoluteImageUrl(rawValue: unknown, api: string): string {
  const normalizedValue = normalizeImageUrl(rawValue);
  if (!normalizedValue) return "";

  if (/^https?:\/\//i.test(normalizedValue)) {
    return normalizedValue;
  }

  const cleanBase = String(api || "").trim().replace(/\/+$/, "");
  if (!cleanBase) return normalizedValue;

  if (normalizedValue.startsWith("//")) {
    try {
      const baseUrl = new URL(cleanBase);
      return `${baseUrl.protocol}${normalizedValue}`;
    } catch {
      return `http:${normalizedValue}`;
    }
  }

  if (normalizedValue.startsWith("/")) {
    return `${cleanBase}${normalizedValue}`;
  }

  return `${cleanBase}/${normalizedValue.replace(/^\/+/, "")}`;
}

function getImageSortOrder(image: PropertyImage): number {
  if (typeof image.sortOrder === "number" && Number.isFinite(image.sortOrder)) {
    return image.sortOrder;
  }
  if (typeof image.order === "number" && Number.isFinite(image.order)) {
    return image.order;
  }
  if (typeof image.position === "number" && Number.isFinite(image.position)) {
    return image.position;
  }

  return Number.MAX_SAFE_INTEGER;
}

function collectPropertyImageCandidates(
  property: Property,
  api: string,
): string[] {
  const candidates: string[] = [];

  const pushCandidate = (value: unknown) => {
    const normalizedValue = toAbsoluteImageUrl(value, api);
    if (!normalizedValue) return;

    if (!candidates.includes(normalizedValue)) {
      candidates.push(normalizedValue);
    }
  };

  pushCandidate(property.coverImageUrl);
  pushCandidate(property.coverPhotoUrl);
  pushCandidate(property.primaryImageUrl);
  pushCandidate(property.primaryPhotoUrl);
  pushCandidate(property.imageUrl);

  if (Array.isArray(property.imageUrls)) {
    for (const item of property.imageUrls) {
      pushCandidate(item);
    }
  }

  if (Array.isArray(property.images) && property.images.length > 0) {
    const sortedImages = [...property.images].sort(
      (a, b) => getImageSortOrder(a) - getImageSortOrder(b),
    );

    for (const image of sortedImages) {
      pushCandidate(image?.url);
      pushCandidate(image?.imageUrl);
      pushCandidate(image?.src);
      pushCandidate(image?.path);
      pushCandidate(image?.filePath);
    }
  }

  return candidates;
}

function getPropertyCoverImage(
  property: Property,
  api: string,
  failedUrls: string[],
): string {
  const failedUrlSet = new Set(failedUrls);
  const candidates = collectPropertyImageCandidates(property, api);

  for (const candidate of candidates) {
    if (!failedUrlSet.has(candidate)) {
      return candidate;
    }
  }

  return "";
}

function getPropertyImageCount(property: Property, api: string): number {
  if (
    typeof property.imageCount === "number" &&
    Number.isFinite(property.imageCount)
  ) {
    return Math.max(0, Math.trunc(property.imageCount));
  }

  return collectPropertyImageCandidates(property, api).length;
}

function getLocationSourceLabel(source: Property["locationSource"]): string {
  const normalizedValue = String(source || "").trim().toUpperCase();

  if (normalizedValue === "CURRENT_DEVICE") {
    return PAGE_COPY.currentDeviceLocation;
  }
  if (normalizedValue === "MAP_PICKER") {
    return PAGE_COPY.mapPicker;
  }

  return PAGE_COPY.manualLocation;
}

function getCoordinateSummary(
  property: Property,
  formattingLocale: string,
): string {
  const lat =
    typeof property.locationLat === "number" && Number.isFinite(property.locationLat)
      ? property.locationLat
      : null;
  const lng =
    typeof property.locationLng === "number" && Number.isFinite(property.locationLng)
      ? property.locationLng
      : null;

  if (lat === null || lng === null) return "";

  const formatterOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 6,
    maximumFractionDigits: 6,
  };

  return `${formatDisplayNumber(lat, formattingLocale, formatterOptions)}, ${formatDisplayNumber(lng, formattingLocale, formatterOptions)}`;
}

export default function PropertiesPage() {
  const router = useRouter();
  const { locale, direction, formattingLocale } =
    useI18n<AppMessagesCatalog>();
  const API = useMemo(() => apiBase(), []);

  const [items, setItems] = useState<Property[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [serviceKey, setServiceKey] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [actionInfo, setActionInfo] = useState("");
  const [failedImagesByProperty, setFailedImagesByProperty] =
    useState<Record<string, string[]>>({});

  const resolvedServiceKey = useMemo(() => {
    const fromQuery = safeServiceKey(getQueryValue(router.query.serviceKey));
    return fromQuery || serviceKey;
  }, [router.query.serviceKey, serviceKey]);

  const displayServiceName = useMemo(() => {
    return humanizeServiceKey(resolvedServiceKey);
  }, [resolvedServiceKey]);

  const dashboardHref = useMemo(() => {
    return buildDashboardUrl(resolvedServiceKey, locale);
  }, [resolvedServiceKey, locale]);

  const createHref = useMemo(() => {
    return buildCreateUrl(resolvedServiceKey, locale);
  }, [resolvedServiceKey, locale]);

  const billingHref = useMemo(() => {
    return buildBillingUrl(resolvedServiceKey, locale);
  }, [resolvedServiceKey, locale]);

  const propertiesHref = useMemo(() => {
    return buildPropertiesUrl(resolvedServiceKey, locale);
  }, [resolvedServiceKey, locale]);

  const servicesHref = useMemo(() => {
    return buildServicesUrl(propertiesHref, locale, resolvedServiceKey);
  }, [propertiesHref, locale, resolvedServiceKey]);

  useEffect(() => {
    if (!router.isReady) return;

    const fromQuery = safeServiceKey(getQueryValue(router.query.serviceKey));
    const fromStorage = getServiceKeyFromStorage();
    const resolvedValue = fromQuery || fromStorage;

    if (!resolvedValue) {
      setReady(true);
      void router.replace(buildServicesUrl("/properties", locale));
      return;
    }

    writeServiceKeyToStorage(resolvedValue);
    setServiceKey(resolvedValue);
    setReady(true);

    const currentLang = getQueryValue(router.query.lang);
    if (!currentLang) {
      void router.replace(
        {
          pathname: router.pathname,
          query: buildLocaleQuery(
            {
              ...router.query,
              serviceKey: resolvedValue,
            },
            locale,
          ),
        },
        undefined,
        { shallow: true },
      );
    }
  }, [router.isReady, router.query.serviceKey, router.query.lang, router, locale]);

  async function handleOwnerAccessRedirect(
    rawMessage: string,
    payload?: { redirectUrl?: string | null } | null,
  ): Promise<boolean> {
    if (!resolvedServiceKey) return false;

    if (rawMessage === "PROFILE_REQUIRED") {
      await router.replace(
        buildProfileUrl(
          resolvedServiceKey,
          buildPropertiesUrl(resolvedServiceKey, locale),
          locale,
        ),
      );
      return true;
    }

    if (
      rawMessage === "PHONE_VERIFICATION_REQUIRED" ||
      rawMessage === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED"
    ) {
      await router.replace(
        buildProfileUrl(
          resolvedServiceKey,
          buildPropertiesUrl(resolvedServiceKey, locale),
          locale,
        ),
      );
      return true;
    }

    if (rawMessage === "SERVICE_SELECTION_REQUIRED") {
      await router.replace(
        buildServicesUrl(
          buildPropertiesUrl(resolvedServiceKey, locale),
          locale,
          resolvedServiceKey,
        ),
      );
      return true;
    }

    if (rawMessage === "SUBSCRIPTION_REQUIRED") {
      const redirectUrl = String(payload?.redirectUrl || "").trim();

      if (redirectUrl) {
        if (isAbsoluteUrl(redirectUrl)) {
          window.location.assign(redirectUrl);
          return true;
        }

        await router.replace(redirectUrl);
        return true;
      }

      await router.replace(buildBillingUrl(resolvedServiceKey, locale));
      return true;
    }

    return false;
  }

  async function loadProperties(): Promise<void> {
    if (!resolvedServiceKey) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      setLoading(true);
      setErr("");

      const searchParams = new URLSearchParams();
      searchParams.set("serviceKey", resolvedServiceKey);

      const storedPhone = getPhoneFromStorage();
      if (storedPhone) {
        searchParams.set("phone", storedPhone);
      }

      const url = `${API}/owner/properties?${searchParams.toString()}`;
      const response = await fetch(url, {
        method: "GET",
        headers: buildOwnerHeaders(),
        signal: controller.signal,
      });

      const payload = (await response.json().catch(() => ({}))) as {
        items?: Property[];
        message?: string;
        error?: string;
        redirectUrl?: string | null;
      };
      const rawMessage = String(payload?.message || payload?.error || "").trim();

      if (!response.ok) {
        const redirected = await handleOwnerAccessRedirect(rawMessage, payload);
        if (redirected) return;

        throw new Error(rawMessage || `HTTP ${response.status}`);
      }

      setItems(Array.isArray(payload.items) ? payload.items : []);
      setFailedImagesByProperty({});
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        error.name === "AbortError"
      ) {
        setItems([]);
        setErr(PAGE_COPY.internalError);
        return;
      }

      const message =
        typeof error === "object" && error !== null && "message" in error
          ? String(error.message || "")
          : "Load error";

      setItems([]);
      setErr(getReadableError(message));
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!ready || !resolvedServiceKey) return;
    void loadProperties();
  }, [ready, resolvedServiceKey, locale]);

  async function handleDeleteProperty(property: Property): Promise<void> {
    if (!resolvedServiceKey || !property?.id) return;

    const confirmed = window.confirm(
      `“${property.title}” ${PAGE_COPY.deleteConfirmSuffix}`,
    );
    if (!confirmed) return;

    setActionInfo("");
    setErr("");
    setDeletingId(property.id);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const searchParams = new URLSearchParams();
      searchParams.set("serviceKey", resolvedServiceKey);

      const storedPhone = getPhoneFromStorage();
      if (storedPhone) {
        searchParams.set("phone", storedPhone);
      }

      const url = `${API}/owner/properties/${encodeURIComponent(property.id)}?${searchParams.toString()}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers: buildOwnerHeaders(),
        signal: controller.signal,
      });

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        error?: string;
        redirectUrl?: string | null;
      };
      const rawMessage = String(payload?.message || payload?.error || "").trim();

      if (!response.ok || !payload?.ok) {
        if (rawMessage === "PROPERTY_NOT_FOUND") {
          setItems((prev: Property[]) =>
            prev.filter((item: Property) => item.id !== property.id),
          );
          setActionInfo(`“${property.title}” ${PAGE_COPY.deleteRemovedAlready}`);
          return;
        }

        const redirected = await handleOwnerAccessRedirect(rawMessage, payload);
        if (redirected) return;

        throw new Error(rawMessage || `HTTP ${response.status}`);
      }

      setItems((prev: Property[]) =>
        prev.filter((item: Property) => item.id !== property.id),
      );
      setActionInfo(`“${property.title}” ${PAGE_COPY.deleteSuccess}`);
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        error.name === "AbortError"
      ) {
        setErr(PAGE_COPY.internalError);
      } else {
        const message =
          typeof error === "object" && error !== null && "message" in error
            ? String(error.message || "")
            : "Delete error";
        setErr(getReadableError(message));
      }
    } finally {
      window.clearTimeout(timeout);
      setDeletingId("");
    }
  }

  function handleImageError(propertyId: string, src: string): void {
    if (!propertyId || !src) return;

    setFailedImagesByProperty((prev: Record<string, string[]>) => {
      const current = Array.isArray(prev[propertyId]) ? prev[propertyId] : [];
      if (current.includes(src)) return prev;

      return {
        ...prev,
        [propertyId]: [...current, src],
      };
    });
  }

  if (!ready) {
    return (
      <div style={{ ...pageStyle, direction }}>
        <div style={shellStyle}>
          <div style={heroCardStyle}>
            <div style={heroInnerStyle}>
              <h1 style={titleStyle}>{PAGE_COPY.pageTitle}</h1>
              <p style={subtitleStyle}>{PAGE_COPY.loadingContext}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!resolvedServiceKey) return null;

  return (
    <div style={{ ...pageStyle, direction }}>
      <div style={shellStyle}>
        <div style={heroCardStyle}>
          <div style={heroInnerStyle}>
            <div style={heroHeaderStackStyle}>
              <h1 style={titleStyle}>{PAGE_COPY.pageTitle}</h1>
              <p style={subtitleStyle}>
                {displayServiceName} {PAGE_COPY.pageSubtitleSuffix}
              </p>
            </div>

            <div style={contextCardStyle}>
              <div style={contextLabelStyle}>{PAGE_COPY.selectedService}</div>
              <div style={contextTitleStyle}>{displayServiceName}</div>
              <div style={contextSubtextStyle}>{resolvedServiceKey}</div>
            </div>

            <div style={topActionsStyle}>
              <Link href={createHref} style={primaryLinkStyle}>
                {PAGE_COPY.createNewListing}
              </Link>

              <Link href={dashboardHref} style={secondaryLinkStyle}>
                {PAGE_COPY.backToDashboard}
              </Link>

              <Link href={servicesHref} style={secondaryLinkStyle}>
                {PAGE_COPY.changeService}
              </Link>
            </div>
          </div>
        </div>

        {actionInfo ? (
          <div style={successBoxStyle}>
            <div style={messageTitleStyle}>{PAGE_COPY.successTitle}</div>
            <div style={messageTextStyle}>{actionInfo}</div>
          </div>
        ) : null}

        {err ? (
          <div style={errorBoxStyle}>
            <div style={messageTitleStyle}>{PAGE_COPY.errorTitle}</div>
            <div style={messageTextStyle}>{err}</div>

            {err === PAGE_COPY.subscriptionRequired ? (
              <div style={messageActionsStyle}>
                <Link href={billingHref} style={secondaryLinkStyle}>
                  {PAGE_COPY.goToBilling}
                </Link>

                <Link href={servicesHref} style={secondaryLinkStyle}>
                  {PAGE_COPY.changeService}
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}

        {loading ? (
          <div style={cardStyle}>
            <div style={mutedStyle}>{PAGE_COPY.loadingItems}</div>
          </div>
        ) : null}

        {!loading && !err && items.length === 0 ? (
          <div style={cardStyle}>
            <div style={emptyTitleStyle}>{PAGE_COPY.emptyTitle}</div>
            <div style={mutedStyle}>{PAGE_COPY.emptySubtitle}</div>

            <div style={emptyActionWrapStyle}>
              <Link href={createHref} style={primaryLinkStyle}>
                {PAGE_COPY.createNewListing}
              </Link>
            </div>
          </div>
        ) : null}

        {!loading && !err && items.length > 0 ? (
          <div style={listStyle}>
            {items.map((property) => {
              const isDeleting = deletingId === property.id;
              const editHref = buildEditUrl(
                resolvedServiceKey,
                property.id,
                locale,
              );
              const failedUrls = failedImagesByProperty[property.id] || [];
              const coverImage = getPropertyCoverImage(property, API, failedUrls);
              const imageCount = getPropertyImageCount(property, API);
              const coordinateSummary = getCoordinateSummary(
                property,
                formattingLocale,
              );

              return (
                <div key={property.id} style={propertyCardStyle}>
                  <div style={propertyLayoutStyle}>
                    <div style={mediaColumnStyle}>
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={property.title}
                          style={coverImageStyle}
                          loading="lazy"
                          onError={() => handleImageError(property.id, coverImage)}
                        />
                      ) : (
                        <div style={coverPlaceholderStyle}>
                          {imageCount > 0
                            ? PAGE_COPY.imageLoadFailed
                            : PAGE_COPY.noImage}
                        </div>
                      )}

                      <div style={mediaMetaRowStyle}>
                        <span style={imageCountBadgeStyle}>
                          {formatDisplayNumber(imageCount, formattingLocale, {
                            maximumFractionDigits: 0,
                          })}{" "}
                          {PAGE_COPY.imageCountSuffix}
                        </span>
                        <span
                          style={{
                            ...statusBadgeStyle,
                            ...(property.isVisible === false
                              ? hiddenBadgeStyle
                              : visibleBadgeStyle),
                          }}
                        >
                          {property.isVisible === false
                            ? PAGE_COPY.hidden
                            : PAGE_COPY.visible}
                        </span>
                      </div>
                    </div>

                    <div style={contentColumnStyle}>
                      <div style={propertyHeaderStyle}>
                        <div style={propertyTextColumnStyle}>
                          <div style={propertyTitleStyle}>{property.title}</div>

                          <div style={propertyMetaStyle}>
                            {property.city}
                            {PAGE_COPY.cityAreaSeparator}
                            {property.areaName} •{" "}
                            {formatDisplayNumber(
                              property.roomCount,
                              formattingLocale,
                              { maximumFractionDigits: 0 },
                            )}{" "}
                            {PAGE_COPY.roomSuffix}
                          </div>

                          {property.location ? (
                            <div style={propertySubMetaStyle}>
                              {PAGE_COPY.locationLabel}: {property.location}
                            </div>
                          ) : null}

                          {property.locationSource ? (
                            <div style={propertySubMetaStyle}>
                              {PAGE_COPY.sourceLabel}:{" "}
                              {getLocationSourceLabel(property.locationSource)}
                            </div>
                          ) : null}

                          {coordinateSummary ? (
                            <div style={propertySubMetaStyle}>
                              {PAGE_COPY.coordinatesLabel}: {coordinateSummary}
                            </div>
                          ) : null}

                          <div style={propertySubMetaStyle}>
                            {getPricingSummary(property, formattingLocale)}
                          </div>

                          {property.rulesText ? (
                            <div style={rulesPreviewStyle}>{property.rulesText}</div>
                          ) : null}
                        </div>

                        <div style={propertyActionsRowStyle}>
                          <Link
                            href={editHref}
                            aria-disabled={isDeleting}
                            style={{
                              ...secondaryLinkStyle,
                              ...(isDeleting ? disabledButtonStyle : {}),
                            }}
                          >
                            {PAGE_COPY.edit}
                          </Link>

                          <button
                            type="button"
                            onClick={() => void handleDeleteProperty(property)}
                            disabled={isDeleting}
                            style={{
                              ...dangerButtonStyle,
                              ...(isDeleting ? disabledButtonStyle : {}),
                            }}
                          >
                            {isDeleting ? PAGE_COPY.deleting : PAGE_COPY.delete}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
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
  padding: "0 0 36px",
  overflowX: "clip",
};

const shellStyle: CSSProperties = {
  width: "100%",
  maxWidth: 1320,
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
  maxWidth: 1320,
  margin: "0 auto",
  padding: "clamp(22px, 4vw, 38px) 16px clamp(24px, 4vw, 34px)",
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
  fontSize: "clamp(0.96rem, 2.2vw, 1rem)",
  lineHeight: 1.8,
  color: "#475569",
  maxWidth: 920,
  minWidth: 0,
};

const contextCardStyle: CSSProperties = {
  marginTop: 2,
  minWidth: 0,
  borderRadius: 22,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background: `
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.10), transparent 24%),
    radial-gradient(circle at bottom left, rgba(163, 230, 53, 0.08), transparent 20%),
    linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)
  `,
  padding: "clamp(16px, 2.6vw, 20px)",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
  boxSizing: "border-box",
};

const contextLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const contextTitleStyle: CSSProperties = {
  marginTop: 10,
  fontSize: "clamp(1.35rem, 3vw, 1.7rem)",
  fontWeight: 900,
  color: "#0f172a",
  letterSpacing: "-0.02em",
  lineHeight: 1.18,
  overflowWrap: "anywhere",
};

const contextSubtextStyle: CSSProperties = {
  marginTop: 8,
  color: "#64748b",
  fontSize: 13,
  wordBreak: "break-word",
  overflowWrap: "anywhere",
  lineHeight: 1.7,
};

const topActionsStyle: CSSProperties = {
  marginTop: 2,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: 10,
  alignItems: "stretch",
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

const listStyle: CSSProperties = {
  display: "grid",
  gap: 16,
};

const propertyCardStyle: CSSProperties = {
  background: `
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.10), transparent 24%),
    radial-gradient(circle at bottom left, rgba(163, 230, 53, 0.08), transparent 20%),
    linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)
  `,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: 22,
  padding: "clamp(16px, 2.4vw, 20px)",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
  boxSizing: "border-box",
  overflow: "hidden",
};

const propertyLayoutStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 18,
  alignItems: "stretch",
  minWidth: 0,
};

const mediaColumnStyle: CSSProperties = {
  display: "grid",
  gap: 12,
  flex: "0 1 260px",
  minWidth: "min(100%, 240px)",
};

const contentColumnStyle: CSSProperties = {
  flex: "1 1 340px",
  minWidth: 0,
};

const coverImageStyle: CSSProperties = {
  width: "100%",
  height: 184,
  objectFit: "cover",
  borderRadius: 16,
  border: "1px solid rgba(15, 23, 42, 0.10)",
  background: "#ffffff",
  display: "block",
};

const coverPlaceholderStyle: CSSProperties = {
  width: "100%",
  height: 184,
  borderRadius: 16,
  border: "1px dashed rgba(15, 23, 42, 0.18)",
  background: "rgba(255,255,255,0.72)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  color: "#475569",
  fontWeight: 800,
  padding: "0 14px",
  lineHeight: 1.5,
  boxSizing: "border-box",
};

const mediaMetaRowStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
  minWidth: 0,
};

const imageCountBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 30,
  maxWidth: "100%",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.2,
  textAlign: "center",
  background: "#eef4ff",
  color: "#1d4ed8",
  border: "1px solid rgba(59, 130, 246, 0.20)",
  overflowWrap: "anywhere",
  boxSizing: "border-box",
};

const propertyHeaderStyle: CSSProperties = {
  display: "grid",
  gap: 16,
  minWidth: 0,
};

const propertyTextColumnStyle: CSSProperties = {
  minWidth: 0,
};

const propertyTitleStyle: CSSProperties = {
  fontSize: "clamp(1.2rem, 2.8vw, 1.45rem)",
  fontWeight: 900,
  color: "#0f172a",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
  lineHeight: 1.22,
  letterSpacing: "-0.02em",
};

const propertyMetaStyle: CSSProperties = {
  marginTop: 8,
  color: "#2563eb",
  fontSize: 15,
  lineHeight: 1.75,
  fontWeight: 700,
  wordBreak: "break-word",
  overflowWrap: "anywhere",
};

const propertySubMetaStyle: CSSProperties = {
  marginTop: 8,
  color: "#475569",
  fontSize: 14,
  lineHeight: 1.75,
  wordBreak: "break-word",
  overflowWrap: "anywhere",
};

const rulesPreviewStyle: CSSProperties = {
  marginTop: 12,
  padding: "12px 13px",
  borderRadius: 14,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background: "rgba(255,255,255,0.72)",
  color: "#334155",
  fontSize: 13,
  lineHeight: 1.75,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
  boxSizing: "border-box",
};

const propertyActionsRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))",
  gap: 10,
  alignItems: "stretch",
};

const statusBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 30,
  maxWidth: "100%",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.2,
  textAlign: "center",
  overflowWrap: "anywhere",
  boxSizing: "border-box",
};

const visibleBadgeStyle: CSSProperties = {
  background: "#f0fdf4",
  color: "#166534",
  border: "1px solid rgba(34, 197, 94, 0.24)",
};

const hiddenBadgeStyle: CSSProperties = {
  background: "#fef2f2",
  color: "#991b1b",
  border: "1px solid rgba(239, 68, 68, 0.24)",
};

const emptyTitleStyle: CSSProperties = {
  fontSize: "clamp(1.15rem, 2.8vw, 1.28rem)",
  fontWeight: 900,
  color: "#0f172a",
  marginBottom: 8,
  letterSpacing: "-0.02em",
  lineHeight: 1.25,
};

const emptyActionWrapStyle: CSSProperties = {
  marginTop: 18,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: 10,
};

const mutedStyle: CSSProperties = {
  color: "#64748b",
  lineHeight: 1.75,
  fontSize: 14,
};

const errorBoxStyle: CSSProperties = {
  padding: "14px 16px",
  border: "1px solid rgba(239, 68, 68, 0.24)",
  background: "linear-gradient(180deg, #fffafa 0%, #fef2f2 100%)",
  color: "#991b1b",
  borderRadius: 16,
  fontWeight: 700,
  lineHeight: 1.65,
  boxSizing: "border-box",
};

const successBoxStyle: CSSProperties = {
  padding: "14px 16px",
  border: "1px solid rgba(34, 197, 94, 0.24)",
  background: "linear-gradient(180deg, #f8fff9 0%, #edfdf2 100%)",
  color: "#166534",
  borderRadius: 16,
  fontWeight: 700,
  lineHeight: 1.65,
  boxSizing: "border-box",
};

const messageTitleStyle: CSSProperties = {
  fontWeight: 900,
  marginBottom: 6,
  lineHeight: 1.35,
};

const messageTextStyle: CSSProperties = {
  lineHeight: 1.7,
  wordBreak: "break-word",
  overflowWrap: "anywhere",
};

const messageActionsStyle: CSSProperties = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
  gap: 10,
};

const primaryLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  minHeight: 48,
  padding: "12px 16px",
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

const dangerButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  minHeight: 48,
  padding: "12px 16px",
  borderRadius: 14,
  background: "#7f1d1d",
  color: "#ffffff",
  border: "1px solid #7f1d1d",
  fontWeight: 800,
  cursor: "pointer",
  textDecoration: "none",
  textAlign: "center",
  lineHeight: 1.3,
  boxShadow: "0 10px 20px rgba(127, 29, 29, 0.16)",
  boxSizing: "border-box",
};

const disabledButtonStyle: CSSProperties = {
  opacity: 0.6,
  pointerEvents: "none",
};