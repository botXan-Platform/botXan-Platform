import {
  SUPPORTED_LOCALES,
  type Locale,
} from "../contracts/locale.js";
import { SYSTEM_DEFAULT_LOCALE } from "./constants.js";

export interface LocaleFallbackOptions {
  requestedLocale?: Locale | null;
  tenantDefaultLocale?: Locale | null;
  supportedLocales?: readonly Locale[] | null;
  systemDefaultLocale?: Locale;
}

function buildOpenLocaleOrder(
  systemDefaultLocale: Locale,
): readonly Locale[] {
  return [
    systemDefaultLocale,
    ...SUPPORTED_LOCALES.filter((locale) => locale !== systemDefaultLocale),
  ];
}

export function isLocaleSupported(
  locale: Locale | null | undefined,
  supportedLocales: readonly Locale[],
): locale is Locale {
  if (locale === null || locale === undefined) {
    return false;
  }

  return supportedLocales.includes(locale);
}

export function resolveSupportedLocales(
  supportedLocales?: readonly Locale[] | null,
  systemDefaultLocale: Locale = SYSTEM_DEFAULT_LOCALE,
): readonly Locale[] {
  const unique = new Set<Locale>();

  for (const locale of supportedLocales ?? []) {
    unique.add(locale);
  }

  if (unique.size > 0) {
    return [...unique];
  }

  return buildOpenLocaleOrder(systemDefaultLocale);
}

export function buildLocaleFallbackChain(
  options: LocaleFallbackOptions,
): readonly Locale[] {
  const systemDefaultLocale =
    options.systemDefaultLocale ?? SYSTEM_DEFAULT_LOCALE;

  const supportedLocales = resolveSupportedLocales(
    options.supportedLocales,
    systemDefaultLocale,
  );

  const chain: Locale[] = [];

  const pushUnique = (locale?: Locale | null): void => {
    if (!locale || chain.includes(locale)) {
      return;
    }

    chain.push(locale);
  };

  if (isLocaleSupported(options.requestedLocale, supportedLocales)) {
    pushUnique(options.requestedLocale);
  }

  if (isLocaleSupported(options.tenantDefaultLocale, supportedLocales)) {
    pushUnique(options.tenantDefaultLocale);
  }

  if (isLocaleSupported(systemDefaultLocale, supportedLocales)) {
    pushUnique(systemDefaultLocale);
  }

  pushUnique(supportedLocales[0] ?? systemDefaultLocale);

  if (!chain.includes(systemDefaultLocale)) {
    pushUnique(systemDefaultLocale);
  }

  return chain;
}