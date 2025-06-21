// File: src/app/(main)/themes/[themeId]/page.tsx

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { api } from "~/trpc/server";
import { AddToCartButton } from "~/components/shared/AddToCartButton";
import { DigitalProductAddToCart } from "./components/DigitalProductAddToCart";
import { Button } from "~/components/ui/button";
import { Eye } from "lucide-react";

export default async function ThemeDetailPage({
  params,
}: {
  // Perbaikan: Tipe 'params' dibungkus dengan Promise
  params: Promise<{ themeId: string }>;
}) {
  // Perbaikan: 'await' digunakan untuk mendapatkan nilai params
  const { themeId } = await params;
  const theme = await api.product.getProductById({ id: themeId });

  if (!theme) {
    notFound();
  }

  const renderActionButton = () => {
    // Tombol untuk produk digital
    if (theme.category === "DIGITAL") {
      return (
        <div className="space-y-4">
          <DigitalProductAddToCart product={theme} />
          <Button asChild variant="outline" className="w-full">
            <Link href={`/themes/${theme.id}/preview`}>
              <Eye className="mr-2 h-4 w-4" />
              Lihat Preview
            </Link>
          </Button>
        </div>
      );
    }

    // Tombol untuk produk fisik yang bisa didesain
    if (theme.isDesignable) {
      return (
        <Button asChild size="lg" className="w-full">
          <Link href={`/design/new?templateId=${theme.id}`}>
            Desain Sekarang
          </Link>
        </Button>
      );
    }

    // Tombol untuk produk fisik biasa
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

          <div className="mt-8 border-t pt-8">{renderActionButton()}</div>
        </div>
      </div>
    </main>
  );
}
