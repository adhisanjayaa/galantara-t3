// File: src/app/(main)/(dashboard)/manage-invitation/[invitationId]/components/GalleryUpload.tsx

"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useFieldArray, useFormContext } from "react-hook-form";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Loader2, Trash2, UploadCloud } from "lucide-react";
import { type WeddingFormData } from "~/lib/formSchemas";

type UploadStatus = {
  file: File;
  preview: string;
  status: "pending" | "uploading" | "success" | "error";
  errorMessage?: string;
};

export function GalleryUpload() {
  const { control, getValues } = useFormContext<WeddingFormData>();
  const fieldName = "gallery_photo_urls";

  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldName,
  });

  const [uploadQueue, setUploadQueue] = useState<UploadStatus[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createPresignedUrlMutation =
    api.storage.createPresignedUrl.useMutation();

  const handleFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files ?? []);
    const currentPhotoCount = getValues(fieldName)?.length ?? 0;

    if (files.length === 0) return;

    if (files.length + currentPhotoCount > 10) {
      toast.error("Anda hanya dapat mengunggah maksimal 10 foto galeri.");
      return;
    }

    const newQueue: UploadStatus[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: "pending",
    }));

    setUploadQueue(newQueue);

    // [FIX 1] Mengganti loop for tradisional dengan for...of
    for (const item of newQueue) {
      setUploadQueue((prev) =>
        prev.map((q) =>
          q.preview === item.preview ? { ...q, status: "uploading" } : q,
        ),
      );

      try {
        const { uploadUrl, publicUrl } =
          await createPresignedUrlMutation.mutateAsync({
            fileType: item.file.type,
          });
        await fetch(uploadUrl, {
          method: "PUT",
          body: item.file,
          headers: { "Content-Type": item.file.type },
        });
        append({ url: publicUrl });
        setUploadQueue((prev) =>
          prev.map((q) =>
            q.preview === item.preview ? { ...q, status: "success" } : q,
          ),
        );
      } catch (error) {
        // [FIX 2] Menggunakan variabel 'error' untuk pesan yang lebih detail
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan tidak dikenal";
        setUploadQueue((prev) =>
          prev.map((q) =>
            q.preview === item.preview
              ? { ...q, status: "error", errorMessage: errorMessage }
              : q,
          ),
        );
        toast.error(`Gagal mengunggah ${item.file.name}: ${errorMessage}`);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
    // Hapus antrian setelah beberapa saat, kecuali yang error
    setTimeout(
      () => setUploadQueue((prev) => prev.filter((q) => q.status === "error")),
      5000,
    );
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Galeri Foto (Maks. 10)</h3>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={
            fields.length >= 10 ||
            uploadQueue.some((q) => q.status === "uploading")
          }
        >
          <UploadCloud className="mr-2 h-4 w-4" />
          Tambah Foto
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-4 md:grid-cols-5">
        {fields.map((field, index) => (
          <div key={field.id} className="relative aspect-square">
            <Image
              src={field.url}
              alt={`Galeri ${index + 1}`}
              fill
              className="rounded-md object-cover"
            />
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute top-1 right-1 h-6 w-6"
              onClick={() => remove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {uploadQueue.map((item) => (
          <div key={item.preview} className="relative aspect-square">
            <Image
              src={item.preview}
              alt={`Uploading ${item.file.name}`}
              fill
              className="rounded-md object-cover opacity-50"
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/60 p-1 text-center">
              {item.status === "uploading" && (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              )}
              {item.status === "error" && (
                <p className="text-xs text-red-400">{item.errorMessage}</p>
              )}
              {item.status === "success" && (
                <p className="text-xs text-green-400">Berhasil</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFilesSelected}
        className="hidden"
        accept="image/jpeg, image/png, image/webp"
        multiple
      />
    </div>
  );
}
