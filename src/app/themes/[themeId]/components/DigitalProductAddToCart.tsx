// File: src/app/themes/[themeId]/components/DigitalProductAddToCart.tsx
"use client";

import { useState } from "react";
import type { Product } from "@prisma/client";
import { useDebounce } from "use-debounce";
import { useRouter, usePathname } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { useUser, SignInButton } from "@clerk/nextjs";

export function DigitalProductAddToCart({ product }: { product: Product }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const [subdomain, setSubdomain] = useState("");
  const [debouncedSubdomain] = useDebounce(subdomain, 500);

  const { data, isLoading } =
    api.invitation.checkSubdomainAvailability.useQuery(
      { subdomain: debouncedSubdomain },
      { enabled: debouncedSubdomain.length >= 3, retry: false },
    );

  const addToCartMutation = api.cart.addItemToCart.useMutation({
    onSuccess: () => {
      toast.success("Undangan berhasil ditambahkan ke keranjang!");
      router.refresh();
    },
    // --- PERBAIKAN DI SINI ---
    // Tambahkan kurung kurawal {} untuk memastikan fungsi tidak mengembalikan nilai.
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAddToCart = () => {
    addToCartMutation.mutate({ productId: product.id, quantity: 1, subdomain });
  };

  const isAvailable = data?.available === true;

  return (
    <div className="space-y-4">
      <label htmlFor="subdomain" className="font-semibold">
        Pilih Subdomain Anda
      </label>
      <div className="flex items-center">
        <input
          id="subdomain"
          value={subdomain}
          onChange={(e) =>
            setSubdomain(
              e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
            )
          }
          className="ring-offset-background focus-visible:ring-ring w-full rounded-l-md border p-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          placeholder="budi-dan-ani"
        />
        <span className="inline-block rounded-r-md border-y border-r bg-gray-100 p-2 text-sm">
          .yourdomain.com
        </span>
      </div>
      {debouncedSubdomain.length >= 3 && (
        <p
          className={`h-5 text-sm ${isLoading ? "text-blue-500" : isAvailable ? "text-green-500" : "text-red-500"}`}
        >
          {isLoading
            ? "Mengecek..."
            : isAvailable
              ? "Subdomain tersedia!"
              : "Subdomain sudah digunakan atau tidak valid."}
        </p>
      )}

      {!isSignedIn ? (
        <SignInButton mode="modal" fallbackRedirectUrl={pathname}>
          <Button disabled={!isAvailable} className="w-full" size="lg">
            Tambah ke Keranjang
          </Button>
        </SignInButton>
      ) : (
        <Button
          onClick={handleAddToCart}
          disabled={!isAvailable || addToCartMutation.isPending}
          className="w-full"
          size="lg"
        >
          {addToCartMutation.isPending
            ? "Menambahkan..."
            : "Tambah ke Keranjang"}
        </Button>
      )}
    </div>
  );
}
