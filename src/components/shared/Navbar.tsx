// File: src/components/shared/Navbar.tsx

"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "~/components/ui/skeleton";

// Gunakan dynamic import untuk memuat komponen NavbarClient
// dengan opsi ssr: false.
const NavbarClient = dynamic(
  () => import("./NavbarClient").then((mod) => mod.Navbar),
  {
    ssr: false,
    // Tampilkan placeholder loading agar tidak terjadi lompatan layout
    loading: () => (
      <header className="fixed top-0 left-0 z-50 w-full border-b backdrop-blur">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      </header>
    ),
  },
);

/**
 * Komponen wrapper ini diekspor dan digunakan di layout.
 * Tujuannya hanya untuk memuat NavbarClient secara dinamis di sisi klien.
 */
export function Navbar() {
  return <NavbarClient />;
}
