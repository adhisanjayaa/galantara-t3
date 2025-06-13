// File: src/middleware.ts
import {
  authMiddleware,
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";

// Definisikan rute yang sepenuhnya publik dan tidak memerlukan pengecekan autentikasi
const isPublicRoute = createRouteMatcher([
  "/",
  "/themes(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/xendit", // Webhook harus selalu publik
]);

// Definisikan rute yang memerlukan login untuk diakses
const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/profile(.*)",
  "/cart(.*)",
  "/checkout(.*)",
  "/my-designs(.*)",
  "/my-invitations(.*)",
  "/manage-invitation(.*)",
]);

export default authMiddleware({
  // Jadikan semua rute publik kecuali yang secara eksplisit kita lindungi
  publicRoutes: (req) => !isProtectedRoute(req),
});

export const config = {
  matcher: [
    // Jalankan middleware pada semua rute kecuali untuk file statis internal Next.js
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
