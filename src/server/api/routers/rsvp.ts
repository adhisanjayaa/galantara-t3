import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { RsvpStatus } from "@prisma/client";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const rsvpRouter = createTRPCRouter({
  /**
   * Prosedur publik untuk membuat entri RSVP baru.
   * Bisa diakses oleh siapa saja yang memiliki link undangan.
   */
  create: publicProcedure
    .input(
      z.object({
        invitationId: z.string().cuid(),
        name: z.string().min(1, "Nama wajib diisi"),
        guests: z.number().min(1, "Jumlah tamu minimal 1"),
        status: z.nativeEnum(RsvpStatus),
        message: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.rsvp.create({
        data: {
          invitationId: input.invitationId,
          name: input.name,
          guests: input.guests,
          status: input.status,
          message: input.message,
        },
      });
    }),

  /**
   * Prosedur terproteksi untuk mengambil daftar RSVP untuk sebuah undangan.
   * Hanya pemilik undangan yang bisa mengakses ini.
   */
  getForInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      // Verifikasi kepemilikan undangan
      const invitation = await ctx.db.userInvitation.findFirst({
        where: {
          id: input.invitationId,
          userId: ctx.userId,
        },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda tidak memiliki akses ke daftar RSVP ini.",
        });
      }

      // Ambil semua RSVP yang terkait
      return ctx.db.rsvp.findMany({
        where: {
          invitationId: input.invitationId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),
});
