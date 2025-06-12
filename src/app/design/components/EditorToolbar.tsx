// File: src/app/design/components/EditorToolbar.tsx

"use client";

import { Button } from "~/components/ui/button";
// [FIX] Kita tidak lagi perlu mengimpor tipe 'Image' secara terpisah
import { FabricImage, IText, Rect, Circle } from "fabric";
import type { Canvas } from "fabric";
import {
  Type,
  Square,
  Circle as CircleIcon,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { useRef, useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";

interface EditorToolbarProps {
  canvas: Canvas | null;
}

export default function EditorToolbar({ canvas }: EditorToolbarProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const createPresignedUrlMutation =
    api.storage.createPresignedUrl.useMutation();

  const addText = () => {
    // ... (fungsi ini tidak berubah)
    if (!canvas) return;
    const text = new IText("Teks Anda", {
      left: 100,
      top: 100,
      fontSize: 24,
      fill: "#000000",
      padding: 10,
      editable: true,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const addRectangle = () => {
    // ... (fungsi ini tidak berubah)
    if (!canvas) return;
    const rect = new Rect({
      left: 150,
      top: 150,
      width: 100,
      height: 100,
      fill: "#cccccc",
    });
    canvas.add(rect);
    canvas.renderAll();
  };

  const addCircle = () => {
    // ... (fungsi ini tidak berubah)
    if (!canvas) return;
    const circle = new Circle({
      left: 200,
      top: 200,
      radius: 50,
      fill: "#cccccc",
    });
    canvas.add(circle);
    canvas.renderAll();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvas) return;

    setIsUploading(true);
    toast.info("Mempersiapkan unggahan...");

    try {
      // 1. Dapatkan pre-signed URL dari backend
      const { uploadUrl, publicUrl } =
        await createPresignedUrlMutation.mutateAsync({
          fileType: file.type,
        });

      toast.info("Mengunggah gambar...");

      // 2. Unggah file langsung ke Supabase Storage
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Unggahan file gagal.");
      }

      // --- PERBAIKAN UTAMA DI SINI ---
      // Gunakan async/await untuk memuat gambar. Ini lebih modern dan aman secara tipe.
      const img = await FabricImage.fromURL(publicUrl);

      // Setelah gambar dimuat, kita bisa memanipulasinya
      img.scaleToWidth(200);
      canvas.add(img);
      canvas.centerObject(img);
      canvas.renderAll();
      toast.success("Gambar berhasil ditambahkan!");
      // -----------------------------
    } catch (error) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "Kesalahan tidak diketahui.";
      toast.error(`Gagal: ${errorMessage}`);
    } finally {
      setIsUploading(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="bg-background flex w-full flex-col gap-2 p-2">
      <h3 className="px-2 font-semibold">Tambah Elemen</h3>
      <Button variant="outline" className="justify-start" onClick={addText}>
        <Type className="mr-2 h-4 w-4" /> Teks
      </Button>
      <Button
        variant="outline"
        className="justify-start"
        onClick={addRectangle}
      >
        <Square className="mr-2 h-4 w-4" /> Persegi
      </Button>
      <Button variant="outline" className="justify-start" onClick={addCircle}>
        <CircleIcon className="mr-2 h-4 w-4" /> Lingkaran
      </Button>
      <Button
        variant="outline"
        className="justify-start"
        onClick={() => imageInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ImageIcon className="mr-2 h-4 w-4" />
        )}
        Gambar
      </Button>
      <input
        type="file"
        accept="image/*"
        ref={imageInputRef}
        className="hidden"
        onChange={handleImageUpload}
        disabled={isUploading}
      />
    </div>
  );
}
