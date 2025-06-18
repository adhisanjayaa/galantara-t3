// File: src/app/profile/components/AddressCard.tsx
"use client";

import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";

type Address = RouterOutputs["profile"]["getAddresses"][number];

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
}

export function AddressCard({ address, onEdit }: AddressCardProps) {
  const utils = api.useUtils();
  const { data: user } = api.clerk.getCurrentUser.useQuery();

  const deleteMutation = api.profile.deleteAddress.useMutation({
    onSuccess: () => {
      toast.success("Alamat berhasil dihapus.");
      void utils.profile.getAddresses.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Mutasi 'setPrimaryMutation' telah dihapus.

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Alamat {address.type === "PRIMARY" ? "Utama" : "Sekunder"}
          </CardTitle>
          {address.type === "PRIMARY" && <Badge>Primary</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <p className="h-6 font-medium">
          {user ? `${user.firstName} ${user.lastName}` : "..."}
        </p>
        <p className="text-muted-foreground text-sm">{address.street}</p>
        <p className="text-muted-foreground text-sm">{`${address.city}, ${address.province} ${address.postalCode}`}</p>
        <p className="text-muted-foreground text-sm">{address.country}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(address)}>
            Edit
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "..." : "Hapus"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Anda yakin ingin menghapus alamat ini?
                </AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    deleteMutation.mutate({ addressId: address.id })
                  }
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Ya, Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Tombol 'Jadikan Utama' telah dihapus dari sini. */}
        </div>
      </CardContent>
    </Card>
  );
}
