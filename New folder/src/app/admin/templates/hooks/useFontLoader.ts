// File: src/app/admin/templates/hooks/useFontLoader.ts
"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

export function useFontLoader() {
  // [FIX] Mengubah pemanggilan dari endpoint admin ke endpoint theme yang lebih umum
  const { data: customFonts, isLoading: isFetchingFonts } =
    api.theme.getAvailableFonts.useQuery();

  const [availableFonts, setAvailableFonts] = useState<string[]>([]);
  const [areFontsLoading, setAreFontsLoading] = useState(true);

  useEffect(() => {
    if (isFetchingFonts || !customFonts) return;

    const standardFonts = [
      "Arial",
      "Helvetica",
      "Georgia",
      "Times New Roman",
      "Verdana",
    ];

    if (customFonts.length === 0) {
      setAvailableFonts(standardFonts.sort());
      setAreFontsLoading(false);
      return;
    }

    const fontPromises = customFonts.map((font) => {
      const fontFace = new FontFace(font.name, `url(${font.url})`, {
        weight: font.weight,
        style: font.style,
      });
      document.fonts.add(fontFace);
      return fontFace.load();
    });

    Promise.all(fontPromises)
      .then(() => {
        console.log("Semua font kustom berhasil dimuat!");
        const customFontNames = customFonts.map((f) => f.name);
        const allFonts = [...new Set([...standardFonts, ...customFontNames])];
        setAvailableFonts(allFonts.sort());
      })
      .catch((err) => {
        console.error("Gagal memuat beberapa font kustom:", err);
        setAvailableFonts(standardFonts.sort());
      })
      .finally(() => {
        setAreFontsLoading(false);
      });
  }, [customFonts, isFetchingFonts]);

  return { availableFonts, areFontsLoading };
}
