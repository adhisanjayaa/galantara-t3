// File: src/components/invitation-themes/ModernElegantTheme.tsx

"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { format, differenceInSeconds } from "date-fns";
import { id } from "date-fns/locale";
import { Heart, Calendar, MapPin, Gift, Banknote, Video } from "lucide-react";
import { MusicPlayer } from "~/components/player/MusicPlayer";

// Definisikan tipe untuk props, mencerminkan skema Zod kita
interface Event {
  name: string;
  datetime: string;
  gmaps_url?: string;
}

interface GalleryPhoto {
  url: string;
}

interface DigitalGift {
  bank_name: string;
  account_number: string;
  account_holder_name: string;
}

interface WeddingFormData {
  user_nickname?: string;
  partner_nickname?: string;
  user_full_name?: string;
  partner_full_name?: string;
  user_profile_brief?: string;
  partner_profile_brief?: string;
  user_photo_url?: string;
  partner_photo_url?: string;
  quote?: string;
  events?: Event[];
  gallery_photo_urls?: GalleryPhoto[];
  background_music_url?: string;
  story?: string;
  live_stream_url?: string;
  dress_code?: string;
  digital_gifts?: DigitalGift[];
  gift_address?: string;
}

interface ThemeProps {
  formData: WeddingFormData;
}

// Helper Hook untuk Countdown
const useCountdown = (targetDate: string | undefined) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!targetDate) return;

    const interval = setInterval(() => {
      const now = new Date();
      const target = new Date(targetDate);
      const totalSeconds = differenceInSeconds(target, now);

      if (totalSeconds <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
};

// Komponen Kecil untuk setiap bagian agar lebih rapi
const Section: React.FC<{
  title?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}> = ({ title, children, className = "", id }) => (
  <section
    id={id}
    className={`mx-auto w-full max-w-4xl px-4 py-12 text-center md:py-20 ${className}`}
  >
    {title && (
      <h2 className="mb-8 font-serif text-3xl tracking-wide text-gray-700 md:text-4xl">
        {title}
      </h2>
    )}
    {children}
  </section>
);

// Komponen Tema Utama
export default function ModernElegantTheme({ formData }: ThemeProps) {
  const mainEvent = formData.events?.[0];
  const timeLeft = useCountdown(mainEvent?.datetime);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "eeee, dd MMMM yyyy", { locale: id });
    } catch {
      return "Tanggal tidak valid";
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "HH:mm 'WITA'", { locale: id });
    } catch {
      return "Waktu tidak valid";
    }
  };

  return (
    <div className="bg-[#F8F5F2] font-sans text-gray-600 antialiased">
      {/* Hero Section */}
      <div
        className="relative flex min-h-screen flex-col items-center justify-center bg-cover bg-center text-center text-white"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1523438903328-1b6f9513a2d2?q=80&w=2070&auto=format&fit=crop')",
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 p-4">
          <p className="text-lg tracking-widest uppercase">The Wedding Of</p>
          <h1 className="my-4 font-serif text-5xl md:text-7xl">
            {formData.user_nickname ?? "Mempelai Pria"} &{" "}
            {formData.partner_nickname ?? "Mempelai Wanita"}
          </h1>
          {mainEvent?.datetime && (
            <p className="text-lg">{formatDate(mainEvent.datetime)}</p>
          )}
        </div>
      </div>

      {/* Countdown Section */}
      <Section>
        <div className="mx-auto grid max-w-md grid-cols-4 gap-4">
          {Object.entries(timeLeft).map(([unit, value]) => (
            <div key={unit} className="rounded-lg bg-white/50 p-4 shadow-md">
              <div className="text-3xl font-bold text-gray-800">
                {String(value).padStart(2, "0")}
              </div>
              <div className="text-sm tracking-wider uppercase">{unit}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Quote Section */}
      {formData.quote && (
        <Section className="bg-white">
          <p className="mx-auto max-w-3xl font-serif text-xl italic md:text-2xl">
            &quot;{formData.quote}&quot;
          </p>
        </Section>
      )}

      {/* Couple Profile Section */}
      <Section title="The Happy Couple">
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Profile 1 */}
          <div className="flex flex-col items-center">
            {formData.user_photo_url && (
              <Image
                src={formData.user_photo_url}
                alt={formData.user_full_name ?? "Foto Mempelai Pria"}
                width={150}
                height={150}
                className="mb-4 h-40 w-40 rounded-full border-4 border-white object-cover shadow-lg"
              />
            )}
            <h3 className="mt-2 font-serif text-2xl text-gray-800">
              {formData.user_full_name ?? "Nama Lengkap Pria"}
            </h3>
            <p className="mt-2 text-sm">
              {formData.user_profile_brief ?? "Profil singkat mempelai pria."}
            </p>
          </div>
          {/* Profile 2 */}
          <div className="flex flex-col items-center">
            {formData.partner_photo_url && (
              <Image
                src={formData.partner_photo_url}
                alt={formData.partner_full_name ?? "Foto Mempelai Wanita"}
                width={150}
                height={150}
                className="mb-4 h-40 w-40 rounded-full border-4 border-white object-cover shadow-lg"
              />
            )}
            <h3 className="mt-2 font-serif text-2xl text-gray-800">
              {formData.partner_full_name ?? "Nama Lengkap Wanita"}
            </h3>
            <p className="mt-2 text-sm">
              {formData.partner_profile_brief ??
                "Profil singkat mempelai wanita."}
            </p>
          </div>
        </div>
      </Section>

      {/* Story Section */}
      {formData.story && (
        <Section title="Our Story" className="bg-white">
          <p className="mx-auto max-w-2xl text-left leading-relaxed whitespace-pre-line md:text-center">
            {formData.story}
          </p>
        </Section>
      )}

      {/* Event Details Section */}
      <Section title="Wedding Events">
        <div className="flex flex-col items-stretch justify-center gap-8 md:flex-row">
          {formData.events?.map((event, index) => (
            <div
              key={index}
              className="flex max-w-sm flex-1 flex-col rounded-lg bg-white p-8 shadow-lg"
            >
              <h3 className="mb-4 font-serif text-2xl text-gray-800">
                {event.name}
              </h3>
              <div className="mx-auto max-w-xs flex-grow space-y-3 text-left">
                <p className="flex items-center gap-3">
                  <Calendar size={20} />{" "}
                  <span>{formatDate(event.datetime)}</span>
                </p>
                <p className="flex items-center gap-3">
                  <Heart size={20} /> <span>{formatTime(event.datetime)}</span>
                </p>
              </div>
              {event.gmaps_url && (
                <a
                  href={event.gmaps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-block rounded-full bg-gray-800 px-6 py-2 text-white transition-colors hover:bg-gray-700"
                >
                  <MapPin size={20} className="mr-2 inline-block" />
                  <span>Lihat Lokasi</span>
                </a>
              )}
            </div>
          ))}
        </div>
        {formData.live_stream_url && (
          <a
            href={formData.live_stream_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-12 inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-white transition-colors hover:bg-red-700"
          >
            <Video size={20} /> <span>Tonton Live Streaming</span>
          </a>
        )}
      </Section>

      {/* Gallery Section */}
      {formData.gallery_photo_urls &&
        formData.gallery_photo_urls.length > 0 && (
          <Section title="Gallery" className="bg-white">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {formData.gallery_photo_urls.map((photo, index) => (
                <div
                  key={photo.url}
                  className="group relative aspect-square overflow-hidden rounded-lg shadow-md"
                >
                  <Image
                    src={photo.url}
                    alt={`Gallery photo ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </Section>
        )}

      {/* Gift & RSVP Section */}
      <Section title="Share Your Love">
        <p className="mx-auto mb-10 max-w-xl">
          Kehadiran Anda adalah hadiah terindah bagi kami. Namun, jika Anda
          ingin memberikan tanda kasih, kami telah menyediakan opsi di bawah
          ini.
        </p>
        <div className="grid gap-8 md:grid-cols-2">
          {/* Digital Gifts */}
          {formData.digital_gifts && formData.digital_gifts.length > 0 && (
            <div className="rounded-lg bg-white p-6 text-left shadow-lg">
              <div className="mb-4 flex items-center justify-center gap-2">
                <Banknote className="text-gray-700" />
                <h4 className="font-serif text-xl text-gray-800">
                  Amplop Digital
                </h4>
              </div>
              <div className="space-y-3">
                {formData.digital_gifts?.map((gift, index) => (
                  <div key={index} className="rounded-md border p-4">
                    <p className="font-bold text-gray-700">{gift.bank_name}</p>
                    <p className="text-sm">a.n. {gift.account_holder_name}</p>
                    <p className="mt-1 font-mono">{gift.account_number}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Physical Gift */}
          {formData.gift_address && (
            <div className="rounded-lg bg-white p-6 text-center shadow-lg">
              <div className="mb-4 flex items-center justify-center gap-2">
                <Gift className="text-gray-700" />
                <h4 className="font-serif text-xl text-gray-800">
                  Kirim Hadiah
                </h4>
              </div>
              <p className="whitespace-pre-line">{formData.gift_address}</p>
            </div>
          )}
        </div>
      </Section>

      <footer className="py-8 text-center text-sm text-gray-500">
        <p>Dibuat dengan ❤️ oleh Galantara.</p>
        <p>Tema: Modern & Elegan</p>
      </footer>

      <MusicPlayer src={formData.background_music_url} />
    </div>
  );
}
