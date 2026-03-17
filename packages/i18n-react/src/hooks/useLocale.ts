import type { Locale } from "i18n-core";

import { useI18n } from "../provider/I18nProvider.js";

export function useLocale(): Locale {
  return useI18n().locale;
}