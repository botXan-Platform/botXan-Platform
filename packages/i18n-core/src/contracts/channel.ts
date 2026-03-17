export const MESSAGE_CHANNELS = [
  "web",
  "admin",
  "backend",
  "whatsapp",
  "email",
  "sms",
  "push",
] as const;

export type MessageChannel = (typeof MESSAGE_CHANNELS)[number];