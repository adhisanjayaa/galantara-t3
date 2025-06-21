// File: src/server/api/routers/theme.ts

import {
  createTRPCRouter,
  adminProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const themeRouter = createTRPCRouter({
  /**
   * Mengambil daftar nama file tema yang tersedia (khusus admin).
   */
  getAvailableThemes: adminProcedure.query(() => {
    // Buat daftar nama tema secara manual.
    // Nama ini harus cocok dengan nama file di `src/components/invitation-themes` (tanpa .tsx)
    const availableThemes = [
      "BirthdayPartyTheme",
      "ElegantTheme",
      "ModernElegantTheme",
    ];
    return availableThemes;
  }),

  /**
   * [BARU] Mengambil semua font kustom.
   * Prosedur ini bisa diakses oleh semua pengguna yang sudah login
   * untuk digunakan di dalam editor desain.
   */
  getAvailableFonts: protectedProcedure.query(({ ctx }) => {
    return ctx.db.customFont.findMany({
      orderBy: { name: "asc" },
    });
  }),
});
