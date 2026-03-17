import type { MessageChannel } from "./contracts/channel.js";
import type {
  Direction,
  FormattingLocale,
  Locale,
} from "./contracts/locale.js";
import type {
  MessageKey,
  TranslationParams,
} from "./contracts/message.js";
import type {
  TranslateOptions,
  Translator,
} from "./contracts/translator.js";
import { getDirection } from "./locale/direction.js";
import { getFormattingLocale } from "./locale/formatting.js";
import { interpolateMessage } from "./message/interpolate.js";
import { lookupMessage } from "./message/lookup.js";

export interface CreateTranslatorOptions<TCatalog extends object> {
  locale: Locale;
  catalog: TCatalog;
  fallbackCatalog?: object | null;
  channel?: MessageChannel;
  formattingLocale?: FormattingLocale;
  direction?: Direction;
}

const SELECTOR_PATH = Symbol("selector-path");

type MessageSelector<TCatalog extends object> = (catalog: TCatalog) => unknown;

type SelectorPathCarrier = {
  readonly [SELECTOR_PATH]?: readonly string[];
};

function buildLookupOptions(
  channel: MessageChannel | undefined,
): { channel?: MessageChannel } | undefined {
  if (!channel) {
    return undefined;
  }

  return { channel };
}

function createSelectorProxy(path: readonly string[]): object {
  return new Proxy(
    {},
    {
      get(_target, property: string | symbol) {
        if (property === SELECTOR_PATH) {
          return path;
        }

        if (typeof property !== "string") {
          return createSelectorProxy(path);
        }

        return createSelectorProxy([...path, property]);
      },
    },
  );
}

function resolveMessageKey<TCatalog extends object>(
  key: MessageKey<TCatalog>,
): string {
  if (typeof key === "string") {
    return key;
  }

  if (typeof key === "function") {
    try {
      const selector = key as unknown as MessageSelector<TCatalog>;
      const selected = selector(
        createSelectorProxy([]) as TCatalog,
      ) as SelectorPathCarrier;

      const path = selected?.[SELECTOR_PATH];
      if (Array.isArray(path) && path.length > 0) {
        return path.join(".");
      }
    } catch {
      return String(key);
    }
  }

  return String(key);
}

export function createTranslator<TCatalog extends object>(
  options: CreateTranslatorOptions<TCatalog>,
): Translator<TCatalog> {
  const direction = options.direction ?? getDirection(options.locale);
  const formattingLocale =
    options.formattingLocale ?? getFormattingLocale(options.locale);

  return {
    locale: options.locale,
    formattingLocale,
    direction,

    t<Key extends MessageKey<TCatalog>>(
      key: Key,
      params: TranslationParams = {},
      translateOptions: TranslateOptions = {},
    ): string {
      const channel = translateOptions.channel ?? options.channel;
      const lookupOptions = buildLookupOptions(channel);
      const resolvedKey = resolveMessageKey<TCatalog>(key);

      const primary = lookupMessage(
        options.catalog,
        resolvedKey,
        lookupOptions,
      );

      if (primary !== null) {
        return interpolateMessage(primary, params);
      }

      if (translateOptions.fallback !== false && options.fallbackCatalog) {
        const fallback = lookupMessage(
          options.fallbackCatalog,
          resolvedKey,
          lookupOptions,
        );

        if (fallback !== null) {
          return interpolateMessage(fallback, params);
        }
      }

      return `[missing:${resolvedKey}]`;
    },
  };
}