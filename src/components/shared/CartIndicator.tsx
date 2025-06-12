// File: src/components/shared/CartIndicator.tsx
"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { useUser, SignInButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

export function CartIndicator() {
  const { isSignedIn } = useUser();
  const pathname = usePathname();

  const { data: cart } = api.cart.getCart.useQuery(undefined, {
    enabled: !!isSignedIn,
  });

  const itemCount = cart?.items?.length ?? 0;

  if (!isSignedIn) {
    return (
      // PERBAIKAN FINAL: Gunakan prop 'fallbackRedirectUrl' sesuai dokumentasi.
      <SignInButton mode="modal" fallbackRedirectUrl={pathname}>
        <Button variant="ghost" size="icon">
          <ShoppingCart className="h-5 w-5" />
        </Button>
      </SignInButton>
    );
  }

  return (
    <Button asChild variant="ghost" size="icon">
      <Link href="/cart" className="relative">
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {itemCount}
          </span>
        )}
      </Link>
    </Button>
  );
}
