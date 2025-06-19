// File: src/server/api/routers/storage.ts

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { supabase } from "~/server/lib/supabase";
import { randomUUID } from "crypto";

export const storageRouter = createTRPCRouter({
  createPresignedUrl: protectedProcedure
    .input(
      z.object({
        fileType: z.string().refine(
          (val) => {
            if (val === "") return true; // Menangani kasus browser tidak mengirim tipe

            // [FIX] Logika ini mengizinkan gambar, audio, dan font
            return (
              val.startsWith("image/") ||
              val.startsWith("audio/") || // <-- Baris ini mengizinkan file musik
              val.startsWith("font/") ||
              val.startsWith("application/") // Fallback untuk beberapa tipe font
            );
          },
          {
            // [FIX] Pesan error juga diperbarui untuk mencerminkan izin baru
            message:
              "Tipe file tidak didukung. Harap unggah gambar, musik, atau file font.",
          },
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { fileType } = input;
      const userId = ctx.userId;

      let fileExtension = "bin";
      if (fileType) {
        fileExtension = fileType.split("/")[1] ?? "bin";
        // Menangani kasus umum seperti 'audio/mpeg' menjadi 'mp3'
        if (fileExtension === "mpeg") fileExtension = "mp3";
      }

      const fileName = `${userId}/${randomUUID()}.${fileExtension}`;
      const bucketName = "design-assets";

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

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      return {
        uploadUrl: data.signedUrl,
        publicUrl: publicUrlData.publicUrl,
        filePath: data.path,
      };
    }),
});
