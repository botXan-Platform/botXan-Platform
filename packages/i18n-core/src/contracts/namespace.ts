export const MESSAGE_NAMESPACES = [
  "common",
  "auth",
  "billing",
  "pay",
  "profile",
  "services",
  "dashboard",
  "notifications",
  "owner",
  "user",
  "admin",
  "booking",
  "listing",
  "subscription",
  "validation",
  "errors",
] as const;

export type MessageNamespace = (typeof MESSAGE_NAMESPACES)[number];