import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { ProductCategory, type Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export const adminRouter = createTRPCRouter({
  /**
   * Mengambil semua pesanan untuk ditampilkan di dashboard admin.
   */
  getAllOrders: adminProcedure.query(({ ctx }) => {
    return ctx.db.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }),

  /**
   * Mengambil semua produk untuk manajemen.
   */
  getAllProducts: adminProcedure.query(({ ctx }) => {
    return ctx.db.product.findMany({
      orderBy: { name: "asc" },
      include: { productType: true },
    });
  }),

  /**
   * Mengambil semua tipe produk.
   */
  getProductTypes: adminProcedure.query(({ ctx }) => {
    return ctx.db.productType.findMany({
      orderBy: { name: "asc" },
    });
  }),

  /**
   * Mengambil tipe produk beserta jumlah produk yang terkait.
   */
  getProductTypesWithCount: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.productType.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }),

  /**
   * Membuat tipe produk baru.
   */
  createProductType: adminProcedure
    .input(
      z.object({ name: z.string().min(3, "Nama tipe minimal 3 karakter.") }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingType = await ctx.db.productType.findFirst({
        where: {
          name: { equals: input.name, mode: "insensitive" },
        },
      });

      if (existingType) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Tipe produk dengan nama tersebut sudah ada.",
        });
      }

      return ctx.db.productType.create({
        data: {
          name: input.name,
        },
      });
    }),

  /**
   * Membuat produk baru.
   */
  createProduct: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        price: z.number().min(0),
        category: z.nativeEnum(ProductCategory),
        productTypeId: z.string().cuid(),
        images: z.array(z.string().url()).min(1),
        weightGram: z.number().optional(),
        themeIdentifier: z.string().optional(),
        isDesignable: z.boolean().optional(),
        designTemplateId: z.string().cuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.product.create({ data: input });
    }),

  /**
   * Memperbarui produk yang sudah ada.
   */
  updateProduct: adminProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string().min(1),
        description: z.string().min(1),
        price: z.number().min(0),
        category: z.nativeEnum(ProductCategory),
        productTypeId: z.string().cuid(),
        images: z.array(z.string().url()).min(1),
        isActive: z.boolean(),
        weightGram: z.number().optional(),
        themeIdentifier: z.string().optional(),
        isDesignable: z.boolean().optional(),
        designTemplateId: z.string().cuid().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, productTypeId, designTemplateId, ...scalarData } = input;

      const updateData: Prisma.ProductUpdateInput = {
        ...scalarData,
        productType: {
          connect: {
            id: productTypeId,
          },
        },
      };

      if (designTemplateId) {
        updateData.designTemplate = {
          connect: {
            id: designTemplateId,
          },
        };
      } else if (designTemplateId === null) {
        updateData.designTemplate = {
          disconnect: true,
        };
      }

      return ctx.db.product.update({
        where: { id },
        data: updateData,
      });
    }),

  /**
   * Menghapus produk.
   */
  deleteProduct: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const existingOrderItem = await ctx.db.orderItem.findFirst({
        where: { productId: input.id },
      });

      if (existingOrderItem) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Produk ini tidak bisa dihapus karena sudah ada dalam riwayat pesanan. Sebaiknya nonaktifkan saja.",
        });
      }

      const existingCartItem = await ctx.db.cartItem.findFirst({
        where: { productId: input.id },
      });

      if (existingCartItem) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Produk ini tidak bisa dihapus karena sedang berada di keranjang pengguna lain.",
        });
      }

      return ctx.db.product.delete({
        where: { id: input.id },
      });
    }),

  /**
   * Mengambil semua template desain.
   */
  getDesignTemplates: adminProcedure.query(({ ctx }) => {
    return ctx.db.designTemplate.findMany({
      orderBy: { name: "asc" },
    });
  }),

  /**
   * Mengambil satu template desain berdasarkan ID.
   */
  getDesignTemplateById: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const template = await ctx.db.designTemplate.findUnique({
        where: { id: input.id },
      });
      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template tidak ditemukan.",
        });
      }
      return template;
    }),

  /**
   * Membuat atau memperbarui template desain, termasuk dimensi artboard.
   */
  createOrUpdateDesignTemplate: adminProcedure
    .input(
      z.object({
        id: z.string().cuid().optional(),
        name: z.string().min(3, "Nama template minimal 3 karakter."),
        // --- PERUBAHAN DI SINI ---
        designData: z.array(z.any()), // Diubah menjadi array
        artboardWidth: z.number().min(100, "Lebar minimal 100px"),
        artboardHeight: z.number().min(100, "Tinggi minimal 100px"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, designData, artboardWidth, artboardHeight } = input;

      const dataToSave = {
        name,
        designData,
        artboardWidth,
        artboardHeight,
      };

      if (id) {
        return ctx.db.designTemplate.update({
          where: { id },
          data: dataToSave,
        });
      }
      return ctx.db.designTemplate.create({
        data: dataToSave,
      });
    }),

  /**
   * Menghapus template desain.
   */
  deleteDesignTemplate: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const productUsingTemplate = await ctx.db.product.findFirst({
        where: { designTemplateId: input.id },
      });

      if (productUsingTemplate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Template ini tidak bisa dihapus karena sedang digunakan oleh produk "${productUsingTemplate.name}".`,
        });
      }

      return ctx.db.designTemplate.delete({ where: { id: input.id } });
    }),
});
