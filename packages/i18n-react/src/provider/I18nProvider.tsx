import {
  createTranslator,
  type CreateTranslatorOptions,
  type Direction,
  type FormattingLocale,
  type Locale,
  type TranslateOptions,
  type Translator,
} from "i18n-core";
import type { AppMessagesCatalog } from "i18n-messages";
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

export type DefaultI18nCatalog = AppMessagesCatalog;

export interface I18nContextValue<
  TCatalog extends object = DefaultI18nCatalog,
> extends Translator<TCatalog> {
  readonly supportedLocales: readonly Locale[];
  setLocale(locale: Locale): void;
}

const I18nContext =
  createContext<I18nContextValue<DefaultI18nCatalog> | null>(null);

export interface I18nProviderProps<
  TCatalog extends object = DefaultI18nCatalog,
> {
  locale: Locale;
  catalog: TCatalog;
  fallbackCatalog?: TCatalog | null;
  supportedLocales?: readonly Locale[];
  channel?: TranslateOptions["channel"];
  formattingLocale?: FormattingLocale;
  direction?: Direction;
  onLocaleChange?: (locale: Locale) => void;
  children: ReactNode;
}

export function I18nProvider<
  TCatalog extends object = DefaultI18nCatalog,
>({
  locale,
  catalog,
  fallbackCatalog,
  supportedLocales,
  channel,
  formattingLocale,
  direction,
  onLocaleChange,
  children,
}: I18nProviderProps<TCatalog>) {
  const translator = useMemo(() => {
    const options: CreateTranslatorOptions<TCatalog> = {
      locale,
      catalog,
    };

    if (fallbackCatalog !== undefined) {
      options.fallbackCatalog = fallbackCatalog;
    }

    if (channel !== undefined) {
      options.channel = channel;
    }

    if (formattingLocale !== undefined) {
      options.formattingLocale = formattingLocale;
    }

    if (direction !== undefined) {
      options.direction = direction;
    }

    return createTranslator(options);
  }, [catalog, channel, direction, fallbackCatalog, formattingLocale, locale]);

  const resolvedSupportedLocales: readonly Locale[] =
    supportedLocales ?? [locale];

  const value = useMemo<I18nContextValue<TCatalog>>(
    () => ({
      ...translator,
      supportedLocales: resolvedSupportedLocales,
      setLocale(nextLocale: Locale) {
        onLocaleChange?.(nextLocale);
      },
    }),
    [onLocaleChange, resolvedSupportedLocales, translator],
  );

  return (
    <I18nContext.Provider
      value={
        value as unknown as I18nContextValue<DefaultI18nCatalog>
      }
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n<
  TCatalog extends object = DefaultI18nCatalog,
>(): I18nContextValue<TCatalog> {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider.");
  }

  return context as unknown as I18nContextValue<TCatalog>;
}