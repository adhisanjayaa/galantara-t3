// File: src/app/(main)/(dashboard)/manage-invitation/[invitationId]/components/InvitationEditorForm.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
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
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";

// Impor komponen-komponen anak
import { CoupleProfileSection } from "./CoupleProfileSection";
import { EventListEditor } from "./EventListEditor";
import { GalleryUpload } from "./GalleryUpload";
import { MusicUpload } from "./MusicUpload";

// Impor skema dan tipe dari file terpusat
import { weddingFormSchema, type WeddingFormData } from "~/lib/formSchemas";

type InvitationDetails = RouterOutputs["invitation"]["getInvitationDetails"];

export function InvitationEditorForm({
  invitation,
}: {
  invitation: InvitationDetails;
}) {
  const router = useRouter();

  // Inisialisasi React Hook Form dengan skema Zod
  const methods = useForm<WeddingFormData>({
    resolver: zodResolver(weddingFormSchema),
    // Default values untuk memastikan field array tidak pernah 'undefined'
    defaultValues: {
      events: [],
      gallery_photo_urls: [],
      digital_gifts: [],
    },
  });

  // Efek untuk mengisi form dengan data dari server saat komponen dimuat
  useEffect(() => {
    const formDataFromServer =
      invitation.formData as Partial<WeddingFormData> | null;

    // Nilai default untuk memastikan field array selalu ada
    const defaultArrayValues = {
      events: [],
      gallery_photo_urls: [],
      digital_gifts: [],
    };

    // Gabungkan nilai default dengan data dari server
    const valuesToSet = {
      ...defaultArrayValues,
      ...formDataFromServer,
    };

    methods.reset(valuesToSet);
  }, [invitation.formData, methods]);

  // Mutasi untuk menyimpan perubahan data form
  const updateMutation = api.invitation.updateInvitationData.useMutation({
    onSuccess: () => {
      toast.success("Perubahan berhasil disimpan!");
      router.refresh();
    },
    onError: (error) => {
      // Menampilkan error validasi Zod jika ada
      const zodError = error.data?.zodError;
      if (zodError) {
        Object.values(zodError.fieldErrors)
          .flat()
          .forEach((errorMessage) => {
            if (typeof errorMessage === "string") toast.error(errorMessage);
          });
      } else {
        toast.error(`Gagal menyimpan: ${error.message}`);
      }
    },
  });

  // Mutasi untuk mengaktifkan undangan
  const activateMutation = api.invitation.activateInvitation.useMutation({
    onSuccess: () => {
      toast.success("Selamat! Undangan Anda sekarang aktif.");
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Gagal mengaktifkan: ${error.message}`);
    },
  });

  // Handler saat form di-submit
  const onSubmit = (data: WeddingFormData) => {
    updateMutation.mutate({
      invitationId: invitation.id,
      formData: data,
    });
  };

  const handleActivate = () => {
    activateMutation.mutate({ invitationId: invitation.id });
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Editor Undangan Digital</CardTitle>
                <CardDescription>
                  Isi semua detail undangan pernikahan Anda di bawah ini.
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
          <CardContent className="space-y-8">
            <CoupleProfileSection />
            <EventListEditor />
            <GalleryUpload />
            <MusicUpload />

            {/* Bagian untuk input sederhana lainnya */}
            <div className="space-y-4 rounded-lg border p-4">
              <h3 className="text-lg font-semibold">Informasi Tambahan</h3>
              <div>
                <Label htmlFor="quote">Kutipan (Quote)</Label>
                <Textarea
                  id="quote"
                  placeholder="cth. Dan di antara tanda-tanda kekuasaan-Nya..."
                  {...methods.register("quote")}
                />
              </div>
              <div>
                <Label htmlFor="story">Cerita Cinta</Label>
                <Textarea
                  id="story"
                  placeholder="Ceritakan bagaimana perjalanan cinta Anda dimulai..."
                  {...methods.register("story")}
                  rows={5}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Baris Tombol Aksi */}
        <div className="mt-6 flex items-center justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={
                  invitation.status !== "DRAFT" || activateMutation.isPending
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
    </FormProvider>
  );
}
