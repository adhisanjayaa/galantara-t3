// File: src/server/api/routers/profile.ts

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { AddressType } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export const profileRouter = createTRPCRouter({
  /**
   * Mengambil SEMUA alamat milik pengguna.
   */
  getAddresses: protectedProcedure.query(({ ctx }) => {
    return ctx.db.address.findMany({
      where: { userId: ctx.userId },
      orderBy: { type: "asc" },
    });
  }),

  /**
   * Menambah alamat baru.
   */
  addAddress: protectedProcedure
    .input(
      z.object({
        street: z.string().min(1),
        city: z.string().min(1),
        province: z.string().min(1),
        postalCode: z.string().min(1),
        country: z.string().min(1),
        phoneNumber: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingAddresses = await ctx.db.address.findMany({
        where: { userId: ctx.userId },
      });
      if (existingAddresses.length >= 2) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Anda hanya dapat memiliki maksimal 2 alamat.",
        });
      }
      const type =
        existingAddresses.length === 0
          ? AddressType.PRIMARY
          : AddressType.SECONDARY;

      return ctx.db.address.create({
        data: { userId: ctx.userId, type, ...input },
      });
    }),

  /**
   * Memperbarui alamat yang sudah ada.
   */
  updateAddress: protectedProcedure
    .input(
      z.object({
        addressId: z.string().cuid(),
        street: z.string().min(1),
        city: z.string().min(1),
        province: z.string().min(1),
        postalCode: z.string().min(1),
        country: z.string().min(1),
        phoneNumber: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { addressId, ...data } = input;
      return ctx.db.address.update({
        where: { id: addressId, userId: ctx.userId },
        data,
      });
    }),

  /**
   * Menghapus alamat.
   */
  deleteAddress: protectedProcedure
    .input(z.object({ addressId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const addressToDelete = await ctx.db.address.findFirst({
        where: { id: input.addressId, userId: ctx.userId },
      });
      if (!addressToDelete) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Alamat tidak ditemukan.",
        });
      }
      await ctx.db.address.delete({ where: { id: input.addressId } });

      if (addressToDelete.type === "PRIMARY") {
        const otherAddress = await ctx.db.address.findFirst({
          where: { userId: ctx.userId },
        });
        if (otherAddress) {
          await ctx.db.address.update({
            where: { id: otherAddress.id },
            data: { type: "PRIMARY" },
          });
        }
      }
      return { success: true };
    }),

  // Prosedur 'setPrimaryAddress' telah dihapus.
});
