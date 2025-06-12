// File: src/components/invitation-themes/ElegantTheme.tsx
"use client";

import { MapPin, Calendar, Heart } from "lucide-react";

// Definisikan tipe untuk props yang akan diterima oleh semua komponen tema.
interface ThemeProps {
  formData: Record<string, string>;
}

// Komponen tema harus di-export sebagai default agar bisa diimpor secara dinamis.
export default function ElegantTheme({ formData }: ThemeProps) {
  // Helper untuk mendapatkan tanggal yang sudah diformat dengan aman.
  const formattedDate =
    formData.eventDate && typeof formData.eventDate === "string"
      ? new Intl.DateTimeFormat("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(new Date(formData.eventDate))
      : "Tanggal Acara";

  return (
    // Latar belakang dengan warna netral dan lembut
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 font-serif sm:p-8">
      {/* Kartu undangan utama */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-lg border border-gray-200 bg-white p-8 text-center shadow-xl sm:p-12">
        {/* Dekorasi Pojok (absolut) */}
        <div className="absolute top-0 left-0 h-24 w-24 rounded-tl-lg border-t-8 border-l-8 border-yellow-500/50"></div>
        <div className="absolute right-0 bottom-0 h-24 w-24 rounded-br-lg border-r-8 border-b-8 border-yellow-500/50"></div>

        <div className="mb-4">
          <p className="text-lg tracking-widest text-gray-500 uppercase">
            The Wedding Of
          </p>
        </div>

        <h1 className="my-4 text-4xl font-medium text-gray-800 sm:text-5xl">
          {formData.groomName ?? "[Nama Pria]"}
        </h1>

        <div className="my-6 flex items-center justify-center gap-4 text-yellow-600">
          <div className="flex-grow border-t border-gray-300"></div>
          <Heart className="h-6 w-6" />
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <h1 className="my-4 text-4xl font-medium text-gray-800 sm:text-5xl">
          {formData.brideName ?? "[Nama Wanita]"}
        </h1>

        <div className="mx-auto my-10 w-1/3 border-t border-gray-200"></div>

        <div className="space-y-4 text-center text-gray-700">
          <div className="flex flex-col items-center gap-2">
            <Calendar className="h-6 w-6 text-yellow-600" />
            <p className="text-lg font-semibold">{formattedDate}</p>
          </div>
          <div className="mt-4 flex flex-col items-center gap-2">
            <MapPin className="h-6 w-6 text-yellow-600" />
            <p className="text-lg font-semibold">
              {formData.eventLocation ?? "Lokasi Acara"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
