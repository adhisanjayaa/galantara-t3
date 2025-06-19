// File: src/components/player/MusicPlayer.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";

interface MusicPlayerProps {
  /** URL dari file musik yang akan diputar */
  src?: string | null;
}

/**
 * Komponen reusable untuk menampilkan tombol play/pause musik
 * yang posisinya tetap di pojok layar.
 */
export function MusicPlayer({ src }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fungsi untuk play/pause musik
  const togglePlayPause = () => {
    // Pastikan audioRef sudah terhubung ke elemen audio
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // .play() mengembalikan Promise, tangani error jika browser memblokir autoplay
      audioRef.current.play().catch((error) => {
        console.error("Audio play was prevented by the browser:", error);
        // Anda bisa menampilkan toast di sini jika ingin memberitahu user
      });
    }
    setIsPlaying(!isPlaying);
  };

  // Efek untuk mensinkronkan state jika user mengontrol dari luar (jarang terjadi, tapi aman)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, []);

  // Jangan render apapun jika tidak ada link musik
  if (!src) {
    return null;
  }

  return (
    <div className="fixed right-5 bottom-5 z-50">
      {/* Elemen audio yang sebenarnya disembunyikan */}
      <audio ref={audioRef} src={src} loop />

      {/* Tombol kontrol yang terlihat oleh pengguna */}
      <button
        onClick={togglePlayPause}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800 text-white shadow-lg transition-transform hover:scale-110 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
        aria-label={isPlaying ? "Pause music" : "Play music"}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
      </button>
    </div>
  );
}
