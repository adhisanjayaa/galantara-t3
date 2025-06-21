// File: src/server/db.ts
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neon } from "@neondatabase/serverless";
import { env } from "~/env"; // Kita tetap butuh 'env' untuk variabel lain jika ada

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createDbClient = () => {
  // FIX: Ambil DATABASE_URL langsung dari process.env di sini
  const sql = neon(process.env.DATABASE_URL!);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaNeon(sql as any);

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
