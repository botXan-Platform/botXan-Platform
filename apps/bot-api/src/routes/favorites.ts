import { Router, type Request, type Response } from "express";
import prisma from "db";

export const favoritesRouter = Router();

function bad(res: Response, message: string) {
  return res.status(400).json({ ok: false, message });
}

/**
 * POST /favorites/toggle
 * body: { phone: string, propertyId: string }
 *
 * - varsa silir
 * - yoxdursa əlavə edir (max 5 limit)
 */
favoritesRouter.post("/toggle", async (req: Request, res: Response) => {
  const { phone, propertyId } = req.body ?? {};

  if (!phone || typeof phone !== "string") return bad(res, "phone required");
  if (!propertyId || typeof propertyId !== "string")
    return bad(res, "propertyId required");

  try {
    // property var?
    const prop = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!prop) return res.status(404).json({ ok: false, message: "PROPERTY_NOT_FOUND" });

    // artıq favoritdir?
    const existing = await prisma.favorite.findUnique({
      where: { customerPhone_propertyId: { customerPhone: phone, propertyId } },
      select: { id: true },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { customerPhone_propertyId: { customerPhone: phone, propertyId } },
      });

      const count = await prisma.favorite.count({ where: { customerPhone: phone } });
      return res.json({ ok: true, isFavorite: false, count });
    }

    // max 5 limit
    const count = await prisma.favorite.count({ where: { customerPhone: phone } });
    if (count >= 5) {
      return res.status(409).json({ ok: false, message: "MAX_FAVORITES_REACHED", max: 5 });
    }

    await prisma.favorite.create({
      data: { customerPhone: phone, propertyId },
    });

    const newCount = count + 1;
    return res.json({ ok: true, isFavorite: true, count: newCount });
  } catch (e) {
    console.error("favorites/toggle error:", e);
    return res.status(500).json({ ok: false, message: "INTERNAL_ERROR" });
  }
});

/**
 * GET /favorites?phone=994...
 * returns: properties (id,title,areaName)
 */
favoritesRouter.get("/", async (req: Request, res: Response) => {
  const phone = String(req.query.phone ?? "");
  if (!phone) return bad(res, "phone required");

  try {
    const favs = await prisma.favorite.findMany({
      where: { customerPhone: phone },
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { id: true, title: true, areaName: true, isVisible: true } },
      },
      take: 5,
    });

    return res.json({
      ok: true,
      items: favs
        .filter((f) => f.property?.isVisible !== false)
        .map((f) => ({
          propertyId: f.property.id,
          title: f.property.title,
          areaName: f.property.areaName,
        })),
    });
  } catch (e) {
    console.error("favorites/list error:", e);
    return res.status(500).json({ ok: false, message: "INTERNAL_ERROR" });
  }
});