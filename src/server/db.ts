// File: src/server/db.ts
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";
import { env } from "~/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createDbClient = () => {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  // FIX: Cast 'pool' to 'any' to bypass the type error during build.
  const adapter = new PrismaNeon(pool as any);
  return new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

export const db = globalForPrisma.prisma ?? createDbClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
