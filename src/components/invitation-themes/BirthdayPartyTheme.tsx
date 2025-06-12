// File: src/components/invitation-themes/BirthdayPartyTheme.tsx
"use client";

import { Cake, Gift, MapPin, PartyPopper } from "lucide-react";

// Definisikan tipe untuk props yang akan diterima oleh semua komponen tema.
interface ThemeProps {
  formData: Record<string, string>;
}

// Komponen tema harus di-export sebagai default agar bisa diimpor secara dinamis.
export default function BirthdayPartyTheme({ formData }: ThemeProps) {
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
    // Latar belakang dengan gradasi warna cerah
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-yellow-200 via-pink-200 to-purple-300 p-4 font-sans sm:p-8">
      {/* Kartu undangan utama */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/50 bg-white/80 p-8 text-center shadow-2xl backdrop-blur-lg">
        {/* Dekorasi Pojok (absolut) */}
        <div className="absolute -top-12 -left-12 rotate-12 transform text-6xl opacity-20">
          🎉
        </div>
        <div className="absolute -right-12 -bottom-16 -rotate-12 transform text-7xl opacity-20">
          🎈
        </div>

        <div className="mb-4">
          <PartyPopper className="mx-auto h-12 w-12 text-pink-500" />
        </div>

        <p className="text-lg font-medium text-gray-600">
          You&apos;re Invited to
        </p>

        <h1 className="my-2 text-4xl font-bold text-purple-600 drop-shadow-sm sm:text-5xl">
          {formData.celebrantName ?? "[Nama]"}
        </h1>

        {formData.age && (
          <h2 className="text-2xl font-semibold text-yellow-500">
            the {formData.age}th Birthday Party!
          </h2>
        )}

        <div className="my-8 border-t-2 border-dashed border-pink-300"></div>

        <div className="space-y-4 text-left text-gray-700">
          <div className="flex items-center gap-4">
            <Cake className="h-6 w-6 flex-shrink-0 text-purple-500" />
            <p className="font-medium">{formattedDate}</p>
          </div>
          <div className="flex items-center gap-4">
            <MapPin className="h-6 w-6 flex-shrink-0 text-purple-500" />
            <p className="font-medium">
              {formData.eventLocation ?? "Lokasi Acara"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Gift className="h-6 w-6 flex-shrink-0 text-purple-500" />
            <p className="font-medium">Don&apos;t forget to bring a gift!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
