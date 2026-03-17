import type { Locale } from "i18n-core";

import type { LocaleNameMessages } from "../catalog.js";

export const LANGUAGE_AUTONYMS = {
  az: "Azərbaycanca",
  en: "English",
  ru: "Русский",
  zh: "中文",
  ar: "العربية",
  hi: "हिन्दी",
  bn: "বাংলা",
  ta: "தமிழ்",
  pt: "Português",
  id: "Bahasa Indonesia",
  fil: "Filipino",
  es: "Español",
  tr: "Türkçe",
  ur: "اردو",
  de: "Deutsch",
  ha: "Hausa",
  yo: "Yorùbá",
  ig: "Igbo",
  it: "Italiano",
  ca: "Català",
  eu: "Euskara",
  gl: "Galego",
} as const satisfies LocaleNameMessages;

export function getLocaleAutonym(locale: Locale): string {
  return LANGUAGE_AUTONYMS[locale];
}