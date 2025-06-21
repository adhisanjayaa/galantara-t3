// File: src/components/shared/ThemeCard.tsx
"use client";

import Image from "next/image";
import type { Product } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

interface ThemeCardProps {
  // Kita perlu menambahkan 'category' ke tipe 'Product' jika belum ada
  // Namun, Prisma Client seharusnya sudah menyertakannya secara otomatis.
  theme: Product;
}

export function ThemeCard({ theme }: ThemeCardProps) {
  return (
    <Card className="flex h-full cursor-pointer flex-col transition-shadow duration-300 hover:shadow-lg">
      <CardHeader>
        {theme.images.length > 0 && (
          <div className="relative aspect-video w-full overflow-hidden rounded-md">
            <Image
              src={theme.images[0]!}
              alt={theme.name}
              fill
              className="object-cover"
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <CardTitle>{theme.name}</CardTitle>
        <CardDescription className="mt-2 line-clamp-2">
          {theme.description}
        </CardDescription>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        {/* --- PERBAIKAN DI SINI --- */}
        {/* Tampilkan badge secara dinamis berdasarkan kategori produk */}
        {theme.category === "DIGITAL" ? (
          <Badge variant="secondary">Digital</Badge>
        ) : (
          <Badge variant="outline">Fisik</Badge>
        )}
        {/* ------------------------- */}
        <p className="text-lg font-semibold">
          {new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          }).format(theme.price)}
        </p>
      </CardFooter>
    </Card>
  );
}
