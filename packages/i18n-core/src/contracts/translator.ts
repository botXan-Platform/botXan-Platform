import type { MessageChannel } from "./channel.js";
import type {
  Direction,
  FormattingLocale,
  Locale,
} from "./locale.js";
import type {
  MessageKey,
  TranslationParams,
} from "./message.js";

export interface TranslateOptions {
  channel?: MessageChannel;
  fallback?: boolean;
}

export interface Translator<TCatalog extends object = object> {
  readonly locale: Locale;
  readonly formattingLocale: FormattingLocale;
  readonly direction: Direction;

  t<Key extends MessageKey<TCatalog>>(
    key: Key,
    params?: TranslationParams,
    options?: TranslateOptions,
  ): string;
}