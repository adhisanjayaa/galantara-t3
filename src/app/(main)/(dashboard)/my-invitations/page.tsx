// File: src/app/(dashboard)/my-invitations/page.tsx

import { api } from "~/trpc/server";
import { InvitationList } from "./components/InvitationList";

export default async function MyInvitationsPage() {
  // Ambil semua undangan milik user di server
  const invitations = await api.invitation.getMyInvitations();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Undangan Saya</h1>
        <p className="text-muted-foreground">
          Kelola semua undangan yang telah Anda buat.
        </p>
      </div>
      <InvitationList initialInvitations={invitations} />
    </div>
  );
}
