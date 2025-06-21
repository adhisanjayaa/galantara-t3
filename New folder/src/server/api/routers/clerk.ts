// File: src/server/api/routers/clerk.ts

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
// Kita tidak lagi butuh 'clerkClient' di sini

export const clerkRouter = createTRPCRouter({
  /**
   * Mengambil detail pengguna yang sedang login dari konteks tRPC.
   * Ini lebih efisien daripada memanggil API Clerk lagi.
   */
  getCurrentUser: protectedProcedure.query(({ ctx }) => {
    // Objek 'user' sudah tersedia di dalam konteks, kita tinggal mengembalikannya.
    return ctx.user;
  }),
});
