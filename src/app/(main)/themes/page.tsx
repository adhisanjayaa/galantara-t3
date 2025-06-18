// File: src/app/themes/page.tsx

import Link from "next/link";
import { api } from "~/trpc/server";
import { ThemeCard } from "~/components/shared/ThemeCard";

export default async function ThemesPage() {
  // Panggil router 'product' dan prosedur 'getProducts' yang baru.
  // Kita tidak memberikan filter agar semua produk (digital dan fisik) ditampilkan.
  const allProducts = await api.product.getProducts({});

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Semua Desain</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Temukan desain yang sempurna untuk setiap momen spesial Anda.
        </p>
      </div>

      {allProducts.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed py-16 text-center">
          <p className="text-muted-foreground">
            Belum ada produk yang tersedia saat ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {allProducts.map((product) => (
            <Link href={`/themes/${product.id}`} key={product.id}>
              <ThemeCard theme={product} />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
