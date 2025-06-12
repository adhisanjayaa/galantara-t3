// File: src/server/api/routers/theme.ts

import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import fs from "fs";
import path from "path";

export const themeRouter = createTRPCRouter({
  /**
   * Mengambil daftar tema yang tersedia secara otomatis.
   * Prosedur ini membaca direktori komponen tema dan mengembalikan
   * nama file (tanpa ekstensi .tsx) sebagai identifier tema.
   * Dilindungi oleh adminProcedure karena hanya diperlukan di dashboard admin.
   */
  getAvailableThemes: adminProcedure.query(() => {
    try {
      // Tentukan path ke direktori tema Anda
      const themesDirectory = path.join(
        process.cwd(),
        "src/components/invitation-themes",
      );

      // Baca semua file di dalam direktori
      const filenames = fs.readdirSync(themesDirectory);

      // Filter untuk hanya mengambil file .tsx dan hapus ekstensinya
      const themes = filenames
        .filter((file) => file.endsWith(".tsx"))
        .map((file) => file.replace(".tsx", ""));

      // Kembalikan daftar nama tema sebagai string array
      return themes;
    } catch (error) {
      console.error("Gagal membaca direktori tema:", error);
      // Kembalikan array kosong jika terjadi error (misal: folder tidak ada)
      return [];
    }
  }),
});
