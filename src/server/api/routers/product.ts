// File: src/server/api/routers/product.ts

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { ProductCategory } from "@prisma/client";

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
    }),

  /**
   * Mengambil detail satu produk/tema berdasarkan ID-nya.
   */
  getProductById: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.product.findUnique({
        where: {
          id: input.id,
        },
        // [PERBAIKAN] Sertakan data dari relasi designTemplate
        // agar data JSON-nya bisa diakses di frontend.
        include: {
          designTemplate: true,
        },
      });
    }),
});
