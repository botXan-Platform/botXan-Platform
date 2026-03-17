import type { Direction } from "i18n-core";

import { useI18n } from "../provider/I18nProvider.js";

export function useDirection(): Direction {
  return useI18n().direction;
}