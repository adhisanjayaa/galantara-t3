// File: src/app/(main)/themes/[themeId]/preview/page.tsx

import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/server";
import React from "react";
import { getDummyDataByIdentifier } from "~/lib/dummyData";
import { Button } from "~/components/ui/button";
import { ArrowLeft, EyeOff } from "lucide-react";

// Definisikan tipe untuk props tema
interface ThemeProps {
  formData: Record<string, unknown>;
  invitationId: string;
}

type ThemeModule = {
  default: React.ComponentType<ThemeProps>;
};

// Komponen fallback jika tema gagal dimuat
function FallbackTheme({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="rounded-lg border-2 border-dashed p-8 text-center">
        <h1 className="text-2xl font-bold">Kesalahan Pratinjau</h1>
        <p className="text-destructive mt-2">{message}</p>
      </div>
    </div>
  );
}

export default async function ThemePreviewPage({
  params,
}: {
  // Perbaikan: Tipe 'params' dibungkus dengan Promise
  params: Promise<{ themeId: string }>;
}) {
  // Perbaikan: 'await' digunakan untuk mendapatkan nilai params
  const { themeId } = await params;

  // 1. Ambil data produk untuk mendapatkan themeIdentifier dan schemaIdentifier
  const product = await api.product.getProductById({ id: themeId });

  if (!product || product.category !== "DIGITAL") {
    notFound();
  }

  // 2. Ambil themeIdentifier untuk memuat komponen tema
  const themeIdentifier = product.themeIdentifier;
  if (!themeIdentifier) {
    return (
      <FallbackTheme
        message={`Produk "${product.name}" tidak memiliki identifier tema.`}
      />
    );
  }

  // 3. Ambil schemaIdentifier untuk mendapatkan data dummy yang benar
  const schemaIdentifier = product.productType?.schemaIdentifier;
  const dummyData = getDummyDataByIdentifier(schemaIdentifier);

  // 4. Muat komponen tema secara dinamis
  let ThemeComponent: React.ComponentType<ThemeProps>;
  try {
    const themeModule = (await import(
      `~/components/invitation-themes/${themeIdentifier}.tsx`
    )) as ThemeModule;
    ThemeComponent = themeModule.default;
  } catch (error) {
    console.error(`Gagal memuat komponen tema: ${themeIdentifier}.tsx`, error);
    return (
      <FallbackTheme
        message={`Komponen tema "${themeIdentifier}" tidak dapat dimuat.`}
      />
    );
  }

  return (
    <>
      {/* Tombol untuk kembali ke halaman detail */}
      <div className="bg-background/80 fixed top-4 left-4 z-[9999] rounded-full shadow-lg backdrop-blur-sm">
        <Button asChild variant="secondary" className="rounded-full">
          <Link href={`/themes/${themeId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Link>
        </Button>
      </div>
      {/* Tombol untuk kembali ke halaman detail */}
      <div className="fixed top-4 right-4 z-[9999] rounded-full bg-yellow-300/80 text-yellow-900 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-2 px-4 py-2 text-sm font-semibold">
          <EyeOff className="h-4 w-4" />
          <span>Mode Pratinjau</span>
        </div>
      </div>

      {/* Render komponen tema dengan data dummy */}
      <ThemeComponent formData={dummyData} invitationId="preview-id-dummy" />
    </>
  );
}
