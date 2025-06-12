// File: src/server/api/routers/storage.ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { supabase } from "~/server/lib/supabase";
import { randomUUID } from "crypto";

export const storageRouter = createTRPCRouter({
  /**
   * Membuat Pre-signed URL untuk mengunggah file ke Supabase Storage.
   * Ini adalah cara aman untuk memungkinkan klien mengunggah file secara langsung.
   */
  createPresignedUrl: protectedProcedure
    .input(
      z.object({
        fileType: z.string().startsWith("image/"), // Hanya izinkan tipe file gambar
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { fileType } = input;
      const userId = ctx.userId;

      // Buat nama file yang unik untuk menghindari konflik
      const fileExtension = fileType.split("/")[1];
      const fileName = `${userId}/${randomUUID()}.${fileExtension}`;
      const bucketName = "design-assets"; // Ganti dengan nama bucket Anda di Supabase

      // Buat pre-signed URL dengan izin 'upload'
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUploadUrl(fileName);

      if (error) {
        console.error("Gagal membuat pre-signed URL:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Tidak dapat mempersiapkan unggahan file.",
        });
      }

      // Ambil URL publik dari file yang akan diunggah
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      return {
        uploadUrl: data.signedUrl,
        publicUrl: publicUrlData.publicUrl,
        filePath: data.path, // Path file di bucket
      };
    }),
});
