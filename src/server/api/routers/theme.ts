// File: src/server/api/routers/theme.ts

import {
  createTRPCRouter,
  adminProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import fs from "fs";
import path from "path";

export const themeRouter = createTRPCRouter({
  /**
   * Mengambil daftar nama file tema yang tersedia (khusus admin).
   */
  getAvailableThemes: adminProcedure.query(() => {
    try {
      const themesDirectory = path.join(
        process.cwd(),
        "src/components/invitation-themes",
      );
      const filenames = fs.readdirSync(themesDirectory);
      const themes = filenames
        .filter((file) => file.endsWith(".tsx"))
        .map((file) => file.replace(".tsx", ""));
      return themes;
    } catch (error) {
      console.error("Gagal membaca direktori tema:", error);
      return [];
    }
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
