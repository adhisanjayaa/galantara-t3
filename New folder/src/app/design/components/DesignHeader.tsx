"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import type { Canvas } from "fabric";
import {
  Save,
  ShoppingCart,
  Loader2,
  Redo2,
  Undo2,
  ArrowLeft, // <-- Import ikon baru
} from "lucide-react";
import { Separator } from "~/components/ui/separator";

interface DesignHeaderProps {
  designId: string | null;
  initialName: string;
  productId: string;
  canvasInstance: Canvas | null;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  getPagesForSave: () => { name: string; data: Record<string, unknown> }[];
}

export default function DesignHeader({
  designId: initialDesignId,
  initialName,
  productId,
  canvasInstance,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  getPagesForSave,
}: DesignHeaderProps) {
  const router = useRouter(); // <-- Gunakan router untuk navigasi
  const utils = api.useUtils();

  const [designId, setDesignId] = useState(initialDesignId);
  const [designName, setDesignName] = useState(initialName);

  const saveMutation = api.design.createOrUpdateDesign.useMutation({
    onSuccess: (data) => {
      toast.success("Desain berhasil disimpan!");
      if (!designId) {
        setDesignId(data.id);
        // Gunakan router.replace agar tidak menambah history browser
        router.replace(`/design/${data.id}`);
      }
    },
    onError: (error) => {
      toast.error(`Gagal menyimpan: ${error.message}`);
    },
  });

  const addToCartMutation = api.cart.addItemToCart.useMutation({
    onSuccess: () => {
      toast.success("Berhasil ditambahkan ke keranjang!");
      void utils.cart.getCart.invalidate();
    },
    onError: (error) => {
      toast.error(`Gagal menambahkan: ${error.message}`);
    },
  });

  const handleSave = () => {
    if (!canvasInstance || !designName) {
      toast.error("Nama desain tidak boleh kosong.");
      return;
    }
    // --- PERUBAHAN DI SINI ---
    const designData = getPagesForSave();
    saveMutation.mutate({
      id: designId ?? undefined,
      name: designName,
      productId,
      designData,
    });
  };

  const handleAddToCart = async () => {
    if (!canvasInstance || !designName) {
      toast.error("Nama desain tidak boleh kosong.");
      return;
    }
    const designData = getPagesForSave();

    const savedDesign = await saveMutation.mutateAsync({
      id: designId ?? undefined,
      name: designName,
      productId,
      designData,
    });

    if (savedDesign) {
      addToCartMutation.mutate({
        productId: savedDesign.productId,
        userDesignId: savedDesign.id,
        quantity: 1,
      });
    }
  };

  return (
    <div className="bg-background flex h-16 items-center justify-between border-b px-2 sm:px-4">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <Button
          variant="ghost"
          size="icon"
          onClick={onUndo}
          disabled={!canUndo}
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRedo}
          disabled={!canRedo}
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-grow text-center">
        <Input
          placeholder="Nama Desain Anda"
          type="text"
          className="mx-auto max-w-xs border-none text-center text-lg font-semibold shadow-none focus-visible:ring-0"
          value={designName}
          onChange={(e) => setDesignName(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={handleSave}
          variant="outline"
          size="sm"
          disabled={saveMutation.isPending}
          className="px-3"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4 sm:mr-2" />
          )}
          <span className="hidden sm:inline">Simpan</span>
        </Button>
        <Button
          onClick={handleAddToCart}
          size="sm"
          disabled={addToCartMutation.isPending || saveMutation.isPending}
          className="px-3"
        >
          {addToCartMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShoppingCart className="h-4 w-4 sm:mr-2" />
          )}
          <span className="hidden sm:inline">Tambah ke Keranjang</span>
        </Button>
      </div>
    </div>
  );
}
