// apps/bot-api/src/routes/messages.ts

import { Router } from "express";
import prisma from "db";

export const messagesRouter = Router();

/**
 * POST /messages/send
 * body: { to: string, text: string }
 */
messagesRouter.post("/messages/send", async (req, res) => {
  try {
    const to = String(req.body?.to ?? "").trim();
    const text = String(req.body?.text ?? "").trim();

    if (!to || !text) {
      return res.status(400).json({
        error: "to and text required",
      });
    }

    const msg = await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          direction: "OUTBOUND",
          status: "SEND_REQUESTED",
          waId: to,
          type: "text",
          body: text,
        },
      });

      await tx.messageJob.create({
        data: {
          messageId: message.id,
          type: "SEND_OUTBOUND",
          state: "PENDING",
          attempts: 0,
        },
      });

      return message;
    });

    return res.json({
      ok: true,
      messageId: msg.id,
    });
  } catch (err) {
    console.error("send route error:", err);
    return res.status(500).json({ error: "internal_error" });
  }
});