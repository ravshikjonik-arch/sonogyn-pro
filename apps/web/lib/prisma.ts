/**
 * Singleton PrismaClient — избегаем множества соединений в dev (HMR) и на serverless.
 *
 * Pooling (Stage 3): `DATABASE_URL` должен указывать на Supabase pooler
 * (`…pooler.supabase.com:6543/…?pgbouncer=true`), `DIRECT_URL` — на :5432 для migrate.
 * Основной clinical I/O идёт через Supabase JS (PostgREST), не через Prisma.
 *
 * Использование (только серверные модули, НИКОГДА в Client Components):
 *   import { prisma } from "@/lib/prisma";
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
