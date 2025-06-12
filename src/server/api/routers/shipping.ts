// File: src/server/api/routers/shipping.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { env } from "~/env.js";
import axios from "axios";

// Definisikan tipe untuk satu opsi ongkir dari Biteship
interface BiteshipRate {
  courier_code: string;
  courier_name: string;
  courier_service_code: string;
  courier_service_name: string;
  price: number;
}

// Definisikan tipe untuk keseluruhan objek respons dari Biteship Rates API
interface BiteshipRatesResponse {
  success: boolean;
  pricing: BiteshipRate[];
  // tambahkan properti lain jika perlu
}

export const shippingRouter = createTRPCRouter({
  getShippingRates: protectedProcedure
    .input(z.object({ destinationAddressId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;

      const destination = await ctx.db.address.findFirst({
        where: { id: input.destinationAddressId, userId },
      });
      if (!destination) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Alamat tujuan tidak ditemukan.",
        });
      }

      const cart = await ctx.db.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } },
      });
      if (!cart)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Keranjang tidak ditemukan.",
        });

      const totalWeight = cart.items
        .filter((item) => item.product.category === "PHYSICAL")
        .reduce(
          (sum, item) => sum + (item.product.weightGram ?? 0) * item.quantity,
          0,
        );

      if (totalWeight === 0) return [];

      try {
        // PERBAIKAN: Berikan tipe eksplisit pada pemanggilan axios
        const { data } = await axios.post<BiteshipRatesResponse>(
          "https://api.biteship.com/v1/rates/couriers",
          {
            origin_postal_code: env.ORIGIN_POSTAL_CODE,
            destination_postal_code: destination.postalCode,
            couriers: "jne,sicepat,jnt,gojek,grab",
            items: [
              {
                name: "Order",
                description: "Paket",
                value: 1,
                weight: totalWeight / 1000,
                quantity: 1,
              },
            ],
          },
          { headers: { Authorization: `Bearer ${env.BITESHIP_API_KEY}` } },
        );

        // Sekarang 'data.pricing' aman secara tipe
        return data.pricing;
      } catch (error) {
        console.error("Biteship API Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil ongkos kirim.",
        });
      }
    }),
});
