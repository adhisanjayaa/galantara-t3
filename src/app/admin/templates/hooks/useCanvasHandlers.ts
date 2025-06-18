// File: src/app/admin/templates/hooks/useCanvasHandlers.ts

"use client";

import { useCallback } from "react";
import {
  type Canvas,
  type FabricObject,
  IText,
  Rect,
  FabricImage,
} from "fabric";
import QRCode from "qrcode";
import { toast } from "sonner";

// Tipe untuk state dan action dari reducer history
type HistoryState = { history: string[]; index: number };
type HistoryAction =
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESET"; payload: string }
  | { type: "SAVE"; payload: string };

// --- [FIX] Definisikan tipe kustom untuk objek gambar QR Code ---
interface IQrCodeImage extends FabricImage {
  isQrcode: true;
  qrcodeData: string;
  qrcodeFill: string;
}

// Tipe untuk props yang diterima oleh custom hook ini
interface UseCanvasHandlersProps {
  canvasInstance: Canvas | null;
  activeObject: FabricObject | null;
  historyState: HistoryState;
  dispatchHistory: React.Dispatch<HistoryAction>;
  isHistoryProcessing: React.RefObject<boolean>;
  saveHistory: () => void;
  setForceRender: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * Custom hook yang berisi semua fungsi untuk memanipulasi objek dan state kanvas.
 * @param props - State dan dispatcher yang diperlukan dari komponen utama.
 * @returns - Sebuah objek yang berisi semua fungsi handler.
 */
export function useCanvasHandlers({
  canvasInstance,
  activeObject,
  historyState,
  dispatchHistory,
  isHistoryProcessing,
  saveHistory,
  setForceRender,
}: UseCanvasHandlersProps) {
  /**
   * Memperbarui gambar QR Code berdasarkan data atau warna baru.
   */
  const updateQrcode = useCallback(
    async (
      qrcodeObject: IQrCodeImage, // [FIX] Gunakan tipe kustom
      options: { newColor?: string; newData?: string },
    ) => {
      if (!canvasInstance) return;

      const data = options.newData ?? qrcodeObject.qrcodeData;
      const color = options.newColor ?? qrcodeObject.qrcodeFill;

      try {
        const dataUrl = await QRCode.toDataURL(data, {
          width: 200,
          margin: 1,
          color: { dark: color, light: "#0000" }, // Latar belakang transparan
        });
        await qrcodeObject.setSrc(dataUrl);
        qrcodeObject.qrcodeData = data;
        qrcodeObject.qrcodeFill = color;
        canvasInstance.renderAll();
        saveHistory();
      } catch (err) {
        // [FIX] Hapus warning variabel tidak terpakai dengan console.error
        console.error("Gagal membuat QR Code:", err);
        toast.error("Gagal membuat QR Code. Pastikan link valid.");
      }
    },
    [canvasInstance, saveHistory],
  );

  /**
   * Mengubah properti dari objek yang aktif.
   */
  const handlePropertyChange = (prop: string, value: unknown) => {
    // [FIX] Ganti any dengan unknown
    if (!activeObject || !canvasInstance) return;
    if (prop === "fill" && (activeObject as IQrCodeImage).isQrcode) {
      void updateQrcode(activeObject as IQrCodeImage, {
        newColor: value as string,
      });
      return;
    }
    if (prop === "cornerRadius" && activeObject instanceof Rect) {
      activeObject.set("rx", value as number);
      activeObject.set("ry", value as number);
    } else {
      activeObject.set(prop as keyof FabricObject, value);
    }
    canvasInstance.renderAll();
    saveHistory();
    setForceRender((c) => c + 1); // Memaksa render ulang popover
  };

  /**
   * Mengubah data (URL) dari objek QR Code yang aktif.
   */
  const handleQrcodeDataChange = (data: string) => {
    if (!activeObject || !(activeObject as IQrCodeImage).isQrcode) return;
    (activeObject as IQrCodeImage).qrcodeData = data;
    void updateQrcode(activeObject as IQrCodeImage, { newData: data });
    setForceRender((c) => c + 1);
  };

  /**
   * Mengubah perataan teks (text align) dari objek teks yang aktif.
   */
  const handleTextAlignChange = (align: "left" | "center" | "right") => {
    if (!(activeObject instanceof IText) || !canvasInstance) return;
    activeObject.set("textAlign", align);
    canvasInstance.renderAll();
    saveHistory();
    setForceRender((c) => c + 1);
  };

  /**
   * Mengaktifkan/menonaktifkan style (bold, italic, underline) pada objek teks.
   */
  const handleToggleStyle = (style: "Bold" | "Italic" | "Underline") => {
    if (!(activeObject instanceof IText) || !canvasInstance) return;
    switch (style) {
      case "Bold":
        activeObject.set(
          "fontWeight",
          activeObject.fontWeight === "bold" ? "normal" : "bold",
        );
        break;
      case "Italic":
        activeObject.set(
          "fontStyle",
          activeObject.fontStyle === "italic" ? "normal" : "italic",
        );
        break;
      case "Underline":
        activeObject.set("underline", !activeObject.underline);
        break;
    }
    canvasInstance.renderAll();
    saveHistory();
    setForceRender((c) => c + 1);
  };

  /**
   * Menambah atau mengurangi ukuran font.
   */
  const handleFontSizeStep = (step: number) => {
    if (!(activeObject instanceof IText)) return;
    const newSize = Math.max(1, (activeObject.fontSize || 0) + step);
    handlePropertyChange("fontSize", newSize);
  };

  /**
   * Mengunci atau membuka kunci objek agar tidak bisa digerakkan/diubah ukurannya.
   */
  const handleToggleLock = () => {
    if (!activeObject || !canvasInstance) return;
    const isLocked = !activeObject.lockMovementX;
    activeObject.set({
      lockMovementX: isLocked,
      lockMovementY: isLocked,
      lockRotation: isLocked,
      lockScalingX: isLocked,
      lockScalingY: isLocked,
      hasControls: !isLocked,
    });
    canvasInstance.renderAll();
    setForceRender((c) => c + 1);
  };

  /**
   * Menghapus objek yang sedang aktif dari kanvas.
   */
  const handleDeleteObject = () => {
    if (activeObject && canvasInstance) {
      canvasInstance.remove(activeObject);
      canvasInstance.discardActiveObject();
      canvasInstance.renderAll();
      saveHistory();
    }
  };

  /**
   * Mengembalikan state kanvas ke kondisi sebelumnya (Undo).
   */
  const handleUndo = async () => {
    if (historyState.index > 0 && canvasInstance) {
      isHistoryProcessing.current = true;
      const targetState = historyState.history[historyState.index - 1]!;
      await canvasInstance.loadFromJSON(targetState, () => {
        canvasInstance.renderAll();
      });
      dispatchHistory({ type: "UNDO" });
      isHistoryProcessing.current = false;
    }
  };

  /**
   * Mengembalikan state kanvas ke kondisi setelahnya (Redo).
   */
  const handleRedo = async () => {
    if (
      historyState.index < historyState.history.length - 1 &&
      canvasInstance
    ) {
      isHistoryProcessing.current = true;
      const targetState = historyState.history[historyState.index + 1]!;
      await canvasInstance.loadFromJSON(targetState, () => {
        canvasInstance.renderAll();
      });
      dispatchHistory({ type: "REDO" });
      isHistoryProcessing.current = false;
    }
  };

  /**
   * Memindahkan objek satu lapis ke depan (Bring Forward).
   */
  const handleBringObjectForward = () => {
    if (activeObject && canvasInstance) {
      canvasInstance.bringObjectForward(activeObject);
      canvasInstance.renderAll();
      saveHistory();
    }
  };

  /**
   * Memindahkan objek satu lapis ke belakang (Send Backward).
   */
  const handleSendObjectBackwards = () => {
    if (activeObject && canvasInstance) {
      canvasInstance.sendObjectBackwards(activeObject);
      canvasInstance.renderAll();
      saveHistory();
    }
  };

  /**
   * Menambahkan objek QR Code baru ke kanvas.
   */
  const handleAddQrcode = useCallback(async () => {
    if (!canvasInstance) return;
    const qrcodeValue = "https://galantara.com";
    try {
      const dataUrl = await QRCode.toDataURL(qrcodeValue, {
        width: 200,
        margin: 1,
        color: { dark: "#000000", light: "#0000" },
      });
      const img = await FabricImage.fromURL(dataUrl);

      // [FIX] Assign properti kustom dengan benar
      const qrcodeImage = img as IQrCodeImage;
      qrcodeImage.isQrcode = true;
      qrcodeImage.qrcodeData = qrcodeValue;
      qrcodeImage.qrcodeFill = "#000000";

      canvasInstance.add(qrcodeImage);
      canvasInstance.centerObject(qrcodeImage);
      canvasInstance.setActiveObject(qrcodeImage);
      saveHistory();
    } catch (err) {
      console.error(err);
      toast.error("Gagal membuat QR code.");
    }
  }, [canvasInstance, saveHistory]);

  return {
    handlePropertyChange,
    handleQrcodeDataChange,
    handleTextAlignChange,
    handleToggleStyle,
    handleFontSizeStep,
    handleToggleLock,
    handleDeleteObject,
    handleUndo,
    handleRedo,
    handleBringObjectForward,
    handleSendObjectBackwards,
    handleAddQrcode,
  };
}
