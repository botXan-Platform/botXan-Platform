import {
  SUPPORTED_LOCALES,
  type Locale,
  type RawLocaleInput,
} from "../contracts/locale.js";
import { NORMALIZED_LOCALE_ALIASES } from "./constants.js";

const SUPPORTED_LOCALE_SET = new Set<string>(SUPPORTED_LOCALES);

function hasOwnLocaleAlias(
  value: string,
): value is keyof typeof NORMALIZED_LOCALE_ALIASES {
  return Object.prototype.hasOwnProperty.call(
    NORMALIZED_LOCALE_ALIASES,
    value,
  );
}

function getAliasedLocale(sanitized: string): Locale | null {
  if (!hasOwnLocaleAlias(sanitized)) {
    return null;
  }

  return NORMALIZED_LOCALE_ALIASES[sanitized];
}

export function sanitizeLocaleInput(raw: RawLocaleInput): string | null {
  if (typeof raw !== "string") {
    return null;
  }

  const trimmed = raw.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.replaceAll("_", "-").toLowerCase();
}

export function isCanonicalLocale(value: string): value is Locale {
  return SUPPORTED_LOCALE_SET.has(value);
}

export function normalizeLocale(raw: RawLocaleInput): Locale | null {
  const sanitized = sanitizeLocaleInput(raw);

  if (!sanitized) {
    return null;
  }

  const aliasedLocale = getAliasedLocale(sanitized);

  if (aliasedLocale) {
    return aliasedLocale;
  }

  const [baseLanguage] = sanitized.split("-");

  if (baseLanguage && isCanonicalLocale(baseLanguage)) {
    return baseLanguage;
  }

  return null;
}

export function normalizeLocaleList(
  values: readonly RawLocaleInput[],
): readonly Locale[] {
  const normalizedLocales: Locale[] = [];
  const seen = new Set<Locale>();

  for (const value of values) {
    const locale = normalizeLocale(value);

    if (!locale || seen.has(locale)) {
      continue;
    }

    seen.add(locale);
    normalizedLocales.push(locale);
  }

  return normalizedLocales;
}