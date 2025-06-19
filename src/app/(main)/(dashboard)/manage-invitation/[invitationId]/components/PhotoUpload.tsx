// File: src/app/(main)/(dashboard)/manage-invitation/[invitationId]/components/PhotoUpload.tsx

"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useFormContext } from "react-hook-form";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Loader2, UploadCloud, XCircle } from "lucide-react";
import { Label } from "~/components/ui/label";

interface PhotoUploadProps {
  fieldName: string;
  label: string;
  currentValue: string | null | undefined;
}

export function PhotoUpload({
  fieldName,
  label,
  currentValue,
}: PhotoUploadProps) {
  const { setValue } = useFormContext();
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentValue ?? null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createPresignedUrlMutation =
    api.storage.createPresignedUrl.useMutation();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setPreviewUrl(URL.createObjectURL(file)); // Tampilkan pratinjau lokal segera

    try {
      // 1. Dapatkan pre-signed URL dari server
      const { uploadUrl, publicUrl } =
        await createPresignedUrlMutation.mutateAsync({ fileType: file.type });

      // 2. Unggah file langsung ke Supabase Storage
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error("Gagal mengunggah file ke storage.");
      }

      // 3. Simpan URL publik ke state React Hook Form
      setValue(fieldName, publicUrl, { shouldDirty: true });
      setPreviewUrl(publicUrl); // Update pratinjau dengan URL permanen
      toast.success("Foto berhasil diunggah!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Terjadi kesalahan";
      toast.error(`Gagal mengunggah: ${errorMessage}`);
      setPreviewUrl(currentValue ?? null); // Kembalikan ke gambar semula jika gagal
    } finally {
      setIsLoading(false);
    }
  };

  const clearPhoto = () => {
    setValue(fieldName, null, { shouldDirty: true });
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2 flex items-center gap-4">
        <div className="relative h-24 w-24 rounded-md border-2 border-dashed">
          {previewUrl && (
            <Image
              src={previewUrl}
              alt="Pratinjau Foto"
              fill
              className="rounded-md object-cover"
            />
          )}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            Pilih Foto
          </Button>
          {previewUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={clearPhoto}
              disabled={isLoading}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Hapus Foto
            </Button>
          )}
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/jpeg, image/png, image/webp"
      />
    </div>
  );
}
