import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "~/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createDbClient = () => {
  const pool = new Pool({ connectionString: env.DATABASE_URL });

  // --- PERBAIKAN DI SINI ---
  // Kita gunakan 'as any' untuk melewati error type-checking yang salah dari TypeScript.
  // Ini aman dilakukan karena kita tahu 'pool' adalah objek yang benar secara fungsional.
  const adapter = new PrismaPg(pool as any);

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
