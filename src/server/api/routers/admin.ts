import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { ProductCategory, type Prisma, ShippingStatus } from "@prisma/client"; // <-- Impor ShippingStatus
import { TRPCError } from "@trpc/server";
import { supabase } from "~/server/lib/supabase";
import axios from "axios"; // <-- Impor axios
import { env } from "~/env.js"; // <-- Impor env
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

  getOrderDetails: adminProcedure
    .input(z.object({ orderId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.orderId },
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

      // Ambil alamat pengguna secara terpisah menggunakan userId dari pesanan
      const userAddresses = await ctx.db.address.findMany({
        where: { userId: order.userId },
      });

      // Gabungkan data pesanan dengan alamat pengguna agar mudah digunakan di frontend
      return {
        ...order,
        user: {
          addresses: userAddresses,
        },
      };
    }),

  createShipment: adminProcedure
    .input(z.object({ orderId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Ambil data pesanan
      const order = await ctx.db.order.findUnique({
        where: { id: input.orderId },
        include: {
          items: { include: { product: true } },
        },
      });

      if (
        !order ||
        !order.shippingAddress ||
        !order.shippingProvider ||
        !order.customerName
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Data pesanan tidak lengkap untuk membuat pengiriman.",
        });
      }

      // 2. Filter hanya produk fisik
      const physicalItems = order.items.filter(
        (item) => item.product.category === "PHYSICAL",
      );

      if (physicalItems.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Pesanan ini tidak memiliki produk fisik.",
        });
      }

      // 3. Ambil alamat pengguna secara terpisah untuk mendapatkan data terstruktur
      const userAddresses = await ctx.db.address.findMany({
        where: { userId: order.userId },
      });

      const destinationAddress = userAddresses.find(
        (addr) =>
          `${addr.street}, ${addr.city}, ${addr.province} ${addr.postalCode}, ${addr.country}` ===
          order.shippingAddress,
      );

      if (!destinationAddress) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Alamat pengiriman di pesanan tidak cocok dengan alamat manapun di profil pengguna.",
        });
      }

      // 4. Siapkan payload untuk API Biteship menggunakan data yang andal
      const biteshipPayload = {
        origin_contact_name: env.ORIGIN_CONTACT_NAME,
        origin_contact_phone: env.ORIGIN_CONTACT_PHONE,
        origin_address: env.ORIGIN_ADDRESS,
        origin_postal_code: env.ORIGIN_POSTAL_CODE,
        destination_contact_name: order.customerName,
        destination_contact_phone: destinationAddress.phoneNumber,
        destination_address: destinationAddress.street,
        destination_postal_code: parseInt(destinationAddress.postalCode, 10),
        courier_company: order.courierCompany,
        courier_type: order.courierService,
        delivery_type: "now",
        order_id: `GALANTARA-${order.id}`,
        items: physicalItems.map((item) => ({
          name: item.productName,
          value: item.price,
          quantity: item.quantity,
          weight: (item.product.weightGram ?? 100) / 1000,
        })),
      };

      try {
        // 5. Kirim permintaan ke Biteship
        const { data: shipmentData } = await axios.post(
          "https://api.biteship.com/v1/orders",
          biteshipPayload,
          {
            headers: { Authorization: `Bearer ${env.BITESHIP_API_KEY}` },
          },
        );

        if (!shipmentData.success) {
          const errorMsg = Array.isArray(shipmentData.error)
            ? shipmentData.error.join(", ")
            : shipmentData.error;
          throw new Error(errorMsg ?? "Gagal membuat pengiriman di Biteship");
        }

        const tracking_id = shipmentData.courier.tracking_id;
        const waybill_id = shipmentData.courier.waybill_id;

        if (!tracking_id || !waybill_id) {
          throw new Error(
            "Biteship tidak mengembalikan tracking_id atau waybill_id.",
          );
        }

        // 7. Perbarui database dengan data pengiriman baru
        await ctx.db.order.update({
          where: { id: order.id },
          data: {
            trackingId: tracking_id,
            shippingStatus: ShippingStatus.SHIPPED,
          },
        });

        return {
          trackingId: tracking_id,
        };
      } catch (error) {
        console.error("Biteship Create Order API Error:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan tidak diketahui.";
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal membuat pengiriman melalui Biteship: ${errorMessage}`,
        });
      }
    }),

  getDesignsForOrder: adminProcedure
    .input(z.object({ orderId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const orderItems = await ctx.db.orderItem.findMany({
        where: {
          orderId: input.orderId,
          userDesignId: {
            not: null, // Hanya ambil item yang memiliki desain kustom
          },
        },
        select: {
          productName: true,
          userDesign: {
            select: {
              id: true,
              name: true,
              designData: true,
              product: {
                select: {
                  designTemplate: {
                    select: {
                      artboardWidth: true,
                      artboardHeight: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!orderItems) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tidak ada item dengan desain kustom pada pesanan ini.",
        });
      }

      // Filter item yang mungkin tidak memiliki userDesign (meskipun query sudah mencoba)
      // dan format datanya agar lebih mudah digunakan di frontend
      const designs = orderItems
        .filter((item) => item.userDesign)
        .map((item) => {
          return item.userDesign!;
        });

      return designs;
    }),
});
