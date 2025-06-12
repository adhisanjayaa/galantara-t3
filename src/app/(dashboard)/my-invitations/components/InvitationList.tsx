// File: src/app/(dashboard)/my-invitations/components/InvitationList.tsx
"use client";

import type { RouterOutputs } from "~/trpc/react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

// Definisikan tipe untuk satu undangan dari data yang diterima
type Invitation = RouterOutputs["invitation"]["getMyInvitations"][number];

export function InvitationList({
  initialInvitations,
}: {
  initialInvitations: Invitation[];
}) {
  if (initialInvitations.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed py-16 text-center">
        <h3 className="text-xl font-semibold">Anda Belum Memiliki Undangan</h3>
        <p className="text-muted-foreground mt-2 mb-4">
          Ayo mulai buat undangan pertama Anda!
        </p>
        <Button asChild>
          <Link href="/themes">Lihat Pilihan Tema</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {initialInvitations.map((inv) => (
        <Card key={inv.id} className="flex flex-col">
          <CardHeader>
            {/* --- PERBAIKAN DI SINI --- */}
            {/* Akses nama produk melalui relasi yang baru: inv -> orderItem -> product */}
            <CardTitle>{inv.orderItem.product.name}</CardTitle>
            <CardDescription>{inv.subdomain}.yourdomain.com</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            {/* Konten tambahan bisa ditambahkan di sini */}
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <Badge variant={inv.status === "ACTIVE" ? "default" : "secondary"}>
              {inv.status}
            </Badge>
            <Button asChild variant="outline" size="sm">
              <Link href={`/manage-invitation/${inv.id}`}>Kelola</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
