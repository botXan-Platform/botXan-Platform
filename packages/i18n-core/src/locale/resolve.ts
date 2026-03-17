import type {
  Locale,
  LocaleResolutionInput,
  LocaleResolutionSource,
  ResolvedLocale,
} from "../contracts/locale.js";
import { SYSTEM_DEFAULT_LOCALE } from "./constants.js";
import { getDirection } from "./direction.js";
import {
  buildLocaleFallbackChain,
  isLocaleSupported,
  resolveSupportedLocales,
} from "./fallback.js";
import { getFormattingLocale } from "./formatting.js";
import { normalizeLocale } from "./normalize.js";

interface RankedAcceptLanguage {
  raw: string;
  q: number;
}

interface ResolutionCandidate {
  source: LocaleResolutionSource;
  raw: string | null | undefined;
}

function parseAcceptLanguageHeader(
  header: string | null | undefined,
): readonly string[] {
  if (!header) {
    return [];
  }

  const ranked: RankedAcceptLanguage[] = [];

  for (const part of header.split(",")) {
    const [rawValue, ...params] = part.split(";");
    const value = rawValue?.trim();

    if (!value) {
      continue;
    }

    let q = 1;

    for (const param of params) {
      const trimmed = param.trim();

      if (!trimmed.startsWith("q=")) {
        continue;
      }

      const parsed = Number(trimmed.slice(2));

      if (Number.isFinite(parsed)) {
        q = parsed;
      }
    }

    ranked.push({ raw: value, q });
  }

  ranked.sort((a, b) => b.q - a.q);

  return ranked.map((entry) => entry.raw);
}

function buildResolvedLocale(
  locale: Locale,
  source: LocaleResolutionSource,
  raw: string | null,
  usedFallback: boolean,
  supportedLocales: readonly Locale[],
): ResolvedLocale {
  return {
    locale,
    source,
    formattingLocale: getFormattingLocale(locale),
    direction: getDirection(locale),
    raw,
    usedFallback,
    supportedLocales,
  };
}

function resolveSupportedCandidate(
  raw: string | null | undefined,
  supportedLocales: readonly Locale[],
): Locale | null {
  const normalizedLocale = normalizeLocale(raw);

  if (!normalizedLocale) {
    return null;
  }

  return isLocaleSupported(normalizedLocale, supportedLocales)
    ? normalizedLocale
    : null;
}

function firstMeaningfulRaw(
  candidates: readonly ResolutionCandidate[],
): string | null {
  for (const candidate of candidates) {
    const raw = candidate.raw?.trim();

    if (raw) {
      return raw;
    }
  }

  return null;
}

export function resolveLocale(
  input: LocaleResolutionInput = {},
): ResolvedLocale {
  const systemDefaultLocale =
    input.systemDefaultLocale ?? SYSTEM_DEFAULT_LOCALE;

  const supportedLocales = resolveSupportedLocales(
    input.tenantSupportedLocales,
    systemDefaultLocale,
  );

  const directCandidates = [
    { source: "explicit", raw: input.explicitLocale },
    { source: "query", raw: input.queryLocale },
    { source: "header", raw: input.headerLocale },
    { source: "authenticated", raw: input.authenticatedLocale },
    { source: "tenant-default", raw: input.tenantDefaultLocale },
    { source: "guest-storage", raw: input.guestLocale },
  ] as const satisfies readonly ResolutionCandidate[];

  for (const candidate of directCandidates) {
    const locale = resolveSupportedCandidate(candidate.raw, supportedLocales);

    if (!locale) {
      continue;
    }

    return buildResolvedLocale(
      locale,
      candidate.source,
      candidate.raw ?? null,
      false,
      supportedLocales,
    );
  }

  const acceptLanguageCandidates = parseAcceptLanguageHeader(
    input.acceptLanguageHeader,
  );

  for (const raw of acceptLanguageCandidates) {
    const locale = resolveSupportedCandidate(raw, supportedLocales);

    if (!locale) {
      continue;
    }

    return buildResolvedLocale(
      locale,
      "accept-language",
      raw,
      false,
      supportedLocales,
    );
  }

  const normalizedTenantDefault = normalizeLocale(input.tenantDefaultLocale);

  const requestedFallbackLocale =
    normalizeLocale(input.explicitLocale) ??
    normalizeLocale(input.queryLocale) ??
    normalizeLocale(input.headerLocale) ??
    normalizeLocale(input.authenticatedLocale) ??
    normalizedTenantDefault ??
    normalizeLocale(input.guestLocale) ??
    normalizeLocale(acceptLanguageCandidates[0]);

  const fallbackChain = buildLocaleFallbackChain({
    requestedLocale: requestedFallbackLocale,
    tenantDefaultLocale: normalizedTenantDefault,
    supportedLocales,
    systemDefaultLocale,
  });

  const fallbackLocale =
    fallbackChain.find((locale) => isLocaleSupported(locale, supportedLocales)) ??
    systemDefaultLocale;

  const fallbackRaw = firstMeaningfulRaw([
    ...directCandidates,
    ...acceptLanguageCandidates.map(
      (raw): ResolutionCandidate => ({
        source: "accept-language",
        raw,
      }),
    ),
  ]);

  const source: LocaleResolutionSource =
    fallbackLocale === systemDefaultLocale ? "system-default" : "fallback";

  return buildResolvedLocale(
    fallbackLocale,
    source,
    fallbackRaw,
    true,
    supportedLocales,
  );
}