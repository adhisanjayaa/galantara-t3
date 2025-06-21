// File: src/lib/dummyData.ts

import type { WeddingFormData, BirthdayFormData } from "./formSchemas";

/**
 * Data dummy untuk skema undangan pernikahan (WEDDING_V1)
 */
export const dummyWeddingData: WeddingFormData = {
  user_nickname: "Budi",
  partner_nickname: "Ani",
  user_full_name: "Budi Setiawan",
  partner_full_name: "Ani Lestari",
  user_profile_brief: "Putra pertama dari Bpk. Sujatmiko & Ibu Sri Rahayu",
  partner_profile_brief: "Putri kedua dari Bpk. Santoso & Ibu Wati Ningsih",
  // --- PERUBAHAN DI SINI: Menggunakan aset lokal ---
  user_photo_url: "/dummy-assets/profile-male.jpg",
  partner_photo_url: "/dummy-assets/profile-female.jpg",
  quote:
    "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.",
  events: [
    {
      name: "Akad Nikah",
      datetime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 hari dari sekarang
      gmaps_url: "https://maps.app.goo.gl/UZHLz83HwzGkGj7y9",
    },
    {
      name: "Resepsi",
      datetime: new Date(
        Date.now() + 10 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
      ).toISOString(), // 2 jam setelah akad
      gmaps_url: "https://maps.app.goo.gl/UZHLz83HwzGkGj7y9",
    },
  ],
  // --- PERUBAHAN DI SINI: Menggunakan aset lokal ---
  gallery_photo_urls: [
    { url: "/dummy-assets/gallery-1.jpg" },
    { url: "/dummy-assets/gallery-2.jpg" },
    { url: "/dummy-assets/gallery-3.jpg" },
    { url: "/dummy-assets/gallery-4.jpg" },
  ],
  // --- PERUBAHAN DI SINI: Menggunakan aset lokal ---
  background_music_url: "/dummy-assets/wedding-music.mp3",
  story: `Awal pertemuan kami terjadi di sebuah acara komunitas beberapa tahun lalu. Dari obrolan ringan, kami menemukan banyak kesamaan dan kenyamanan. Seiring berjalannya waktu, benih-benih cinta mulai tumbuh.
  
Setelah melewati berbagai momen suka dan duka bersama, kami semakin yakin bahwa kami ditakdirkan untuk satu sama lain. Hari ini, dengan restu keluarga, kami melangkah ke jenjang yang lebih serius untuk membangun masa depan bersama.`,
  digital_gifts: [
    {
      bank_name: "BCA",
      account_number: "1234567890",
      account_holder_name: "Budi Setiawan",
    },
    {
      bank_name: "Mandiri",
      account_number: "0987654321",
      account_holder_name: "Ani Lestari",
    },
  ],
  gift_address:
    "Jl. Merpati Putih No. 123, Denpasar, Bali. 80225\nPenerima: Budi/Ani",
  live_stream_url: "https://www.youtube.com",
  dress_code: "Batik / Pakaian Formal",
};

/**
 * Data dummy untuk skema undangan ulang tahun (BIRTHDAY_V1)
 */
export const dummyBirthdayData: BirthdayFormData = {
  celebrant_name: "Putu",
  age: 7,
  event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 hari dari sekarang
  event_location: "Aula Serbaguna, Jl. Raya Kuta No. 1, Kuta, Bali",
};

// Peta untuk mengambil data dummy berdasarkan identifier
const dummyDataMap = {
  WEDDING_V1: dummyWeddingData,
  BIRTHDAY_V1: dummyBirthdayData,
};

/**
 * Fungsi helper untuk mendapatkan data dummy yang sesuai berdasarkan schemaIdentifier.
 * @param identifier - Identifier skema (cth. "WEDDING_V1")
 * @returns Objek data dummy yang sesuai atau objek kosong jika tidak ditemukan.
 */
export function getDummyDataByIdentifier(
  identifier: string | null | undefined,
): Record<string, unknown> {
  if (!identifier || !(identifier in dummyDataMap)) {
    return {};
  }
  return dummyDataMap[identifier as keyof typeof dummyDataMap];
}
