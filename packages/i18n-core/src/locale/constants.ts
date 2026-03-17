import type {
  FormattingLocale,
  Locale,
} from "../contracts/locale.js";

export const SYSTEM_DEFAULT_LOCALE: Locale = "en";

export const RTL_LOCALES = ["ar"] as const satisfies readonly Locale[];

export const FORMATTING_LOCALE_MAP = {
  az: "az-AZ",
  en: "en-US",
  ru: "ru-RU",
  zh: "zh-CN",
  ar: "ar-SA",
  hi: "hi-IN",
  bn: "bn-BD",
  ta: "ta-IN",
  pt: "pt-BR",
  id: "id-ID",
  fil: "fil-PH",
  es: "es-ES",
  tr: "tr-TR",
  ur: "ur-PK",
  de: "de-DE",
  ha: "ha-NG",
  yo: "yo-NG",
  ig: "ig-NG",
  it: "it-IT",
  ca: "ca-ES",
  eu: "eu-ES",
  gl: "gl-ES",
} as const satisfies Record<Locale, FormattingLocale>;

export const NORMALIZED_LOCALE_ALIASES = {
  az: "az",
  "az-az": "az",

  en: "en",
  "en-us": "en",
  "en-gb": "en",
  "en-in": "en",
  "en-ph": "en",
  "en-ng": "en",
  "en-pk": "en",

  ru: "ru",
  "ru-ru": "ru",

  zh: "zh",
  "zh-cn": "zh",
  "zh-hans": "zh",
  "zh-hans-cn": "zh",

  ar: "ar",
  "ar-sa": "ar",
  "ar-ae": "ar",
  "ar-eg": "ar",

  hi: "hi",
  "hi-in": "hi",

  bn: "bn",
  "bn-bd": "bn",
  "bn-in": "bn",

  ta: "ta",
  "ta-in": "ta",
  "ta-lk": "ta",
  "ta-sg": "ta",
  "ta-my": "ta",

  pt: "pt",
  "pt-br": "pt",
  "pt-pt": "pt",

  id: "id",
  "id-id": "id",

  fil: "fil",
  "fil-ph": "fil",
  tl: "fil",
  "tl-ph": "fil",

  es: "es",
  "es-es": "es",
  "es-mx": "es",
  "es-us": "es",
  "es-419": "es",

  tr: "tr",
  "tr-tr": "tr",

  ur: "ur",
  "ur-pk": "ur",
  "ur-in": "ur",

  de: "de",
  "de-de": "de",
  "de-at": "de",
  "de-ch": "de",

  ha: "ha",
  "ha-ng": "ha",
  "ha-ne": "ha",
  "ha-gh": "ha",
  "ha-latn": "ha",
  "ha-latn-ng": "ha",

  yo: "yo",
  "yo-ng": "yo",
  "yo-bj": "yo",

  ig: "ig",
  "ig-ng": "ig",

  it: "it",
  "it-it": "it",
  "it-ch": "it",

  ca: "ca",
  "ca-es": "ca",
  "ca-ad": "ca",

  eu: "eu",
  "eu-es": "eu",

  gl: "gl",
  "gl-es": "gl",
} as const satisfies Record<string, Locale>;

export const RTL_LOCALE_SET = new Set<Locale>(RTL_LOCALES);