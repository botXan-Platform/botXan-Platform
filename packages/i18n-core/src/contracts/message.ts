import type { MessageChannel } from "./channel.js";

export type TranslationPrimitive =
  | string
  | number
  | boolean
  | bigint
  | Date
  | null
  | undefined;

export type TranslationParams = Readonly<Record<string, TranslationPrimitive>>;

export type ChannelVariantMap = Partial<Record<MessageChannel, string>>;

export interface ChannelAwareMessage extends ChannelVariantMap {
  default: string;
}

export type MessageValue = string | ChannelAwareMessage;

export type MessageNode =
  | MessageValue
  | {
    readonly [key: string]: MessageNode;
  };

export interface MessageTree {
  readonly [key: string]: MessageNode;
}

type Join<
  Prefix extends string,
  Key extends string,
> = Prefix extends "" ? Key : `${Prefix}.${Key}`;

type ExtractMessageKeys<TNode, Prefix extends string = ""> =
  TNode extends MessageValue
  ? never
  : TNode extends readonly unknown[]
  ? never
  : TNode extends object
  ? {
    [K in Extract<keyof TNode, string>]:
    TNode[K] extends MessageValue
    ? Join<Prefix, K>
    : TNode[K] extends readonly unknown[]
    ? never
    : TNode[K] extends object
    ? ExtractMessageKeys<TNode[K], Join<Prefix, K>>
    : never;
  }[Extract<keyof TNode, string>]
  : never;

export type MessageSelectorTree<TNode> =
  TNode extends MessageValue
  ? MessageValue
  : TNode extends readonly unknown[]
  ? never
  : TNode extends object
  ? {
    readonly [K in Extract<keyof TNode, string>]: MessageSelectorTree<TNode[K]>;
  }
  : never;

export type MessageSelector<TCatalog> = (
  catalog: MessageSelectorTree<TCatalog>,
) => MessageValue;

export type MessageKey<TCatalog> =
  | ExtractMessageKeys<TCatalog>
  | MessageSelector<TCatalog>;