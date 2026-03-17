import {
  resolveLocale,
  type Locale,
  type LocaleResolutionInput,
  type RawLocaleInput,
  type ResolvedLocale,
} from "i18n-core";

export const DEFAULT_WEB_LOCALE_STORAGE_KEYS = [
  "appLocale",
  "locale",
  "language",
  "selectedLanguage",
] as const;

export type LocaleStorageKey =
  (typeof DEFAULT_WEB_LOCALE_STORAGE_KEYS)[number];

export type LocaleQueryRecord = Record<string, string | string[] | undefined>;

export function normalizeLocaleQueryValue(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) {
    return String(value[0] ?? "").trim();
  }

  return String(value ?? "").trim();
}

export function readLocaleFromBrowserStorage(
  keys: readonly string[] = DEFAULT_WEB_LOCALE_STORAGE_KEYS,
): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  for (const key of keys) {
    const value = window.localStorage.getItem(key)?.trim();

    if (value) {
      return value;
    }
  }

  return null;
}

export function writeLocaleToBrowserStorage(
  keys: readonly string[] = DEFAULT_WEB_LOCALE_STORAGE_KEYS,
  locale: Locale,
): void {
  if (typeof window === "undefined") {
    return;
  }

  for (const key of keys) {
    window.localStorage.setItem(key, locale);
  }
}

export interface ResolveWebLocaleInput {
  queryLocale?: string | string[] | undefined;
  authenticatedLocale?: RawLocaleInput;
  tenantDefaultLocale?: RawLocaleInput;
  tenantSupportedLocales?: readonly Locale[] | null;
  storageKeys?: readonly string[];
  systemDefaultLocale?: Locale;
}

function readNavigatorLanguageHeader(): string | null {
  if (typeof navigator === "undefined") {
    return null;
  }

  if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
    return navigator.languages.join(",");
  }

  return navigator.language || null;
}

export function resolveWebLocale(
  input: ResolveWebLocaleInput = {},
): ResolvedLocale {
  const resolutionInput: LocaleResolutionInput = {
    queryLocale: normalizeLocaleQueryValue(input.queryLocale),
    guestLocale: readLocaleFromBrowserStorage(input.storageKeys),
    acceptLanguageHeader: readNavigatorLanguageHeader(),
  };

  if (input.authenticatedLocale !== undefined) {
    resolutionInput.authenticatedLocale = input.authenticatedLocale;
  }

  if (input.tenantDefaultLocale !== undefined) {
    resolutionInput.tenantDefaultLocale = input.tenantDefaultLocale;
  }

  if (input.tenantSupportedLocales !== undefined) {
    resolutionInput.tenantSupportedLocales = input.tenantSupportedLocales;
  }

  if (input.systemDefaultLocale !== undefined) {
    resolutionInput.systemDefaultLocale = input.systemDefaultLocale;
  }

  return resolveLocale(resolutionInput);
}

export function buildLocaleQuery(
  query: LocaleQueryRecord,
  locale: Locale,
): Record<string, string | string[]> {
  const nextQuery: Record<string, string | string[]> = {};

  for (const [key, value] of Object.entries(query)) {
    if (key === "lang" || key === "locale" || key === "language") {
      continue;
    }

    if (typeof value === "undefined") {
      continue;
    }

    nextQuery[key] = value;
  }

  nextQuery.lang = locale;

  return nextQuery;
}