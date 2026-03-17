import type { CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
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

type InvoiceStatus = "PENDING" | "PAID" | "FAILED" | "CANCELED" | string;
type SubscriptionTier = "STANDARD" | "PREMIUM";
type BillingCycle = "MONTHLY" | "YEARLY";
type PlanType = "STANDARD" | "PLUS";
type VisualTone = "success" | "cancel" | "pending" | "error" | "neutral";

type InvoiceDTO = {
  id: string;
  status: InvoiceStatus;
  amount: number;
  currency: string;
  provider: string;
  providerRef?: string | null;
  paidAt: string | null;
  paidUntil: string | null;
  periodDays: number;
  serviceKey: string | null;
  serviceName?: string | null;
  ownerId?: string | null;
  ownerPhone: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  receiptNumber?: string | null;
  subscriptionTier?: SubscriptionTier;
  billingCycle?: BillingCycle;
  plan?: PlanType;
};

type InvoiceResponseDTO = Partial<InvoiceDTO> & {
  ok?: boolean;
  error?: string;
  message?: string;
};

type ReceiptField = {
  label: string;
  value: string;
};

type VisualStatus = {
  tone: VisualTone;
  title: string;
  text: string;
  badge: string;
};

type ToneStyles = {
  box: CSSProperties;
  badge: CSSProperties;
};

type FetchJsonResult<T> = {
  response: Response;
  data: T;
};

const PAGE_COPY = {
  paymentReceiptBadge: "Ödəniş qəbzi",
  paymentReceiptTitle: "Ödəniş qəbzi",
  paymentReceiptSubtitle:
    "botXan ödəniş nəticəsi, sahibkar məlumatları və provider detalları burada göstərilir.",
  missingInvoiceIdTitle: "Invoice identifikatoru yoxdur",
  missingInvoiceIdText: "Qəbz səhifəsi invoice identifikatoru olmadan açılıb.",
  errorTitle: "Xəta",
  loadingInvoice: "Invoice məlumatı yüklənir...",
  detailsTitle: "Ödəniş detalları",
  actionsTitle: "Qəbz əməliyyatları",
  refreshing: "Yenilənir...",
  refreshReceipt: "Qəbzi yenilə",
  preparingCheck: "Çek hazırlanır...",
  downloadCheck: "Çeki yüklə",
  share: "Paylaş",
  dashboardBack: "İdarəetmə panelinə qayıt",
  billingBack: "Abunəlik səhifəsinə qayıt",
  servicesBack: "Xidmətlər səhifəsinə qayıt",
  shareCopied: "Qəbz linki kopyalandı.",
  shareUnsupported: "Paylaşma bu cihazda dəstəklənmir.",
  shareFailed: "Paylaşma alınmadı.",
  downloadFailed: "Şəkil kimi yükləmə alınmadı.",
  timeoutError: "Sorğu vaxt aşımına düşdü. Backend cavab vermədi.",
  invoiceLoadFailed: "Invoice yüklənmədi.",
  forbiddenReceipt: "Bu qəbzə giriş icazəniz yoxdur.",
  invoiceNotFound: "Invoice tapılmadı.",
  internalError: "Server xətası baş verdi. Bir az sonra yenidən cəhd edin.",
  paymentCanceledTitle: "Ödəniş ləğv edildi",
  paymentCanceledText:
    "Ödəniş prosesi dayandırıldı. İstəsəniz abunəlik səhifəsindən yenidən cəhd edə bilərsiniz.",
  paymentCanceledBadge: "Ləğv edildi",
  paymentPaidTitle: "Ödəniş uğurla tamamlandı",
  paymentPaidText: "Abunəlik aktivləşdirildi və xidmət istifadəyə hazırdır.",
  paymentPaidBadge: "Ödənildi",
  paymentPendingTitle: "Ödəniş gözlənilir",
  paymentPendingText: "Ödəniş hələ tamamlanmayıb. Provider təsdiqi gözlənilir.",
  paymentPendingBadge: "Gözlənilir",
  paymentFailedTitle: "Ödəniş alınmadı",
  paymentFailedText: "Ödəniş təsdiqlənmədi. Yenidən cəhd etməniz lazım ola bilər.",
  paymentFailedBadge: "Uğursuz",
  paymentCheckingTitle: "Ödəniş nəticəsi yoxlanılır",
  paymentCheckingText: "Provider cavabı gözlənilir. Qəbz məlumatı yenilənə bilər.",
  paymentCheckingBadge: "Yoxlanılır",
  receiptInfoTitle: "Qəbz məlumatı",
  receiptInfoText: "Invoice məlumatı aşağıda göstərilir.",
  receiptInfoBadge: "Naməlum",
  standardPlan: "Standart",
  plusPlan: "Plus",
  legacyYearly: "İllik (köhnə model)",
  receiptNumber: "Qəbz nömrəsi",
  status: "Status",
  provider: "Provider",
  providerRef: "Provider ref",
  service: "Xidmət",
  plan: "Plan",
  amount: "Məbləğ",
  paidAt: "Ödənilib",
  activeUntil: "Aktivdir",
  duration: "Müddət",
  durationDays: "gün",
  ownerName: "Sahibkar adı",
  ownerPhone: "Sahibkar telefonu",
  ownerEmail: "Sahibkar e-poçtu",
  paymentReceiptCanvasTitle: "Ödəniş qəbzi",
  paymentReceiptCanvasSubtitle:
    "Bu sənəddə ödəniş, sahibkar və provider məlumatları göstərilir.",
  paymentStatusDetails: "Ödəniş detalları",
  digitalReceiptNote1:
    "Bu qəbz sahibkar panelində yaradılmış rəqəmsal ödəniş çıxarışıdır.",
  digitalReceiptNote2:
    "Provider ref və sahibkar məlumatları audit və istinad məqsədi ilə əlavə olunub.",
  shareTitle: "botXan ödəniş qəbzi",
  rentHome: "Ev kirayəsi",
  barber: "Bərbər xidməti",
  carRental: "Avtomobil icarəsi",
  hotel: "Otel xidməti",
  beautySalon: "Gözəllik salonu",
  babysitter: "Uşaq baxıcısı",
  cleaning: "Təmizlik xidmətləri",
  technicalServices: "Texniki xidmətlər",
  invoiceStatusPending: "Gözlənilir",
  invoiceStatusPaid: "Ödənilib",
  invoiceStatusFailed: "Uğursuz",
  invoiceStatusCanceled: "Ləğv edilib",
  invoiceStatusUnknown: "Naməlum",
} as const;

type UiText = typeof PAGE_COPY;

function normalizeQueryValue(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return (v[0] || "").trim();
  return (v || "").trim();
}

function digitsOnly(input: string): string {
  return String(input || "").replace(/[^\d]/g, "");
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

function safeServiceKey(v: unknown): string {
  const s = String(v ?? "").trim().toUpperCase();
  if (!s) return "";
  if (!/^[A-Z0-9_-]{2,64}$/.test(s)) return "";
  return s;
}

function normalizePlanValue(value: unknown): PlanType | "" {
  const v = String(value ?? "").trim().toUpperCase();

  if (!v) return "";
  if (v === "STANDARD" || v === "STANDART") return "STANDARD";
  if (v === "PLUS" || v === "PREMIUM") return "PLUS";

  return "";
}

function resolvePlanFromInvoice(
  plan?: PlanType,
  tier?: SubscriptionTier,
): PlanType | "" {
  const normalizedPlan = normalizePlanValue(plan);
  if (normalizedPlan) return normalizedPlan;

  if (tier === "PREMIUM") return "PLUS";
  if (tier === "STANDARD") return "STANDARD";

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
  const sanitized = normalizeAsciiHeaderValue(String(value ?? "").toLowerCase());
  if (!sanitized) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) return "";
  return sanitized;
}

function sanitizeHeadersRecord(input: Record<string, string>): Record<string, string> {
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
    const value = String(window.localStorage.getItem(key) || "").trim();
    if (value) return value;
  }

  return "";
}

function readOwnerIdFromStorage(): string {
  return normalizeOwnerIdForStorage(readFirstStorageValue(OWNER_ID_STORAGE_KEYS));
}

function readOwnerEmailFromStorage(): string {
  return normalizeEmailForStorage(readFirstStorageValue(OWNER_EMAIL_STORAGE_KEYS));
}

function readPhoneFromStorage(): string {
  return normalizePhoneCandidate(readFirstStorageValue(PHONE_STORAGE_KEYS));
}

function readServiceKeyFromStorage(): string {
  return safeServiceKey(readFirstStorageValue(SERVICE_STORAGE_KEYS));
}

function readPlanFromStorage(): PlanType | "" {
  return normalizePlanValue(readFirstStorageValue(PLAN_STORAGE_KEYS));
}

function writeOwnerIdToStorage(ownerId: string): void {
  if (typeof window === "undefined") return;
  const normalized = normalizeOwnerIdForStorage(ownerId);
  if (!normalized) return;
  for (const key of OWNER_ID_STORAGE_KEYS) {
    window.localStorage.setItem(key, normalized);
  }
}

function writeOwnerEmailToStorage(email: string): void {
  if (typeof window === "undefined") return;
  const normalized = normalizeEmailForStorage(email);
  if (!normalized) return;
  for (const key of OWNER_EMAIL_STORAGE_KEYS) {
    window.localStorage.setItem(key, normalized);
  }
}

function writePhoneToStorage(phone: string): void {
  if (typeof window === "undefined") return;
  const normalized = normalizePhoneCandidate(phone);
  if (!normalized) return;
  for (const key of PHONE_STORAGE_KEYS) {
    window.localStorage.setItem(key, normalized);
  }
}

function writeServiceKeyToStorage(serviceKey: string): void {
  if (typeof window === "undefined") return;
  const safe = safeServiceKey(serviceKey);
  if (!safe) return;
  for (const key of SERVICE_STORAGE_KEYS) {
    window.localStorage.setItem(key, safe);
  }
}

function writePlanToStorage(plan: PlanType): void {
  if (typeof window === "undefined") return;
  for (const key of PLAN_STORAGE_KEYS) {
    window.localStorage.setItem(key, plan);
  }
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

function buildRouteWithLang(
  pathname: string,
  extra?: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  params.set("lang", PAGE_LOCALE);

  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      const normalizedValue = String(value || "").trim();
      if (normalizedValue) {
        params.set(key, normalizedValue);
      }
    }
  }

  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
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

function humanizeServiceKey(
  serviceKey: string | null | undefined,
  text: UiText,
): string {
  const raw = String(serviceKey || "").trim().toUpperCase();
  if (!raw) return text.invoiceStatusUnknown;

  const map: Record<string, string> = {
    RENT_HOME: text.rentHome,
    BARBER: text.barber,
    CAR_RENTAL: text.carRental,
    HOTEL: text.hotel,
    BEAUTY_SALON: text.beautySalon,
    BABYSITTER: text.babysitter,
    CLEANING: text.cleaning,
    TECHNICAL_SERVICES: text.technicalServices,
  };

  if (map[raw]) return map[raw];

  return raw
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function resolveServiceTitle(invoice: InvoiceDTO, text: UiText): string {
  const name = String(invoice.serviceName || "").trim();
  if (name) return name;
  return humanizeServiceKey(invoice.serviceKey, text);
}

function formatReceiptDateTime(
  value: string | null | undefined,
  formattingLocale: FormattingLocale,
): string {
  return formatDateTime(value, formattingLocale, { fallback: "-" });
}

function formatDisplayNumber(
  value: number,
  formattingLocale: FormattingLocale,
  options?: Intl.NumberFormatOptions,
): string {
  if (!Number.isFinite(value)) return "-";

  try {
    return new Intl.NumberFormat(formattingLocale, options).format(value);
  } catch {
    return String(value);
  }
}

function formatAmount(
  amount: number,
  currency: string,
  formattingLocale: FormattingLocale,
): string {
  const formattedAmount = formatDisplayNumber(amount, formattingLocale, {
    maximumFractionDigits: 2,
  });
  const normalizedCurrency = String(currency || "").trim() || "AZN";
  return `${formattedAmount} ${normalizedCurrency}`;
}

function getPlanTitle(
  plan: PlanType | undefined,
  tier: SubscriptionTier | undefined,
  cycle: BillingCycle | undefined,
  text: UiText,
): string {
  const resolvedPlan = resolvePlanFromInvoice(plan, tier);

  if (!resolvedPlan) return "-";

  const planLabel = resolvedPlan === "PLUS" ? text.plusPlan : text.standardPlan;

  if (cycle === "YEARLY") {
    return `${planLabel} / ${text.legacyYearly}`;
  }

  return planLabel;
}

function getInvoiceStatusLabel(
  status: InvoiceStatus | "",
  text: UiText,
): string {
  const normalized = String(status || "").trim().toUpperCase();

  if (normalized === "PAID") return text.invoiceStatusPaid;
  if (normalized === "PENDING") return text.invoiceStatusPending;
  if (normalized === "FAILED") return text.invoiceStatusFailed;
  if (normalized === "CANCELED" || normalized === "CANCELLED") {
    return text.invoiceStatusCanceled;
  }

  return normalized || text.invoiceStatusUnknown;
}

function getVisualStatus(
  statusHint: string,
  invoiceStatus: InvoiceStatus | "",
  text: UiText,
): VisualStatus {
  const hint = statusHint.trim().toLowerCase();
  const status = String(invoiceStatus || "").trim().toUpperCase();

  if (status === "CANCELED" || status === "CANCELLED") {
    return {
      tone: "cancel",
      title: text.paymentCanceledTitle,
      text: text.paymentCanceledText,
      badge: text.paymentCanceledBadge,
    };
  }

  if (status === "PAID") {
    return {
      tone: "success",
      title: text.paymentPaidTitle,
      text: text.paymentPaidText,
      badge: text.paymentPaidBadge,
    };
  }

  if (status === "PENDING") {
    return {
      tone: "pending",
      title: text.paymentPendingTitle,
      text: text.paymentPendingText,
      badge: text.paymentPendingBadge,
    };
  }

  if (status === "FAILED") {
    return {
      tone: "error",
      title: text.paymentFailedTitle,
      text: text.paymentFailedText,
      badge: text.paymentFailedBadge,
    };
  }

  if (hint === "cancel") {
    return {
      tone: "cancel",
      title: text.paymentCanceledTitle,
      text: text.paymentCanceledText,
      badge: text.paymentCanceledBadge,
    };
  }

  if (hint === "success") {
    return {
      tone: "pending",
      title: text.paymentCheckingTitle,
      text: text.paymentCheckingText,
      badge: text.paymentCheckingBadge,
    };
  }

  return {
    tone: "neutral",
    title: text.receiptInfoTitle,
    text: text.receiptInfoText,
    badge: text.receiptInfoBadge,
  };
}

function getToneStyles(tone: VisualTone): ToneStyles {
  if (tone === "success") {
    return {
      box: {
        border: "1px solid #86efac",
        background: "#f0fdf4",
        color: "#166534",
      },
      badge: {
        background: "#dcfce7",
        color: "#166534",
        border: "1px solid #86efac",
      },
    };
  }

  if (tone === "cancel") {
    return {
      box: {
        border: "1px solid #f9a8d4",
        background: "#fdf2f8",
        color: "#9d174d",
      },
      badge: {
        background: "#fce7f3",
        color: "#9d174d",
        border: "1px solid #f9a8d4",
      },
    };
  }

  if (tone === "pending") {
    return {
      box: {
        border: "1px solid #fcd34d",
        background: "#fffbeb",
        color: "#92400e",
      },
      badge: {
        background: "#fef3c7",
        color: "#92400e",
        border: "1px solid #fcd34d",
      },
    };
  }

  if (tone === "error") {
    return {
      box: {
        border: "1px solid #fca5a5",
        background: "#fef2f2",
        color: "#991b1b",
      },
      badge: {
        background: "#fee2e2",
        color: "#991b1b",
        border: "1px solid #fca5a5",
      },
    };
  }

  return {
    box: {
      border: "1px solid #d1d5db",
      background: "#f9fafb",
      color: "#374151",
    },
    badge: {
      background: "#f3f4f6",
      color: "#374151",
      border: "1px solid #d1d5db",
    },
  };
}

function canUseBrowserDom(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : error instanceof Error
      ? error.name === "AbortError"
      : false;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function downloadDataUrl(dataUrl: string, fileName: string): void {
  if (!canUseBrowserDom()) {
    throw new Error("Browser API mövcud deyil.");
  }

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const normalized = String(text || "").trim();
  if (!normalized) return ["-"];

  const paragraphs = normalized.split("\n").map((item) => item.trim());
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push("");
      continue;
    }

    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let current = words[0];

    for (let i = 1; i < words.length; i += 1) {
      const testLine = `${current} ${words[i]}`;
      if (ctx.measureText(testLine).width <= maxWidth) {
        current = testLine;
      } else {
        lines.push(current);
        current = words[i];
      }
    }

    lines.push(current);
  }

  return lines.length > 0 ? lines : ["-"];
}

function buildReceiptFields(
  invoice: InvoiceDTO,
  text: UiText,
  formattingLocale: FormattingLocale,
): ReceiptField[] {
  return [
    {
      label: text.receiptNumber,
      value: String(invoice.receiptNumber || invoice.id || "-").trim() || "-",
    },
    {
      label: text.status,
      value: getInvoiceStatusLabel(invoice.status, text),
    },
    {
      label: text.provider,
      value: String(invoice.provider || "-"),
    },
    {
      label: text.providerRef,
      value: String(invoice.providerRef || "-"),
    },
    {
      label: text.service,
      value: resolveServiceTitle(invoice, text),
    },
    {
      label: text.plan,
      value: getPlanTitle(
        invoice.plan,
        invoice.subscriptionTier,
        invoice.billingCycle,
        text,
      ),
    },
    {
      label: text.amount,
      value: formatAmount(invoice.amount, invoice.currency, formattingLocale),
    },
    {
      label: text.paidAt,
      value: formatReceiptDateTime(invoice.paidAt, formattingLocale),
    },
    {
      label: text.activeUntil,
      value: formatReceiptDateTime(invoice.paidUntil, formattingLocale),
    },
    {
      label: text.duration,
      value: `${invoice.periodDays} ${text.durationDays}`,
    },
    {
      label: text.ownerName,
      value: String(invoice.ownerName || "-"),
    },
    {
      label: text.ownerPhone,
      value: String(invoice.ownerPhone || "-"),
    },
    {
      label: text.ownerEmail,
      value: String(invoice.ownerEmail || "-"),
    },
  ];
}

function extractInvoiceErrorMessage(raw: string, text: UiText): string {
  const value = String(raw || "").trim();
  const normalized = value.toLowerCase();

  if (normalized === "forbidden") {
    return text.forbiddenReceipt;
  }
  if (normalized === "not_found" || normalized === "invoice not found") {
    return text.invoiceNotFound;
  }
  if (normalized === "internal_error") {
    return text.internalError;
  }

  return value || text.invoiceLoadFailed;
}

async function exportReceiptAsJpg(params: {
  invoice: InvoiceDTO;
  visual: VisualStatus;
  text: UiText;
  formattingLocale: FormattingLocale;
}): Promise<void> {
  const { invoice, visual, text, formattingLocale } = params;

  if (!canUseBrowserDom()) {
    throw new Error(text.downloadFailed);
  }

  const scale = Math.max(2, Math.min(window.devicePixelRatio || 1, 3));
  const width = 1400;
  const padding = 56;
  const sectionGap = 24;
  const rowGap = 14;
  const leftColWidth = 250;
  const rightColWidth = width - padding * 2 - leftColWidth - 36;
  const fields = buildReceiptFields(invoice, text, formattingLocale);

  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  if (!measureCtx) {
    throw new Error("Canvas context yaradıla bilmədi.");
  }

  measureCtx.font =
    '500 26px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  let detailsHeight = 0;
  for (const field of fields) {
    const lines = wrapText(measureCtx, field.value, rightColWidth);
    detailsHeight += Math.max(38, lines.length * 34) + rowGap;
  }

  const headerHeight = 182;
  const statusHeight = 126;
  const detailsHeaderHeight = 52;
  const cardPaddingTop = 40;
  const cardPaddingBottom = 40;
  const footerNoteHeight = 78;
  const detailsCardHeight =
    cardPaddingTop +
    detailsHeaderHeight +
    detailsHeight +
    footerNoteHeight +
    cardPaddingBottom;

  const height =
    padding +
    headerHeight +
    sectionGap +
    statusHeight +
    sectionGap +
    detailsCardHeight +
    padding;

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context yaradıla bilmədi.");
  }

  ctx.scale(scale, scale);

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, width, height);

  const cardX = padding;
  const cardWidth = width - padding * 2;

  let y = padding;

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, cardX, y, cardWidth, headerHeight, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#eef2ff";
  ctx.strokeStyle = "#c7d2fe";
  drawRoundedRect(ctx, cardX + 28, y + 24, 220, 40, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#3730a3";
  ctx.font =
    '800 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(text.paymentReceiptBadge, cardX + 46, y + 50);

  ctx.fillStyle = "#111827";
  ctx.font =
    '900 44px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(text.paymentReceiptCanvasTitle, cardX + 28, y + 104);

  ctx.fillStyle = "#4b5563";
  ctx.font =
    '400 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(text.paymentReceiptCanvasSubtitle, cardX + 28, y + 144);

  ctx.fillStyle = "#111827";
  ctx.font =
    '800 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(
    `${text.receiptNumber}: ${String(invoice.receiptNumber || invoice.id || "-")}`,
    cardX + cardWidth - 430,
    y + 52,
  );
  ctx.fillText(
    `${text.provider}: ${String(invoice.provider || "-")}`,
    cardX + cardWidth - 430,
    y + 88,
  );
  ctx.fillText(
    `${text.providerRef}: ${String(invoice.providerRef || "-")}`,
    cardX + cardWidth - 430,
    y + 124,
  );

  y += headerHeight + sectionGap;

  const toneStyles = getToneStyles(visual.tone);
  ctx.fillStyle = String(toneStyles.box.background || "#f9fafb");
  ctx.strokeStyle = String(toneStyles.box.border || "#d1d5db");
  drawRoundedRect(ctx, cardX, y, cardWidth, statusHeight, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = String(toneStyles.box.color || "#374151");
  ctx.font =
    '900 34px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(visual.title, cardX + 28, y + 46);

  ctx.font =
    '400 21px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const statusLines = wrapText(ctx, visual.text, cardWidth - 260);
  let statusTextY = y + 82;
  for (const line of statusLines.slice(0, 2)) {
    ctx.fillText(line, cardX + 28, statusTextY);
    statusTextY += 28;
  }

  ctx.fillStyle = String(toneStyles.badge.background || "#f3f4f6");
  ctx.strokeStyle = String(toneStyles.badge.border || "#d1d5db");
  drawRoundedRect(ctx, cardX + cardWidth - 180, y + 26, 140, 44, 22);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = String(toneStyles.badge.color || "#374151");
  ctx.font =
    '900 20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText(visual.badge, cardX + cardWidth - 110, y + 54);
  ctx.textAlign = "start";

  y += statusHeight + sectionGap;

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#e5e7eb";
  drawRoundedRect(ctx, cardX, y, cardWidth, detailsCardHeight, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#111827";
  ctx.font =
    '900 34px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(text.paymentStatusDetails, cardX + 28, y + 48);

  let rowY = y + 92;
  for (const field of fields) {
    ctx.fillStyle = "#374151";
    ctx.font =
      '800 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(field.label, cardX + 28, rowY);

    ctx.fillStyle = "#111827";
    ctx.font =
      '500 26px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

    const lines = wrapText(ctx, field.value, rightColWidth);
    let valueY = rowY;

    for (const line of lines) {
      ctx.fillText(line || " ", cardX + 28 + leftColWidth + 36, valueY);
      valueY += 34;
    }

    rowY += Math.max(38, lines.length * 34) + rowGap;
  }

  ctx.strokeStyle = "#e5e7eb";
  ctx.beginPath();
  ctx.moveTo(cardX + 28, y + detailsCardHeight - 96);
  ctx.lineTo(cardX + cardWidth - 28, y + detailsCardHeight - 96);
  ctx.stroke();

  ctx.fillStyle = "#6b7280";
  ctx.font =
    '400 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(text.digitalReceiptNote1, cardX + 28, y + detailsCardHeight - 58);
  ctx.fillText(text.digitalReceiptNote2, cardX + 28, y + detailsCardHeight - 28);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
  const safeId = String(invoice.receiptNumber || invoice.id || "receipt")
    .trim()
    .replace(/[^\w-]+/g, "_");
  downloadDataUrl(dataUrl, `receipt-${safeId}.jpg`);
}

async function fetchJsonWithTimeout<T>(
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

function parseInvoiceResponse(parsed: InvoiceResponseDTO): InvoiceDTO {
  return {
    id: String(parsed.id || ""),
    status: String(parsed.status || ""),
    amount: safeNumber(parsed.amount, 0),
    currency: String(parsed.currency || ""),
    provider: String(parsed.provider || ""),
    providerRef: parsed.providerRef ?? null,
    paidAt: parsed.paidAt ?? null,
    paidUntil: parsed.paidUntil ?? null,
    periodDays: safeNumber(parsed.periodDays, 0),
    serviceKey: parsed.serviceKey ?? null,
    serviceName: parsed.serviceName ?? null,
    ownerId: parsed.ownerId ?? null,
    ownerPhone: parsed.ownerPhone ?? null,
    ownerName: parsed.ownerName ?? null,
    ownerEmail: parsed.ownerEmail ?? null,
    receiptNumber: parsed.receiptNumber ?? null,
    subscriptionTier: parsed.subscriptionTier,
    billingCycle: parsed.billingCycle,
    plan: parsed.plan,
  };
}

export default function ReceiptPage() {
  const router = useRouter();
  const API = useMemo(() => apiBase(), []);
  const text: UiText = PAGE_COPY;
  const direction = PAGE_DIRECTION;
  const formattingLocale = PAGE_FORMATTING_LOCALE;

  const invoiceId = normalizeQueryValue(router.query.invoiceId);
  const statusHint = normalizeQueryValue(router.query.status);
  const queryLang = normalizeQueryValue(router.query.lang);

  const [data, setData] = useState<InvoiceDTO | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (!router.isReady) return;
    if (queryLang === PAGE_LOCALE) return;

    const currentPath =
      normalizeSafeRelativePath(router.asPath) ||
      buildRouteWithLang("/receipt", {
        ...(invoiceId ? { invoiceId } : {}),
        ...(statusHint ? { status: statusHint } : {}),
      });

    void router.replace(withPageLocaleOnRelativeUrl(currentPath), undefined, {
      shallow: true,
      scroll: false,
    });
  }, [router, router.isReady, router.asPath, queryLang, invoiceId, statusHint]);

  useEffect(() => {
    setPollCount(0);
    setReloadTick(0);
  }, [invoiceId]);

  useEffect(() => {
    if (!router.isReady || !invoiceId) return;

    let cancelled = false;

    const loadInvoice = async (): Promise<void> => {
      try {
        setLoading(true);
        setErr("");
        setShareMessage("");

        const { response, data: raw } = await fetchJsonWithTimeout<InvoiceResponseDTO>(
          `${API}/billing/invoice?id=${encodeURIComponent(invoiceId)}`,
          {
            method: "GET",
            headers: buildOwnerHeaders(),
          },
        );

        if (!response.ok || !raw?.ok) {
          throw new Error(
            extractInvoiceErrorMessage(String(raw?.error || raw?.message || ""), text),
          );
        }

        const invoice = parseInvoiceResponse(raw);

        if (cancelled) return;

        if (invoice.serviceKey) {
          writeServiceKeyToStorage(invoice.serviceKey);
        }

        const resolvedPlan = resolvePlanFromInvoice(
          invoice.plan,
          invoice.subscriptionTier,
        );
        if (resolvedPlan) {
          writePlanToStorage(resolvedPlan);
        }

        if (invoice.ownerId) writeOwnerIdToStorage(invoice.ownerId);
        if (invoice.ownerEmail) writeOwnerEmailToStorage(invoice.ownerEmail);
        if (invoice.ownerPhone) writePhoneToStorage(invoice.ownerPhone);

        setData(invoice);
      } catch (error: unknown) {
        if (cancelled) return;

        if (
          error instanceof Error &&
          error.message === REQUEST_TIMEOUT_ERROR
        ) {
          setErr(text.timeoutError);
        } else {
          setErr(getErrorMessage(error, text.invoiceLoadFailed));
        }
        setData(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadInvoice();

    return () => {
      cancelled = true;
    };
  }, [API, router.isReady, invoiceId, reloadTick, text]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const shouldPoll =
      Boolean(invoiceId) &&
      !loading &&
      pollCount < 5 &&
      statusHint.trim().toLowerCase() === "success" &&
      String(data?.status || "").trim().toUpperCase() === "PENDING";

    if (!shouldPoll) return;

    const timer = window.setTimeout(() => {
      setPollCount((prev) => prev + 1);
      setReloadTick((prev) => prev + 1);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [invoiceId, loading, pollCount, statusHint, data?.status]);

  const visual = useMemo(
    () => getVisualStatus(statusHint, data?.status ?? "", text),
    [statusHint, data?.status, text],
  );

  const toneStyles = useMemo(() => getToneStyles(visual.tone), [visual.tone]);

  const resolvedPlan = useMemo(
    () =>
      resolvePlanFromInvoice(data?.plan, data?.subscriptionTier) ||
      readPlanFromStorage(),
    [data?.plan, data?.subscriptionTier],
  );

  const resolvedServiceKey = useMemo(
    () => safeServiceKey(data?.serviceKey || "") || readServiceKeyFromStorage(),
    [data?.serviceKey],
  );

  const resolvedOwnerPhone = useMemo(
    () =>
      normalizePhoneCandidate(String(data?.ownerPhone || "").trim()) ||
      readPhoneFromStorage(),
    [data?.ownerPhone],
  );

  const billingHref = useMemo(() => {
    return buildRouteWithLang("/billing", {
      ...(resolvedOwnerPhone ? { phone: resolvedOwnerPhone } : {}),
      ...(resolvedServiceKey ? { serviceKey: resolvedServiceKey } : {}),
      ...(resolvedPlan ? { plan: resolvedPlan } : {}),
    });
  }, [resolvedOwnerPhone, resolvedServiceKey, resolvedPlan]);

  const dashboardHref = useMemo(() => {
    return buildRouteWithLang("/dashboard", {
      ...(resolvedServiceKey ? { serviceKey: resolvedServiceKey } : {}),
      ...(resolvedPlan ? { plan: resolvedPlan } : {}),
    });
  }, [resolvedServiceKey, resolvedPlan]);

  const servicesHref = useMemo(() => {
    return buildRouteWithLang("/services", {
      ...(resolvedServiceKey ? { serviceKey: resolvedServiceKey } : {}),
      ...(resolvedPlan ? { plan: resolvedPlan } : {}),
    });
  }, [resolvedServiceKey, resolvedPlan]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined" || !invoiceId) return "";
    const path = buildRouteWithLang("/receipt", { invoiceId });
    return `${window.location.origin}${path}`;
  }, [invoiceId]);

  const statusValue = String(data?.status || "").trim().toUpperCase();
  const showBillingAction =
    statusValue === "CANCELED" ||
    statusValue === "CANCELLED" ||
    statusValue === "FAILED" ||
    statusValue === "PENDING" ||
    (!data && statusHint.trim().toLowerCase() === "cancel");

  const receiptFields = useMemo(() => {
    if (!data) return [];
    return buildReceiptFields(data, text, formattingLocale);
  }, [data, text, formattingLocale]);

  async function handleShare(): Promise<void> {
    if (!data || !shareUrl || typeof navigator === "undefined") return;

    const shareTitle = text.shareTitle;
    const shareText = `${resolveServiceTitle(data, text)} • ${getPlanTitle(
      data.plan,
      data.subscriptionTier,
      data.billingCycle,
      text,
    )} • ${formatAmount(data.amount, data.currency, formattingLocale)}`;

    try {
      setShareMessage("");

      if (typeof navigator.share === "function") {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareMessage(text.shareCopied);
        return;
      }

      setShareMessage(text.shareUnsupported);
    } catch (error: unknown) {
      if (isAbortError(error)) return;
      setShareMessage(text.shareFailed);
    }
  }

  async function handleDownload(): Promise<void> {
    if (!data) return;

    try {
      setDownloading(true);
      setShareMessage("");
      await exportReceiptAsJpg({
        invoice: data,
        visual,
        text,
        formattingLocale,
      });
    } catch {
      setShareMessage(text.downloadFailed);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div style={{ ...pageStyle, direction }}>
      <div style={shellStyle}>
        <div style={heroCardStyle}>
          <div style={heroInnerStyle}>
            <div style={heroBadgeStyle}>{text.paymentReceiptBadge}</div>
            <h1 style={titleStyle}>{text.paymentReceiptTitle}</h1>
            <p style={subtitleStyle}>{text.paymentReceiptSubtitle}</p>
          </div>
        </div>

        {!invoiceId ? (
          <div style={errorBoxStyle}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>
              {text.missingInvoiceIdTitle}
            </div>
            <div>{text.missingInvoiceIdText}</div>
          </div>
        ) : null}

        {invoiceId ? (
          <div style={{ ...statusBoxStyle, ...toneStyles.box }}>
            <div style={statusHeaderStyle}>
              <div style={statusCopyStyle}>
                <div style={statusTitleStyle}>{visual.title}</div>
                <div style={statusTextStyle}>{visual.text}</div>
              </div>

              <div style={{ ...statusBadgeStyle, ...toneStyles.badge }}>
                {visual.badge}
              </div>
            </div>
          </div>
        ) : null}

        {err ? (
          <div style={errorBoxStyle}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>{text.errorTitle}</div>
            <div>{err}</div>
          </div>
        ) : null}

        {loading ? (
          <div style={cardStyle}>
            <div style={mutedStyle}>{text.loadingInvoice}</div>
          </div>
        ) : null}

        {data ? (
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>{text.detailsTitle}</div>

            <div style={detailsCardsGridStyle}>
              {receiptFields.map((field) => (
                <DetailRow key={field.label} label={field.label} value={field.value} />
              ))}
            </div>
          </div>
        ) : null}

        <div style={toolbarCardStyle}>
          <div style={toolbarTitleStyle}>{text.actionsTitle}</div>

          <div style={toolbarActionsStyle}>
            <button
              type="button"
              onClick={() => setReloadTick((prev) => prev + 1)}
              style={{
                ...secondaryButtonStyle,
                ...(loading ? disabledButtonStyle : {}),
              }}
              disabled={loading}
            >
              {loading ? text.refreshing : text.refreshReceipt}
            </button>

            <button
              type="button"
              onClick={() => void handleDownload()}
              style={{
                ...secondaryButtonStyle,
                ...(!data || downloading ? disabledButtonStyle : {}),
              }}
              disabled={!data || downloading}
            >
              {downloading ? text.preparingCheck : text.downloadCheck}
            </button>

            <button
              type="button"
              onClick={() => void handleShare()}
              style={{
                ...secondaryButtonStyle,
                ...(!data || !shareUrl ? disabledButtonStyle : {}),
              }}
              disabled={!data || !shareUrl}
            >
              {text.share}
            </button>
          </div>

          {shareMessage ? <div style={shareMessageStyle}>{shareMessage}</div> : null}
        </div>

        <div style={actionsRowStyle}>
          <Link href={dashboardHref} style={primaryLinkStyle}>
            {text.dashboardBack}
          </Link>

          {showBillingAction ? (
            <Link href={billingHref} style={secondaryLinkStyle}>
              {text.billingBack}
            </Link>
          ) : null}

          <Link href={servicesHref} style={secondaryLinkStyle}>
            {text.servicesBack}
          </Link>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={detailCardStyle}>
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
  boxSizing: "border-box",
};

const heroBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 36,
  padding: "0 14px",
  borderRadius: 999,
  background: "#eef2ff",
  color: "#3730a3",
  border: "1px solid #c7d2fe",
  fontWeight: 800,
  fontSize: 13,
  letterSpacing: "0.02em",
  marginBottom: 14,
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
  margin: "12px 0 0 0",
  fontSize: "clamp(0.96rem, 2.1vw, 1rem)",
  lineHeight: 1.75,
  color: "#475569",
  maxWidth: 920,
};

const statusBoxStyle: CSSProperties = {
  borderRadius: 24,
  padding: "clamp(18px, 2.6vw, 22px)",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background: `
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.10), transparent 24%),
    radial-gradient(circle at bottom left, rgba(163, 230, 53, 0.08), transparent 20%),
    linear-gradient(180deg, #ffffff 0%, #f5f8fb 100%)
  `,
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
  boxSizing: "border-box",
};

const statusHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const statusCopyStyle: CSSProperties = {
  minWidth: 0,
  flex: "1 1 280px",
};

const statusTitleStyle: CSSProperties = {
  fontSize: "clamp(1.2rem, 2.8vw, 1.4rem)",
  fontWeight: 900,
  marginBottom: 8,
  color: "#0f172a",
  letterSpacing: "-0.02em",
  lineHeight: 1.25,
  overflowWrap: "anywhere",
};

const statusTextStyle: CSSProperties = {
  fontSize: 14,
  lineHeight: 1.75,
  color: "#475569",
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
  whiteSpace: "nowrap",
  background: "#0f172a",
  color: "#ffffff",
  border: "1px solid #0f172a",
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.12)",
  lineHeight: 1.3,
  textAlign: "center",
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

const cardStyle: CSSProperties = {
  background: `
    radial-gradient(circle at top right, rgba(163, 230, 53, 0.10), transparent 22%),
    radial-gradient(circle at bottom left, rgba(37, 99, 235, 0.08), transparent 24%),
    linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)
  `,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: 22,
  padding: "clamp(18px, 2.5vw, 22px)",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
  boxSizing: "border-box",
};

const toolbarCardStyle: CSSProperties = {
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.98) 100%)",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: 22,
  padding: "clamp(18px, 2.5vw, 22px)",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
  boxSizing: "border-box",
};

const toolbarTitleStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  color: "#0f172a",
  marginBottom: 14,
  letterSpacing: "-0.02em",
};

const toolbarActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: 10,
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
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.06)",
  textAlign: "center",
  lineHeight: 1.3,
  boxSizing: "border-box",
};

const disabledButtonStyle: CSSProperties = {
  opacity: 0.68,
  cursor: "not-allowed",
};

const shareMessageStyle: CSSProperties = {
  marginTop: 12,
  color: "#475569",
  fontSize: 14,
  lineHeight: 1.75,
  overflowWrap: "anywhere",
};

const sectionTitleStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  color: "#0f172a",
  marginBottom: 16,
  letterSpacing: "-0.02em",
};

const mutedStyle: CSSProperties = {
  color: "#64748b",
  lineHeight: 1.7,
};

const detailsCardsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
  gap: 12,
};

const detailCardStyle: CSSProperties = {
  display: "grid",
  gap: 8,
  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background: "rgba(255,255,255,0.76)",
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.04)",
  minWidth: 0,
  boxSizing: "border-box",
};

const detailLabelStyle: CSSProperties = {
  fontWeight: 800,
  color: "#64748b",
  fontSize: 12,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  lineHeight: 1.45,
};

const detailValueStyle: CSSProperties = {
  color: "#0f172a",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
  lineHeight: 1.7,
  fontWeight: 800,
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