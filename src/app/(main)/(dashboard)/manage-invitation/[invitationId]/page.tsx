// File: src/app/(main)/(dashboard)/manage-invitation/[invitationId]/page.tsx

import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import { InvitationEditorForm } from "./components/InvitationEditorForm";

/**
 * Halaman ini adalah Server Component yang bertanggung jawab untuk:
 * 1. Mengambil 'invitationId' dari parameter URL.
 * 2. Memanggil tRPC procedure di server untuk mengambil detail undangan.
 * 3. Menangani kasus jika undangan tidak ditemukan (404).
 * 4. Me-render komponen 'InvitationEditorForm' (sebuah Client Component)
 * dan meneruskan data undangan sebagai prop.
 */
export default async function ManageInvitationPage({
  params,
}: {
  // Tipe 'params' sebagai Promise sesuai standar Next.js terbaru
  params: Promise<{ invitationId: string }>;
}) {
  // Menunggu (await) promise 'params' untuk mendapatkan objek parameter
  const { invitationId } = await params;

  // Mengambil data detail undangan dari server
  const invitation = await api.invitation.getInvitationDetails({
    invitationId,
  });

  // Jika undangan tidak ada di database atau bukan milik user, tampilkan halaman 404
  if (!invitation) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Kelola Undangan</h1>
        <p className="text-muted-foreground mt-1">
          Anda sedang mengedit tema &quot;{invitation.orderItem.product.name}
          &quot; untuk subdomain{" "}
          <span className="text-primary font-mono">{invitation.subdomain}</span>
          .
        </p>
      </div>

      {/* Me-render form editor (Client Component) dan memberikan seluruh objek
        'invitation' sebagai prop. Semua logika form yang kompleks akan
        ditangani di dalam InvitationEditorForm dan komponen-komponen anaknya.
      */}
      <InvitationEditorForm invitation={invitation} />
    </div>
  );
}
