import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";

// Definisikan rute mana saja yang HARUS dilindungi (memerlukan login)
const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/profile(.*)",
  "/cart(.*)",
  "/checkout(.*)",
  "/my-designs(.*)",
  "/my-invitations(.*)",
  "/manage-invitation(.*)",
]);

export default clerkMiddleware((auth, req: NextRequest) => {
  // [FIX] Jika rute saat ini adalah rute yang dilindungi, panggil auth.protect()
  if (isProtectedRoute(req)) {
    auth.protect();
  }
});

export const config = {
  matcher: [
    // Jalankan middleware pada semua rute kecuali untuk file statis internal Next.js
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
