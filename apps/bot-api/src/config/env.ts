// apps/bot-api/src/config/env.ts

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnvIfExists(p: string) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
  }
}

// ✅ FIX: monorepo root-a qalxmaq üçün 4 level yuxarı çıxırıq
// /botXan/apps/bot-api/src/config  -> ../../../../  => /botXan
const repoRoot = path.resolve(__dirname, "../../../../");

const candidates = [
  path.join(repoRoot, ".env"),
  path.join(repoRoot, "apps/bot-api/.env"),
  path.join(repoRoot, "packages/db/.env"),
];

for (const p of candidates) loadEnvIfExists(p);

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function requiredInProd(name: string, fallback = ""): string {
  const v = process.env[name];
  const isProd = String(process.env.NODE_ENV ?? "").toLowerCase() === "production";
  if (isProd && !v) throw new Error(`Missing env var (prod): ${name}`);
  return v ?? fallback;
}

export const env = {
  PORT: Number(process.env.PORT ?? "3001"),

  PUBLIC_BASE_URL:
    process.env.PUBLIC_BASE_URL ?? `http://localhost:${process.env.PORT ?? "3001"}`,

  DATABASE_URL: required("DATABASE_URL"),

  // ✅ In prod required, local/dev fallback allowed
  WHATSAPP_VERIFY_TOKEN: requiredInProd("WHATSAPP_VERIFY_TOKEN", "dev-verify-token"),

  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN ?? "",
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
  WHATSAPP_GRAPH_VERSION: process.env.WHATSAPP_GRAPH_VERSION ?? "v19.0",

  META_APP_SECRET: process.env.META_APP_SECRET ?? "",

  // ✅ Local tooling
  WA_MOCK_LOG_DIR: process.env.WA_MOCK_LOG_DIR ?? ".wa-mock",
};