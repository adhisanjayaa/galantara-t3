// File: src/app/admin/fonts/components/FontUploadModal.tsx
"use client";

import { useState, useEffect, useRef } from "react"; // 1. Impor useRef
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface FontUploadModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function FontUploadModal({
  isOpen,
  onOpenChange,
}: FontUploadModalProps) {
  const utils = api.useUtils();

  // State untuk data form (metadata)
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("400");
  const [style, setStyle] = useState("normal");

  // 2. Gunakan useRef untuk input file, bukan useState
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isUploading, setIsUploading] = useState(false);

  const createPresignedUrlMutation =
    api.storage.createPresignedUrl.useMutation();
  const addFontMutation = api.admin.addCustomFont.useMutation();

  // Reset form saat modal ditutup
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setWeight("400");
      setStyle("normal");
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset input file
      }
      setIsUploading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 4. Ambil file langsung dari ref pada saat submit
    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      toast.error("Silakan pilih file font untuk diunggah.");
      return;
    }
    toast.info(`Tipe file terdeteksi: '${file.type}'`);

    setIsUploading(true);
    toast.info("Mempersiapkan unggahan...");

    try {
      const { uploadUrl, publicUrl } =
        await createPresignedUrlMutation.mutateAsync({
          fileType: file.type, // Sekarang dijamin memiliki file.type
        });

      toast.info("Mengunggah file font...");

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error("Gagal mengunggah file ke storage.");
      }

      toast.info("Menyimpan data font...");

      await addFontMutation.mutateAsync({
        name,
        weight,
        style,
        url: publicUrl,
      });

      toast.success("Font kustom berhasil ditambahkan!");
      void utils.admin.getCustomFonts.invalidate();
      onOpenChange(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Terjadi kesalahan";
      toast.error(`Gagal: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Unggah Font Kustom Baru</DialogTitle>
            <DialogDescription>
              Pilih file font (.woff, .woff2, .ttf) dan isi detailnya.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="font-name" className="text-right">
                Nama Font
              </Label>
              <Input
                id="font-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
                placeholder="cth. Poppins"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="font-weight" className="text-right">
                Berat
              </Label>
              <Input
                id="font-weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="col-span-3"
                required
                placeholder="cth. 400 atau 700"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="font-style" className="text-right">
                Gaya
              </Label>
              <Input
                id="font-style"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="col-span-3"
                required
                placeholder="cth. normal atau italic"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="font-file" className="text-right">
                File Font
              </Label>
              {/* 3. Hubungkan ref ke input dan hapus onChange */}
              <Input
                id="font-file"
                type="file"
                ref={fileInputRef}
                className="col-span-3"
                required
                accept=".woff,.woff2,.ttf"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isUploading ? "Mengunggah..." : "Simpan Font"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
