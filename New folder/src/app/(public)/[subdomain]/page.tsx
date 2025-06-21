// File: src/app/[subdomain]/page.tsx

import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import React from "react";

// Definisikan tipe untuk props yang akan diterima oleh semua komponen tema.
interface ThemeProps {
  formData: Record<string, string>;
  invitationId: string;
}

type ThemeModule = {
  default: React.ComponentType<ThemeProps>;
};

// Komponen fallback yang akan ditampilkan jika tema tidak ditemukan atau gagal dimuat.
function DefaultTheme({ formData }: ThemeProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="rounded-lg border-2 border-dashed p-8 text-center">
        <h1 className="text-2xl font-bold">
          {/* Mencoba menampilkan nama dari berbagai jenis form */}
          {formData.groomName ?? formData.celebrantName ?? "Undangan Spesial"}
        </h1>
        <p className="text-destructive mt-2">
          Desain tema untuk undangan ini tidak dapat dimuat.
        </p>
      </div>
    </div>
  );
}

export default async function PublicInvitationPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;

  const invitation = await api.invitation.getPublicInvitationBySubdomain({
    subdomain,
  });

  if (!invitation) {
    return notFound();
  }

  let ThemeComponent: React.ComponentType<ThemeProps> = DefaultTheme;
  const themeIdentifier = invitation.orderItem.product.themeIdentifier;

  // Ambil dan beri tipe yang aman pada formData.
  const formData = (invitation.formData as Record<string, string>) ?? {};

  // Jika ada themeIdentifier, coba muat komponennya secara dinamis.
  if (themeIdentifier) {
    try {
      // PERBAIKAN: Berikan tipe eksplisit pada hasil import dinamis.
      const themeModule = (await import(
        `~/components/invitation-themes/${themeIdentifier}.tsx`
      )) as ThemeModule;

      // Gunakan nullish coalescing (??) untuk fallback yang lebih aman.
      ThemeComponent = themeModule.default ?? DefaultTheme;
    } catch (error) {
      console.error(
        `Gagal memuat komponen tema: ${themeIdentifier}.tsx`,
        error,
      );
    }
  }

  // Render komponen tema yang sesuai dan teruskan data undangan.
  return <ThemeComponent formData={formData} invitationId={invitation.id} />;
}
