// apps/bot-api/src/services/whatsapp/signature.ts

import crypto from "node:crypto";
import type { RawBodyRequest } from "../../middlewares/rawBody.js";

export function verifyMetaSignature(
  req: RawBodyRequest,
  appSecret: string
): boolean {
  const header = req.header("x-hub-signature-256");
  if (!header) return false;

  const raw = req.rawBody;
  if (!raw?.length) return false;

  // Header format: "sha256=<hex>"
  const [algo, theirHex] = header.split("=", 2);
  if (algo !== "sha256" || !theirHex) return false;

  const ourHex = crypto.createHmac("sha256", appSecret).update(raw).digest("hex");

  // Compare as raw bytes, not UTF-8 strings
  const theirBuf = Buffer.from(theirHex, "hex");
  const ourBuf = Buffer.from(ourHex, "hex");

  if (theirBuf.length !== ourBuf.length) return false;

  return crypto.timingSafeEqual(theirBuf, ourBuf);
}