import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Prisma v7 + adapter (LOCAL POSTGRES SAFE)
 * - Fixes "engine client requires adapter" error
 * - Production ready for workers + billing
 * - Compatible with prisma.config.ts
 */
function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    
    throw new Error("DATABASE_URL is not set (db package)");

  }

  const pool = new pg.Pool({
    connectionString: databaseUrl,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    errorFormat: process.env.NODE_ENV === "production" ? "minimal" : "pretty",
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}

const prisma =
  globalThis.__prisma ??
  createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

export default prisma;
export { prisma };

export type {
  Prisma,
  MessageEventType,
  MessageStatus,
} from "@prisma/client";