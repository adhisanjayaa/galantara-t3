// File: src/app/admin/fonts/page.tsx

import { api } from "~/trpc/server";
import { FontClient } from "./components/FontClient";

/**
 * Halaman utama untuk manajemen Font Kustom di panel admin.
 * Halaman ini adalah Server Component yang mengambil data awal.
 */
export default async function AdminFontsPage() {
  // Ambil data semua font kustom di sisi server untuk render awal yang cepat.
  const initialFonts = await api.admin.getCustomFonts();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Manajemen Font Kustom</h1>
        <p className="text-muted-foreground mt-1">
          Unggah dan kelola font yang akan tersedia di dalam editor desain.
        </p>
      </div>

      {/* Render komponen klien dan teruskan data awal sebagai prop.
        Semua logika interaktif (modal, tabel, hapus) akan ditangani oleh FontClient.
      */}
      <FontClient initialFonts={initialFonts} />
    </div>
  );
}
