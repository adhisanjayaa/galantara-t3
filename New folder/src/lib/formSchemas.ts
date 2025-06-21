// File: src/lib/formSchemas.ts

import { z } from "zod";

// Skema Zod untuk Pernikahan (sumber kebenaran tunggal)
export const weddingFormSchema = z.object({
  user_nickname: z.string().optional(),
  partner_nickname: z.string().optional(),
  user_full_name: z.string().optional(),
  partner_full_name: z.string().optional(),
  user_profile_brief: z.string().optional(),
  partner_profile_brief: z.string().optional(),
  user_photo_url: z.string().url().optional().nullable(),
  partner_photo_url: z.string().url().optional().nullable(),
  quote: z.string().optional(),
  events: z
    .array(
      z.object({
        name: z.string(),
        datetime: z.string(),
        gmaps_url: z.string().url().optional().or(z.literal("")),
      }),
    )
    .max(3)
    .optional(),
  gallery_photo_urls: z
    .array(
      z.object({
        url: z.string().url(),
      }),
    )
    .max(10)
    .optional(),
  background_music_url: z.string().url().optional().nullable(),
  story: z.string().optional(),
  // [TAMBAHKAN] Definisi untuk hadiah digital
  digital_gifts: z
    .array(
      z.object({
        bank_name: z.string(),
        account_number: z.string(),
        account_holder_name: z.string(),
      }),
    )
    .optional(),
  gift_address: z.string().optional(),
  live_stream_url: z.string().url().optional().or(z.literal("")),
  dress_code: z.string().optional(),
});

// Skema Zod untuk Ulang Tahun
export const birthdayFormSchema = z.object({
  celebrant_name: z.string().min(1, "Nama harus diisi"),
  age: z.number().positive().optional(),
  event_date: z.string(),
  event_location: z.string().optional(),
});

// Tipe data yang di-infer dari skema Zod
export type WeddingFormData = z.infer<typeof weddingFormSchema>;
export type BirthdayFormData = z.infer<typeof birthdayFormSchema>;

// Peta untuk mengambil skema berdasarkan identifier
const schemaMap = {
  WEDDING_V1: weddingFormSchema,
  BIRTHDAY_V1: birthdayFormSchema,
};

// Fungsi helper untuk mendapatkan skema berdasarkan identifier
export function getFormSchemaByIdentifier(
  identifier: string | null | undefined,
) {
  if (!identifier || !(identifier in schemaMap)) {
    return null;
  }
  return schemaMap[identifier as keyof typeof schemaMap];
}
