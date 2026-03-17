import type { Locale } from "i18n-core";
import { SUPPORTED_LOCALES, normalizeLocale } from "i18n-core";
import {
  getCatalog,
  getLocaleAutonym,
  type AppMessagesCatalog,
} from "i18n-messages";
import {
  buildLocaleQuery,
  DEFAULT_WEB_LOCALE_STORAGE_KEYS,
  I18nProvider,
  normalizeLocaleQueryValue,
  resolveWebLocale,
  useDocumentLocale,
  useI18n,
  writeLocaleToBrowserStorage,
} from "i18n-react";
import type { AppProps } from "next/app";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import type { CSSProperties, ReactElement, ReactNode, RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import "../styles/globals.css";

type NextPageWithLayout = AppProps["Component"] & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type OwnerWebAppProps = AppProps & {
  Component: NextPageWithLayout;
};

type LocaleOption = {
  code: Locale;
  shortLabel: string;
  nativeLabel: string;
};

const LOCALE_STORAGE_KEYS = DEFAULT_WEB_LOCALE_STORAGE_KEYS;
const APP_DEFAULT_LOCALE: Locale = "az";

const LOCALE_OPTIONS: ReadonlyArray<LocaleOption> = SUPPORTED_LOCALES.map(
  (code) => ({
    code,
    shortLabel: code.toUpperCase(),
    nativeLabel: getLocaleAutonym(code),
  }),
);

function GlobeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M2.5 12H21.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 2C14.7 4.75 16.236 8.29 16.35 12C16.236 15.71 14.7 19.25 12 22C9.3 19.25 7.764 15.71 7.65 12C7.764 8.29 9.3 4.75 12 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type OwnerWebChromeProps = {
  Component: NextPageWithLayout;
  pageProps: AppProps["pageProps"];
  activeLocale: Locale;
  isLocaleReady: boolean;
  isMenuOpen: boolean;
  hasBrandLogoError: boolean;
  dropdownRef: RefObject<HTMLDivElement | null>;
  onToggleMenu(): void;
  onCloseMenu(): void;
  onLocaleChange(locale: Locale): Promise<void>;
  onBrandLogoError(): void;
};

function OwnerWebChrome({
  Component,
  pageProps,
  activeLocale,
  isLocaleReady,
  isMenuOpen,
  hasBrandLogoError,
  dropdownRef,
  onToggleMenu,
  onCloseMenu,
  onLocaleChange,
  onBrandLogoError,
}: OwnerWebChromeProps) {
  const { t, direction } = useI18n<AppMessagesCatalog>();

  useDocumentLocale(activeLocale, direction);

  const getLayout = Component.getLayout ?? ((page: ReactElement) => page);

  const currentLocaleMeta =
    LOCALE_OPTIONS.find((item) => item.code === activeLocale) ??
    LOCALE_OPTIONS[0];

  if (!currentLocaleMeta) {
    return null;
  }

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </Head>

      <div style={appRootStyle}>
        <div style={topBarShellStyle}>
          <div style={topBarStyle}>
            <Link
              href="/"
              style={brandLinkStyle}
              aria-label={t("common.brand.homeAriaLabel")}
            >
              {hasBrandLogoError ? (
                <span style={brandFallbackTextStyle}>
                  {t("common.brand.fallbackName")}
                </span>
              ) : (
                <Image
                  src="/logo.png"
                  alt={t("common.brand.fallbackName")}
                  width={140}
                  height={35}
                  style={brandLogoStyle}
                  onError={onBrandLogoError}
                  priority
                  draggable={false}
                />
              )}
            </Link>

            <div ref={dropdownRef} style={localeDropdownWrapStyle}>
              <button
                type="button"
                onClick={onToggleMenu}
                style={localeTriggerStyle}
                aria-haspopup="dialog"
                aria-expanded={isMenuOpen}
                aria-label={t("common.language.selectorAriaLabel")}
                title={t("common.language.currentLocaleTitle", {
                  language: currentLocaleMeta.nativeLabel,
                })}
              >
                <GlobeIcon />
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen ? (
          <div
            style={{
              ...localeMenuOverlayStyle,
              direction,
            }}
            role="dialog"
            aria-modal="true"
            aria-label={t("common.language.selectorMenuAriaLabel")}
          >
            <div style={localeMenuHeaderStyle}>
              <div style={localeMenuHeaderContentStyle}>
                <div style={localeMenuEyebrowStyle}>
                  {t("common.language.selectorAriaLabel")}
                </div>
                <div style={localeMenuTitleStyle}>
                  {t("common.language.currentLocaleTitle", {
                    language: currentLocaleMeta.nativeLabel,
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={onCloseMenu}
                style={localeMenuCloseButtonStyle}
                aria-label="Dil menyusunu bağlayın"
                title="Dil menyusunu bağlayın"
              >
                ×
              </button>
            </div>

            <div style={localeMenuGridStyle}>
              {LOCALE_OPTIONS.map((item) => {
                const isActive = item.code === activeLocale;

                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => void onLocaleChange(item.code)}
                    style={{
                      ...localeMenuTileStyle,
                      ...(isActive ? localeMenuTileActiveStyle : {}),
                    }}
                    role="menuitemradio"
                    aria-checked={isActive}
                    title={item.nativeLabel}
                  >
                    <span style={localeMenuTileCodeStyle}>
                      {item.shortLabel}
                    </span>
                    <span style={localeMenuTileLabelStyle}>
                      {item.nativeLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div style={pageShellStyle}>
          {isLocaleReady ? getLayout(<Component {...pageProps} />) : null}
        </div>
      </div>
    </>
  );
}

export default function OwnerWebApp({
  Component,
  pageProps,
}: OwnerWebAppProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasBrandLogoError, setHasBrandLogoError] = useState(false);
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);

  const queryLocale = useMemo(() => {
    return normalizeLocaleQueryValue(
      (router.query.lang ??
        router.query.locale ??
        router.query.language) as string | string[] | undefined,
    );
  }, [router.query.lang, router.query.language, router.query.locale]);

  const resolvedLocale = useMemo<Locale>(() => {
    if (!router.isReady) {
      return APP_DEFAULT_LOCALE;
    }

    return resolveWebLocale({
      queryLocale,
      tenantSupportedLocales: SUPPORTED_LOCALES,
      systemDefaultLocale: APP_DEFAULT_LOCALE,
    }).locale;
  }, [queryLocale, router.isReady]);

  const activeLocale = pendingLocale ?? resolvedLocale;
  const isLocaleReady = router.isReady;

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    writeLocaleToBrowserStorage(LOCALE_STORAGE_KEYS, resolvedLocale);

    const currentQueryLocale = normalizeLocale(queryLocale);

    if (currentQueryLocale === resolvedLocale) {
      return;
    }

    void router.replace(
      {
        pathname: router.pathname,
        query: buildLocaleQuery(
          router.query as Record<string, string | string[] | undefined>,
          resolvedLocale,
        ),
      },
      undefined,
      { shallow: true, scroll: false },
    );
  }, [
    queryLocale,
    resolvedLocale,
    router,
    router.isReady,
    router.pathname,
    router.query,
  ]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    function handleRouteChangeStart() {
      setIsMenuOpen(false);
    }

    router.events.on("routeChangeStart", handleRouteChangeStart);

    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
    };
  }, [router.events]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isMenuOpen]);

  async function handleLocaleChange(locale: Locale) {
    if (!router.isReady) {
      return;
    }

    if (locale === activeLocale) {
      setIsMenuOpen(false);
      return;
    }

    setPendingLocale(locale);
    writeLocaleToBrowserStorage(LOCALE_STORAGE_KEYS, locale);
    setIsMenuOpen(false);

    try {
      await router.replace(
        {
          pathname: router.pathname,
          query: buildLocaleQuery(
            router.query as Record<string, string | string[] | undefined>,
            locale,
          ),
        },
        undefined,
        { shallow: false, scroll: false },
      );
    } finally {
      setPendingLocale(null);
    }
  }

  const catalog = useMemo<AppMessagesCatalog>(
    () => getCatalog(activeLocale),
    [activeLocale],
  );

  const fallbackCatalog = useMemo<AppMessagesCatalog>(
    () => getCatalog(APP_DEFAULT_LOCALE),
    [],
  );

  return (
    <I18nProvider<AppMessagesCatalog>
      locale={activeLocale}
      catalog={catalog}
      fallbackCatalog={fallbackCatalog}
      supportedLocales={SUPPORTED_LOCALES}
      onLocaleChange={(locale) => {
        void handleLocaleChange(locale);
      }}
    >
      <OwnerWebChrome
        Component={Component}
        pageProps={pageProps}
        activeLocale={activeLocale}
        isLocaleReady={isLocaleReady}
        isMenuOpen={isMenuOpen}
        hasBrandLogoError={hasBrandLogoError}
        dropdownRef={dropdownRef}
        onToggleMenu={() => setIsMenuOpen((prev) => !prev)}
        onCloseMenu={() => setIsMenuOpen(false)}
        onLocaleChange={handleLocaleChange}
        onBrandLogoError={() => setHasBrandLogoError(true)}
      />
    </I18nProvider>
  );
}

const appRootStyle: CSSProperties = {
  width: "100%",
  minHeight: "100dvh",
  margin: 0,
  padding: 0,
  position: "relative",
  background: `
    radial-gradient(circle at top left, rgba(177, 209, 88, 0.18) 0%, transparent 22%),
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.10) 0%, transparent 22%),
    radial-gradient(circle at bottom left, rgba(34, 197, 94, 0.08) 0%, transparent 20%),
    linear-gradient(180deg, #eef2ea 0%, #e9eee7 52%, #e6ece4 100%)
  `,
};

const pageShellStyle: CSSProperties = {
  width: "100%",
  maxWidth: 1280,
  minHeight: "100dvh",
  margin: "0 auto",
  padding: 0,
};

const topBarShellStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 1000,
  width: "100%",
  padding: 0,
  pointerEvents: "none",
};

const topBarStyle: CSSProperties = {
  width: "100%",
  minHeight: 80,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  paddingTop: 8,
  paddingRight: 14,
  paddingBottom: 8,
  paddingLeft: 0,
  borderRadius: 0,
  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  background: `
    radial-gradient(circle at top left, rgba(177, 209, 88, 0.16) 0%, transparent 22%),
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.10) 0%, transparent 22%),
    radial-gradient(circle at bottom left, rgba(34, 197, 94, 0.08) 0%, transparent 20%),
    linear-gradient(180deg, #eef2ea 0%, #e9eee7 52%, #e6ece4 100%)
  `,
  boxShadow: "none",
  pointerEvents: "auto",
};

const brandLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-start",
  height: 35,
  padding: 14,
  borderRadius: 0,
  background: "transparent",
  color: "inherit",
  textDecoration: "none",
  boxShadow: "none",
  flexShrink: 0,
  overflow: "hidden",
};

const brandLogoStyle: CSSProperties = {
  width: 140,
  height: 35,
  display: "block",
  objectFit: "contain",
  flexShrink: 0,
};

const brandFallbackTextStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 40,
  padding: "0 14px",
  borderRadius: 999,
  background: "#0f172a",
  color: "#ffffff",
  fontWeight: 800,
  letterSpacing: "0.02em",
  boxShadow: "0 10px 20px rgba(15, 23, 42, 0.14)",
};

const localeDropdownWrapStyle: CSSProperties = {
  position: "relative",
  display: "inline-flex",
  flexDirection: "column",
  alignItems: "flex-end",
  flexShrink: 0,
};

const localeTriggerStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 42,
  height: 42,
  padding: 0,
  borderRadius: 999,
  border: "1px solid rgba(15, 23, 42, 0.10)",
  background: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.06)",
};

const localeMenuOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1400,
  display: "flex",
  flexDirection: "column",
  gap: 20,
  padding: 16,
  background:
    "linear-gradient(180deg, rgba(248,250,252,0.995) 0%, rgba(241,245,249,0.995) 100%)",
  overflowY: "auto",
};

const localeMenuHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
};

const localeMenuHeaderContentStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const localeMenuEyebrowStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#64748b",
};

const localeMenuTitleStyle: CSSProperties = {
  fontSize: 28,
  lineHeight: 1.2,
  fontWeight: 900,
  color: "#0f172a",
};

const localeMenuCloseButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 48,
  height: 48,
  borderRadius: 999,
  border: "1px solid rgba(15, 23, 42, 0.10)",
  background: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
  fontSize: 28,
  lineHeight: 1,
  flexShrink: 0,
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.06)",
};

const localeMenuGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
  width: "100%",
  alignContent: "start",
};

const localeMenuTileStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  minHeight: 68,
  width: "100%",
  padding: "0 16px",
  borderRadius: 18,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  background: "#ffffff",
  color: "#0f172a",
  fontWeight: 800,
  cursor: "pointer",
  textAlign: "left",
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.04)",
};

const localeMenuTileActiveStyle: CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  boxShadow: "0 12px 24px rgba(15, 23, 42, 0.14)",
};

const localeMenuTileCodeStyle: CSSProperties = {
  minWidth: 42,
  fontWeight: 900,
  fontSize: 16,
};

const localeMenuTileLabelStyle: CSSProperties = {
  fontSize: 16,
  lineHeight: 1.3,
};