// File: src/app/themes/[themeId]/page.tsx [MODIFIED]

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link"; // [NEW] Impor Link
import { api } from "~/trpc/server";
import { AddToCartButton } from "~/components/shared/AddToCartButton";
import { DigitalProductAddToCart } from "./components/DigitalProductAddToCart";
import { Button } from "~/components/ui/button"; // [NEW] Impor Button

export default async function ThemeDetailPage({
  params,
}: {
  params: Promise<{ themeId: string }>;
}) {
  const { themeId } = await params;
  const theme = await api.product.getProductById({ id: themeId });

  if (!theme) {
    notFound();
  }

  // --- [NEW] Fungsi untuk render tombol aksi ---
  const renderActionButton = () => {
    if (theme.category === "DIGITAL") {
      return <DigitalProductAddToCart product={theme} />;
    }

    // Jika produk fisik dan bisa didesain
    if (theme.isDesignable) {
      return (
        <Button asChild size="lg" className="w-full">
          <Link href={`/design/new?templateId=${theme.id}`}>
            Desain Sekarang
          </Link>
        </Button>
      );
    }

    // Jika produk fisik biasa (tidak bisa didesain)
    return <AddToCartButton productId={theme.id} />;
  };

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="grid items-start gap-8 md:grid-cols-2 lg:gap-12">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg shadow-lg">
          {theme.images.length > 0 && (
            <Image
              src={theme.images[0]!}
              alt={theme.name}
              fill
              className="object-cover"
              priority
            />
          )}
        </div>

        <div className="flex flex-col">
          <h1 className="text-4xl font-bold tracking-tight">{theme.name}</h1>
          <p className="text-muted-foreground mt-4 text-lg">
            {theme.description}
          </p>

          <div className="mt-6">
            <span className="text-3xl font-bold">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(theme.price)}
            </span>
            {theme.category === "PHYSICAL" && (
              <span className="text-muted-foreground text-sm"> / pcs</span>
            )}
          </div>

          <div className="mt-8 border-t pt-8">
            {/* [MODIFIED] Panggil fungsi render tombol aksi */}
            {renderActionButton()}
          </div>
        </div>
      </div>
    </main>
  );
}
