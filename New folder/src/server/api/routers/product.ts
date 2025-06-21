// File: src/server/api/routers/product.ts

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { ProductCategory } from "@prisma/client";
// [FIX] Impor unstable_cache
import { unstable_cache } from "next/cache";

export const productRouter = createTRPCRouter({
  /**
   * Mengambil daftar produk dengan filter opsional.
   */
  getProducts: publicProcedure
    .input(
      z.object({
        category: z.nativeEnum(ProductCategory).optional(),
        limit: z.number().min(1).max(100).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // [FIX] Bungkus query database dengan unstable_cache
      // Ini akan menyimpan hasil query selama 60 detik.
      return await unstable_cache(
        async () => {
          return ctx.db.product.findMany({
            where: {
              isActive: true,
              category: input.category,
            },
            take: input.limit,
            orderBy: {
              name: "asc",
            },
          });
        },
        // Buat kunci cache yang unik berdasarkan input
        [`products-${input.category ?? "all"}-${input.limit ?? "none"}`],
        {
          revalidate: 60, // Detik
        },
      )();
    }),

  /**
   * Mengambil detail satu produk/tema berdasarkan ID-nya.
   */
  getProductById: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      // [FIX] Terapkan cache di sini juga untuk halaman detail produk
      return await unstable_cache(
        async () => {
          return ctx.db.product.findUnique({
            where: {
              id: input.id,
            },
            include: {
              designTemplate: true,
            },
          });
        },
        [`product-${input.id}`], // Kunci cache unik per produk
        {
          revalidate: 60, // Detik
        },
      )();
    }),
});
