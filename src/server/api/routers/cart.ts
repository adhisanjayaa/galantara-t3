// File: src/server/api/routers/cart.ts

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const cartRouter = createTRPCRouter({
  /**
   * Mengambil isi keranjang belanja pengguna yang sedang login.
   */
  getCart: protectedProcedure.query(async ({ ctx }) => {
    const cart = await ctx.db.cart.findUnique({
      where: { userId: ctx.userId },
      include: {
        items: {
          include: {
            product: true,
            // [NEW] Sertakan detail desain kustom jika ada
            userDesign: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // Jika user belum punya cart, buatkan yang baru
    if (!cart) {
      const newCart = await ctx.db.cart.create({
        data: { userId: ctx.userId },
        include: {
          items: {
            include: {
              product: true,
              userDesign: true,
            },
          },
        },
      });
      return newCart;
    }
    return cart;
  }),

  /**
   * Menambahkan item ke keranjang.
   */
  addItemToCart: protectedProcedure
    .input(
      z.object({
        productId: z.string().cuid(),
        quantity: z.number().min(1),
        subdomain: z.string().min(3).optional(),
        userDesignId: z.string().cuid().optional(), // Input untuk desain kustom
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { productId, quantity, subdomain, userDesignId } = input;

      const product = await ctx.db.product.findUnique({
        where: { id: productId },
      });
      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Produk tidak ditemukan.",
        });
      }

      // Validasi untuk undangan digital
      if (product.category === "DIGITAL" && !subdomain) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Subdomain harus diisi untuk undangan digital.",
        });
      }

      // Validasi untuk produk yang dapat didesain
      if (product.isDesignable && !userDesignId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Desain kustom harus disediakan untuk produk ini.",
        });
      }

      // Validasi ketersediaan subdomain jika ada
      if (subdomain) {
        const lowerCaseSubdomain = subdomain.toLowerCase();
        const existingInvitation = await ctx.db.userInvitation.findUnique({
          where: { subdomain: lowerCaseSubdomain },
        });
        const pendingOrderItem = await ctx.db.orderItem.findFirst({
          where: {
            subdomain: lowerCaseSubdomain,
            order: { status: { in: ["PENDING", "PAID"] } },
          },
        });
        const itemInCart = await ctx.db.cartItem.findFirst({
          where: { subdomain: lowerCaseSubdomain },
        });

        if (existingInvitation || pendingOrderItem || itemInCart) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Subdomain "${subdomain}" sudah digunakan.`,
          });
        }
      }

      const cart = await ctx.db.cart.upsert({
        where: { userId: ctx.userId },
        create: { userId: ctx.userId },
        update: {},
      });

      // Untuk produk fisik yang TIDAK dapat didesain, kita akumulasi kuantitasnya
      if (product.category === "PHYSICAL" && !product.isDesignable) {
        const existingItem = await ctx.db.cartItem.findFirst({
          where: { cartId: cart.id, productId, userDesignId: null },
        });
        if (existingItem) {
          return ctx.db.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + quantity },
          });
        }
      }

      // Buat item baru untuk produk digital, produk yang didesain, atau produk fisik yang belum ada
      return ctx.db.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          subdomain: subdomain ? subdomain.toLowerCase() : null,
          userDesignId: userDesignId ?? null,
        },
      });
    }),

  /**
   * Menghapus item dari keranjang.
   */
  removeItemFromCart: protectedProcedure
    .input(z.object({ cartItemId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.cartItem.findFirst({
        where: { id: input.cartItemId, cart: { userId: ctx.userId } },
      });
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item tidak ditemukan.",
        });
      }
      return ctx.db.cartItem.delete({
        where: { id: input.cartItemId },
      });
    }),

  /**
   * Mengupdate kuantitas item di keranjang.
   */
  updateItemQuantity: protectedProcedure
    .input(
      z.object({ cartItemId: z.string().cuid(), quantity: z.number().min(1) }),
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.cartItem.findFirst({
        where: { id: input.cartItemId, cart: { userId: ctx.userId } },
      });
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item tidak ditemukan.",
        });
      }
      return ctx.db.cartItem.update({
        where: { id: input.cartItemId },
        data: { quantity: input.quantity },
      });
    }),
});
