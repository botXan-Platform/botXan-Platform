import type { Request, Response, NextFunction } from "express";
import prisma from "db";

type Options = {
  /**
   * serviceKey-i hardan götürək:
   * - "body" => req.body.serviceKey
   * - "query" => req.query.serviceKey
   * - "fixed" => options.serviceKeyFixed
   *
   * Qeyd:
   * əgər seçilən source boşdursa, fallback olaraq body/query də yoxlanılır.
   */
  source?: "body" | "query" | "fixed";
  serviceKeyFixed?: string;

  /**
   * owner phone header adı (default: x-owner-phone)
   */
  ownerPhoneHeader?: string;

  /**
   * Abunəlik yoxdursa response status (default: 402 Payment Required)
   */
  denyStatusCode?: number;
};

const DB_TIMEOUT_MS = 5000;

function normalizePhone(input: unknown): string {
  return String(input ?? "").trim().replace(/\s+/g, "");
}

function normalizeServiceKey(input: unknown): string {
  return String(input ?? "").trim().toUpperCase();
}

function pickServiceKey(req: Request, opt: Options): string {
  const fromBody = normalizeServiceKey((req.body as any)?.serviceKey);
  const fromQuery = normalizeServiceKey(req.query?.serviceKey);

  const src = opt.source ?? "body";

  if (src === "fixed") {
    return normalizeServiceKey(opt.serviceKeyFixed) || fromQuery || fromBody;
  }

  if (src === "query") {
    return fromQuery || fromBody;
  }

  return fromBody || fromQuery;
}

function getOwnerPhoneFromHeader(req: Request, headerName: string): string {
  const raw = req.headers[headerName];
  if (Array.isArray(raw)) return normalizePhone(raw[0]);
  return normalizePhone(raw);
}

function getPhoneVariants(phone: string): string[] {
  const normalized = normalizePhone(phone);
  if (!normalized) return [];

  const variants = new Set<string>();
  variants.add(normalized);

  if (normalized.startsWith("+")) {
    variants.add(normalized.slice(1));
  } else {
    variants.add(`+${normalized}`);
  }

  return [...variants].filter(Boolean);
}

function buildPayRedirectUrl(phone: string, serviceKey: string): string {
  const base =
    (process.env.WEB_APP_URLS ?? process.env.WEB_APP_URL ?? "")
      .split(",")
      .map((s) => s.trim())
      .find(Boolean) || "http://localhost:3000";

  return `${base}/pay?phone=${encodeURIComponent(phone)}&serviceKey=${encodeURIComponent(
    serviceKey
  )}`;
}

function requestLabel(req: Request) {
  return `${req.method} ${req.originalUrl || req.url}`;
}

async function withTimeout<T>(promise: Promise<T>, label: string, ms = DB_TIMEOUT_MS): Promise<T> {
  let timer: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function isFutureDate(value: Date | null | undefined, now: Date): boolean {
  return !!value && value.getTime() > now.getTime();
}

export function requireActiveSubscription(options: Options = {}) {
  const ownerPhoneHeader = (options.ownerPhoneHeader ?? "x-owner-phone").toLowerCase();
  const denyStatusCode = options.denyStatusCode ?? 402;

  return async (req: Request, res: Response, next: NextFunction) => {
    const reqId = `[requireActiveSubscription] ${requestLabel(req)}`;

    try {
      const serviceKey = pickServiceKey(req, options);

      if (!serviceKey) {
        return res.status(400).json({ ok: false, message: "serviceKey is required" });
      }

      const headerPhone = getOwnerPhoneFromHeader(req, ownerPhoneHeader);
      const phoneVariants = getPhoneVariants(headerPhone);

      console.log(`${reqId} start`, {
        serviceKey,
        headerPhone: headerPhone || null,
        phoneVariantsCount: phoneVariants.length,
      });

      let owner:
        | {
          id: string;
          phone: string | null;
          paidUntil: Date | null;
        }
        | null = null;

      if (phoneVariants.length > 0) {
        console.log(`${reqId} lookup owner by phone variants`);
        owner = await withTimeout(
          prisma.owner.findFirst({
            where: {
              OR: phoneVariants.map((phone) => ({ phone })),
            },
            select: { id: true, phone: true, paidUntil: true },
            orderBy: { createdAt: "asc" },
          }),
          `${reqId} prisma.owner.findFirst(by phone)`
        );
      }

      if (!owner) {
        console.log(`${reqId} fallback owner.findFirst()`);
        owner = await withTimeout(
          prisma.owner.findFirst({
            select: { id: true, phone: true, paidUntil: true },
            orderBy: { createdAt: "asc" },
          }),
          `${reqId} prisma.owner.findFirst(fallback)`
        );
      }

      if (!owner) {
        console.warn(`${reqId} owner not found`);
        return res.status(404).json({ ok: false, message: "owner not found" });
      }

      console.log(`${reqId} owner resolved`, {
        ownerId: owner.id,
        ownerPhone: owner.phone,
      });

      const service = await withTimeout(
        prisma.service.findFirst({
          where: { key: serviceKey, isActive: true },
          select: { id: true, key: true },
        }),
        `${reqId} prisma.service.findFirst`
      );

      if (!service) {
        console.warn(`${reqId} service not found`, { serviceKey });
        return res.status(404).json({ ok: false, message: "service not found or inactive" });
      }

      console.log(`${reqId} service resolved`, {
        serviceId: service.id,
        serviceKey: service.key,
      });

      const now = new Date();

      let sub:
        | {
          status: string;
          paidUntil: Date | null;
        }
        | null = null;

      try {
        console.log(`${reqId} lookup ownerSubscription`);
        sub = await withTimeout(
          prisma.ownerSubscription.findUnique({
            where: { ownerId_serviceId: { ownerId: owner.id, serviceId: service.id } },
            select: { status: true, paidUntil: true },
          }),
          `${reqId} prisma.ownerSubscription.findUnique`
        );
      } catch (subErr: any) {
        console.error(`${reqId} ownerSubscription lookup failed`, subErr);
        return res.status(503).json({
          ok: false,
          message: "SUBSCRIPTION_CHECK_FAILED",
        });
      }

      const hasServiceSubscriptionRecord = !!sub;

      const isSubActive =
        !!sub &&
        sub.status === "ACTIVE" &&
        isFutureDate(sub.paidUntil, now);

      const isLegacyActive =
        !hasServiceSubscriptionRecord &&
        isFutureDate(owner.paidUntil, now);

      console.log(`${reqId} subscription result`, {
        hasSub: !!sub,
        subStatus: sub?.status ?? null,
        subPaidUntil: sub?.paidUntil?.toISOString?.() ?? null,
        ownerPaidUntil: owner.paidUntil?.toISOString?.() ?? null,
        isSubActive,
        isLegacyActive,
      });

      if (!isSubActive && !isLegacyActive) {
        const redirectUrl = buildPayRedirectUrl(owner.phone || "", service.key);

        console.warn(`${reqId} subscription required`, {
          redirectUrl,
        });

        return res.status(denyStatusCode).json({
          ok: false,
          message: "SUBSCRIPTION_REQUIRED",
          redirectUrl,
        });
      }

      (req as any).ownerId = owner.id;
      (req as any).ownerPhone = owner.phone ?? "";
      (req as any).serviceId = service.id;
      (req as any).serviceKey = service.key;

      console.log(`${reqId} pass`);
      return next();
    } catch (e: any) {
      console.error(`${reqId} fatal`, e);
      return res.status(500).json({
        ok: false,
        message: e?.message || "INTERNAL_ERROR",
      });
    }
  };
}