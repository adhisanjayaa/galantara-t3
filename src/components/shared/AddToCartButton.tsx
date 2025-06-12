// File: src/components/shared/AddToCartButton.tsx
"use client";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";

export function AddToCartButton({ productId }: { productId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn } = useUser();

  const addToCartMutation = api.cart.addItemToCart.useMutation({
    onSuccess: () => {
      toast.success("Produk berhasil ditambahkan ke keranjang!");
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Gagal menambahkan: ${error.message}`);
    },
  });

  const handleAddToCart = () => {
    addToCartMutation.mutate({ productId, quantity: 1 });
  };

  if (!isSignedIn) {
    return (
      // PERBAIKAN FINAL: Gunakan prop 'fallbackRedirectUrl' sesuai dokumentasi.
      <SignInButton mode="modal" fallbackRedirectUrl={pathname}>
        <Button size="lg" className="w-full">
          Tambah ke Keranjang
        </Button>
      </SignInButton>
    );
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={addToCartMutation.isPending}
      size="lg"
      className="w-full"
    >
      {addToCartMutation.isPending ? "Menambahkan..." : "Tambah ke Keranjang"}
    </Button>
  );
}
