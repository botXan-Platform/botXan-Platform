// apps/owner-web/src/utils/dateFormat.ts

export const AZ_MONTH_NAMES = [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "İyun",
    "İyul",
    "Avqust",
    "Sentyabr",
    "Oktyabr",
    "Noyabr",
    "Dekabr",
] as const;

export type DateLike = Date | string | number | null | undefined;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function parseSafeDate(value: DateLike): Date | null {
  if (value == null || value === "") return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isValidDateLike(value: DateLike): boolean {
  return parseSafeDate(value) !== null;
}

export function formatAzTime(value: DateLike, fallback = "-"): string {
  const date = parseSafeDate(value);
  if (!date) return fallback;

  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function formatAzDate(value: DateLike, fallback = "-"): string {
  const date = parseSafeDate(value);
  if (!date) return fallback;

  const day = date.getDate();
  const month = AZ_MONTH_NAMES[date.getMonth()] || "";
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

export function formatAzMonthYear(value: DateLike, fallback = "-"): string {
  const date = parseSafeDate(value);
  if (!date) return fallback;

  const month = AZ_MONTH_NAMES[date.getMonth()] || "";
  const year = date.getFullYear();

  return `${month} ${year}`;
}

export function formatAzDateTime(value: DateLike, fallback = "-"): string {
  const date = parseSafeDate(value);
  if (!date) return fallback;

  return `${formatAzDate(date, fallback)} saat - ${formatAzTime(date, fallback)}`;
}

export function formatAzDateTimeInlineRange(
  start: DateLike,
  end: DateLike,
  fallback = "-"
): string {
  const startText = formatAzDateTime(start, fallback);
  const endText = formatAzDateTime(end, fallback);

  if (startText === fallback && endText === fallback) return fallback;
  if (endText === fallback) return startText;
  if (startText === fallback) return endText;

  return `${startText} → ${endText}`;
}

export function formatAzDateInlineRange(
  start: DateLike,
  end: DateLike,
  fallback = "-"
): string {
  const startText = formatAzDate(start, fallback);
  const endText = formatAzDate(end, fallback);

  if (startText === fallback && endText === fallback) return fallback;
  if (endText === fallback) return startText;
  if (startText === fallback) return endText;

  return `${startText} → ${endText}`;
}

export function formatAzDateTimeLines(
  start: DateLike,
  end: DateLike,
  fallback = "-"
): { start: string; end: string } {
  return {
    start: formatAzDateTime(start, fallback),
    end: formatAzDateTime(end, fallback),
  };
}

export function formatAzDateLines(
  start: DateLike,
  end: DateLike,
  fallback = "-"
): { start: string; end: string } {
  return {
    start: formatAzDate(start, fallback),
    end: formatAzDate(end, fallback),
  };
}

export type SupportedLocale = "az" | "en" | "ru" | "zh";

export const LOCALE_MONTH_NAMES: Record<SupportedLocale, readonly string[]> = {
  az: [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "İyun",
    "İyul",
    "Avqust",
    "Sentyabr",
    "Oktyabr",
    "Noyabr",
    "Dekabr",
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  ru: [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ],
  zh: [
    "1月",
    "2月",
    "3月",
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
    "10月",
    "11月",
    "12月",
  ],
};

export function formatDisplayDate(
  value: DateLike,
  locale: SupportedLocale,
  fallback = "-"
): string {
  const date = parseSafeDate(value);
  if (!date) return fallback;

  const day = date.getDate();
  const month = LOCALE_MONTH_NAMES[locale]?.[date.getMonth()] || LOCALE_MONTH_NAMES.az[date.getMonth()];
  const year = date.getFullYear();

  if (locale === "zh") {
    return `${year}年${month}${day}日`;
  }

  return `${day} ${month} ${year}`;
}

export function formatDisplayDateTime(
  value: DateLike,
  locale: SupportedLocale,
  fallback = "-"
): string {
  const date = parseSafeDate(value);
  if (!date) return fallback;

  const datePart = formatDisplayDate(date, locale, fallback);
  const timePart = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

  if (datePart === fallback) return fallback;

  if (locale === "az") {
    return `${datePart} saat - ${timePart}`;
  }

  return `${datePart} ${timePart}`;
}