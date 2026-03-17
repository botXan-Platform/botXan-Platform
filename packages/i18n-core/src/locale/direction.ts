import type {
  Direction,
  Locale,
  RawLocaleInput,
} from "../contracts/locale.js";
import { RTL_LOCALE_SET, SYSTEM_DEFAULT_LOCALE } from "./constants.js";
import { normalizeLocale } from "./normalize.js";

export function isRtlLocale(locale: Locale): boolean {
  return RTL_LOCALE_SET.has(locale);
}

export function getDirection(locale: Locale): Direction {
  return isRtlLocale(locale) ? "rtl" : "ltr";
}

export function resolveDirection(
  rawLocale: RawLocaleInput,
  fallbackLocale: Locale = SYSTEM_DEFAULT_LOCALE,
): Direction {
  const normalizedLocale = normalizeLocale(rawLocale) ?? fallbackLocale;

  return getDirection(normalizedLocale);
}