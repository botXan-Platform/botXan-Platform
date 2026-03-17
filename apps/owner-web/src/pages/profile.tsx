import type { ChangeEvent, CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
const OWNER_BIO_MAX_LENGTH = 1000;
const OWNER_NAME_MAX_LENGTH = 120;
const OWNER_EMAIL_MAX_LENGTH = 254;
const OWNER_PROFILE_PHOTO_MAX_LENGTH = 2048;
const PROFILE_PHOTO_MAX_FILE_BYTES = 5 * 1024 * 1024;
const PROFILE_PHOTO_ACCEPT = "image/jpeg,image/png,image/webp,image/jpg";
const PROFILE_PHOTO_ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

type OwnerFlowState =
  | "PROFILE_REQUIRED"
  | "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED"
  | "SERVICE_SELECTION_REQUIRED";

type VerificationStatus =
  | "REQUIRED"
  | "SENT"
  | "VERIFIED"
  | "EXPIRED"
  | "FAILED";

type VerificationInfo = {
  canSendOtp?: boolean;
  canVerifyOtp?: boolean;
};

type ProfileDTO = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  bio?: string | null;
  profilePhotoUrl?: string | null;
  hasProfilePhoto?: boolean;
  profileExists?: boolean;
  profileCompleted?: boolean;
  phoneVerified?: boolean;
  phoneVerifiedAt?: string | null;
  phoneVerificationStatus?: string | null;
  pendingPhone?: string | null;
};

type ProfileResponseDTO = {
  ok?: boolean;
  state?: OwnerFlowState;
  owner?: ProfileDTO | null;
  profileExists?: boolean;
  profileCompleted?: boolean;
  phoneVerified?: boolean;
  phoneVerifiedAt?: string | null;
  phoneVerificationStatus?: string | null;
  verification?: VerificationInfo;
  message?: string;
  expiresAt?: string;
  testOtp?: string;
  cooldownSeconds?: number;
  count?: number;
  attemptsLeft?: number;
};

type FormState = {
  name: string;
  email: string;
  bio: string;
  profilePhotoUrl: string;
};

type Country = {
  iso2: string;
  name: string;
  dial: string;
  minNationalLength: number;
  maxNationalLength: number;
  allowedPrefixes?: string[];
};

type UploadResponseData = {
  ok?: boolean;
  message?: string;
  count?: number;
  url?: string;
  path?: string;
  mediaUrl?: string;
  fileUrl?: string;
  profilePhotoUrl?: string;
  owner?: {
    profilePhotoUrl?: string | null;
  } | null;
  data?: {
    url?: string;
    path?: string;
    mediaUrl?: string;
    fileUrl?: string;
    profilePhotoUrl?: string;
  } | null;
};

const COUNTRIES: Country[] = [
  {
    iso2: "AZ",
    name: "Azərbaycan",
    dial: "+994",
    minNationalLength: 9,
    maxNationalLength: 9,
    allowedPrefixes: ["10", "50", "51", "55", "70", "77", "99"],
  },
  {
    iso2: "TR",
    name: "Türkiyə",
    dial: "+90",
    minNationalLength: 10,
    maxNationalLength: 10,
  },
  {
    iso2: "GE",
    name: "Gürcüstan",
    dial: "+995",
    minNationalLength: 9,
    maxNationalLength: 9,
  },
  {
    iso2: "RU",
    name: "Rusiya",
    dial: "+7",
    minNationalLength: 10,
    maxNationalLength: 10,
  },
  {
    iso2: "UA",
    name: "Ukrayna",
    dial: "+380",
    minNationalLength: 9,
    maxNationalLength: 9,
  },
  {
    iso2: "KZ",
    name: "Qazaxıstan",
    dial: "+7",
    minNationalLength: 10,
    maxNationalLength: 10,
  },
  {
    iso2: "AE",
    name: "BƏƏ",
    dial: "+971",
    minNationalLength: 9,
    maxNationalLength: 9,
  },
  {
    iso2: "SA",
    name: "Səudiyyə Ərəbistanı",
    dial: "+966",
    minNationalLength: 9,
    maxNationalLength: 9,
  },
  {
    iso2: "DE",
    name: "Almaniya",
    dial: "+49",
    minNationalLength: 10,
    maxNationalLength: 11,
  },
  {
    iso2: "FR",
    name: "Fransa",
    dial: "+33",
    minNationalLength: 9,
    maxNationalLength: 9,
  },
  {
    iso2: "GB",
    name: "Birləşmiş Krallıq",
    dial: "+44",
    minNationalLength: 10,
    maxNationalLength: 10,
  },
  {
    iso2: "US",
    name: "ABŞ",
    dial: "+1",
    minNationalLength: 10,
    maxNationalLength: 10,
  },
  {
    iso2: "CN",
    name: "Çin",
    dial: "+86",
    minNationalLength: 11,
    maxNationalLength: 11,
  },
  {
    iso2: "IN",
    name: "Hindistan",
    dial: "+91",
    minNationalLength: 10,
    maxNationalLength: 10,
  },
  {
    iso2: "BD",
    name: "Banqladeş",
    dial: "+880",
    minNationalLength: 10,
    maxNationalLength: 10,
  },
  {
    iso2: "BR",
    name: "Braziliya",
    dial: "+55",
    minNationalLength: 10,
    maxNationalLength: 11,
  },
  {
    iso2: "PT",
    name: "Portuqaliya",
    dial: "+351",
    minNationalLength: 9,
    maxNationalLength: 9,
  },
  {
    iso2: "ID",
    name: "İndoneziya",
    dial: "+62",
    minNationalLength: 9,
    maxNationalLength: 11,
  },
  {
    iso2: "PH",
    name: "Filippin",
    dial: "+63",
    minNationalLength: 10,
    maxNationalLength: 10,
  },
  {
    iso2: "ES",
    name: "İspaniya",
    dial: "+34",
    minNationalLength: 9,
    maxNationalLength: 9,
  },
  {
    iso2: "PK",
    name: "Pakistan",
    dial: "+92",
    minNationalLength: 10,
    maxNationalLength: 10,
  },
  {
    iso2: "IT",
    name: "İtaliya",
    dial: "+39",
    minNationalLength: 9,
    maxNationalLength: 10,
  },
  {
    iso2: "NG",
    name: "Nigeriya",
    dial: "+234",
    minNationalLength: 10,
    maxNationalLength: 10,
  },
  {
    iso2: "EG",
    name: "Misir",
    dial: "+20",
    minNationalLength: 10,
    maxNationalLength: 10,
  },
];

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

const SERVICE_LABELS_AZ = {
  RENT_HOME: "Ev kirayəsi",
  BARBER: "Bərbərlik xidməti",
  CAR_RENTAL: "Avtomobil icarəsi",
  HOTEL: "Otel xidməti",
  BEAUTY_SALON: "Gözəllik salonu",
  BABYSITTER: "Uşaq baxıcılığı",
  CLEANING: "Təmizlik xidmətləri",
  TECHNICAL_SERVICES: "Texniki xidmətlər",
} as const;

const PAGE_COPY = {
  pageTitle: "Şəxsi məlumatlar",
  pageLoading: "botXan sahibkar profil konteksti yoxlanılır...",
  heroSubtitle:
    "botXan sahibkar profili bu mərhələdə məcburidir. Bütün xanalar doldurulmadan xidmət axını davam etməyəcək. Telefon OTP ilə təsdiqlənmədən sahibkar aktiv hesab edilmir.",
  selectedServiceLabel: "Seçilmiş xidmət",
  serviceNotSelectedHelp:
    "Xidmət hələ seçilməyib. Profili indi doldurub daha sonra xidmət mərhələsinə qayıda bilərsiniz.",
  stateBadgeProfileRequired: "Profil tələb olunur",
  stateTitleProfileRequired: "Sahibkar məlumatları məcburidir",
  stateDescriptionProfileRequired:
    "Xidmətlərdən yararlanmaq üçün əvvəlcə sahibkar məlumatlarını daxil etməlisiniz. Profil tamamlanmadan axın davam etmir.",
  stateBadgePhoneRequired: "Telefon təsdiqi tələb olunur",
  stateTitlePhoneRequired:
    "Profil yadda saxlanılıb, lakin sahibkar hələ aktiv deyil",
  stateDescriptionPhoneRequired:
    "Telefon OTP ilə təsdiqlənmədən sahibkar aktiv hesab edilmir. İdarəetmə paneli, ödəniş bölməsi və xidmətin davamı bağlı qalır.",
  stateBadgeReady: "Profil tamamdır",
  stateTitleReady: "Profil tamamlandı",
  stateDescriptionReady:
    "Profil və telefon təsdiqi tamamlandıqdan sonra növbəti addım xidmət seçimidir. İdarəetmə panelinə giriş artıq açılır.",
  profileStatusLabel: "Profil statusu",
  profileStatusMissing: "Məlumat gözlənilir",
  profileStatusDraft: "Qaralama yaradılıb",
  profileStatusReady: "Hazırdır",
  phoneVerificationLabel: "Telefon təsdiqi",
  phoneVerificationDone: "Təsdiqlənib",
  phoneVerificationPending: "Təsdiqlənməyib",
  verificationStatusLabel: "Təsdiq statusu",
  otpWarning:
    "Telefon OTP ilə təsdiqlənmədən idarəetmə paneli, ödəniş bölməsi və xidmətin davamı bağlı qalır.",
  otpVerifiedAtPrefix: "Telefon təsdiq tarixi",
  errorPrefix: "Xəta",
  loading: "Yüklənir...",
  previewLabel: "Profil önizləməsi",
  previewFallbackName: "Sahibkar adı",
  previewFallbackBio:
    "Rezervasiya təsdiqlənənədək istifadəçilərə görünəcək qısa bio burada göstəriləcək.",
  fieldName: "Ad",
  fieldEmail: "E-poçt",
  fieldProfilePhoto: "Profil şəkli",
  photoReplace: "Şəkli dəyiş",
  photoAdd: "Şəkil əlavə et",
  photoUploading: "Şəkil yüklənir...",
  photoRemove: "Şəkli sil",
  photoHint:
    "JPEG, PNG və ya WEBP. Maksimum {size}. Şəkil yükləndikdən sonra “Yadda saxla” ilə sahibkar profilinə bağlanır.",
  photoSelectedPrefix: "Son seçilən fayl",
  photoPathPrefix: "Media yolu",
  photoVisibleHint:
    "Rezervasiya təsdiqlənənədək sahibkar üçün görünən əsas sahələrdən biri avatar və bio olacaq.",
  fieldBio: "Bio",
  bioPlaceholder: "Özünüz və xidmətiniz barədə qısa təqdimat yazın",
  bioHint:
    "Bu bio rezervasiya təsdiqlənənədək sahibkar haqqında görünən əsas məlumatlardan biri olacaq.",
  fieldPhone: "Telefon",
  fieldCountryCodeHint: "Ölkə kodu",
  fieldNationalNumberHint:
    "Nömrə (operator kodu ilə) — məsələn: 507654321 və ya 0507654321",
  fieldNationalNumberPlaceholder: "Nömrəni daxil edin",
  previewE164: "Önizləmə (E.164)",
  invalidShort: "yanlışdır",
  save: "Yadda saxla",
  saving: "Saxlanılır...",
  refresh: "Yenilə",
  note:
    "Qeyd: Telefon serverə E.164 formatında göndərilir. Profilin saxlanılması sahibkarı avtomatik aktiv etmir. OTP təsdiqi tamamlanmadan sahibkar yalnız ilkin qoşulma mərhələsində qalır. Rezervasiya təsdiqlənənədək əsas görünən sahələr avatar və bio olacaq. Unikallıq qaydası sahibkar profilləri daxilində tətbiq olunur: sahibkar e-poçtu və sahibkar telefonu təkrarlana bilməz. Eyni nömrə həm istifadəçi, həm də sahibkar hesabında istifadə oluna bilər.",
  otpCardLabel: "OTP təsdiqi",
  otpCardTitle: "Telefon nömrəsini təsdiqləyin",
  otpCardBody:
    "Profil yadda saxlanılıb. Ödəniş bölməsinin və idarəetmə panelinin açılması üçün OTP təsdiqi tamamlanmalıdır.",
  otpExpiresPrefix: "Kodun vaxtı bitir",
  otpTestCodePrefix: "Test OTP",
  otpResend: "OTP göndər",
  otpResendCooldown: "Yenidən göndər",
  otpSending: "Göndərilir...",
  otpFieldLabel: "OTP kodu",
  otpFieldPlaceholder: "Kodu daxil edin",
  otpVerify: "OTP-ni təsdiqlə",
  otpVerifying: "Təsdiqlənir...",
  nextStepLabel: "Növbəti addım",
  nextStepProfile: "Əvvəl profili doldurun",
  nextStepPhone: "Telefon təsdiqini tamamlayın",
  nextStepReady:
    "İdarəetmə panelinə qayıdın və ya xidmət mərhələsinə keçin",
  nextStepProfileText:
    "Ad, telefon və e-poçt daxil edilmədən axın davam etməyəcək.",
  nextStepPhoneText:
    "Telefon təsdiqi olmadan xidmətin davamı və idarəetmə panelinə giriş açılmır.",
  dashboardBack: "İdarəetmə panelinə qayıt",
  dashboardLocked: "İdarəetmə paneli bağlıdır",
  servicesGo: "Xidmətlər səhifəsinə keç",
  okSaved: "✅ Profil yadda saxlanıldı.",
  okSavedAndOtp: "✅ Profil yadda saxlanıldı. OTP göndərilir...",
  okSavedReady:
    "✅ Profil tamamlandı. Xidmət seçimi mərhələsinə qayıda bilərsiniz.",
  okOtpSent: "✅ OTP göndərildi",
  okOtpSentWithCode: "✅ OTP göndərildi. Test kodu",
  okOtpVerified: "✅ Telefon təsdiqləndi",
  okPhotoUploaded: "✅ Şəkil yükləndi. Profili yadda saxlayın",
  okPhotoRemoved: "Şəkil silindi. Profili yadda saxlayın",
  errorTimeout: "Sorğunun vaxtı bitdi. Backend cavab vermədi",
  errorLoadFailed: "Profil yüklənmədi",
  errorSaveFailed: "Profil saxlanmadı",
  errorOtpSendFailed: "OTP göndərilmədi",
  errorOtpVerifyFailed: "OTP təsdiqlənmədi",
  errorNameRequired: "Ad məcburidir",
  errorNameTooLong: "Ad maksimum {count} simvol ola bilər",
  errorEmailRequired: "E-poçt məcburidir",
  errorEmailTooLong: "E-poçt maksimum {count} simvol ola bilər",
  errorEmailInvalid: "E-poçt düzgün deyil",
  errorPhoneRequired: "Telefon məcburidir",
  errorPhoneNotFound:
    "Telefon məlumatı tapılmadı. Profili yeniləyib yenidən cəhd edin",
  errorPhoneDigitsOnly: "Telefon yalnız rəqəmlərdən ibarət olmalıdır",
  errorPhoneTooShort: "Telefon nömrəsi ən azı {count} rəqəm olmalıdır",
  errorPhoneTooLong: "Telefon nömrəsi maksimum {count} rəqəm ola bilər",
  errorOperatorCodeRequired: "Telefon operator kodu ilə daxil edilməlidir",
  errorPhoneInvalid: "Telefon formatı düzgün deyil",
  errorBioTooLong: "Bio maksimum {count} simvol ola bilər",
  errorPhotoUrlTooLong:
    "Profil şəkli keçidi maksimum {count} simvol ola bilər",
  errorPhotoUrlInvalid: "Profil şəkli keçidi düzgün deyil",
  errorPhotoUrlUnsafe: "Profil şəkli keçidi təhlükəsiz deyil",
  errorPhotoUrlProtocol:
    "Profil şəkli keçidi yalnız http/https və ya təhlükəsiz media yolu ola bilər",
  errorPhotoUploadingWait:
    "Şəkil yüklənir. Yükləmə tamamlandıqdan sonra yadda saxlayın",
  errorOtpDigits: "OTP kodu 4-8 rəqəm olmalıdır",
  errorOtpCooldown: "Yenidən OTP göndərmək üçün bir qədər gözləyin",
  errorSendOtpFirst: "Əvvəl OTP göndərin",
  errorOtpInvalid: "OTP kodu düzgün deyil",
  errorOtpWrong: "OTP kodu yanlışdır",
  errorOtpExpired: "OTP-nin vaxtı bitib. Yenidən kod göndərin",
  errorOtpTooMany: "Çox sayda səhv cəhd oldu. Yenidən OTP göndərin",
  errorPhoneUsed:
    "Bu telefon artıq başqa sahibkar tərəfindən istifadə olunur. Fərqli nömrə daxil edin və ya mövcud sahibkar hesabı ilə davam edin",
  errorEmailUsed:
    "Bu e-poçt artıq başqa sahibkar tərəfindən istifadə olunur. Fərqli e-poçt daxil edin və ya mövcud sahibkar hesabı ilə davam edin",
  errorOwnerIdentityUsed:
    "Bu sahibkar məlumatları artıq sistemdə mövcuddur. E-poçtu və ya telefonu dəyişin, yaxud mövcud sahibkar hesabı ilə davam edin",
  errorPhotoValueInvalid:
    "Profil şəkli keçidi və ya media yolu düzgün deyil",
  errorBioInvalidChars: "Bio daxilində icazəsiz simvol var",
  errorServer: "Server xətası baş verdi. Bir qədər sonra yenidən cəhd edin",
  errorUnexpected: "Gözlənilməz xəta baş verdi",
  errorPhotoFileMissing: "Şəkil faylı seçilməyib",
  errorPhotoFileType:
    "Yalnız JPG, PNG və ya WEBP formatında şəkil yükləyə bilərsiniz",
  errorPhotoFileEmpty: "Boş fayl yükləmək olmaz",
  errorPhotoFileTooLarge: "Şəkil maksimum {size} ola bilər",
  errorPhotoUploadTimeout: "Şəkil yükləmə sorğusunun vaxtı bitdi",
  errorPhotoUploadNoPath:
    "Yükləmə endpoint-i cavab verdi, lakin media yolu qaytarmadı",
  errorPhotoUploadNoRoute:
    "Şəkil yükləmə endpoint-i tapılmadı. Backend-də yükləmə route-u əlavə edilməlidir",
  verificationRequired: "Tələb olunur",
  verificationSent: "Göndərildi",
  verificationVerified: "Təsdiqləndi",
  verificationExpired: "Vaxtı bitib",
  verificationFailed: "Uğursuz",
  countryCodePrefix: "Ölkə",
  mbSuffix: "MB",
  serviceFallbackSelected: "Xidmət hələ seçilməyib",
} as const;

type UiText = typeof PAGE_COPY;

function t(template: string, values: Record<string, string | number>): string {
  let output = template;
  for (const [key, value] of Object.entries(values)) {
    output = output.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }
  return output;
}

function normalizeQueryValue(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return (v[0] || "").trim();
  return (v || "").trim();
}

function readFirstStorageValue(keys: readonly string[]): string {
  if (typeof window === "undefined") return "";
  for (const key of keys) {
    const value = String(window.localStorage.getItem(key) || "").trim();
    if (value) return value;
  }
  return "";
}

function writeStorageValueToKeys(
  keys: readonly string[],
  value: string,
): void {
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

function formatDisplayDateTime(
  value: string | null | undefined,
  fallback = "",
): string {
  return formatDateTime(value, PAGE_FORMATTING_LOCALE, { fallback });
}

function safeServiceKey(v: unknown): string {
  const value = String(v ?? "").trim().toUpperCase();
  if (!value) return "";
  if (!/^[A-Z0-9_-]{2,64}$/.test(value)) return "";
  return value;
}

function digitsOnly(input: string) {
  return String(input || "").replace(/[^\d]/g, "");
}

function normalizeDial(dial: string) {
  return `+${digitsOnly(dial)}`;
}

function stripLeadingZeros(value: string) {
  return value.replace(/^0+/, "");
}

function isValidE164(e164: string) {
  const cleaned = String(e164 || "").trim();
  return /^\+[1-9]\d{7,14}$/.test(cleaned);
}

function normalizeAsciiHeaderValue(value: unknown): string {
  const raw = String(value ?? "").replace(/[\r\n]+/g, " ").trim();
  if (!raw) return "";
  let out = "";
  for (const ch of raw) {
    const code = ch.charCodeAt(0);
    if (code >= 0x20 && code <= 0x7e) out += ch;
  }
  return out.trim();
}

function normalizeNameInput(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeEmailForStorage(value: unknown): string {
  const sanitized = normalizeAsciiHeaderValue(
    String(value ?? "").toLowerCase(),
  );
  if (!sanitized) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) return "";
  return sanitized;
}

function normalizeOwnerIdForStorage(value: unknown): string {
  const sanitized = normalizeAsciiHeaderValue(value);
  if (!sanitized) return "";
  if (!/^[A-Za-z0-9_-]{6,128}$/.test(sanitized)) return "";
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

function normalizeBioInput(value: unknown): string {
  return String(value ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function normalizeProfilePhotoUrlInput(value: unknown): string {
  return String(value ?? "").trim();
}

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function resolveMediaUrl(value: string, api: string): string {
  const trimmed = normalizeProfilePhotoUrlInput(value);
  if (!trimmed) return "";
  if (isAbsoluteHttpUrl(trimmed)) return trimmed;
  try {
    const base = api.replace(/\/+$/, "") + "/";
    const relative = trimmed.replace(/^\/+/, "");
    return new URL(relative, base).toString();
  } catch {
    return "";
  }
}

function validateProfilePhotoUrlInput(
  value: string,
  text: UiText,
): string | null {
  const trimmed = normalizeProfilePhotoUrlInput(value);
  if (!trimmed) return null;

  if (trimmed.length > OWNER_PROFILE_PHOTO_MAX_LENGTH) {
    return t(text.errorPhotoUrlTooLong, {
      count: OWNER_PROFILE_PHOTO_MAX_LENGTH,
    });
  }
  if (/[\u0000-\u001F\u007F<>"'`]/.test(trimmed)) {
    return text.errorPhotoUrlInvalid;
  }
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return text.errorPhotoUrlUnsafe;
  }
  if (trimmed.startsWith("/")) return null;
  if (/^[A-Za-z0-9/_\-.?=&%]+$/.test(trimmed)) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return text.errorPhotoUrlProtocol;
    }
    return null;
  } catch {
    return text.errorPhotoUrlInvalid;
  }
}

function validateProfilePhotoFile(
  file: File | null | undefined,
  text: UiText,
): string | null {
  if (!file) return text.errorPhotoFileMissing;
  if (!PROFILE_PHOTO_ALLOWED_MIME_TYPES.has(file.type)) {
    return text.errorPhotoFileType;
  }
  if (file.size <= 0) return text.errorPhotoFileEmpty;
  if (file.size > PROFILE_PHOTO_MAX_FILE_BYTES) {
    return t(text.errorPhotoFileTooLarge, {
      size: `${Math.round(PROFILE_PHOTO_MAX_FILE_BYTES / (1024 * 1024))} ${
        text.mbSuffix
      }`,
    });
  }
  return null;
}

function dedupeStrings(values: string[]): string[] {
  return [...new Set(values.map((v) => String(v || "").trim()).filter(Boolean))];
}

function includesAny(value: string, candidates: readonly string[]): boolean {
  const normalized = String(value || "").toLowerCase();
  return candidates.some((candidate) =>
    normalized.includes(String(candidate || "").toLowerCase()),
  );
}

function getServiceKeyFromStorage(): string {
  return safeServiceKey(readFirstStorageValue(SERVICE_STORAGE_KEYS));
}

function writeServiceKeyToStorage(serviceKey: string) {
  const safe = safeServiceKey(serviceKey);
  if (!safe) return;
  writeStorageValueToKeys(SERVICE_STORAGE_KEYS, safe);
}

function clearPhoneStorage() {
  removeStorageKeys(PHONE_STORAGE_KEYS);
}

function writePhoneToStorage(phoneE164: string) {
  const normalized = normalizePhoneForStorage(phoneE164);
  if (!normalized) {
    clearPhoneStorage();
    return;
  }
  writeStorageValueToKeys(PHONE_STORAGE_KEYS, normalized);
}

function getPhoneFromStorage(): string {
  return normalizePhoneForStorage(readFirstStorageValue(PHONE_STORAGE_KEYS));
}

function clearOwnerIdStorage() {
  removeStorageKeys(OWNER_ID_STORAGE_KEYS);
}

function writeOwnerIdToStorage(ownerId: string) {
  const normalized = normalizeOwnerIdForStorage(ownerId);
  if (!normalized) {
    clearOwnerIdStorage();
    return;
  }
  writeStorageValueToKeys(OWNER_ID_STORAGE_KEYS, normalized);
}

function getOwnerIdFromStorage(): string {
  return normalizeOwnerIdForStorage(
    readFirstStorageValue(OWNER_ID_STORAGE_KEYS),
  );
}

function clearOwnerEmailStorage() {
  removeStorageKeys(OWNER_EMAIL_STORAGE_KEYS);
}

function writeOwnerEmailToStorage(email: string) {
  const normalized = normalizeEmailForStorage(email);
  if (!normalized) {
    clearOwnerEmailStorage();
    return;
  }
  writeStorageValueToKeys(OWNER_EMAIL_STORAGE_KEYS, normalized);
}

function getOwnerEmailFromStorage(): string {
  return normalizeEmailForStorage(readFirstStorageValue(OWNER_EMAIL_STORAGE_KEYS));
}

function clearOwnerIdentityStorage() {
  clearOwnerIdStorage();
  clearOwnerEmailStorage();
  clearPhoneStorage();
}

function sanitizeNationalInput(input: string, country: Country): string {
  let digits = digitsOnly(input);
  const dialDigits = digitsOnly(country.dial);

  if (digits.startsWith(dialDigits)) {
    digits = digits.slice(dialDigits.length);
  }
  if (digits.startsWith("00")) {
    digits = digits.replace(/^0+/, "");
  }
  if (digits.length > 1 && digits.startsWith("0")) {
    digits = stripLeadingZeros(digits);
  }

  return digits.slice(0, country.maxNationalLength);
}

function getPhoneValidation(
  country: Country,
  nationalInput: string,
  text: UiText,
): { sanitizedNational: string; e164: string; isValid: boolean; error: string } {
  const sanitizedNational = sanitizeNationalInput(nationalInput, country);
  const dialDigits = digitsOnly(country.dial);

  if (!sanitizedNational) {
    return {
      sanitizedNational,
      e164: "",
      isValid: false,
      error: text.errorPhoneRequired,
    };
  }
  if (!/^\d+$/.test(sanitizedNational)) {
    return {
      sanitizedNational,
      e164: "",
      isValid: false,
      error: text.errorPhoneDigitsOnly,
    };
  }
  if (sanitizedNational.length < country.minNationalLength) {
    return {
      sanitizedNational,
      e164: "",
      isValid: false,
      error: t(text.errorPhoneTooShort, {
        count: country.minNationalLength,
      }),
    };
  }
  if (sanitizedNational.length > country.maxNationalLength) {
    return {
      sanitizedNational,
      e164: "",
      isValid: false,
      error: t(text.errorPhoneTooLong, {
        count: country.maxNationalLength,
      }),
    };
  }
  if (country.allowedPrefixes?.length) {
    const hasAllowedPrefix = country.allowedPrefixes.some((prefix) =>
      sanitizedNational.startsWith(prefix),
    );
    if (!hasAllowedPrefix) {
      return {
        sanitizedNational,
        e164: "",
        isValid: false,
        error: text.errorOperatorCodeRequired,
      };
    }
  }

  const e164 = `+${dialDigits}${sanitizedNational}`;
  if (!isValidE164(e164)) {
    return {
      sanitizedNational,
      e164: "",
      isValid: false,
      error: text.errorPhoneInvalid,
    };
  }

  return { sanitizedNational, e164, isValid: true, error: "" };
}

function splitE164ToCountryAndNational(e164: string): {
  country: Country | null;
  national: string;
} {
  const cleaned = `+${digitsOnly(e164)}`;
  if (!cleaned || cleaned === "+") {
    return { country: null, national: "" };
  }

  const sorted = [...COUNTRIES].sort(
    (a, b) => normalizeDial(b.dial).length - normalizeDial(a.dial).length,
  );

  for (const country of sorted) {
    const dialDigits = digitsOnly(country.dial);
    const allDigits = digitsOnly(cleaned);

    if (allDigits.startsWith(dialDigits)) {
      return { country, national: allDigits.slice(dialDigits.length) };
    }
  }

  return { country: null, national: digitsOnly(cleaned) };
}

function getCountryLabel(country: Country): string {
  return country.name;
}

function humanizeServiceKey(serviceKey: string): string {
  const normalized = String(serviceKey || "").trim().toUpperCase();

  if (!normalized) return PAGE_COPY.serviceFallbackSelected;

  if (Object.prototype.hasOwnProperty.call(SERVICE_LABELS_AZ, normalized)) {
    return SERVICE_LABELS_AZ[normalized as keyof typeof SERVICE_LABELS_AZ];
  }

  return normalized
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
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

function normalizeSafeNextPath(v: string): string {
  const trimmed = String(v || "").trim();
  if (!trimmed) return "";
  if (!trimmed.startsWith("/")) return "";
  if (trimmed.startsWith("//")) return "";
  return trimmed;
}

function withPageLocalePath(path: string): string {
  const safe = normalizeSafeNextPath(path);
  if (!safe) return "";
  try {
    const url = new URL(safe, "http://local");
    url.searchParams.set("lang", PAGE_LOCALE);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return safe;
  }
}

function buildServicesUrl(nextPath: string, serviceKey: string): string {
  const safeNext = withPageLocalePath(nextPath);
  return buildHref("/services", {
    next: safeNext || undefined,
    serviceKey: serviceKey || undefined,
  });
}

function buildDashboardUrl(serviceKey: string): string {
  return buildHref("/dashboard", {
    serviceKey: serviceKey || undefined,
  });
}

function resolveProfileState(
  dto: ProfileResponseDTO | null | undefined,
): OwnerFlowState {
  const raw = String(dto?.state || "").trim().toUpperCase();
  if (raw === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED") {
    return "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED";
  }
  if (raw === "SERVICE_SELECTION_REQUIRED") {
    return "SERVICE_SELECTION_REQUIRED";
  }
  return "PROFILE_REQUIRED";
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

function mapApiErrorMessage(
  raw: string | Record<string, unknown> | null | undefined,
  text: UiText,
): string {
  const payload =
    typeof raw === "string"
      ? ({ message: raw } as Record<string, unknown>)
      : raw && typeof raw === "object"
        ? raw
        : {};

  const value = String(payload.message || "").trim();
  const normalized = value.toLowerCase();
  const countRaw = Number(payload.count);
  const count =
    Number.isFinite(countRaw) && countRaw > 0 ? Math.trunc(countRaw) : null;

  if (value === "PROFILE_REQUIRED") return "Əvvəl sahibkar profilini tamamlayın";
  if (value === "OWNER_NAME_REQUIRED") return text.errorNameRequired;
  if (value === "OWNER_NAME_TOO_LONG") {
    return t(text.errorNameTooLong, {
      count: count ?? OWNER_NAME_MAX_LENGTH,
    });
  }

  if (value === "OWNER_EMAIL_REQUIRED") return text.errorEmailRequired;
  if (value === "OWNER_EMAIL_TOO_LONG") {
    return t(text.errorEmailTooLong, {
      count: count ?? OWNER_EMAIL_MAX_LENGTH,
    });
  }
  if (value === "OWNER_EMAIL_INVALID") return text.errorEmailInvalid;

  if (value === "OWNER_PHONE_REQUIRED") return text.errorPhoneRequired;
  if (value === "OWNER_PHONE_NOT_FOUND") return text.errorPhoneNotFound;
  if (value === "OWNER_PHONE_DIGITS_ONLY") return text.errorPhoneDigitsOnly;
  if (value === "OWNER_PHONE_TOO_SHORT") {
    return count ? t(text.errorPhoneTooShort, { count }) : text.errorPhoneInvalid;
  }
  if (value === "OWNER_PHONE_TOO_LONG") {
    return count ? t(text.errorPhoneTooLong, { count }) : text.errorPhoneInvalid;
  }
  if (value === "OWNER_PHONE_OPERATOR_CODE_REQUIRED") {
    return text.errorOperatorCodeRequired;
  }
  if (value === "OWNER_PHONE_INVALID") return text.errorPhoneInvalid;

  if (value === "OWNER_BIO_TOO_LONG") {
    return t(text.errorBioTooLong, {
      count: count ?? OWNER_BIO_MAX_LENGTH,
    });
  }
  if (value === "OWNER_BIO_INVALID_CHARS") return text.errorBioInvalidChars;
  if (value === "OWNER_PROFILE_PHOTO_INVALID") return text.errorPhotoValueInvalid;
  if (value === "OWNER_EMAIL_ALREADY_USED") return text.errorEmailUsed;
  if (value === "OWNER_PHONE_ALREADY_USED") return text.errorPhoneUsed;
  if (value === "OWNER_IDENTITY_ALREADY_EXISTS") {
    return text.errorOwnerIdentityUsed;
  }
  if (value === "OWNER_OTP_RESEND_COOLDOWN") return text.errorOtpCooldown;
  if (value === "OWNER_OTP_INVALID") return text.errorOtpInvalid;
  if (value === "OWNER_OTP_NOT_SENT") return text.errorSendOtpFirst;
  if (value === "OWNER_OTP_EXPIRED") return text.errorOtpExpired;
  if (value === "OWNER_OTP_TOO_MANY_ATTEMPTS") return text.errorOtpTooMany;
  if (value === "OWNER_OTP_WRONG") return text.errorOtpWrong;

  if (value === "OTP göndərilməyib.") return text.errorSendOtpFirst;
  if (value === "OTP kodu düzgün deyil.") return text.errorOtpInvalid;
  if (value === "OTP kodu yanlışdır.") return text.errorOtpWrong;
  if (value === "OTP vaxtı bitib. Yenidən kod göndərin.") {
    return text.errorOtpExpired;
  }
  if (value === "Çox sayda səhv cəhd oldu. Yenidən OTP göndərin.") {
    return text.errorOtpTooMany;
  }

  if (value === "Ad mütləqdir.") return text.errorNameRequired;
  if (value === "Email mütləqdir.") return text.errorEmailRequired;
  if (value === "Email formatı səhvdir.") return text.errorEmailInvalid;
  if (value === "Telefon mütləqdir.") return text.errorPhoneRequired;
  if (value === "Telefon formatı səhvdir.") return text.errorPhoneInvalid;

  if (value === "Bu telefon artıq başqa owner tərəfindən istifadə olunur.") {
    return text.errorPhoneUsed;
  }
  if (value === "Bu email artıq başqa owner tərəfindən istifadə olunur.") {
    return text.errorEmailUsed;
  }
  if (value === "Bu ad, email və telefon kombinasiyası ilə owner artıq mövcuddur.") {
    return text.errorOwnerIdentityUsed;
  }
  if (
    value ===
    "Telefon nömrəsi operator kodu ilə daxil edilməlidir. Bu ölkə üçün operator prefiksi tanınmadı."
  ) {
    return text.errorOperatorCodeRequired;
  }
  if (
    value ===
    "Profil şəkli dəyəri düzgün deyil. Təhlükəsiz URL və ya media yolu göndərin."
  ) {
    return text.errorPhotoValueInvalid;
  }
  if (value === "Bio daxilində icazəsiz simvol var.") {
    return text.errorBioInvalidChars;
  }
  if (value.startsWith("Bio maksimum ")) {
    return t(text.errorBioTooLong, { count: OWNER_BIO_MAX_LENGTH });
  }
  if (value.startsWith("Ad maksimum ")) {
    return t(text.errorNameTooLong, { count: OWNER_NAME_MAX_LENGTH });
  }
  if (value.startsWith("Email maksimum ")) {
    return t(text.errorEmailTooLong, { count: OWNER_EMAIL_MAX_LENGTH });
  }
  if (value === "INTERNAL_ERROR" || value === "internal_error") {
    return text.errorServer;
  }

  const hasDuplicateSignal = includesAny(normalized, [
    "duplicate",
    "already used",
    "already exists",
    "already taken",
    "already registered",
    "unique constraint",
    "violates unique constraint",
    "dup key",
    "e11000",
    "conflict",
    "istifadə olunur",
    "mövcuddur",
    "təkrarlan",
    "занят",
    "уже используется",
    "已被使用",
    "已存在",
  ]);

  const mentionsOwner = includesAny(normalized, [
    " owner ",
    "owners_",
    "owner_",
    "sahibkar",
    "владел",
    "业主",
  ]);

  const mentionsPhone = includesAny(normalized, [
    "phone",
    "telefon",
    "телефон",
    "手机号",
    "owner_phone",
    "owners_phone",
    "phone_key",
  ]);

  const mentionsEmail = includesAny(normalized, [
    "email",
    "e-mail",
    "электрон",
    "邮箱",
    "owner_email",
    "owners_email",
    "email_key",
  ]);

  if (hasDuplicateSignal && mentionsEmail && mentionsPhone) {
    return text.errorOwnerIdentityUsed;
  }
  if (hasDuplicateSignal && mentionsEmail) return text.errorEmailUsed;
  if (hasDuplicateSignal && mentionsPhone) return text.errorPhoneUsed;
  if (hasDuplicateSignal && mentionsOwner) return text.errorOwnerIdentityUsed;

  return value || text.errorUnexpected;
}

function parseVerificationStatus(value: unknown): VerificationStatus {
  const normalized = String(value || "").trim().toUpperCase();
  if (
    normalized === "REQUIRED" ||
    normalized === "SENT" ||
    normalized === "VERIFIED" ||
    normalized === "EXPIRED" ||
    normalized === "FAILED"
  ) {
    return normalized;
  }
  return "REQUIRED";
}

function humanizeVerificationStatus(
  status: VerificationStatus,
  text: UiText,
): string {
  if (status === "SENT") return text.verificationSent;
  if (status === "VERIFIED") return text.verificationVerified;
  if (status === "EXPIRED") return text.verificationExpired;
  if (status === "FAILED") return text.verificationFailed;
  return text.verificationRequired;
}

function getStateMeta(state: OwnerFlowState, text: UiText) {
  if (state === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED") {
    return {
      badge: text.stateBadgePhoneRequired,
      title: text.stateTitlePhoneRequired,
      description: text.stateDescriptionPhoneRequired,
      tone: "warning" as const,
    };
  }

  if (state === "SERVICE_SELECTION_REQUIRED") {
    return {
      badge: text.stateBadgeReady,
      title: text.stateTitleReady,
      description: text.stateDescriptionReady,
      tone: "success" as const,
    };
  }

  return {
    badge: text.stateBadgeProfileRequired,
    title: text.stateTitleProfileRequired,
    description: text.stateDescriptionProfileRequired,
    tone: "info" as const,
  };
}

async function fetchJsonWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<{ response: Response; data: unknown }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    return { response, data };
  } finally {
    window.clearTimeout(timeout);
  }
}

function resolveProfilePhotoUploadEndpoints(api: string): string[] {
  const envCandidates = [
    process.env.NEXT_PUBLIC_OWNER_PROFILE_IMAGE_UPLOAD_URL,
    process.env.NEXT_PUBLIC_OWNER_PROFILE_UPLOAD_URL,
    process.env.NEXT_PUBLIC_MEDIA_UPLOAD_URL,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  const base = api.replace(/\/+$/, "");
  const conventionalCandidates = [
    `${base}/owner/profile/photo/upload`,
    `${base}/owner/profile/upload-photo`,
    `${base}/owner/media/upload`,
    `${base}/media/upload`,
    `${base}/upload`,
  ];

  return dedupeStrings([...envCandidates, ...conventionalCandidates]);
}

function extractUploadedProfilePhotoUrl(
  data: UploadResponseData | null | undefined,
): string {
  const directCandidates = [
    data?.profilePhotoUrl,
    data?.url,
    data?.path,
    data?.mediaUrl,
    data?.fileUrl,
    data?.owner?.profilePhotoUrl,
    data?.data?.profilePhotoUrl,
    data?.data?.url,
    data?.data?.path,
    data?.data?.mediaUrl,
    data?.data?.fileUrl,
  ];

  for (const candidate of directCandidates) {
    const normalized = normalizeProfilePhotoUrlInput(candidate);
    if (normalized) return normalized;
  }

  return "";
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : error instanceof Error
      ? error.name === "AbortError"
      : false;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function ProfilePage() {
  const router = useRouter();
  const API = useMemo(() => apiBase(), []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const text: UiText = PAGE_COPY;
  const direction = PAGE_DIRECTION;

  const [ready, setReady] = useState(false);
  const [serviceKey, setServiceKey] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [profilePhotoLoadFailed, setProfilePhotoLoadFailed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [photoUploadError, setPhotoUploadError] = useState("");
  const [selectedPhotoName, setSelectedPhotoName] = useState("");
  const [localPhotoPreviewUrl, setLocalPhotoPreviewUrl] = useState("");

  const [profileState, setProfileState] = useState<OwnerFlowState>(
    "PROFILE_REQUIRED",
  );
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneVerificationStatus, setPhoneVerificationStatus] =
    useState<VerificationStatus>("REQUIRED");
  const [phoneVerifiedAt, setPhoneVerifiedAt] = useState<string | null>(null);

  const [canSendOtp, setCanSendOtp] = useState(false);
  const [canVerifyOtp, setCanVerifyOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [devTestOtp, setDevTestOtp] = useState<string>("");
  const [otpCooldownSeconds, setOtpCooldownSeconds] = useState<number>(0);

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    bio: "",
    profilePhotoUrl: "",
  });

  const [countryIso2, setCountryIso2] = useState<string>("AZ");
  const [nationalNumber, setNationalNumber] = useState<string>("");

  const nextPath = useMemo(() => {
    return normalizeSafeNextPath(normalizeQueryValue(router.query.next));
  }, [router.query.next]);

  const resolvedServiceKey = useMemo(() => {
    const fromQuery = safeServiceKey(normalizeQueryValue(router.query.serviceKey));
    return fromQuery || serviceKey;
  }, [router.query.serviceKey, serviceKey]);

  const selectedCountry = useMemo(() => {
    return COUNTRIES.find((c) => c.iso2 === countryIso2) || COUNTRIES[0];
  }, [countryIso2]);

  const phoneState = useMemo(() => {
    return getPhoneValidation(selectedCountry, nationalNumber, text);
  }, [selectedCountry, nationalNumber, text]);

  const servicesNextPath = useMemo(() => {
    if (nextPath && !nextPath.startsWith("/services")) {
      return withPageLocalePath(nextPath);
    }
    return withPageLocalePath("/billing");
  }, [nextPath]);

  const servicesHref = useMemo(() => {
    return buildServicesUrl(servicesNextPath, resolvedServiceKey);
  }, [servicesNextPath, resolvedServiceKey]);

  const dashboardHref = useMemo(() => {
    return buildDashboardUrl(resolvedServiceKey);
  }, [resolvedServiceKey]);

  const displayServiceName = useMemo(() => {
    return humanizeServiceKey(resolvedServiceKey);
  }, [resolvedServiceKey]);

  const stateMeta = useMemo(() => {
    return getStateMeta(profileState, text);
  }, [profileState, text]);

  const canGoDashboard = useMemo(() => {
    return phoneVerified && profileState === "SERVICE_SELECTION_REQUIRED";
  }, [phoneVerified, profileState]);

  const resolvedOwnerId = useMemo(() => {
    return normalizeOwnerIdForStorage(ownerId) || getOwnerIdFromStorage();
  }, [ownerId]);

  const profilePhotoPreviewError = useMemo(() => {
    return validateProfilePhotoUrlInput(form.profilePhotoUrl, text);
  }, [form.profilePhotoUrl, text]);

  const normalizedProfilePhotoPreviewUrl = useMemo(() => {
    const trimmed = normalizeProfilePhotoUrlInput(form.profilePhotoUrl);
    return profilePhotoPreviewError ? "" : trimmed;
  }, [form.profilePhotoUrl, profilePhotoPreviewError]);

  const resolvedProfilePhotoPreviewUrl = useMemo(() => {
    if (localPhotoPreviewUrl) return localPhotoPreviewUrl;
    return resolveMediaUrl(normalizedProfilePhotoPreviewUrl, API);
  }, [localPhotoPreviewUrl, normalizedProfilePhotoPreviewUrl, API]);

  useEffect(() => {
    setProfilePhotoLoadFailed(false);
  }, [resolvedProfilePhotoPreviewUrl]);

  useEffect(() => {
    return () => {
      if (localPhotoPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(localPhotoPreviewUrl);
      }
    };
  }, [localPhotoPreviewUrl]);

  const clearLocalPhotoPreview = useCallback(() => {
    setLocalPhotoPreviewUrl((prev) => {
      if (prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return "";
    });
  }, []);

  const resetOtpUiState = useCallback(() => {
    setOtpCode("");
    setOtpExpiresAt(null);
    setDevTestOtp("");
    setOtpCooldownSeconds(0);
  }, []);

  const resetProfileUiToMissingState = useCallback(() => {
    setProfileState("PROFILE_REQUIRED");
    setPhoneVerified(false);
    setPhoneVerificationStatus("REQUIRED");
    setPhoneVerifiedAt(null);
    setCanSendOtp(false);
    setCanVerifyOtp(false);
    setForm({ name: "", email: "", bio: "", profilePhotoUrl: "" });
    setNationalNumber("");
    setCountryIso2("AZ");
    setOwnerId("");
    setProfilePhotoLoadFailed(false);
    setPhotoUploadError("");
    setSelectedPhotoName("");
    clearLocalPhotoPreview();
    resetOtpUiState();
    clearOwnerIdentityStorage();
  }, [clearLocalPhotoPreview, resetOtpUiState]);

  const update = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const applyProfileResponse = useCallback(
    (j: ProfileResponseDTO) => {
      const state = resolveProfileState(j);
      const owner = (j.owner ?? null) as ProfileDTO | null;
      const resolvedVerified = Boolean(j.phoneVerified || owner?.phoneVerified);
      const resolvedStatus = parseVerificationStatus(
        j.phoneVerificationStatus || owner?.phoneVerificationStatus || "REQUIRED",
      );

      setProfileState(state);
      setPhoneVerified(resolvedVerified);
      setPhoneVerificationStatus(resolvedStatus);
      setPhoneVerifiedAt(
        String(j.phoneVerifiedAt || owner?.phoneVerifiedAt || "").trim() || null,
      );

      setCanSendOtp(
        typeof j.verification?.canSendOtp === "boolean"
          ? j.verification.canSendOtp
          : state === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED" && !resolvedVerified,
      );

      setCanVerifyOtp(
        typeof j.verification?.canVerifyOtp === "boolean"
          ? j.verification.canVerifyOtp
          : (resolvedStatus === "SENT" ||
              resolvedStatus === "FAILED" ||
              resolvedStatus === "EXPIRED" ||
              resolvedStatus === "REQUIRED") &&
              !resolvedVerified,
      );

      setOtpExpiresAt(String(j.expiresAt || "").trim() || null);
      setDevTestOtp(String(j.testOtp || "").trim());
      setOtpCooldownSeconds(Number(j.cooldownSeconds || 0) || 0);

      if (owner) {
        const normalizedOwnerId = normalizeOwnerIdForStorage(owner.id);
        const normalizedOwnerName = normalizeNameInput(owner.name ?? "");
        const normalizedOwnerEmail = String(owner.email || "").trim();
        const normalizedPhotoUrl = owner.profilePhotoUrl ?? "";
        const normalizedBio = owner.bio ?? "";

        setOwnerId(normalizedOwnerId);
        writeOwnerIdToStorage(normalizedOwnerId);
        writeOwnerEmailToStorage(normalizedOwnerEmail);
        writePhoneToStorage(String(owner.phone || "").trim());

        const phone = normalizePhoneForStorage(
          String(owner.pendingPhone || owner.phone || "").trim(),
        );

        let nextCountryIso2 = "AZ";
        let nextNationalNumber = "";

        if (phone) {
          const { country, national } = splitE164ToCountryAndNational(phone);
          if (country) {
            nextCountryIso2 = country.iso2;
            nextNationalNumber = sanitizeNationalInput(national, country);
          } else {
            nextNationalNumber = national || "";
          }
        }

        setCountryIso2(nextCountryIso2);
        setNationalNumber(nextNationalNumber);

        setForm({
          name: normalizedOwnerName,
          email: normalizedOwnerEmail,
          bio: normalizedBio,
          profilePhotoUrl: normalizedPhotoUrl,
        });

        setPhotoUploadError("");
        setSelectedPhotoName("");
        clearLocalPhotoPreview();
        return;
      }

      resetProfileUiToMissingState();
    },
    [clearLocalPhotoPreview, resetProfileUiToMissingState],
  );

  const load = useCallback(async () => {
    setErr("");
    setOk("");
    setLoading(true);

    try {
      const { response, data } = await fetchJsonWithTimeout(`${API}/owner/profile`, {
        method: "GET",
        headers: buildOwnerHeaders(),
      });

      const j = data as ProfileResponseDTO;

      if (!response.ok || !j?.ok) {
        throw new Error(mapApiErrorMessage(j, text));
      }

      applyProfileResponse(j);
    } catch (error: unknown) {
      if (isAbortError(error)) {
        setErr(text.errorTimeout);
      } else {
        setErr(getErrorMessage(error, text.errorLoadFailed));
      }
    } finally {
      setLoading(false);
    }
  }, [API, applyProfileResponse, text]);

  function validateBeforeSave(): string | null {
    const normalizedName = normalizeNameInput(form.name);
    const rawEmail = form.email.trim();
    const normalizedEmail = normalizeEmailForStorage(rawEmail);

    if (!normalizedName) return text.errorNameRequired;
    if (normalizedName.length > OWNER_NAME_MAX_LENGTH) {
      return t(text.errorNameTooLong, { count: OWNER_NAME_MAX_LENGTH });
    }

    if (!rawEmail) return text.errorEmailRequired;
    if (rawEmail.length > OWNER_EMAIL_MAX_LENGTH) {
      return t(text.errorEmailTooLong, { count: OWNER_EMAIL_MAX_LENGTH });
    }
    if (!normalizedEmail) return text.errorEmailInvalid;

    if (!nationalNumber.trim()) return text.errorPhoneRequired;
    if (!phoneState.isValid) return phoneState.error;
    if (!phoneState.e164) return text.errorPhoneInvalid;

    const normalizedBio = normalizeBioInput(form.bio).trim();
    if (normalizedBio.length > OWNER_BIO_MAX_LENGTH) {
      return t(text.errorBioTooLong, { count: OWNER_BIO_MAX_LENGTH });
    }

    const photoError = validateProfilePhotoUrlInput(form.profilePhotoUrl, text);
    if (photoError) return photoError;

    if (photoUploading) {
      return text.errorPhotoUploadingWait;
    }

    return null;
  }

  async function sendOtp(auto = false) {
    setErr("");
    if (!auto) setOk("");

    setOtpSending(true);

    try {
      const { response, data } = await fetchJsonWithTimeout(
        `${API}/owner/profile/phone/send-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...buildOwnerHeaders(),
          },
          body: JSON.stringify({
            ownerId: resolvedOwnerId || undefined,
          }),
        },
      );

      const j = data as ProfileResponseDTO;

      if (!response.ok || !j?.ok) {
        const msg = mapApiErrorMessage(j, text);
        const cooldown = Number(j?.cooldownSeconds || 0);
        if (cooldown > 0) {
          setOtpCooldownSeconds(cooldown);
        }
        throw new Error(msg);
      }

      setPhoneVerificationStatus(
        parseVerificationStatus(j.phoneVerificationStatus || "SENT"),
      );
      setPhoneVerified(Boolean(j.phoneVerified));
      setPhoneVerifiedAt(j.phoneVerifiedAt || null);
      setProfileState(resolveProfileState(j));
      setOtpExpiresAt(String(j.expiresAt || "").trim() || null);
      setDevTestOtp(String(j.testOtp || "").trim());
      setCanVerifyOtp(true);
      setCanSendOtp(true);
      setOtpCooldownSeconds(Number(j.cooldownSeconds || 60) || 60);

      setOk(j.testOtp ? `${text.okOtpSentWithCode}: ${j.testOtp}` : text.okOtpSent);
    } catch (error: unknown) {
      if (isAbortError(error)) {
        setErr(text.errorTimeout);
      } else {
        setErr(getErrorMessage(error, text.errorOtpSendFailed));
      }
    } finally {
      setOtpSending(false);
    }
  }

  async function verifyOtp() {
    setErr("");
    setOk("");

    if (!/^\d{4,8}$/.test(otpCode.trim())) {
      setErr(text.errorOtpDigits);
      return;
    }

    setOtpVerifying(true);

    try {
      const { response, data } = await fetchJsonWithTimeout(
        `${API}/owner/profile/phone/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...buildOwnerHeaders(),
          },
          body: JSON.stringify({
            ownerId: resolvedOwnerId || undefined,
            code: otpCode.trim(),
          }),
        },
      );

      const j = data as ProfileResponseDTO;

      if (!response.ok || !j?.ok) {
        throw new Error(mapApiErrorMessage(j, text));
      }

      setPhoneVerified(Boolean(j.phoneVerified));
      setPhoneVerificationStatus(
        parseVerificationStatus(j.phoneVerificationStatus || "VERIFIED"),
      );
      setPhoneVerifiedAt(j.phoneVerifiedAt || null);
      setProfileState(resolveProfileState(j));
      setCanSendOtp(false);
      setCanVerifyOtp(false);
      resetOtpUiState();

      setOk(text.okOtpVerified);
      await load();
    } catch (error: unknown) {
      if (isAbortError(error)) {
        setErr(text.errorTimeout);
      } else {
        setErr(getErrorMessage(error, text.errorOtpVerifyFailed));
      }
    } finally {
      setOtpVerifying(false);
    }
  }

  async function uploadProfilePhoto(file: File) {
    const fileError = validateProfilePhotoFile(file, text);
    if (fileError) {
      setPhotoUploadError(fileError);
      return;
    }

    setErr("");
    setOk("");
    setPhotoUploadError("");
    setPhotoUploading(true);

    const objectUrl = URL.createObjectURL(file);
    clearLocalPhotoPreview();
    setLocalPhotoPreviewUrl(objectUrl);
    setSelectedPhotoName(file.name);

    const endpoints = resolveProfilePhotoUploadEndpoints(API);
    const ownerHeaders = buildOwnerHeaders();
    const ownerEmail = getOwnerEmailFromStorage();
    const ownerPhone = getPhoneFromStorage();
    const errors: string[] = [];

    try {
      for (const endpoint of endpoints) {
        const controller = new AbortController();
        const timeout = window.setTimeout(
          () => controller.abort(),
          REQUEST_TIMEOUT_MS,
        );

        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("kind", "owner-profile-photo");
          if (resolvedOwnerId) formData.append("ownerId", resolvedOwnerId);
          if (ownerEmail) formData.append("ownerEmail", ownerEmail);
          if (ownerPhone) formData.append("ownerPhone", ownerPhone);

          const response = await fetch(endpoint, {
            method: "POST",
            headers: ownerHeaders,
            body: formData,
            signal: controller.signal,
          });

          const rawText = await response.text().catch(() => "");
          let data: UploadResponseData = {};

          if (rawText) {
            try {
              data = JSON.parse(rawText) as UploadResponseData;
            } catch {
              data = {};
            }
          }

          if (!response.ok) {
            const mapped = mapApiErrorMessage(
              data || {
                message: `Yükləmə endpoint-i sorğunu rədd etdi (${response.status})`,
              },
              text,
            );
            errors.push(mapped);
            continue;
          }

          const uploadedUrl = extractUploadedProfilePhotoUrl(data);
          if (!uploadedUrl) {
            errors.push(text.errorPhotoUploadNoPath);
            continue;
          }

          const photoValidation = validateProfilePhotoUrlInput(uploadedUrl, text);
          if (photoValidation) {
            errors.push(photoValidation);
            continue;
          }

          update("profilePhotoUrl", uploadedUrl);
          setPhotoUploadError("");
          setOk(text.okPhotoUploaded);
          clearLocalPhotoPreview();
          return;
        } catch (error: unknown) {
          if (isAbortError(error)) {
            errors.push(text.errorPhotoUploadTimeout);
          } else {
            errors.push(getErrorMessage(error, text.errorUnexpected));
          }
        } finally {
          window.clearTimeout(timeout);
        }
      }

      clearLocalPhotoPreview();
      setPhotoUploadError(errors[0] || text.errorPhotoUploadNoRoute);
    } finally {
      setPhotoUploading(false);
    }
  }

  async function onPhotoFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    if (!file) return;
    await uploadProfilePhoto(file);
  }

  function openPhotoPicker() {
    setErr("");
    setOk("");
    setPhotoUploadError("");
    fileInputRef.current?.click();
  }

  function removeProfilePhoto() {
    setErr("");
    setOk(text.okPhotoRemoved);
    setPhotoUploadError("");
    setSelectedPhotoName("");
    clearLocalPhotoPreview();
    update("profilePhotoUrl", "");
  }

  async function save() {
    setErr("");
    setOk("");

    const validationError = validateBeforeSave();
    if (validationError) {
      setErr(validationError);
      return;
    }

    setSaving(true);

    try {
      const phoneE164 = phoneState.e164;
      const normalizedName = normalizeNameInput(form.name);
      const normalizedEmail = normalizeEmailForStorage(form.email.trim());
      const normalizedBio = normalizeBioInput(form.bio).trim();
      const normalizedPhotoUrl = normalizeProfilePhotoUrlInput(form.profilePhotoUrl);

      const { response, data } = await fetchJsonWithTimeout(`${API}/owner/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildOwnerHeaders(),
        },
        body: JSON.stringify({
          ownerId: resolvedOwnerId || undefined,
          name: normalizedName,
          phone: phoneE164,
          email: normalizedEmail,
          bio: normalizedBio || null,
          profilePhotoUrl: normalizedPhotoUrl || null,
          phoneCountryIso2: countryIso2,
        }),
      });

      const j = data as ProfileResponseDTO;
      if (!response.ok || !j?.ok) {
        throw new Error(mapApiErrorMessage(j, text));
      }

      applyProfileResponse(j);
      writePhoneToStorage(phoneE164);

      const savedState = resolveProfileState(j);

      if (savedState === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED") {
        setOk(text.okSavedAndOtp);
        resetOtpUiState();
        await sendOtp(true);
      } else if (savedState === "SERVICE_SELECTION_REQUIRED") {
        setOk(text.okSavedReady);
      } else {
        setOk(text.okSaved);
      }
    } catch (error: unknown) {
      if (isAbortError(error)) {
        setErr(text.errorTimeout);
      } else {
        setErr(getErrorMessage(error, text.errorSaveFailed));
      }
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!router.isReady) return;

    const fromQuery = safeServiceKey(normalizeQueryValue(router.query.serviceKey));
    const fromStorage = getServiceKeyFromStorage();
    const resolved = fromQuery || fromStorage;

    if (resolved) {
      writeServiceKeyToStorage(resolved);
      setServiceKey(resolved);
    } else {
      setServiceKey("");
    }

    setOwnerId(getOwnerIdFromStorage());
    setReady(true);

    const currentLang = normalizeQueryValue(router.query.lang);
    if (currentLang !== PAGE_LOCALE) {
      const currentPath = normalizeSafeNextPath(router.asPath) || "/profile";
      void router.replace(withPageLocalePath(currentPath), undefined, {
        shallow: true,
        scroll: false,
      });
    }
  }, [
    router,
    router.asPath,
    router.isReady,
    router.query.lang,
    router.query.serviceKey,
  ]);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, load]);

  useEffect(() => {
    if (otpCooldownSeconds <= 0) return;
    const timer = window.setTimeout(() => {
      setOtpCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [otpCooldownSeconds]);

  const busy = saving || loading || otpSending || otpVerifying || photoUploading;

  const canShowOtpCard =
    profileState === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED" && !!resolvedOwnerId;
  const canSendOtpNow =
    canShowOtpCard && canSendOtp && !otpSending && otpCooldownSeconds <= 0;
  const canVerifyOtpNow =
    canShowOtpCard && canVerifyOtp && !otpVerifying && /^\d{4,8}$/.test(otpCode.trim());

  const showResolvedProfileImage =
    !!resolvedProfilePhotoPreviewUrl &&
    !profilePhotoLoadFailed &&
    !profilePhotoPreviewError;

  if (!ready) {
    return (
      <div style={{ ...pageStyle, direction }}>
        <div style={shellStyle}>
          <div style={heroCardStyle}>
            <div style={heroInnerStyle}>
              <h1 style={titleStyle}>{text.pageTitle}</h1>
              <p style={subtitleStyle}>{text.pageLoading}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...pageStyle, direction }}>
      <div style={shellStyle}>
        <div style={heroCardStyle}>
          <div style={heroInnerStyle}>
            <div style={heroHeaderStackStyle}>
              <h1 style={titleStyle}>{text.pageTitle}</h1>
              <p style={subtitleStyle}>{text.heroSubtitle}</p>
            </div>

            <div style={heroMetaRowStyle}>
              <div style={serviceCardStyle}>
                <div style={metaLabelStyle}>{text.selectedServiceLabel}</div>
                <div style={serviceTitleStyle}>{displayServiceName}</div>
                <div style={serviceKeyStyle}>
                  {resolvedServiceKey || text.serviceNotSelectedHelp}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            ...stateCardStyle,
            ...(stateMeta.tone === "warning"
              ? stateCardWarningStyle
              : stateMeta.tone === "success"
                ? stateCardSuccessStyle
                : stateCardInfoStyle),
          }}
        >
          <div style={stateBadgeStyle}>{stateMeta.badge}</div>
          <h2 style={stateTitleStyle}>{stateMeta.title}</h2>
          <p style={stateDescriptionStyle}>{stateMeta.description}</p>

          <div style={stateMetaGridStyle}>
            <div style={stateMetaItemStyle}>
              <div style={stateMetaLabelStyle}>{text.profileStatusLabel}</div>
              <div style={stateMetaValueStyle}>
                {profileState === "PROFILE_REQUIRED"
                  ? text.profileStatusMissing
                  : profileState === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED"
                    ? text.profileStatusDraft
                    : text.profileStatusReady}
              </div>
            </div>

            <div style={stateMetaItemStyle}>
              <div style={stateMetaLabelStyle}>{text.phoneVerificationLabel}</div>
              <div style={stateMetaValueStyle}>
                {phoneVerified ? text.phoneVerificationDone : text.phoneVerificationPending}
              </div>
            </div>

            <div style={stateMetaItemStyle}>
              <div style={stateMetaLabelStyle}>{text.verificationStatusLabel}</div>
              <div style={stateMetaValueStyle}>
                {humanizeVerificationStatus(phoneVerificationStatus, text)}
              </div>
            </div>
          </div>

          {!phoneVerified ? (
            <div style={otpWarningBoxStyle}>{text.otpWarning}</div>
          ) : phoneVerifiedAt ? (
            <div style={otpSuccessBoxStyle}>
              {text.otpVerifiedAtPrefix}: {formatDisplayDateTime(phoneVerifiedAt)}
            </div>
          ) : null}
        </div>

        {err ? (
          <div style={errorBoxStyle}>
            {text.errorPrefix}: {err}
          </div>
        ) : null}
        {ok ? <div style={okBoxStyle}>{ok}</div> : null}

        <div style={cardStyle}>
          {loading ? (
            <div style={mutedStyle}>{text.loading}</div>
          ) : (
            <div style={formGridStyle}>
              <div style={profileIdentityGridStyle}>
                <div style={avatarPreviewCardStyle}>
                  <div style={avatarPreviewLabelStyle}>{text.previewLabel}</div>

                  {showResolvedProfileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolvedProfilePhotoPreviewUrl}
                      alt={text.fieldProfilePhoto}
                      style={avatarImageStyle}
                      onError={() => setProfilePhotoLoadFailed(true)}
                    />
                  ) : (
                    <div style={avatarPlaceholderStyle}>
                      {form.name.trim() ? form.name.trim().charAt(0).toUpperCase() : "S"}
                    </div>
                  )}

                  <div style={avatarPreviewNameStyle}>
                    {form.name.trim() || text.previewFallbackName}
                  </div>

                  <div style={avatarPreviewBioStyle}>
                    {normalizeBioInput(form.bio).trim() || text.previewFallbackBio}
                  </div>
                </div>

                <div style={fieldColumnStyle}>
                  <Field
                    label={text.fieldName}
                    value={form.name}
                    onChange={(v) => update("name", v)}
                    disabled={busy}
                  />

                  <Field
                    label={text.fieldEmail}
                    value={form.email}
                    onChange={(v) => update("email", v)}
                    disabled={busy}
                  />

                  <div style={fieldStyle}>
                    <div style={fieldLabelStyle}>{text.fieldProfilePhoto}</div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={PROFILE_PHOTO_ACCEPT}
                      onChange={(e) => void onPhotoFileChange(e)}
                      style={{ display: "none" }}
                    />

                    <div style={uploadPanelStyle}>
                      <div style={uploadActionsRowStyle}>
                        <button
                          type="button"
                          onClick={openPhotoPicker}
                          disabled={busy}
                          style={{
                            ...btnSecondary,
                            ...(busy ? disabledButtonStyle : {}),
                          }}
                        >
                          {photoUploading
                            ? text.photoUploading
                            : form.profilePhotoUrl || localPhotoPreviewUrl
                              ? text.photoReplace
                              : text.photoAdd}
                        </button>

                        <button
                          type="button"
                          onClick={removeProfilePhoto}
                          disabled={busy || (!form.profilePhotoUrl && !localPhotoPreviewUrl)}
                          style={{
                            ...btnGhost,
                            ...(busy || (!form.profilePhotoUrl && !localPhotoPreviewUrl)
                              ? disabledButtonStyle
                              : {}),
                          }}
                        >
                          {text.photoRemove}
                        </button>
                      </div>

                      <div style={fieldHintStyle}>
                        {t(text.photoHint, {
                          size: `${Math.round(
                            PROFILE_PHOTO_MAX_FILE_BYTES / (1024 * 1024),
                          )} ${text.mbSuffix}`,
                        })}
                      </div>

                      {selectedPhotoName ? (
                        <div style={uploadMetaStyle}>
                          {text.photoSelectedPrefix}: <strong>{selectedPhotoName}</strong>
                        </div>
                      ) : null}

                      {form.profilePhotoUrl ? (
                        <div style={uploadMetaStyle}>
                          {text.photoPathPrefix}:{" "}
                          <code style={inlineCodeStyle}>{form.profilePhotoUrl}</code>
                        </div>
                      ) : null}

                      {photoUploadError ? (
                        <div style={validationErrorStyle}>{photoUploadError}</div>
                      ) : (
                        <div style={fieldHintStyle}>{text.photoVisibleHint}</div>
                      )}
                    </div>
                  </div>

                  {profilePhotoPreviewError && form.profilePhotoUrl.trim() ? (
                    <div style={validationErrorStyle}>{profilePhotoPreviewError}</div>
                  ) : null}
                </div>
              </div>

              <div style={fieldStyle}>
                <div style={fieldLabelStyle}>{text.fieldBio}</div>
                <textarea
                  value={form.bio}
                  onChange={(e) => update("bio", normalizeBioInput(e.target.value))}
                  disabled={busy}
                  maxLength={OWNER_BIO_MAX_LENGTH}
                  placeholder={text.bioPlaceholder}
                  style={{
                    ...textareaStyle,
                    ...(busy ? disabledInputStyle : {}),
                  }}
                />
                <div style={bioMetaRowStyle}>
                  <div style={fieldHintStyle}>{text.bioHint}</div>
                  <div style={charCountStyle}>
                    {normalizeBioInput(form.bio).trim().length}/{OWNER_BIO_MAX_LENGTH}
                  </div>
                </div>
              </div>

              <div style={fieldStyle}>
                <div style={fieldLabelStyle}>{text.fieldPhone}</div>

                <div style={phoneGridStyle}>
                  <label style={fieldStyle}>
                    <div style={fieldHintStyle}>{text.fieldCountryCodeHint}</div>
                    <select
                      value={countryIso2}
                      disabled={busy}
                      onChange={(e) => {
                        const nextCountry =
                          COUNTRIES.find((c) => c.iso2 === e.target.value) || COUNTRIES[0];
                        setCountryIso2(nextCountry.iso2);
                        setNationalNumber((prev) =>
                          sanitizeNationalInput(prev, nextCountry),
                        );
                        setErr("");
                        setOk("");
                        resetOtpUiState();
                      }}
                      style={{
                        ...inputStyle,
                        ...(busy ? disabledInputStyle : {}),
                      }}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.iso2} value={c.iso2}>
                          {getCountryLabel(c)} ({normalizeDial(c.dial)})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label style={fieldStyle}>
                    <div style={fieldHintStyle}>{text.fieldNationalNumberHint}</div>
                    <input
                      value={nationalNumber}
                      onChange={(e) => {
                        setNationalNumber(
                          sanitizeNationalInput(e.target.value, selectedCountry),
                        );
                        setErr("");
                        setOk("");
                        resetOtpUiState();
                      }}
                      disabled={busy}
                      inputMode="numeric"
                      autoComplete="tel-national"
                      placeholder={text.fieldNationalNumberPlaceholder}
                      maxLength={selectedCountry.maxNationalLength + 3}
                      style={{
                        ...inputStyle,
                        ...(busy ? disabledInputStyle : {}),
                        border:
                          phoneState.isValid || !nationalNumber.trim()
                            ? "1px solid rgba(15, 23, 42, 0.10)"
                            : "1px solid #f87171",
                      }}
                    />
                  </label>
                </div>

                <div style={previewStyle}>
                  {text.previewE164}:{" "}
                  <code style={previewCodeStyle}>
                    {phoneState.e164 || (nationalNumber.trim() ? text.invalidShort : "-")}
                  </code>
                </div>

                {!phoneState.isValid && nationalNumber.trim() ? (
                  <div style={validationErrorStyle}>{phoneState.error}</div>
                ) : null}
              </div>

              <div style={actionsRowStyle}>
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={busy}
                  style={{
                    ...btnPrimary,
                    ...(busy ? disabledButtonStyle : {}),
                  }}
                >
                  {saving ? text.saving : text.save}
                </button>

                <button
                  type="button"
                  onClick={() => void load()}
                  disabled={busy}
                  style={{
                    ...btnSecondary,
                    ...(busy ? disabledButtonStyle : {}),
                  }}
                >
                  {text.refresh}
                </button>
              </div>

              <div style={noteBoxStyle}>{text.note}</div>
            </div>
          )}
        </div>

        {canShowOtpCard ? (
          <div style={otpCardStyle}>
            <div style={otpCardHeaderStyle}>
              <div style={otpHeaderCopyStyle}>
                <div style={otpLabelStyle}>{text.otpCardLabel}</div>
                <div style={otpTitleStyle}>{text.otpCardTitle}</div>
              </div>

              <div style={otpStatusChipStyle}>
                {humanizeVerificationStatus(phoneVerificationStatus, text)}
              </div>
            </div>

            <div style={otpBodyTextStyle}>{text.otpCardBody}</div>

            {otpExpiresAt ? (
              <div style={otpMetaStyle}>
                {text.otpExpiresPrefix}: {formatDisplayDateTime(otpExpiresAt)}
              </div>
            ) : null}

            {devTestOtp ? (
              <div style={otpDevBoxStyle}>
                {text.otpTestCodePrefix}: <strong>{devTestOtp}</strong>
              </div>
            ) : null}

            <div style={otpActionRowStyle}>
              <button
                type="button"
                onClick={() => void sendOtp(false)}
                disabled={!canSendOtpNow}
                style={{
                  ...btnSecondary,
                  ...(!canSendOtpNow ? disabledButtonStyle : {}),
                }}
              >
                {otpSending
                  ? text.otpSending
                  : otpCooldownSeconds > 0
                    ? `${text.otpResendCooldown} (${otpCooldownSeconds}s)`
                    : text.otpResend}
              </button>
            </div>

            <div style={otpFormRowStyle}>
              <label style={fieldStyle}>
                <div style={fieldLabelStyle}>{text.otpFieldLabel}</div>
                <input
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/[^\d]/g, "").slice(0, 8));
                    setErr("");
                    setOk("");
                  }}
                  disabled={otpVerifying || otpSending}
                  inputMode="numeric"
                  placeholder={text.otpFieldPlaceholder}
                  style={{
                    ...inputStyle,
                    ...(otpVerifying || otpSending ? disabledInputStyle : {}),
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => void verifyOtp()}
                disabled={!canVerifyOtpNow}
                style={{
                  ...btnPrimary,
                  ...(!canVerifyOtpNow ? disabledButtonStyle : {}),
                }}
              >
                {otpVerifying ? text.otpVerifying : text.otpVerify}
              </button>
            </div>
          </div>
        ) : null}

        <div style={footerActionCardStyle}>
          <div style={footerActionCopyStyle}>
            <div style={footerActionLabelStyle}>{text.nextStepLabel}</div>
            <div style={footerActionTitleStyle}>
              {profileState === "PROFILE_REQUIRED"
                ? text.nextStepProfile
                : profileState === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED"
                  ? text.nextStepPhone
                  : text.nextStepReady}
            </div>
            <div style={footerActionTextStyle}>
              {profileState === "PROFILE_REQUIRED"
                ? text.nextStepProfileText
                : profileState === "PROFILE_CREATED_BUT_PHONE_NOT_VERIFIED"
                  ? text.nextStepPhoneText
                  : ""}
            </div>
          </div>

          <div style={footerActionButtonsStyle}>
            {canGoDashboard ? (
              <Link href={dashboardHref} style={dashboardLinkStyle}>
                {text.dashboardBack}
              </Link>
            ) : (
              <span style={disabledDashboardPillStyle}>{text.dashboardLocked}</span>
            )}

            <Link href={servicesHref} style={secondaryButtonStyle}>
              {text.servicesGo}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <label style={fieldStyle}>
      <div style={fieldLabelStyle}>{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        style={{
          ...inputStyle,
          ...(disabled ? disabledInputStyle : {}),
        }}
      />
    </label>
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
  padding: "0 0 88px",
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
  lineHeight: 1.8,
  color: "#475569",
  maxWidth: 920,
  minWidth: 0,
};

const heroMetaRowStyle: CSSProperties = {
  marginTop: 2,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
  gap: 16,
  alignItems: "stretch",
  minWidth: 0,
};

const serviceCardStyle: CSSProperties = {
  minWidth: 0,
  borderRadius: 22,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background: `
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.10), transparent 24%),
    radial-gradient(circle at bottom left, rgba(163, 230, 53, 0.08), transparent 20%),
    linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)
  `,
  padding: "clamp(16px, 2.4vw, 20px)",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
  boxSizing: "border-box",
};

const metaLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const serviceTitleStyle: CSSProperties = {
  marginTop: 10,
  fontSize: "clamp(1.35rem, 3vw, 1.7rem)",
  fontWeight: 900,
  color: "#0f172a",
  letterSpacing: "-0.02em",
  lineHeight: 1.18,
  overflowWrap: "anywhere",
};

const serviceKeyStyle: CSSProperties = {
  marginTop: 8,
  color: "#2563eb",
  fontSize: 13,
  wordBreak: "break-word",
  overflowWrap: "anywhere",
  lineHeight: 1.7,
  fontWeight: 700,
};

const stateCardStyle: CSSProperties = {
  borderRadius: 24,
  padding: "clamp(18px, 2.7vw, 24px)",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  boxShadow: "0 12px 26px rgba(15, 23, 42, 0.05)",
  boxSizing: "border-box",
};

const stateCardInfoStyle: CSSProperties = {
  background: "linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%)",
  borderColor: "rgba(59, 130, 246, 0.24)",
};

const stateCardWarningStyle: CSSProperties = {
  background: "linear-gradient(180deg, #fffdf7 0%, #fff6e8 100%)",
  borderColor: "rgba(245, 158, 11, 0.28)",
};

const stateCardSuccessStyle: CSSProperties = {
  background: "linear-gradient(180deg, #f8fff9 0%, #edfdf2 100%)",
  borderColor: "rgba(34, 197, 94, 0.24)",
};

const stateBadgeStyle: CSSProperties = {
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
  lineHeight: 1.3,
  overflowWrap: "anywhere",
};

const stateTitleStyle: CSSProperties = {
  margin: "12px 0 0 0",
  fontSize: "clamp(1.35rem, 3vw, 1.7rem)",
  lineHeight: 1.2,
  fontWeight: 900,
  color: "#0f172a",
  letterSpacing: "-0.02em",
  overflowWrap: "anywhere",
};

const stateDescriptionStyle: CSSProperties = {
  margin: "10px 0 0 0",
  fontSize: 14,
  lineHeight: 1.8,
  color: "#475569",
};

const stateMetaGridStyle: CSSProperties = {
  marginTop: 16,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
  gap: 12,
};

const stateMetaItemStyle: CSSProperties = {
  padding: "12px 13px",
  borderRadius: 14,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(6px)",
  minWidth: 0,
  boxSizing: "border-box",
};

const stateMetaLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const stateMetaValueStyle: CSSProperties = {
  marginTop: 6,
  fontSize: 15,
  fontWeight: 800,
  color: "#0f172a",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
  lineHeight: 1.5,
};

const otpWarningBoxStyle: CSSProperties = {
  marginTop: 14,
  padding: "14px 15px",
  borderRadius: 14,
  border: "1px solid rgba(245, 158, 11, 0.28)",
  background: "linear-gradient(180deg, #fffdf7 0%, #fff7e8 100%)",
  color: "#92400e",
  fontSize: 13,
  lineHeight: 1.7,
  fontWeight: 700,
  boxSizing: "border-box",
};

const otpSuccessBoxStyle: CSSProperties = {
  marginTop: 14,
  padding: "14px 15px",
  borderRadius: 14,
  border: "1px solid rgba(34, 197, 94, 0.24)",
  background: "linear-gradient(180deg, #f8fff9 0%, #edfdf2 100%)",
  color: "#166534",
  fontSize: 13,
  lineHeight: 1.7,
  fontWeight: 700,
  boxSizing: "border-box",
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

const otpCardStyle: CSSProperties = {
  background: "linear-gradient(180deg, #fffdfa 0%, #fff8ef 100%)",
  border: "1px solid rgba(245, 158, 11, 0.22)",
  borderRadius: 22,
  padding: "clamp(18px, 2.5vw, 22px)",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
  boxSizing: "border-box",
};

const otpCardHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
};

const otpHeaderCopyStyle: CSSProperties = {
  minWidth: 0,
};

const otpLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#92400e",
};

const otpTitleStyle: CSSProperties = {
  marginTop: 6,
  fontSize: "clamp(1.2rem, 2.8vw, 1.4rem)",
  fontWeight: 900,
  color: "#0f172a",
  letterSpacing: "-0.02em",
  lineHeight: 1.24,
  overflowWrap: "anywhere",
};

const otpStatusChipStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 32,
  maxWidth: "100%",
  padding: "0 12px",
  borderRadius: 999,
  background: "#fff7ed",
  border: "1px solid rgba(245, 158, 11, 0.24)",
  color: "#92400e",
  fontWeight: 800,
  lineHeight: 1.3,
  textAlign: "center",
  overflowWrap: "anywhere",
};

const otpBodyTextStyle: CSSProperties = {
  marginTop: 12,
  color: "#475569",
  lineHeight: 1.75,
};

const otpMetaStyle: CSSProperties = {
  marginTop: 10,
  color: "#64748b",
  fontSize: 13,
  lineHeight: 1.6,
  overflowWrap: "anywhere",
};

const otpDevBoxStyle: CSSProperties = {
  marginTop: 12,
  padding: "12px 13px",
  borderRadius: 12,
  background: "#eef4ff",
  border: "1px solid rgba(59, 130, 246, 0.20)",
  color: "#1d4ed8",
  fontWeight: 800,
  lineHeight: 1.55,
  overflowWrap: "anywhere",
  boxSizing: "border-box",
};

const otpActionRowStyle: CSSProperties = {
  marginTop: 16,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: 10,
};

const otpFormRowStyle: CSSProperties = {
  marginTop: 16,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: 10,
  alignItems: "end",
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gap: 16,
};

const profileIdentityGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
  gap: 16,
  alignItems: "start",
};

const fieldColumnStyle: CSSProperties = {
  display: "grid",
  gap: 14,
  minWidth: 0,
};

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  minWidth: 0,
};

const fieldLabelStyle: CSSProperties = {
  fontWeight: 800,
  color: "#334155",
  fontSize: 14,
  lineHeight: 1.45,
};

const fieldHintStyle: CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  lineHeight: 1.65,
};

const phoneGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: 10,
};

const inputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  padding: "12px 13px",
  borderRadius: 12,
  border: "1px solid rgba(15, 23, 42, 0.10)",
  background: "#ffffff",
  fontSize: 14,
  outline: "none",
  color: "#0f172a",
  lineHeight: 1.45,
  boxShadow: "inset 0 1px 2px rgba(15, 23, 42, 0.03)",
  boxSizing: "border-box",
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: 140,
  resize: "vertical",
  fontFamily: "inherit",
};

const disabledInputStyle: CSSProperties = {
  opacity: 0.7,
  cursor: "not-allowed",
  background: "#f8fafc",
};

const profilePreviewCardBorder = "1px solid rgba(15, 23, 42, 0.08)";

const avatarPreviewCardStyle: CSSProperties = {
  borderRadius: 20,
  border: profilePreviewCardBorder,
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  padding: "clamp(14px, 2.3vw, 18px)",
  display: "grid",
  gap: 12,
  alignItems: "start",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
  minWidth: 0,
  boxSizing: "border-box",
};

const avatarPreviewLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#64748b",
};

const avatarImageStyle: CSSProperties = {
  width: "100%",
  maxWidth: 220,
  aspectRatio: "1 / 1",
  borderRadius: "50%",
  objectFit: "cover",
  border: "1px solid rgba(15, 23, 42, 0.10)",
  background: "#f8fafc",
  justifySelf: "start",
  display: "block",
};

const avatarPlaceholderStyle: CSSProperties = {
  width: "100%",
  maxWidth: 220,
  aspectRatio: "1 / 1",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(15, 23, 42, 0.10)",
  background: "#0f172a",
  color: "#ffffff",
  fontWeight: 900,
  fontSize: "clamp(2.4rem, 8vw, 3rem)",
};

const avatarPreviewNameStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  color: "#0f172a",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
  lineHeight: 1.3,
};

const avatarPreviewBioStyle: CSSProperties = {
  fontSize: 14,
  lineHeight: 1.75,
  color: "#475569",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
};

const uploadPanelStyle: CSSProperties = {
  display: "grid",
  gap: 10,
  padding: "14px 15px",
  borderRadius: 16,
  border: "1px dashed rgba(15, 23, 42, 0.18)",
  background: "rgba(255,255,255,0.72)",
  boxSizing: "border-box",
};

const uploadActionsRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
  gap: 10,
};

const uploadMetaStyle: CSSProperties = {
  fontSize: 12,
  color: "#475569",
  lineHeight: 1.6,
  wordBreak: "break-word",
  overflowWrap: "anywhere",
};

const inlineCodeStyle: CSSProperties = {
  display: "inline-block",
  maxWidth: "100%",
  background: "#ffffff",
  borderRadius: 8,
  padding: "2px 8px",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  color: "#0f172a",
  fontWeight: 800,
  wordBreak: "break-word",
  overflowWrap: "anywhere",
  boxSizing: "border-box",
};

const bioMetaRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const charCountStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#475569",
  whiteSpace: "nowrap",
};

const previewStyle: CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  lineHeight: 1.6,
  overflowWrap: "anywhere",
};

const previewCodeStyle: CSSProperties = {
  display: "inline-block",
  maxWidth: "100%",
  fontWeight: 800,
  background: "#eef4ff",
  color: "#1d4ed8",
  padding: "4px 8px",
  borderRadius: 8,
  border: "1px solid rgba(59, 130, 246, 0.18)",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
  boxSizing: "border-box",
};

const validationErrorStyle: CSSProperties = {
  color: "#b91c1c",
  fontSize: 13,
  fontWeight: 800,
  lineHeight: 1.6,
  overflowWrap: "anywhere",
};

const actionsRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
  gap: 10,
  alignItems: "stretch",
};

const noteBoxStyle: CSSProperties = {
  padding: "14px 15px",
  borderRadius: 16,
  border: "1px solid rgba(59, 130, 246, 0.18)",
  background: "linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%)",
  color: "#1e40af",
  fontSize: 13,
  lineHeight: 1.75,
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

const okBoxStyle: CSSProperties = {
  padding: "14px 16px",
  border: "1px solid rgba(34, 197, 94, 0.24)",
  background: "linear-gradient(180deg, #f8fff9 0%, #edfdf2 100%)",
  color: "#166534",
  borderRadius: 16,
  fontWeight: 700,
  lineHeight: 1.7,
  boxSizing: "border-box",
  overflowWrap: "anywhere",
};

const mutedStyle: CSSProperties = {
  color: "#64748b",
  lineHeight: 1.7,
};

const btnPrimary: CSSProperties = {
  width: "100%",
  minHeight: 48,
  padding: "12px 16px",
  borderRadius: 12,
  background: "#0f172a",
  color: "#ffffff",
  border: "1px solid #0f172a",
  fontWeight: 900,
  cursor: "pointer",
  textAlign: "center",
  lineHeight: 1.3,
  boxShadow: "0 10px 20px rgba(15, 23, 42, 0.14)",
  boxSizing: "border-box",
};

const btnSecondary: CSSProperties = {
  width: "100%",
  minHeight: 48,
  padding: "12px 16px",
  borderRadius: 12,
  background: "#ffffff",
  color: "#0f172a",
  border: "1px solid rgba(15, 23, 42, 0.10)",
  fontWeight: 900,
  cursor: "pointer",
  textAlign: "center",
  lineHeight: 1.3,
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.06)",
  boxSizing: "border-box",
};

const btnGhost: CSSProperties = {
  width: "100%",
  minHeight: 48,
  padding: "12px 16px",
  borderRadius: 12,
  background: "transparent",
  color: "#0f172a",
  border: "1px solid rgba(15, 23, 42, 0.12)",
  fontWeight: 900,
  cursor: "pointer",
  textAlign: "center",
  lineHeight: 1.3,
  boxSizing: "border-box",
};

const disabledButtonStyle: CSSProperties = {
  opacity: 0.5,
  cursor: "not-allowed",
};

const secondaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  minHeight: 48,
  padding: "12px 18px",
  borderRadius: 14,
  border: "1px solid rgba(15, 23, 42, 0.10)",
  background: "#ffffff",
  color: "#0f172a",
  textDecoration: "none",
  fontWeight: 700,
  textAlign: "center",
  lineHeight: 1.3,
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.06)",
  boxSizing: "border-box",
};

const footerActionCardStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
  padding: "clamp(18px, 2.5vw, 22px)",
  borderRadius: 22,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background: `
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.10), transparent 24%),
    radial-gradient(circle at bottom left, rgba(163, 230, 53, 0.08), transparent 20%),
    linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)
  `,
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
  boxSizing: "border-box",
};

const footerActionCopyStyle: CSSProperties = {
  flex: "1 1 360px",
  minWidth: 0,
};

const footerActionLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#64748b",
};

const footerActionTitleStyle: CSSProperties = {
  marginTop: 6,
  fontSize: "clamp(1.2rem, 2.8vw, 1.4rem)",
  fontWeight: 900,
  color: "#0f172a",
  letterSpacing: "-0.02em",
  lineHeight: 1.25,
  overflowWrap: "anywhere",
};

const footerActionTextStyle: CSSProperties = {
  marginTop: 8,
  fontSize: 14,
  lineHeight: 1.75,
  color: "#475569",
};

const footerActionButtonsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
  gap: 10,
  alignItems: "stretch",
  flex: "1 1 320px",
  minWidth: 0,
};

const disabledDashboardPillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  minHeight: 48,
  padding: "12px 16px",
  borderRadius: 14,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background: "#f8fafc",
  color: "#94a3b8",
  fontWeight: 800,
  textAlign: "center",
  lineHeight: 1.3,
  cursor: "not-allowed",
  boxSizing: "border-box",
};

const dashboardLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  minHeight: 48,
  padding: "12px 18px",
  borderRadius: 14,
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: 800,
  textAlign: "center",
  lineHeight: 1.3,
  boxShadow: "0 10px 20px rgba(15, 23, 42, 0.14)",
  boxSizing: "border-box",
};