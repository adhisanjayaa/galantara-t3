// File: src/server/api/root.ts

import { invitationRouter } from "~/server/api/routers/invitation";
import { productRouter } from "~/server/api/routers/product";
import { orderRouter } from "~/server/api/routers/order";
import { cartRouter } from "~/server/api/routers/cart";
import { profileRouter } from "~/server/api/routers/profile";
import { clerkRouter } from "~/server/api/routers/clerk";
import { shippingRouter } from "~/server/api/routers/shipping";
import { adminRouter } from "~/server/api/routers/admin";
import { themeRouter } from "./routers/theme";
import { designRouter } from "~/server/api/routers/design";
import { storageRouter } from "~/server/api/routers/storage"; // <-- Impor router baru
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  invitation: invitationRouter,
  product: productRouter,
  order: orderRouter,
  cart: cartRouter,
  profile: profileRouter,
  clerk: clerkRouter,
  shipping: shippingRouter,
  admin: adminRouter,
  theme: themeRouter,
  design: designRouter,
  storage: storageRouter, // <-- Tambahkan router baru di sini
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
