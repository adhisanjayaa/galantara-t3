"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";

type InvitationDetails = RouterOutputs["invitation"]["getInvitationDetails"];

type FormSchemaField = {
  name: string;
  label: string;
  type: "text" | "date" | "textarea";
  placeholder?: string;
};

export function InvitationEditorForm({
  invitation,
}: {
  invitation: InvitationDetails;
}) {
  const router = useRouter();

  // Definisikan variabel dengan jelas untuk menghindari kebingungan
  const product = invitation.orderItem.product;
  const productType = product.productType;

  // Ambil formSchema dari 'product', sesuai dengan struktur data yang kita inginkan
  const formSchema = product.formSchema as FormSchemaField[];

  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (invitation.formData && typeof invitation.formData === "object") {
      setFormData(invitation.formData as Record<string, string>);
    }
  }, [invitation.formData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updateMutation = api.invitation.updateInvitationData.useMutation({
    onSuccess: () => {
      toast.success("Perubahan berhasil disimpan!");
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Gagal menyimpan: ${error.message}`);
    },
  });

  const activateMutation = api.invitation.activateInvitation.useMutation({
    onSuccess: () => {
      toast.success("Selamat! Undangan Anda sekarang aktif.");
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Gagal mengaktifkan: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      invitationId: invitation.id,
      formData: formData,
    });
  };

  const handleActivate = () => {
    activateMutation.mutate({ invitationId: invitation.id });
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {/* Gunakan nama dari Tipe Produk untuk judul */}
                <CardTitle>{productType.name}</CardTitle>
                <CardDescription>
                  Isi detail untuk undangan Anda sesuai dengan kolom yang
                  tersedia.
                </CardDescription>
              </div>
              <Badge
                variant={
                  invitation.status === "ACTIVE" ? "default" : "secondary"
                }
              >
                Status: {invitation.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {formSchema.map((field) => (
              <div key={field.name}>
                <label
                  htmlFor={field.name}
                  className="block text-sm font-medium text-gray-700"
                >
                  {field.label}
                </label>
                <div className="mt-1">
                  <input
                    type={field.type}
                    name={field.name}
                    id={field.name}
                    className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                    placeholder={field.placeholder ?? ""}
                    value={formData[field.name] ?? ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={
                  invitation.status === "ACTIVE" || activateMutation.isPending
                }
              >
                {activateMutation.isPending
                  ? "Mengaktifkan..."
                  : "Aktifkan Undangan"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Aktifkan Undangan?</AlertDialogTitle>
                <AlertDialogDescription>
                  Setelah aktif, undangan akan bisa dilihat publik dan masa
                  aktifnya akan dimulai. Anda tidak bisa menonaktifkannya
                  kembali. Yakin?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleActivate}>
                  Ya, Aktifkan
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </>
  );
}
