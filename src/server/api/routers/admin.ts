import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { ProductCategory, type Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { supabase } from "~/server/lib/supabase";

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
    // <-- PASTIKAN INI ADA
    return ctx.db.product.findMany({
      orderBy: { name: "asc" },
      include: { productType: true },
    });
  }),

  getAllProductTypes: adminProcedure.query(({ ctx }) => {
    // [FIX DI SINI] Tambahkan blok 'select' untuk secara eksplisit
    // meminta semua field yang dibutuhkan. Ini akan memaksa tRPC untuk
    // membuat tipe data yang benar untuk frontend.
    return ctx.db.productType.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        schemaIdentifier: true, // <-- Ini yang paling penting
        createdAt: true,
        updatedAt: true,
      },
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
      z.object({
        name: z.string().min(1, "Nama tipe produk wajib diisi."),
        schemaIdentifier: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingType = await ctx.db.productType.findFirst({
        where: { name: { equals: input.name, mode: "insensitive" } },
      });
      if (existingType) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Tipe produk dengan nama "${input.name}" sudah ada.`,
        });
      }
      return ctx.db.productType.create({ data: input });
    }),

  updateProductType: adminProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string().min(1, "Nama tipe produk wajib diisi."),
        schemaIdentifier: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.productType.update({
        where: { id },
        data,
      });
    }),

  deleteProductType: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const productUsingType = await ctx.db.product.findFirst({
        where: { productTypeId: input.id },
      });

      if (productUsingType) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Tipe ini tidak bisa dihapus karena sedang digunakan oleh produk "${productUsingType.name}".`,
        });
      }

      return ctx.db.productType.delete({ where: { id: input.id } });
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

  /**
   * Mengambil semua font kustom yang telah diunggah.
   */
  getCustomFonts: adminProcedure.query(({ ctx }) => {
    return ctx.db.customFont.findMany({
      orderBy: { name: "asc" },
    });
  }),

  /**
   * Menambahkan metadata font baru ke database.
   */
  addCustomFont: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Nama font wajib diisi"),
        weight: z.string().min(1, "Berat font wajib diisi"),
        style: z.string().min(1, "Gaya font wajib diisi"),
        url: z.string().url("URL tidak valid"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingFont = await ctx.db.customFont.findFirst({
        where: { name: input.name, weight: input.weight, style: input.style },
      });
      if (existingFont) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Varian font <span class="math-inline">\{input\.name\} \(</span>{input.weight} ${input.style}) sudah ada.`,
        });
      }
      return ctx.db.customFont.create({ data: input });
    }),

  /**
   * Menghapus font dari database dan Supabase Storage.
   */
  deleteCustomFont: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const font = await ctx.db.customFont.findUnique({
        where: { id: input.id },
      });
      if (!font) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Font tidak ditemukan.",
        });
      }

      // Hapus file dari Supabase Storage
      try {
        // Ambil path file dari URL lengkap
        const filePath = new URL(font.url).pathname.split(
          "/public/design-assets/",
        )[1];
        if (filePath) {
          const { error } = await supabase.storage
            .from("design-assets")
            .remove([filePath]);
          if (error) throw error;
        }
      } catch (e) {
        // 2. Ganti `toast.warning` dengan `console.error` yang aman di sisi server
        console.error(
          "Gagal menghapus file font dari storage, data DB akan tetap dihapus:",
          e,
        );
        // Di sini kita sengaja tidak melempar error agar proses penghapusan dari DB tetap berjalan.
        // Klien tidak akan tahu tentang kegagalan ini, tapi akan tercatat di log server.
      }

      // Hapus record dari database
      return ctx.db.customFont.delete({ where: { id: input.id } });
    }),
});
