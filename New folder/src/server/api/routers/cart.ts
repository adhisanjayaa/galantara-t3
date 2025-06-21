import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const cartRouter = createTRPCRouter({
  getCart: protectedProcedure.query(async ({ ctx }) => {
    const cart = await ctx.db.cart.findUnique({
      where: { userId: ctx.userId },
      include: {
        items: {
          include: {
            product: true,
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

    if (!cart) {
      return ctx.db.cart.create({
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
    }
    return cart;
  }),

  addItemToCart: protectedProcedure
    .input(
      z.object({
        productId: z.string().cuid(),
        quantity: z.number().min(1),
        subdomain: z.string().min(3).optional(),
        userDesignId: z.string().cuid().optional(),
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

      if (product.category === "DIGITAL" && !subdomain) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Subdomain harus diisi untuk undangan digital.",
        });
      }

      if (product.isDesignable && !userDesignId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Desain kustom harus disediakan untuk produk ini.",
        });
      }

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

      // [FIX] Logika baru untuk mencari item yang sudah ada
      // Cari item yang cocok berdasarkan productId DAN userDesignId
      const existingItem = await ctx.db.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: productId,
          userDesignId: userDesignId ?? null,
        },
      });

      // Jika item yang cocok sudah ada DAN bukan produk digital, update kuantitasnya
      if (existingItem && product.category !== "DIGITAL") {
        return ctx.db.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
        });
      }

      // Jika tidak, buat item baru di keranjang.
      // Ini akan menangani: produk digital, produk yang baru pertama kali ditambahkan,
      // atau produk fisik dengan desain kustom yang berbeda.
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
