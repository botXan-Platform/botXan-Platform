import type { MessageChannel } from "../contracts/channel.js";
import type {
  ChannelAwareMessage,
  MessageNode,
  MessageValue,
} from "../contracts/message.js";

export function isChannelAwareMessage(
  value: unknown,
): value is ChannelAwareMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "default" in value &&
    typeof (value as { default?: unknown }).default === "string"
  );
}

export function isMessageValue(value: unknown): value is MessageValue {
  return typeof value === "string" || isChannelAwareMessage(value);
}

export function getMessageNode(
  catalog: object,
  key: string,
): MessageNode | undefined {
  const segments = key.split(".").filter(Boolean);

  let current: unknown = catalog;

  for (const segment of segments) {
    if (
      !current ||
      typeof current !== "object" ||
      Array.isArray(current) ||
      !(segment in current)
    ) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current as MessageNode | undefined;
}

export function renderMessageValue(
  value: MessageValue,
  channel?: MessageChannel,
): string {
  if (typeof value === "string") {
    return value;
  }

  if (channel) {
    const channelSpecificValue = value[channel];

    if (channelSpecificValue) {
      return channelSpecificValue;
    }
  }

  return value.default;
}

export function lookupMessage(
  catalog: object,
  key: string,
  options: { channel?: MessageChannel } = {},
): string | null {
  const node = getMessageNode(catalog, key);

  if (!node || !isMessageValue(node)) {
    return null;
  }

  return renderMessageValue(node, options.channel);
}