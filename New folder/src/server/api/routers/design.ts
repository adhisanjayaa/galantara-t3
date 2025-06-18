import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const designRouter = createTRPCRouter({
  /**
   * Mengambil detail sebuah desain berdasarkan ID, milik pengguna yang sedang login.
   * Termasuk data produk dan template desain yang terkait.
   */
  getDesignById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const design = await ctx.db.userDesign.findFirst({
        where: {
          id: input.id,
          userId: ctx.userId,
        },
        include: {
          // Memastikan data produk dan template desain ikut terambil
          product: {
            include: {
              designTemplate: true,
            },
          },
        },
      });

      if (!design) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Desain tidak ditemukan.",
        });
      }
      return design;
    }),

  /**
   * Mengambil semua desain milik pengguna yang sedang login.
   */
  getMyDesigns: protectedProcedure.query(({ ctx }) => {
    return ctx.db.userDesign.findMany({
      where: { userId: ctx.userId },
      orderBy: { updatedAt: "desc" },
      include: { product: { select: { name: true, images: true } } },
    });
  }),

  /**
   * Membuat desain baru atau memperbarui desain yang sudah ada.
   */
  createOrUpdateDesign: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid().optional(),
        name: z.string().min(3, "Nama desain minimal 3 karakter."),
        productId: z.string().cuid(),
        // --- PERUBAHAN DI SINI ---
        designData: z.array(z.any()), // Diubah menjadi array
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { id: input.productId },
      });

      if (!product?.isDesignable) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Produk ini tidak dapat didesain.",
        });
      }

      if (input.id) {
        // Mode Update
        const existingDesign = await ctx.db.userDesign.findFirst({
          where: { id: input.id, userId: ctx.userId },
        });
        if (!existingDesign) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Anda tidak memiliki akses untuk mengedit desain ini.",
          });
        }
        return ctx.db.userDesign.update({
          where: { id: input.id },
          data: {
            name: input.name,
            productId: input.productId,
            designData: input.designData,
            updatedAt: new Date(),
          },
        });
      } else {
        // Mode Create
        return ctx.db.userDesign.create({
          data: {
            name: input.name,
            productId: input.productId,
            userId: ctx.userId,
            designData: input.designData,
          },
        });
      }
    }),

  /**
   * Menghapus desain milik pengguna.
   */
  deleteDesign: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const design = await ctx.db.userDesign.findFirst({
        where: { id: input.id, userId: ctx.userId },
      });
      if (!design) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Desain tidak ditemukan.",
        });
      }
      return ctx.db.userDesign.delete({ where: { id: input.id } });
    }),
});
