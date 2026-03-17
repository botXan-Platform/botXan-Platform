import type { FormattingLocale } from "../contracts/locale.js";

export type DateInput = Date | string | number | null | undefined;

export interface SharedDateFormatOptions {
  fallback?: string;
}

const AZ_MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avqust",
  "sentyabr",
  "oktyabr",
  "noyabr",
  "dekabr",
] as const;

type DateFormatKind = "date" | "dateTime" | "time";

function normalizeDateInput(value: DateInput): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function isAzerbaijaniFormattingLocale(formattingLocale: FormattingLocale): boolean {
  return formattingLocale.toLowerCase() === "az-az";
}

function formatAzDate(date: Date): string {
  const day = pad2(date.getDate());
  const month = AZ_MONTHS[date.getMonth()] ?? AZ_MONTHS[0];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

function formatAzTime(date: Date): string {
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());

  return `${hours}:${minutes}`;
}

function formatAzDateTime(date: Date): string {
  return `${formatAzDate(date)} ${formatAzTime(date)}`;
}

function buildLocaleFallbackChain(
  formattingLocale: FormattingLocale,
): readonly string[] {
  return Array.from(new Set([formattingLocale, "en-US"]));
}

function formatWithIntl(
  value: DateInput,
  formattingLocale: FormattingLocale,
  formatOptions: Intl.DateTimeFormatOptions,
  kind: DateFormatKind,
  options: SharedDateFormatOptions = {},
): string {
  const fallback = options.fallback ?? "—";
  const normalizedDate = normalizeDateInput(value);

  if (!normalizedDate) {
    return fallback;
  }

  if (isAzerbaijaniFormattingLocale(formattingLocale)) {
    if (kind === "date") {
      return formatAzDate(normalizedDate);
    }

    if (kind === "time") {
      return formatAzTime(normalizedDate);
    }

    return formatAzDateTime(normalizedDate);
  }

  try {
    return new Intl.DateTimeFormat(
      buildLocaleFallbackChain(formattingLocale),
      formatOptions,
    ).format(normalizedDate);
  } catch {
    try {
      return new Intl.DateTimeFormat("en-US", formatOptions).format(
        normalizedDate,
      );
    } catch {
      return fallback;
    }
  }
}

export function formatDate(
  value: DateInput,
  formattingLocale: FormattingLocale,
  options: SharedDateFormatOptions = {},
): string {
  return formatWithIntl(
    value,
    formattingLocale,
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
    "date",
    options,
  );
}

export function formatDateTime(
  value: DateInput,
  formattingLocale: FormattingLocale,
  options: SharedDateFormatOptions = {},
): string {
  return formatWithIntl(
    value,
    formattingLocale,
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
    "dateTime",
    options,
  );
}

export function formatTime(
  value: DateInput,
  formattingLocale: FormattingLocale,
  options: SharedDateFormatOptions = {},
): string {
  return formatWithIntl(
    value,
    formattingLocale,
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
    "time",
    options,
  );
}