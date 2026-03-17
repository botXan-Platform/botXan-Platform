import type { Direction, Locale } from "i18n-core";
import { useEffect } from "react";

export function useDocumentLocale(
  locale: Locale,
  direction: Direction,
): void {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
  }, [direction, locale]);
}