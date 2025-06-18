// File: src/app/(dashboard)/manage-invitation/[invitationId]/page.tsx

import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import { InvitationEditorForm } from "./components/InvitationEditorForm";

// --- PERBAIKAN FINAL ---
// Tipe 'params' didefinisikan sebagai sebuah Promise, sesuai dengan
// standar Next.js versi baru untuk lolos dari validasi build.
export default async function ManageInvitationPage({
  params,
}: {
  params: Promise<{ invitationId: string }>;
}) {
  // "Tunggu" (await) promise 'params' untuk mendapatkan objek yang sebenarnya,
  // lalu destructure untuk mengambil 'invitationId'.
  const { invitationId } = await params;

  // Gunakan invitationId untuk mengambil data.
  const invitation = await api.invitation.getInvitationDetails({
    invitationId,
  });

  if (!invitation) {
    return notFound();
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
      <InvitationEditorForm invitation={invitation} />
    </div>
  );
}
