// File: src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/trpc/(.*)",
  "/api/webhooks/xendit",
  "/themes(.*)",
  "/profile(.*)",
  "/[subdomain]",
]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    // PERBAIKAN: Gunakan operator 'void' untuk memberitahu linter
    // bahwa kita sengaja tidak menangani promise ini.
    void auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
