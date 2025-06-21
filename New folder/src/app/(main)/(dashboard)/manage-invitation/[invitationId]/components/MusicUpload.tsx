// File: src/app/(main)/(dashboard)/manage-invitation/[invitationId]/components/MusicUpload.tsx

"use client";

import { useState, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Loader2, Music, UploadCloud, XCircle } from "lucide-react";

export function MusicUpload() {
  const { setValue, watch } = useFormContext();
  const fieldName = "background_music_url";
  const currentValue = watch(fieldName);

  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createPresignedUrlMutation =
    api.storage.createPresignedUrl.useMutation();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);

    try {
      const { uploadUrl, publicUrl } =
        await createPresignedUrlMutation.mutateAsync({ fileType: file.type });

      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      setValue(fieldName, publicUrl, { shouldDirty: true });
      toast.success("Musik berhasil diunggah!");
    } catch (error) {
      toast.error(
        `Gagal mengunggah: ${error instanceof Error ? error.message : "Terjadi kesalahan"}`,
      );
      setFileName(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMusic = () => {
    setValue(fieldName, null, { shouldDirty: true });
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="text-lg font-semibold">Musik Latar</h3>
      <div className="flex items-center gap-4">
        {currentValue && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Music className="h-5 w-5" />
            <p className="font-medium">Musik saat ini telah terunggah.</p>
          </div>
        )}
        {!currentValue && fileName && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Music className="h-5 w-5" />
            <p className="font-medium">{fileName}</p>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="mr-2 h-4 w-4" />
          )}
          {currentValue ? "Ganti Musik" : "Pilih Musik"}
        </Button>
        {currentValue && (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={clearMusic}
            disabled={isLoading}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Hapus
          </Button>
        )}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="audio/mpeg, audio/mp3"
      />
    </div>
  );
}
