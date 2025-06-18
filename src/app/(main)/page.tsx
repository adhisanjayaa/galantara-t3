// File: src/app/page.tsx

import Link from "next/link";
import { api } from "~/trpc/server";
import { ThemeCard } from "~/components/shared/ThemeCard";
import { Button } from "~/components/ui/button";

export default async function HomePage() {
  // 1. Ambil data produk secara terpisah untuk setiap kategori di server
  const digitalProducts = await api.product.getProducts({
    category: "DIGITAL",
    limit: 4, // Ambil 4 produk digital teratas
  });

  const physicalProducts = await api.product.getProducts({
    category: "PHYSICAL",
    limit: 4, // Ambil 4 produk fisik teratas
  });

  return (
    <>
      {/* Bagian 1: Hero Section */}
      <section className="relative flex h-[60vh] min-h-[500px] w-full flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="container text-center">
          <h1 className="text-4xl font-extrabold tracking-tighter sm:text-6xl md:text-7xl">
            GALANTARA
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-[700px] text-lg">
            Wujudkan momen spesial Anda dengan undangan digital dan fisik yang
            tak terlupakan.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/themes">Lihat Semua Desain</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Bagian 2: List Undangan Digital */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container space-y-8 px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Undangan Digital Populer
            </h2>
            <p className="text-muted-foreground max-w-[900px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Pilih dari berbagai desain interaktif dan modern yang siap memukau
              tamu Anda.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {digitalProducts.map((product) => (
              <Link href={`/themes/${product.id}`} key={product.id}>
                <ThemeCard theme={product} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bagian 3: List Undangan Fisik */}
      <section className="w-full bg-gray-50 py-12 md:py-24 lg:py-32 dark:bg-gray-800/20">
        <div className="container space-y-8 px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Undangan Fisik & Aksesoris
            </h2>
            <p className="text-muted-foreground max-w-[900px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Sentuhan personal dengan kualitas cetak premium untuk melengkapi
              hari istimewa Anda.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {physicalProducts.map((product) => (
              <Link href={`/themes/${product.id}`} key={product.id}>
                <ThemeCard theme={product} />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
