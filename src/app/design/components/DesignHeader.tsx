"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import type { Canvas } from "fabric";
// [FIX] Hapus 'Eye' yang tidak digunakan
import { Save, ShoppingCart, Loader2 } from "lucide-react";

interface DesignHeaderProps {
  designId: string | null;
  initialName: string;
  productId: string;
  canvasInstance: Canvas | null;
}

export default function DesignHeader({
  designId: initialDesignId,
  initialName,
  productId,
  canvasInstance,
}: DesignHeaderProps) {
  const router = useRouter();
  const utils = api.useUtils();

  const [designId, setDesignId] = useState(initialDesignId);
  const [designName, setDesignName] = useState(initialName);

  const saveMutation = api.design.createOrUpdateDesign.useMutation({
    onSuccess: (data) => {
      toast.success("Desain berhasil disimpan!");
      if (!designId) {
        setDesignId(data.id);
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
    // [FIX] Gunakan 'unknown'
    const designData: unknown = canvasInstance.toJSON();
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
    // [FIX] Gunakan 'unknown'
    const designData: unknown = canvasInstance.toJSON();

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
    <div className="bg-background flex h-16 items-center justify-between border-b px-4">
      <div></div>
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
        >
          {saveMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Simpan
        </Button>
        <Button
          onClick={handleAddToCart}
          size="sm"
          disabled={addToCartMutation.isPending || saveMutation.isPending}
        >
          {addToCartMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ShoppingCart className="mr-2 h-4 w-4" />
          )}
          Tambah ke Keranjang
        </Button>
      </div>
    </div>
  );
}
