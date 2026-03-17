// apps/bot-api/src/routes/webhook.ts

import { Router, type Request, type Response } from "express";
import { env } from "../config/env.js";
import { verifyMetaSignature } from "../services/whatsapp/signature.js";
import type { RawBodyRequest } from "../middlewares/rawBody.js";
import { handleIncomingWebhook } from "../services/whatsapp/handler.js";

export const webhookRouter = Router();

//
// --------------------------------------
// GET VERIFY
// --------------------------------------
webhookRouter.get("/webhook", (req: Request, res: Response) => {
  const mode = String(req.query["hub.mode"] ?? "");
  const token = String(req.query["hub.verify_token"] ?? "");
  const challenge = String(req.query["hub.challenge"] ?? "");

  if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN) {
    console.log("Webhook verified");
    return res.status(200).send(challenge);
  }

  console.warn("Webhook verify failed");
  return res.sendStatus(403);
});

//
// --------------------------------------
// POST WEBHOOK
// --------------------------------------
webhookRouter.post("/webhook", async (req: Request, res: Response) => {
  //
  // 1️⃣ SIGNATURE VERIFY
  //
  if (env.META_APP_SECRET) {
    const ok = verifyMetaSignature(req as RawBodyRequest, env.META_APP_SECRET);

    if (!ok) {
      console.warn("Invalid Meta signature");
      return res.sendStatus(401);
    }
  } else {
    console.warn("META_APP_SECRET not set → DEV MODE");
  }

  //
  // 2️⃣ FAST ACK (Meta timeout = 10s)
  //
  res.sendStatus(200);

  //
  // 3️⃣ ASYNC PROCESS
  //
  try {
    await handleIncomingWebhook(req.body);
  } catch (e) {
    console.error("Webhook handler error:", e);
  }
});