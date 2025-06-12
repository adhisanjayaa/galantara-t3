// File: src/server/api/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth, currentUser } from "@clerk/nextjs/server";

import { db } from "~/server/db";

/**
 * Konteks ini adalah objek yang tersedia untuk semua prosedur tRPC Anda.
 * Ini berisi hal-hal seperti koneksi database dan informasi sesi pengguna.
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const { userId, sessionClaims } = await auth();
  const user = await currentUser();

  return {
    db,
    userId,
    sessionClaims, // Berisi metadata seperti peran (role)
    user, // Berisi detail user seperti nama, email, dll.
    ...opts,
  };
};

/**
 * Inisialisasi tRPC. Jangan ekspor `t` secara langsung.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Helper untuk membuat router dan prosedur tRPC.
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

/**
 * Prosedur publik.
 * API ini bisa diakses oleh siapa saja, bahkan pengguna yang tidak login.
 * @see https://trpc.io/docs/procedures
 */
export const publicProcedure = t.procedure;

/**
 * Middleware untuk memastikan pengguna sudah login.
 * Jika pengguna tidak login, akan dilempar error UNAUTHORIZED.
 */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return next({
    ctx: {
      // TypeScript sekarang tahu bahwa `userId` tidak akan null di prosedur yang dilindungi.
      userId: ctx.userId,
      user: ctx.user,
      sessionClaims: ctx.sessionClaims,
    },
  });
});

/**
 * Prosedur yang dilindungi (protected).
 * API ini hanya bisa diakses oleh pengguna yang sudah login.
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

/**
 * Middleware untuk memastikan pengguna adalah seorang admin.
 * Memeriksa metadata peran dari sesi Clerk.
 */
const isAdmin = t.middleware(({ ctx, next }) => {
  // --- LANGKAH DEBUGGING ---
  // Log ini akan menampilkan seluruh isi dari session token di terminal server Anda.
  // Periksa output ini untuk memastikan klaim 'role' ada dan nilainya benar.
  console.log("Mengecek Session Claims:", ctx.sessionClaims);

  // PERBAIKAN: Beri tahu TypeScript bahwa kita mengharapkan 'role' sebagai string
  // dan baca langsung dari sessionClaims.
  const userRole = (ctx.sessionClaims as { role?: string })?.role;

  if (!ctx.userId || userRole !== "admin") {
    // Log ini akan muncul jika akses ditolak
    console.error("Akses DITOLAK. Peran pengguna yang terdeteksi:", userRole);
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Admin access required",
    });
  }

  // Log ini akan muncul jika akses berhasil
  console.log("Akses DIBERIKAN. Peran pengguna:", userRole);
  return next({
    ctx: {
      userId: ctx.userId,
      user: ctx.user,
      sessionClaims: ctx.sessionClaims,
    },
  });
});

/**
 * Prosedur admin.
 * API ini hanya bisa diakses oleh pengguna yang memiliki peran 'admin' di metadata Clerk.
 */
export const adminProcedure = t.procedure.use(isAdmin);
