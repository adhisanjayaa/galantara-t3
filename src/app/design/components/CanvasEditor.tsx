"use client";

import { Canvas } from "fabric";
import { useEffect, useRef } from "react";

interface CanvasEditorProps {
  initialData: object | null;
  onReady: (canvas: Canvas | null) => void;
}

export default function CanvasEditor({
  initialData,
  onReady,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasInstanceRef = useRef<Canvas | null>(null);

  useEffect(() => {
    if (canvasRef.current && !canvasInstanceRef.current) {
      const canvas = new Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: "#ffffff",
      });
      canvasInstanceRef.current = canvas;
      onReady(canvas);
    }

    return () => {
      onReady(null);
      // [FIX untuk prefer-optional-chain]
      canvasInstanceRef.current?.dispose();
      canvasInstanceRef.current = null;
    };
  }, [onReady]);

  useEffect(() => {
    const loadData = async () => {
      const canvas = canvasInstanceRef.current;
      if (canvas?.contextContainer) {
        canvas.clear();
        if (initialData) {
          try {
            await canvas.loadFromJSON(initialData);
            canvas.renderAll();
          } catch (err) {
            console.error("Gagal memuat JSON ke canvas:", err);
          }
        }
      }
    };

    // [FIX untuk no-floating-promises]
    // Memanggil fungsi async dan menambahkan .catch() untuk menangani error.
    loadData().catch((err) => {
      console.error(
        "Terjadi error tak terduga saat menjalankan loadData:",
        err,
      );
    });
  }, [initialData]);

  return (
    <div className="flex h-full w-full items-center justify-center overflow-auto p-4">
      <canvas ref={canvasRef} className="rounded-md shadow-lg" />
    </div>
  );
}
