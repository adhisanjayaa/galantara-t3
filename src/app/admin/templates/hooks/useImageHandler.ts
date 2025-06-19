// File: src/app/admin/templates/hooks/useImageHandler.ts
"use client";

import { useState, useRef, useCallback } from "react";
import { type Canvas, type FabricObject, FabricImage, Rect } from "fabric";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import type { ICommand } from "./useCanvasHistory";

/**
 * Mendefinisikan antarmuka (interface) untuk objek Commands yang akan diterima sebagai prop.
 * Ini memastikan bahwa semua command yang dibutuhkan tersedia.
 */
interface ICommands {
  UpdateObjectCommand: new (
    canvas: Canvas,
    target: FabricObject,
    initialState: Record<string, unknown>,
    finalState: Record<string, unknown>,
  ) => ICommand;
  AddObjectCommand: new (canvas: Canvas, target: FabricObject) => ICommand;
  RemoveObjectCommand: new (canvas: Canvas, target: FabricObject) => ICommand;
  ReplaceObjectCommand: new (
    canvas: Canvas,
    oldObject: FabricObject,
    newObject: FabricObject,
  ) => ICommand;
}

/**
 * Mendefinisikan props untuk hook useImageHandler.
 */
interface ImageHandlerProps {
  canvasInstance: Canvas | null;
  activeObject: FabricObject | null;
  executeCommand: (command: ICommand) => void;
  Commands: ICommands;
}

/**
 * Custom hook untuk mengelola semua fungsionalitas terkait gambar:
 * unggah, ganti gambar, dan crop.
 */
export function useImageHandler({
  canvasInstance,
  activeObject,
  executeCommand,
  Commands,
}: ImageHandlerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const cropRectRef = useRef<Rect | null>(null);
  const originalImageRef = useRef<FabricImage | null>(null);
  const createPresignedUrlMutation =
    api.storage.createPresignedUrl.useMutation();

  /**
   * Menangani unggahan file gambar, baik untuk menambah gambar baru
   * maupun mengganti gambar yang sudah ada.
   */
  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!canvasInstance) return;
      const file = e.target.files?.[0];
      if (!file) return;

      const objectToReplace = activeObject;
      const isReplacing = objectToReplace instanceof FabricImage;

      setIsUploading(true);
      toast.info(isReplacing ? "Mengganti gambar..." : "Mengunggah gambar...");

      try {
        const { uploadUrl, publicUrl } =
          await createPresignedUrlMutation.mutateAsync({ fileType: file.type });

        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        const cacheBustedUrl = `${publicUrl}?t=${new Date().getTime()}`;
        const newImg = await FabricImage.fromURL(cacheBustedUrl, undefined, {
          crossOrigin: "anonymous",
        });

        if (isReplacing && objectToReplace) {
          // Logika untuk mengganti gambar
          const oldImg = objectToReplace;
          const newScale = oldImg.getScaledWidth() / (newImg.width ?? 1);
          newImg.set({
            left: oldImg.left,
            top: oldImg.top,
            angle: oldImg.angle ?? 0,
            scaleX: newScale,
            scaleY: newScale,
          });
          const command = new Commands.ReplaceObjectCommand(
            canvasInstance,
            oldImg,
            newImg,
          );
          executeCommand(command);
        } else {
          // Logika untuk menambah gambar baru
          newImg.scaleToWidth(200);
          canvasInstance.centerObject(newImg);
          const command = new Commands.AddObjectCommand(canvasInstance, newImg);
          executeCommand(command);
        }

        toast.success(
          isReplacing
            ? "Gambar berhasil diganti!"
            : "Gambar berhasil ditambahkan!",
        );
      } catch (error) {
        console.error("Gagal unggah gambar:", error);
        toast.error("Gagal mengunggah gambar.");
      } finally {
        setIsUploading(false);
        if (imageInputRef.current) imageInputRef.current.value = "";
      }
    },
    [
      canvasInstance,
      activeObject,
      createPresignedUrlMutation,
      executeCommand,
      Commands,
    ],
  );

  /**
   * Memicu dialog pemilihan file.
   */
  const triggerImageUpload = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  /**
   * Masuk ke mode crop.
   */
  const enterCropMode = useCallback(() => {
    if (!canvasInstance || !(activeObject instanceof FabricImage)) return;

    setIsCropping(true);
    originalImageRef.current = activeObject;

    // Nonaktifkan interaksi dengan objek lain
    canvasInstance.getObjects().forEach((obj) => {
      obj.selectable = false;
      obj.evented = false;
    });

    // Buat kotak area crop
    const cropRect = new Rect({
      left: activeObject.left,
      top: activeObject.top,
      width: activeObject.getScaledWidth(),
      height: activeObject.getScaledHeight(),
      fill: "rgba(0,0,0,0.3)",
      stroke: "rgba(255, 255, 255, 0.7)",
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      hasControls: true,
      lockRotation: true,
      excludeFromExport: true,
    });

    canvasInstance.add(cropRect);
    canvasInstance.setActiveObject(cropRect);
    cropRectRef.current = cropRect;
    canvasInstance.renderAll();
  }, [canvasInstance, activeObject]);

  /**
   * Keluar dari mode crop tanpa menyimpan.
   */
  const exitCropMode = useCallback(() => {
    if (!canvasInstance) return;
    setIsCropping(false);
    if (cropRectRef.current) {
      canvasInstance.remove(cropRectRef.current);
      cropRectRef.current = null;
    }
    // Aktifkan kembali interaksi dengan semua objek
    canvasInstance.getObjects().forEach((obj) => {
      obj.selectable = true;
      obj.evented = true;
    });
    if (originalImageRef.current) {
      canvasInstance.setActiveObject(originalImageRef.current);
      originalImageRef.current = null;
    }
    canvasInstance.renderAll();
  }, [canvasInstance]);

  /**
   * Menerapkan crop, membuat gambar baru, dan mencatatnya ke history.
   */
  const applyCrop = useCallback(async () => {
    if (!canvasInstance || !originalImageRef.current || !cropRectRef.current)
      return;

    const fabricImg = originalImageRef.current;
    const cropZone = cropRectRef.current;

    try {
      const imgBounds = fabricImg.getBoundingRect();
      const zoneBounds = cropZone.getBoundingRect();

      const intersectLeft = Math.max(imgBounds.left, zoneBounds.left);
      const intersectTop = Math.max(imgBounds.top, zoneBounds.top);
      const intersectRight = Math.min(
        imgBounds.left + imgBounds.width,
        zoneBounds.left + zoneBounds.width,
      );
      const intersectBottom = Math.min(
        imgBounds.top + imgBounds.height,
        zoneBounds.top + zoneBounds.height,
      );

      const intersectWidth = intersectRight - intersectLeft;
      const intersectHeight = intersectBottom - intersectTop;

      if (intersectWidth <= 0 || intersectHeight <= 0) {
        toast.warning("Area crop berada di luar gambar.");
        exitCropMode();
        return;
      }

      const src = fabricImg.getSrc?.();
      if (!src) throw new Error("Tidak dapat mengambil URL sumber gambar.");
      const safeImg = new Image();
      safeImg.crossOrigin = "anonymous";
      safeImg.src = src;
      await new Promise<void>((resolve, reject) => {
        safeImg.onload = () => resolve();
        safeImg.onerror = reject;
      });

      const scaleX = fabricImg.scaleX ?? 1;
      const scaleY = fabricImg.scaleY ?? 1;
      const sourceX = (intersectLeft - imgBounds.left) / scaleX;
      const sourceY = (intersectTop - imgBounds.top) / scaleY;
      const sourceWidth = intersectWidth / scaleX;
      const sourceHeight = intersectHeight / scaleY;

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = sourceWidth;
      tempCanvas.height = sourceHeight;
      const ctx = tempCanvas.getContext("2d");
      if (!ctx) throw new Error("Konteks kanvas tidak tersedia");
      ctx.drawImage(
        safeImg,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        sourceWidth,
        sourceHeight,
      );

      const croppedDataUrl = tempCanvas.toDataURL();
      const croppedImg = await FabricImage.fromURL(croppedDataUrl, undefined, {
        crossOrigin: "anonymous",
      });

      croppedImg.set({ left: intersectLeft, top: intersectTop });
      croppedImg.scaleToWidth(intersectWidth);

      const command = new Commands.ReplaceObjectCommand(
        canvasInstance,
        fabricImg,
        croppedImg,
      );
      executeCommand(command);
    } catch (err) {
      console.error("Gagal melakukan crop:", err);
      toast.error("Gagal menerapkan crop.");
    } finally {
      exitCropMode();
    }
  }, [canvasInstance, executeCommand, Commands, exitCropMode]);

  return {
    isUploading,
    isCropping,
    imageInputRef,
    handleImageUpload,
    triggerImageUpload,
    enterCropMode,
    exitCropMode,
    applyCrop,
  };
}
