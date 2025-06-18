"use client";

import { Canvas } from "fabric";
import { useEffect, useRef } from "react";

interface CanvasEditorProps {
  onReady: (canvas: Canvas | null) => void;
}

export default function CanvasEditor({ onReady }: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasInstanceRef = useRef<Canvas | null>(null);

  useEffect(() => {
    if (
      canvasRef.current &&
      containerRef.current &&
      !canvasInstanceRef.current
    ) {
      // Inisialisasi canvas dengan ukuran container induknya
      const canvas = new Canvas(canvasRef.current, {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        // Latar belakang di sini tidak lagi relevan karena akan ditutupi artboard
        backgroundColor: "transparent",
      });
      canvasInstanceRef.current = canvas;
      onReady(canvas);
    }

    return () => {
      if (canvasInstanceRef.current) {
        onReady(null);
        canvasInstanceRef.current.dispose();
        canvasInstanceRef.current = null;
      }
    };
  }, [onReady]);

  return (
    // Container ini akan digunakan untuk menentukan ukuran canvas
    <div ref={containerRef} className="h-full w-full">
      <canvas ref={canvasRef} />
    </div>
  );
}
