import type { Locale } from "i18n-core";

import type { AppMessagesCatalog, LocaleNameMessages } from "./catalog.js";
import { arMessages } from "./locales/ar.js";
import { azMessages } from "./locales/az.js";
import { bnMessages } from "./locales/bn.js";
import { caMessages } from "./locales/ca.js";
import { deMessages } from "./locales/de.js";
import { enMessages } from "./locales/en.js";
import { esMessages } from "./locales/es.js";
import { euMessages } from "./locales/eu.js";
import { filMessages } from "./locales/fil.js";
import { glMessages } from "./locales/gl.js";
import { haMessages } from "./locales/ha.js";
import { hiMessages } from "./locales/hi.js";
import { idMessages } from "./locales/id.js";
import { igMessages } from "./locales/ig.js";
import { itMessages } from "./locales/it.js";
import { ptMessages } from "./locales/pt.js";
import { ruMessages } from "./locales/ru.js";
import { taMessages } from "./locales/ta.js";
import { trMessages } from "./locales/tr.js";
import { urMessages } from "./locales/ur.js";
import { yoMessages } from "./locales/yo.js";
import { zhMessages } from "./locales/zh.js";
import {
  LANGUAGE_AUTONYMS,
  getLocaleAutonym,
} from "./shared/localeNames.js";

export type { AppMessagesCatalog, LocaleNameMessages };

export {
  arMessages,
  azMessages,
  bnMessages,
  caMessages,
  deMessages,
  enMessages,
  esMessages,
  euMessages,
  filMessages,
  glMessages,
  haMessages,
  hiMessages,
  idMessages,
  igMessages,
  itMessages,
  ptMessages,
  ruMessages,
  taMessages,
  trMessages,
  urMessages,
  yoMessages,
  zhMessages,
};

export { LANGUAGE_AUTONYMS, getLocaleAutonym };

export const DEFAULT_MESSAGES_LOCALE: Locale = "en";

export const APP_MESSAGE_CATALOGS = {
  az: azMessages,
  en: enMessages,
  ru: ruMessages,
  zh: zhMessages,
  ar: arMessages,
  hi: hiMessages,
  bn: bnMessages,
  ta: taMessages,
  pt: ptMessages,
  id: idMessages,
  fil: filMessages,
  es: esMessages,
  tr: trMessages,
  ur: urMessages,
  de: deMessages,
  ha: haMessages,
  yo: yoMessages,
  ig: igMessages,
  it: itMessages,
  ca: caMessages,
  eu: euMessages,
  gl: glMessages,
} as const satisfies Record<Locale, AppMessagesCatalog>;

export function getCatalog(locale: Locale): AppMessagesCatalog {
  return APP_MESSAGE_CATALOGS[locale];
}