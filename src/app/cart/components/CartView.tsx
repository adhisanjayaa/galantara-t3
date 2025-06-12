// File: src/app/cart/components/CartView.tsx
"use client";

import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce"; // <-- Impor hook untuk debounce callback

type CartData = RouterOutputs["cart"]["getCart"];

export function CartView({ initialCart }: { initialCart: CartData }) {
  const utils = api.useUtils();

  const { data: cart } = api.cart.getCart.useQuery(undefined, {
    initialData: initialCart,
  });

  // 1. Definisikan kembali mutasi dengan logika Optimistic Update
  const updateQuantityMutation = api.cart.updateItemQuantity.useMutation({
    onMutate: async (newQuantityUpdate) => {
      await utils.cart.getCart.cancel();
      const previousCart = utils.cart.getCart.getData();
      utils.cart.getCart.setData(undefined, (oldCart) => {
        if (!oldCart) return previousCart;
        return {
          ...oldCart,
          items: oldCart.items.map((item) =>
            item.id === newQuantityUpdate.cartItemId
              ? { ...item, quantity: newQuantityUpdate.quantity }
              : item,
          ),
        };
      });
      return { previousCart };
    },
    onError: (err, newQuantity, context) => {
      if (context?.previousCart) {
        utils.cart.getCart.setData(undefined, context.previousCart);
      }
      toast.error("Gagal memperbarui kuantitas.");
    },
    onSettled: () => {
      void utils.cart.getCart.invalidate();
    },
  });

  // 2. Buat fungsi yang di-debounce yang akan memanggil mutasi
  const debouncedUpdateQuantity = useDebouncedCallback(
    (vars: { cartItemId: string; quantity: number }) => {
      updateQuantityMutation.mutate(vars);
    },
    500, // Tunggu 500ms setelah pengguna berhenti mengetik
  );

  const removeItemMutation = api.cart.removeItemFromCart.useMutation({
    // Optimistic update untuk menghapus item
    onMutate: async (deletedItem) => {
      await utils.cart.getCart.cancel();
      const previousCart = utils.cart.getCart.getData();
      utils.cart.getCart.setData(undefined, (oldCart) => {
        if (!oldCart) return previousCart;
        return {
          ...oldCart,
          items: oldCart.items.filter(
            (item) => item.id !== deletedItem.cartItemId,
          ),
        };
      });
      return { previousCart };
    },
    onSuccess: () => {
      toast.success("Item berhasil dihapus.");
    },
    onError: (err, deletedItem, context) => {
      if (context?.previousCart) {
        utils.cart.getCart.setData(undefined, context.previousCart);
      }
      toast.error("Gagal menghapus item.");
    },
    onSettled: () => {
      void utils.cart.getCart.invalidate();
    },
  });

  if (!cart || cart.items.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed py-16 text-center">
        <h3 className="text-xl font-semibold">Keranjang Anda Kosong</h3>
        <Button asChild className="mt-4">
          <Link href="/themes">Mulai Belanja</Link>
        </Button>
      </div>
    );
  }

  const subtotal = cart.items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="divide-y rounded-lg border">
        {cart.items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col items-stretch gap-4 p-4 sm:flex-row sm:items-center"
          >
            <Image
              src={item.product.images[0] ?? ""}
              alt={item.product.name}
              width={80}
              height={80}
              className="aspect-square w-full rounded-md object-cover sm:h-20 sm:w-20"
            />
            <div className="flex-grow">
              {/* --- Tampilkan nama desain kustom jika ada --- */}
              {item.userDesign ? (
                <>
                  <p className="font-medium">{item.userDesign.name}</p>
                  <p className="text-muted-foreground text-sm">
                    Template: {item.product.name}
                  </p>
                </>
              ) : (
                <p className="font-medium">{item.product.name}</p>
              )}
              {item.product.category === "DIGITAL" && item.subdomain && (
                <p className="text-muted-foreground font-mono text-sm">
                  {item.subdomain}.yourdomain.com
                </p>
              )}
              <p className="text-muted-foreground mt-1 text-sm">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(item.product.price)}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2">
              <input
                type="number"
                // 3. Gunakan defaultValue agar input tidak "terkunci" oleh re-render
                defaultValue={item.quantity}
                onChange={(e) =>
                  debouncedUpdateQuantity({
                    cartItemId: item.id,
                    quantity: Math.max(1, Number(e.target.value)),
                  })
                }
                className="border-input w-16 rounded-md border p-2 text-center disabled:cursor-not-allowed disabled:opacity-50"
                min="1"
                // Produk yang didesain atau digital kuantitasnya 1
                disabled={
                  item.product.category === "DIGITAL" || !!item.userDesignId
                }
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  removeItemMutation.mutate({ cartItemId: item.id })
                }
                disabled={removeItemMutation.isPending}
              >
                {removeItemMutation.isPending ? "..." : "Hapus"}
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-card rounded-lg border p-6">
        <div className="flex justify-between text-lg font-medium">
          <p>Subtotal</p>
          <p>
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
            }).format(subtotal)}
          </p>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          Pajak dan ongkos kirim akan dihitung saat checkout.
        </p>
        <Button asChild size="lg" className="mt-6 w-full">
          <Link href="/checkout">Lanjut ke Checkout</Link>
        </Button>
      </div>
    </div>
  );
}
