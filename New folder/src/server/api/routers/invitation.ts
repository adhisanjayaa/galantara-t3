import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const invitationRouter = createTRPCRouter({
  checkSubdomainAvailability: publicProcedure
    .input(
      z.object({
        subdomain: z
          .string()
          .min(3, { message: "Subdomain minimal 3 karakter." })
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
            message: "Hanya boleh berisi huruf kecil, angka, dan tanda hubung.",
          }),
      }),
    )
    .query(async ({ ctx, input }) => {
      const subdomain = input.subdomain.toLowerCase();
      const existingInvitation = await ctx.db.userInvitation.findUnique({
        where: { subdomain },
      });
      const pendingOrderItem = await ctx.db.orderItem.findFirst({
        where: {
          subdomain,
          order: {
            status: { in: ["PENDING", "PAID"] },
          },
        },
      });
      const isAvailable = !existingInvitation && !pendingOrderItem;
      return { available: isAvailable };
    }),

  getMyInvitations: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.userInvitation.findMany({
      where: {
        userId: ctx.userId,
      },
      include: {
        orderItem: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }),

  getInvitationDetails: protectedProcedure
    .input(z.object({ invitationId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const invitation = await ctx.db.userInvitation.findUnique({
        where: {
          id: input.invitationId,
          userId: ctx.userId,
        },
        include: {
          orderItem: {
            include: {
              product: {
                // Pastikan kita mengambil relasi productType di dalam product
                include: {
                  productType: true,
                },
              },
            },
          },
        },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Undangan tidak ditemukan atau Anda tidak memiliki akses.",
        });
      }
      return invitation;
    }),

  updateInvitationData: protectedProcedure
    .input(
      z.object({
        invitationId: z.string().cuid(),
        formData: z.record(z.any()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { invitationId, formData } = input;
      const invitation = await ctx.db.userInvitation.findFirst({
        where: { id: invitationId, userId: ctx.userId },
      });
      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Undangan tidak ditemukan.",
        });
      }
      if (invitation.status === "EXPIRED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Undangan kedaluwarsa.",
        });
      }
      return ctx.db.userInvitation.update({
        where: { id: invitationId },
        data: { formData: formData },
      });
    }),

  activateInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const expiresAt = new Date(new Date().setMonth(now.getMonth() + 6));
      const invitationToActivate = await ctx.db.userInvitation.findFirst({
        where: { id: input.invitationId, userId: ctx.userId, status: "DRAFT" },
      });
      if (!invitationToActivate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Undangan tidak dapat diaktifkan.",
        });
      }
      return ctx.db.userInvitation.update({
        where: { id: input.invitationId },
        data: {
          status: "ACTIVE",
          publishedAt: new Date(),
          expiresAt: expiresAt,
        },
      });
    }),

  getPublicInvitationBySubdomain: publicProcedure
    .input(z.object({ subdomain: z.string() }))
    .query(async ({ ctx, input }) => {
      const invitation = await ctx.db.userInvitation.findFirst({
        where: { subdomain: input.subdomain.toLowerCase(), status: "ACTIVE" },
        select: {
          id: true,
          formData: true,
          orderItem: {
            select: {
              product: {
                select: {
                  name: true,
                  themeIdentifier: true,
                },
              },
            },
          },
        },
      });
      return invitation;
    }),
});
