// File: src/server/api/routers/order.ts

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { env } from "~/env.js";
import axios from "axios";

// Definisikan tipe untuk respons dari Xendit Invoice API
interface XenditInvoiceResponse {
  id: string;
  invoice_url: string;
}

export const orderRouter = createTRPCRouter({
  createOrderFromCart: protectedProcedure
    .input(
      z.object({
        customerName: z.string().min(1, "Nama pelanggan harus diisi."),
        addressId: z.string().cuid().optional(),
        shippingProvider: z.string().optional(),
        shippingCost: z.number().optional(),
        courierCompany: z.string().optional(),
        courierService: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, user } = ctx;

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User tidak ditemukan.",
        });
      }

      const cart = await ctx.db.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } },
      });

      if (!cart || cart.items.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Keranjang belanja Anda kosong.",
        });
      }

      const subtotal = cart.items.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0,
      );
      const totalAmount = subtotal + (input.shippingCost ?? 0);

      // Logika untuk mendeteksi produk fisik (sudah ada dan benar)
      const hasPhysicalProduct = cart.items.some(
        (item) => item.product.category === "PHYSICAL",
      );

      let shippingAddressString: string | null = null;
      if (hasPhysicalProduct) {
        if (!input.addressId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Alamat pengiriman wajib dipilih.",
          });
        }
        const address = await ctx.db.address.findFirst({
          where: { id: input.addressId, userId: ctx.userId },
        });
        if (!address) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Alamat yang dipilih tidak valid.",
          });
        }
        shippingAddressString = `${address.street}, ${address.city}, ${address.province} ${address.postalCode}, ${address.country}`;
      }

      const newOrder = await ctx.db.$transaction(async (prisma) => {
        const order = await prisma.order.create({
          data: {
            userId,
            totalAmount,
            customerName: input.customerName,
            shippingAddress: shippingAddressString,
            shippingProvider: input.shippingProvider,
            shippingCost: input.shippingCost,
            status: "PENDING",
            courierCompany: input.courierCompany,
            courierService: input.courierService,
            shippingStatus: hasPhysicalProduct ? "PROCESSING" : undefined,
          },
        });

        await prisma.orderItem.createMany({
          data: cart.items.map((item) => ({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
            productName: item.product.name,
            subdomain: item.subdomain,
            userDesignId: item.userDesignId,
          })),
        });

        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        return order;
      });

      // ... (sisa logika untuk membuat invoice Xendit)
      try {
        const authToken = Buffer.from(`${env.XENDIT_SECRET_KEY}:`).toString(
          "base64",
        );
        const { data } = await axios.post<XenditInvoiceResponse>(
          "https://api.xendit.co/v2/invoices",
          {
            external_id: newOrder.id,
            amount: totalAmount,
            payer_email: user.primaryEmailAddress?.emailAddress,
            description: `Pembayaran untuk Pesanan #${newOrder.id}`,
            success_redirect_url: `${env.NEXT_PUBLIC_BASE_URL}/my-orders`,
          },
          {
            headers: {
              Authorization: `Basic ${authToken}`,
              "Content-Type": "application/json",
            },
          },
        );
        if (!data.invoice_url) {
          throw new Error("Xendit tidak mengembalikan URL invoice.");
        }
        return { orderId: newOrder.id, paymentUrl: data.invoice_url };
      } catch (error) {
        console.error("Gagal membuat invoice Xendit:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memproses pembayaran.",
        });
      }
    }),

  getMyOrders: protectedProcedure.query(({ ctx }) => {
    return ctx.db.order.findMany({
      where: {
        userId: ctx.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        items: {
          select: {
            productName: true,
            quantity: true,
          },
        },
      },
    });
  }),

  getTrackingHistory: protectedProcedure
    .input(z.object({ trackingId: z.string() }))
    .query(async ({ input }) => {
      if (!input.trackingId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nomor resi tidak tersedia untuk dilacak.",
        });
      }

      try {
        const { data } = await axios.get(
          `https://api.biteship.com/v1/trackings/${input.trackingId}`,
          {
            headers: { Authorization: `Bearer ${env.BITESHIP_API_KEY}` },
          },
        );

        if (!data.success) {
          throw new Error(data.error ?? "Gagal melacak pengiriman di Biteship");
        }

        // Kembalikan riwayat pelacakan
        return data.history;
      } catch (error) {
        console.error("Biteship Tracking API Error:", error);
        // Jangan lemparkan error jika resi belum ditemukan, kembalikan array kosong saja.
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return [];
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data pelacakan dari Biteship.",
        });
      }
    }),

  getOrderDetails: protectedProcedure
    .input(z.object({ orderId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findFirst({
        where: {
          id: input.orderId,
          userId: ctx.userId, // Pastikan pengguna hanya bisa melihat pesanannya sendiri
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pesanan tidak ditemukan.",
        });
      }
      return order;
    }),
});
