export const SUPPORTED_LOCALES = [
  "az",
  "en",
  "ru",
  "zh",
  "ar",
  "hi",
  "bn",
  "ta",
  "pt",
  "id",
  "fil",
  "es",
  "tr",
  "ur",
  "de",
  "ha",
  "yo",
  "ig",
  "it",
  "ca",
  "eu",
  "gl",
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const INTL_FORMATTING_LOCALES = [
  "az-AZ",
  "en-US",
  "ru-RU",
  "zh-CN",
  "ar-SA",
  "hi-IN",
  "bn-BD",
  "ta-IN",
  "pt-BR",
  "id-ID",
  "fil-PH",
  "es-ES",
  "tr-TR",
  "ur-PK",
  "de-DE",
  "ha-NG",
  "yo-NG",
  "ig-NG",
  "it-IT",
  "ca-ES",
  "eu-ES",
  "gl-ES",
] as const;

export type FormattingLocale = (typeof INTL_FORMATTING_LOCALES)[number];

export type Direction = "ltr" | "rtl";

export type RawLocaleInput = string | null | undefined;

export type LocaleResolutionSource =
  | "explicit"
  | "query"
  | "header"
  | "authenticated"
  | "tenant-default"
  | "guest-storage"
  | "accept-language"
  | "system-default"
  | "fallback";

export interface LocaleResolutionInput {
  explicitLocale?: RawLocaleInput;
  queryLocale?: RawLocaleInput;
  headerLocale?: RawLocaleInput;
  authenticatedLocale?: RawLocaleInput;
  tenantDefaultLocale?: RawLocaleInput;
  guestLocale?: RawLocaleInput;
  acceptLanguageHeader?: string | null;
  tenantSupportedLocales?: readonly Locale[] | null;
  systemDefaultLocale?: Locale;
}

export interface ResolvedLocale {
  locale: Locale;
  source: LocaleResolutionSource;
  formattingLocale: FormattingLocale;
  direction: Direction;
  raw: string | null;
  usedFallback: boolean;
  supportedLocales: readonly Locale[];
}