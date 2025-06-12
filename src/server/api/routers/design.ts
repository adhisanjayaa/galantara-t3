import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const designRouter = createTRPCRouter({
  getDesignById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const design = await ctx.db.userDesign.findFirst({
        where: {
          id: input.id,
          userId: ctx.userId,
        },
        include: {
          product: true,
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

  getMyDesigns: protectedProcedure.query(({ ctx }) => {
    return ctx.db.userDesign.findMany({
      where: { userId: ctx.userId },
      orderBy: { updatedAt: "desc" },
      include: { product: { select: { name: true, images: true } } },
    });
  }),

  createOrUpdateDesign: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid().optional(),
        name: z.string().min(3, "Nama desain minimal 3 karakter."),
        productId: z.string().cuid(),
        designData: z.any(),
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
        // --- Mode Update ---
        const existingDesign = await ctx.db.userDesign.findFirst({
          where: { id: input.id, userId: ctx.userId },
        });
        if (!existingDesign) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Anda tidak memiliki akses untuk mengedit desain ini.",
          });
        }

        // [FIX] Buat objek data secara eksplisit untuk update
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
        // --- Mode Create ---
        // [FIX] Buat objek data secara eksplisit untuk create
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

  generatePreview: protectedProcedure
    .input(z.object({ designData: z.any() }))
    .mutation(async ({ input }) => {
      console.log("Generating preview for:", input.designData);
      return {
        previewUrl:
          "https://via.placeholder.com/800x600.png?text=Preview+Image",
      };
    }),

  admin_downloadDesign: adminProcedure
    .input(z.object({ designId: z.string().cuid() }))
    .mutation(async ({ ctx: _ctx, input }) => {
      console.log("Admin downloading design:", input.designId);
      return { downloadUrl: "https://example.com/placeholder.zip" };
    }),
});
