// apps/bot-api/src/middlewares/rawBody.ts

import type { Request, Response } from "express";

export interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

export function rawBodySaver(
  req: Request,
  _res: Response,
  buf: Buffer
) {
  if (buf?.length) {
    (req as RawBodyRequest).rawBody = buf;
  }
}