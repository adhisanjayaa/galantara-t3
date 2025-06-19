// File: src/app/(main)/(dashboard)/my-designs/components/DesignPreviewDialog.tsx

"use client";

import { useEffect, useRef } from "react";
import type { Canvas } from "fabric";
import { api } from "~/trpc/react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";
import { Loader2 } from "lucide-react";
import CanvasEditor from "~/app/design/components/CanvasEditor";

interface DesignPreviewDialogProps {
  designId: string | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function DesignPreviewDialog({
  designId,
  isOpen,
  onOpenChange,
}: DesignPreviewDialogProps) {
  const {
    data: design,
    isLoading,
    isError,
  } = api.design.getDesignById.useQuery(
    { id: designId! },
    {
      enabled: !!designId && isOpen,
    },
  );

  const canvasRefs = useRef<Map<number, Canvas>>(new Map());

  // Effect untuk memuat data JSON ke canvas
  useEffect(() => {
    if (design?.designData && canvasRefs.current.size > 0) {
      const designPages = design.designData as unknown as { data: object }[];

      designPages.forEach((page, index) => {
        const canvas = canvasRefs.current.get(index);
        if (canvas) {
          const artboardWidth =
            design.product.designTemplate?.artboardWidth ?? 1200;
          const artboardHeight =
            design.product.designTemplate?.artboardHeight ?? 800;

          // Sesuaikan ukuran wrapper agar canvas tidak melebihi batas
          const parent = canvas.getElement().parentElement;
          if (parent) {
            parent.style.width = `${artboardWidth}px`;
            parent.style.height = `${artboardHeight}px`;
          }

          canvas.setDimensions({
            width: artboardWidth,
            height: artboardHeight,
          });

          canvas.loadFromJSON(page.data, () => {
            canvas.renderAll();
            canvas.selection = false;
            canvas.forEachObject((obj) => {
              obj.selectable = false;
              obj.evented = false;
            });
          });
        }
      });
    }
  }, [design]);

  // [NEW] Effect untuk membersihkan (dispose) semua kanvas saat dialog ditutup/unmount
  useEffect(() => {
    // 1. Tangkap nilai .current ke dalam sebuah variabel lokal
    const capturedCanvasRefs = canvasRefs.current;

    // 2. Fungsi cleanup sekarang menggunakan variabel lokal tersebut
    return () => {
      capturedCanvasRefs.forEach((canvas) => {
        canvas.dispose();
      });
      capturedCanvasRefs.clear();
    };
  }, []); // Dengan dependency array kosong, cleanup ini hanya berjalan sekali saat komponen unmount

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Pratinjau Desain: {design?.name ?? ""}</DialogTitle>
          <DialogDescription>
            Gunakan panah untuk melihat setiap halaman dari desain Anda.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center p-4">
          {isLoading && (
            <div className="flex h-96 flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Memuat pratinjau...</p>
            </div>
          )}
          {isError && (
            <p className="text-destructive">Gagal memuat pratinjau.</p>
          )}
          {design && (
            <Carousel className="w-full max-w-xl">
              <CarouselContent>
                {(design.designData as unknown as object[]).map((_, index) => (
                  <CarouselItem key={index}>
                    <div className="p-1">
                      {/* [MODIFIED] Bungkus CanvasEditor agar bisa diatur ukurannya */}
                      <div
                        className="mx-auto bg-gray-100 shadow-md"
                        style={{ width: "auto", height: "auto" }}
                      >
                        <CanvasEditor
                          onReady={(canvas) => {
                            if (canvas) {
                              canvasRefs.current.set(index, canvas);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
