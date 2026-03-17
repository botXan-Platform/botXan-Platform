// apps/bot-api/src/routes/health.ts

import { Router } from "express";
import prisma from "db";

export const healthRouter = Router();

function stripAnsi(input: string) {
  // Prisma pretty errors may include ANSI codes; remove them for JSON responses
  return input.replace(/\u001b\[[0-9;]*m/g, "");
}

healthRouter.get("/health", async (_req, res) => {
  try {
    // Use Unsafe here intentionally for a fixed constant query.
    // This avoids invalid invocation issues and is safe (no user input).
    await prisma.$queryRawUnsafe("SELECT 1");

    return res.json({ status: "ok", db: "ok" });
  } catch (e: any) {
    const msg = stripAnsi(e?.message ?? String(e));
    return res.status(500).json({
      status: "ok",
      db: "fail",
      error: msg,
    });
  }
});