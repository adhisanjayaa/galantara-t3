"use client";

import { api } from "~/trpc/react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
// [DIHAPUS] Impor 'useDebouncedCallback' tidak lagi diperlukan
// import { useDebouncedCallback } from "use-debounce";
import { Loader2, Minus, Plus } from "lucide-react";

export function CartView() {
  const utils = api.useUtils();
  const { data: cart, isLoading } = api.cart.getCart.useQuery();

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
    onError: (_err, _newQuantity, context) => {
      if (context?.previousCart) {
        utils.cart.getCart.setData(undefined, context.previousCart);
      }
      toast.error("Gagal memperbarui kuantitas.");
    },
    onSettled: () => {
      void utils.cart.getCart.invalidate();
    },
  });

  // [DIHAPUS] Fungsi 'debouncedUpdateQuantity' tidak lagi digunakan

  const removeItemMutation = api.cart.removeItemFromCart.useMutation({
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
    onError: (_err, _deletedItem, context) => {
      if (context?.previousCart) {
        utils.cart.getCart.setData(undefined, context.previousCart);
      }
      toast.error("Gagal menghapus item.");
    },
    onSettled: () => {
      void utils.cart.getCart.invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
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
    <div className="flex h-full flex-col">
      <div className="flex-grow divide-y overflow-y-auto pr-6">
        {cart.items.map((item) => (
          <div key={item.id} className="flex items-start gap-4 py-4">
            <Image
              src={item.product.images[0] ?? ""}
              alt={item.product.name}
              width={64}
              height={64}
              className="aspect-square rounded-md object-cover"
            />
            <div className="flex-grow">
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
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={
                    item.quantity <= 1 ||
                    updateQuantityMutation.isPending ||
                    item.product.category === "DIGITAL"
                  }
                  onClick={() =>
                    updateQuantityMutation.mutate({
                      cartItemId: item.id,
                      quantity: item.quantity - 1,
                    })
                  }
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <input
                  type="number"
                  value={item.quantity}
                  // [FIX] Mengganti pemanggilan debounce dengan pemanggilan mutasi langsung
                  onChange={(e) => {
                    const newQuantity = Math.max(
                      1,
                      parseInt(e.target.value, 10) || 1,
                    );
                    updateQuantityMutation.mutate({
                      cartItemId: item.id,
                      quantity: newQuantity,
                    });
                  }}
                  className="h-8 w-12 border-y text-center font-medium"
                  disabled={item.product.category === "DIGITAL"}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={
                    updateQuantityMutation.isPending ||
                    item.product.category === "DIGITAL"
                  }
                  onClick={() =>
                    updateQuantityMutation.mutate({
                      cartItemId: item.id,
                      quantity: item.quantity + 1,
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  removeItemMutation.mutate({ cartItemId: item.id })
                }
                disabled={removeItemMutation.isPending}
              >
                Hapus
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-auto border-t p-6">
        <div className="flex justify-between font-medium">
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
