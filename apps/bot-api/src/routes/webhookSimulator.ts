import { Router } from "express";
import prisma from "db";

export const webhookSimulatorRouter = Router();

/**
 * POST /webhook/simulate
 * body: { from: string, text: string }
 */
webhookSimulatorRouter.post("/webhook/simulate", async (req, res) => {
  const from = String(req.body?.from ?? "").trim();
  const text = String(req.body?.text ?? "").trim();

  if (!from || !text) {
    return res.status(400).json({ error: "from and text required" });
  }

  try {
    const msg = await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          direction: "INBOUND",
          status: "RECEIVED",
          waId: from,
          type: "text",
          body: text,
        },
      });

      await tx.messageJob.create({
        data: {
          messageId: message.id,
          type: "PROCESS_INBOUND",
          state: "PENDING",
          attempts: 0,
        },
      });

      return message;
    });

    return res.json({ ok: true, messageId: msg.id });
  } catch (e) {
    console.error("simulate webhook error:", e);
    return res.status(500).json({ error: "internal_error" });
  }
});