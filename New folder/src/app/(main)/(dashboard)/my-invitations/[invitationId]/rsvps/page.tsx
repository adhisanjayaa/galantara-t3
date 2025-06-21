// File: src/app/(main)/(dashboard)/my-invitations/[invitationId]/rsvps/page.tsx

import { api } from "~/trpc/server";
import { notFound } from "next/navigation";
import { RsvpTable } from "./components/RsvpTable";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function RsvpListPage({
  params,
}: {
  // --- PERBAIKAN DI SINI: Bungkus tipe params dengan Promise ---
  params: Promise<{ invitationId: string }>;
}) {
  // --- PERBAIKAN DI SINI: Tambahkan 'await' saat mengakses params ---
  const { invitationId } = await params;

  const invitation = await api.invitation.getInvitationDetails({
    invitationId,
  });
  const rsvps = await api.rsvp.getForInvitation({ invitationId });

  if (!invitation) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <Button asChild variant="ghost" className="-ml-4">
          <Link href="/my-invitations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Undangan Saya
          </Link>
        </Button>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Daftar RSVP</h1>
        <p className="text-muted-foreground mt-1">
          Untuk undangan:{" "}
          <span className="text-primary font-semibold">
            {invitation.subdomain}
          </span>
        </p>
      </div>
      <RsvpTable data={rsvps} />
    </div>
  );
}
