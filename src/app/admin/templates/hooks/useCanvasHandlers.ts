// File: src/app/admin/templates/hooks/useCanvasHandlers.ts
"use client";

import { useCallback, useRef } from "react";
import {
  type Canvas,
  type FabricObject,
  Rect,
  Circle,
  Textbox,
  FabricImage,
} from "fabric";
import QRCode from "qrcode";
import { toast } from "sonner";
import type { ICommand } from "./useCanvasHistory";

// Definisikan tipe untuk gambar QR code
interface IQrCodeImage extends FabricImage {
  isQrcode: true;
  qrcodeData: string;
  qrcodeFill: string;
}

// Definisikan tipe untuk constructor Command yang akan diterima sebagai props
interface ICommands {
  UpdateObjectCommand: new (
    canvas: Canvas,
    target: FabricObject,
    initialState: Record<string, unknown>,
    finalState: Record<string, unknown>,
  ) => ICommand;
  AddObjectCommand: new (canvas: Canvas, target: FabricObject) => ICommand;
  RemoveObjectCommand: new (canvas: Canvas, target: FabricObject) => ICommand;
}

// Definisikan props untuk hook useCanvasHandlers
interface UseCanvasHandlersProps {
  canvasInstance: Canvas | null;
  activeObject: FabricObject | null;
  executeCommand: (command: ICommand) => void;
  Commands: ICommands;
}

export function useCanvasHandlers({
  canvasInstance,
  activeObject,
  executeCommand,
  Commands,
}: UseCanvasHandlersProps) {
  // --- Refs untuk menangani perubahan interaktif ---
  const isChangingInteractively = useRef(false);
  const objectStateBeforeInteractiveChange = useRef<Record<
    string,
    unknown
  > | null>(null);

  // --- Handlers untuk Menambah Objek ---

  const handleAddText = useCallback(() => {
    if (!canvasInstance) return;
    const text = new Textbox("Teks Anda", {
      fontSize: 48,
      fill: "#000000",
      padding: 10,
      width: 250,
    });
    canvasInstance.centerObject(text);
    const command = new Commands.AddObjectCommand(canvasInstance, text);
    executeCommand(command);
  }, [canvasInstance, Commands.AddObjectCommand, executeCommand]);

  const handleAddRectangle = useCallback(() => {
    if (!canvasInstance) return;
    const rect = new Rect({ width: 200, height: 150, fill: "#cccccc" });
    canvasInstance.centerObject(rect);
    const command = new Commands.AddObjectCommand(canvasInstance, rect);
    executeCommand(command);
  }, [canvasInstance, Commands.AddObjectCommand, executeCommand]);

  const handleAddCircle = useCallback(() => {
    if (!canvasInstance) return;
    const circle = new Circle({ radius: 80, fill: "#cccccc" });
    canvasInstance.centerObject(circle);
    const command = new Commands.AddObjectCommand(canvasInstance, circle);
    executeCommand(command);
  }, [canvasInstance, Commands.AddObjectCommand, executeCommand]);

  const handleAddQrcode = useCallback(async () => {
    if (!canvasInstance) return;
    const qrcodeValue = "https://galantara.com";
    try {
      const dataUrl = await QRCode.toDataURL(qrcodeValue, {
        width: 200,
        margin: 1,
        color: { dark: "#000000", light: "#0000" }, // Latar belakang transparan
      });
      const img = await FabricImage.fromURL(dataUrl);
      Object.assign(img, {
        isQrcode: true,
        qrcodeData: qrcodeValue,
        qrcodeFill: "#000000",
      });
      canvasInstance.centerObject(img);
      const command = new Commands.AddObjectCommand(canvasInstance, img);
      executeCommand(command);
    } catch (err) {
      console.error("Gagal membuat QR code:", err);
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan tidak dikenal.";
      toast.error(`Gagal membuat QR code: ${message}`);
    }
  }, [canvasInstance, executeCommand, Commands.AddObjectCommand]);

  // --- Handlers untuk Mengubah Properti Objek ---

  const updateQrcode = useCallback(
    async (
      qrcodeObject: IQrCodeImage,
      options: { newColor?: string; newData?: string },
    ) => {
      if (!canvasInstance) return;
      const data = options.newData ?? qrcodeObject.qrcodeData;
      const color = options.newColor ?? qrcodeObject.qrcodeFill;
      try {
        const dataUrl = await QRCode.toDataURL(data, {
          width: 200,
          margin: 1,
          color: { dark: color, light: "#0000" },
        });
        await qrcodeObject.setSrc(dataUrl, { crossOrigin: "anonymous" });
        qrcodeObject.qrcodeData = data;
        qrcodeObject.qrcodeFill = color;
        canvasInstance.renderAll();
      } catch (err) {
        toast.error("Gagal memperbarui QR Code. Pastikan link valid.");
      }
    },
    [canvasInstance],
  );

  /**
   * Untuk perubahan properti yang terjadi sekali klik (misal: bold, ganti font).
   */
  const handlePropertyChange = useCallback(
    (prop: string, value: unknown) => {
      if (!activeObject || !canvasInstance) return;
      const initialState = activeObject.toObject();
      if (prop === "cornerRadius" && activeObject instanceof Rect) {
        activeObject.set({ rx: value as number, ry: value as number });
      } else {
        activeObject.set(prop as keyof FabricObject, value);
      }
      const finalState = activeObject.toObject();
      const command = new Commands.UpdateObjectCommand(
        canvasInstance,
        activeObject,
        initialState,
        finalState,
      );
      executeCommand(command);
    },
    [
      activeObject,
      canvasInstance,
      Commands.UpdateObjectCommand,
      executeCommand,
    ],
  );

  /**
   * Merekam state objek sebelum interaksi (untuk slider, color picker).
   * Dipanggil pada onFocus atau onPointerDown.
   */
  const recordStateBeforeInteractiveChange = useCallback(() => {
    if (activeObject) {
      const relevantProps = [
        "fill",
        "charSpacing",
        "lineHeight",
        "isQrcode",
        "qrcodeFill",
      ];
      objectStateBeforeInteractiveChange.current =
        activeObject.toObject(relevantProps);
    }
  }, [activeObject]);

  /**
   * Mengubah properti objek secara visual secara real-time tanpa menyimpan ke history.
   * Dipanggil pada onInput atau onValueChange.
   */
  const handleInteractiveChange = useCallback(
    (prop: string, value: string | number) => {
      if (!activeObject || !canvasInstance) return;
      if (prop === "fill" && (activeObject as IQrCodeImage).isQrcode) {
        void updateQrcode(activeObject as IQrCodeImage, {
          newColor: value as string,
        });
      } else {
        activeObject.set(prop as keyof FabricObject, value);
      }
      isChangingInteractively.current = true;
      canvasInstance.renderAll();
    },
    [activeObject, canvasInstance, updateQrcode],
  );

  /**
   * Menyimpan perubahan final ke dalam history setelah interaksi selesai.
   * Dipanggil pada onBlur atau onPointerUp.
   */
  const handleInteractiveChangeCommit = useCallback(() => {
    if (
      isChangingInteractively.current &&
      canvasInstance &&
      activeObject &&
      objectStateBeforeInteractiveChange.current
    ) {
      const initialState = objectStateBeforeInteractiveChange.current;
      const finalState = activeObject.toObject(Object.keys(initialState));
      if (JSON.stringify(initialState) !== JSON.stringify(finalState)) {
        const command = new Commands.UpdateObjectCommand(
          canvasInstance,
          activeObject,
          initialState,
          finalState,
        );
        executeCommand(command);
      }
      isChangingInteractively.current = false;
      objectStateBeforeInteractiveChange.current = null;
    }
  }, [
    canvasInstance,
    activeObject,
    Commands.UpdateObjectCommand,
    executeCommand,
  ]);

  const handleQrcodeDataChange = useCallback(
    (data: string) => {
      if (!activeObject || !(activeObject as IQrCodeImage).isQrcode) return;
      recordStateBeforeInteractiveChange(); // Rekam state awal
      void updateQrcode(activeObject as IQrCodeImage, { newData: data }).then(
        () => {
          handleInteractiveChangeCommit(); // Commit perubahan setelah qrcode di-update
        },
      );
    },
    [
      activeObject,
      updateQrcode,
      recordStateBeforeInteractiveChange,
      handleInteractiveChangeCommit,
    ],
  );

  // --- Handlers untuk Aksi Umum ---

  const handleDeleteObject = useCallback(() => {
    if (activeObject && canvasInstance) {
      const command = new Commands.RemoveObjectCommand(
        canvasInstance,
        activeObject,
      );
      executeCommand(command);
    }
  }, [
    activeObject,
    canvasInstance,
    Commands.RemoveObjectCommand,
    executeCommand,
  ]);

  const handleBringObjectForward = useCallback(() => {
    if (activeObject && canvasInstance) {
      canvasInstance.bringObjectForward(activeObject);
      toast.info("Objek dimajukan selapis");
      // Aksi layering sederhana tidak perlu command history kompleks,
      // cukup simpan state akhir kanvas jika diperlukan.
    }
  }, [activeObject, canvasInstance]);

  const handleSendObjectBackwards = useCallback(() => {
    if (activeObject && canvasInstance) {
      canvasInstance.sendObjectBackwards(activeObject);
      toast.info("Objek dimundurkan selapis");
    }
  }, [activeObject, canvasInstance]);

  const handleDuplicateObject = useCallback(async () => {
    if (!canvasInstance || !activeObject) return;
    try {
      const cloned = await activeObject.clone([
        "isQrcode",
        "qrcodeData",
        "qrcodeFill",
      ]);
      cloned.set({
        left: (cloned.left ?? 0) + 15,
        top: (cloned.top ?? 0) + 15,
      });
      const command = new Commands.AddObjectCommand(canvasInstance, cloned);
      executeCommand(command);
    } catch (error) {
      console.error("Gagal menduplikasi objek:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan tidak dikenal.";
      toast.error(`Gagal menduplikasi objek: ${message}`);
    }
  }, [canvasInstance, activeObject, executeCommand, Commands.AddObjectCommand]);

  const handleToggleLock = useCallback(() => {
    if (!activeObject) return;
    const isLocked = !activeObject.lockMovementX;
    handlePropertyChange("lockMovementX", isLocked);
    handlePropertyChange("lockMovementY", isLocked);
    handlePropertyChange("lockRotation", isLocked);
    handlePropertyChange("lockScalingX", isLocked);
    handlePropertyChange("lockScalingY", isLocked);
    activeObject.set("hasControls", !isLocked);
    canvasInstance?.renderAll();
  }, [activeObject, handlePropertyChange, canvasInstance]);

  return {
    handleAddText,
    handleAddRectangle,
    handleAddCircle,
    handleAddQrcode,
    handlePropertyChange,
    handleDeleteObject,
    handleBringObjectForward,
    handleSendObjectBackwards,
    handleDuplicateObject,
    handleQrcodeDataChange,
    recordStateBeforeInteractiveChange,
    handleInteractiveChange,
    handleInteractiveChangeCommit,
    handleToggleLock,
  };
}
