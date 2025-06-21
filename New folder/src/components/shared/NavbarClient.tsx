// File: src/components/shared/NavbarClient.tsx

"use client";

import Link from "next/link";
import {
  UserButton,
  SignedIn,
  SignedOut,
  SignInButton,
  useAuth,
} from "@clerk/nextjs";
import { CartIndicator } from "./CartIndicator";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ShieldCheck, Mail } from "lucide-react";

/**
 * Ini adalah komponen utama Navbar yang berisi semua logika sisi klien,
 * seperti status login (Clerk) dan data keranjang belanja.
 * Nama fungsinya adalah 'Navbar' agar bisa diimpor dengan benar oleh
 * wrapper dynamic import.
 */
export function Navbar() {
  const { sessionClaims } = useAuth();
  const isAdmin = (sessionClaims as { role?: string })?.role === "admin";

  return (
    <header className="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 fixed top-0 left-0 z-50 w-full border-b backdrop-blur">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        {/* Logo dan Link Utama */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold">
            Galantara
          </Link>
          <nav className="hidden md:flex md:gap-4">
            <Link
              href="/themes"
              className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
            >
              Themes
            </Link>
          </nav>
        </div>

        {/* Ikon dan Profil */}
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            {isAdmin && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin" className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Mail className="h-5 w-5" />
                  <span className="sr-only">Buka menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/my-orders">My Orders</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-invitations">My Invitations</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-designs">My Designs</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <CartIndicator />

            <div className="cursor-pointer">
              <UserButton afterSignOutUrl="/" userProfileUrl="/profile" />
            </div>
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
