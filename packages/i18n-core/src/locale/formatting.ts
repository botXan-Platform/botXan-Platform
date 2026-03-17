import type {
  FormattingLocale,
  Locale,
  RawLocaleInput,
} from "../contracts/locale.js";
import { FORMATTING_LOCALE_MAP, SYSTEM_DEFAULT_LOCALE } from "./constants.js";
import { normalizeLocale } from "./normalize.js";

export function getFormattingLocale(locale: Locale): FormattingLocale {
  return FORMATTING_LOCALE_MAP[locale];
}

export function resolveFormattingLocale(
  rawLocale: RawLocaleInput,
  fallbackLocale: Locale = SYSTEM_DEFAULT_LOCALE,
): FormattingLocale {
  const normalizedLocale = normalizeLocale(rawLocale) ?? fallbackLocale;

  return getFormattingLocale(normalizedLocale);
}