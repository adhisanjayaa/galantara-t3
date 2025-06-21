import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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

export default clerkMiddleware((auth, req) => {
  // Jika rute saat ini adalah rute yang dilindungi, panggil auth.protect()
  if (isProtectedRoute(req)) {
    auth.protect();
  }
});

export const config = {
  matcher: [
    // Jalankan middleware pada semua rute kecuali untuk yang spesifik di bawah ini
    "/((?!_next/image|_next/static|favicon.ico|robots.txt).*)",
    // Catatan: '/api/(.*)' dan '/trpc/(.*)' juga secara implisit dikecualikan di sini
  ],
};
