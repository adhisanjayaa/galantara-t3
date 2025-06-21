"use client";

import { ShoppingCart } from "lucide-react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { useUser, SignInButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet"; // Impor komponen Sheet
import { CartView } from "~/app/(main)/cart/components/CartView"; // Impor CartView

export function CartIndicator() {
  const { isSignedIn } = useUser();
  const pathname = usePathname();

  const { data: cart } = api.cart.getCart.useQuery(undefined, {
    enabled: !!isSignedIn,
  });

  const itemCount = cart?.items?.length ?? 0;

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal" fallbackRedirectUrl={pathname}>
        <Button variant="ghost" size="icon">
          <ShoppingCart className="h-5 w-5" />
        </Button>
      </SignInButton>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex h-full w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Keranjang Belanja ({itemCount})</SheetTitle>
        </SheetHeader>
        {/* Render CartView di dalam Sheet */}
        <CartView />
      </SheetContent>
    </Sheet>
  );
}
