import type {
  TranslationParams,
  TranslationPrimitive,
} from "../contracts/message.js";

const INTERPOLATION_PATTERN = /\{([a-zA-Z0-9_.-]+)\}/g;

function stringifyInterpolationValue(value: TranslationPrimitive): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

export function interpolateMessage(
  template: string,
  params: TranslationParams = {},
): string {
  return template.replace(
    INTERPOLATION_PATTERN,
    (_match: string, token: string) => {
      const value = params[token];

      if (value === undefined) {
        return `{${token}}`;
      }

      return stringifyInterpolationValue(value);
    },
  );
}