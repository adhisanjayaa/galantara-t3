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
  forceUpdate: () => void;
}

export function useCanvasHandlers({
  canvasInstance,
  activeObject,
  executeCommand,
  Commands,
  forceUpdate,
}: UseCanvasHandlersProps) {
  const isChangingInteractively = useRef(false);
  const objectStateBeforeInteractiveChange = useRef<Record<
    string,
    unknown
  > | null>(null);

  // Fungsi-fungsi untuk menambah objek tetap sama
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
        color: { dark: "#000000", light: "#0000" },
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
      toast.error(
        `Gagal membuat QR code: ${err instanceof Error ? err.message : "Terjadi kesalahan"}`,
      );
    }
  }, [canvasInstance, executeCommand, Commands.AddObjectCommand]);

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
        console.error("Gagal memperbarui QR code:", err);
        toast.error(
          `Gagal memperbarui QR Code: ${err instanceof Error ? err.message : "Pastikan link valid."}`,
        );
      }
    },
    [canvasInstance],
  );

  const handlePropertyChange = useCallback(
    (prop: string, value: unknown) => {
      if (!activeObject || !canvasInstance) return;
      const initialState = activeObject.toObject();
      if (prop === "cornerRadius" && activeObject instanceof Rect) {
        activeObject.set({ rx: value as number, ry: value as number });
      } else {
        activeObject.set(prop as keyof FabricObject, value);
      }
      canvasInstance.renderAll();
      const finalState = activeObject.toObject();
      const command = new Commands.UpdateObjectCommand(
        canvasInstance,
        activeObject,
        initialState,
        finalState,
      );
      executeCommand(command);
      forceUpdate(); // <-- PANGGIL FUNGSI UPDATE DI SINI
    },
    [
      activeObject,
      canvasInstance,
      Commands.UpdateObjectCommand,
      executeCommand,
      forceUpdate,
    ],
  );

  const recordStateBeforeInteractiveChange = useCallback(() => {
    if (activeObject) {
      const props = [
        "fill",
        "charSpacing",
        "lineHeight",
        "isQrcode",
        "qrcodeFill",
      ];
      objectStateBeforeInteractiveChange.current = activeObject.toObject(props);
    }
  }, [activeObject]);

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
      forceUpdate();
    }
  }, [
    canvasInstance,
    activeObject,
    Commands.UpdateObjectCommand,
    executeCommand,
    forceUpdate,
  ]);

  const handleQrcodeDataChange = useCallback(
    (data: string) => {
      if (!activeObject || !(activeObject as IQrCodeImage).isQrcode) return;
      recordStateBeforeInteractiveChange();
      void updateQrcode(activeObject as IQrCodeImage, { newData: data }).then(
        () => {
          handleInteractiveChangeCommit();
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
      forceUpdate();
    }
  }, [activeObject, canvasInstance, forceUpdate]);

  const handleSendObjectBackwards = useCallback(() => {
    if (activeObject && canvasInstance) {
      canvasInstance.sendObjectBackwards(activeObject);
      toast.info("Objek dimundurkan selapis");
      forceUpdate();
    }
  }, [activeObject, canvasInstance, forceUpdate]);

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
      toast.error(
        `Gagal menduplikasi objek: ${error instanceof Error ? error.message : "Terjadi kesalahan"}`,
      );
    }
  }, [canvasInstance, activeObject, executeCommand, Commands.AddObjectCommand]);

  const handleToggleLock = useCallback(() => {
    if (!activeObject || !canvasInstance) return;
    const props = [
      "lockMovementX",
      "lockMovementY",
      "lockRotation",
      "lockScalingX",
      "lockScalingY",
      "hasControls",
    ];
    const initialState = activeObject.toObject(props);
    const isLocked = !activeObject.lockMovementX;
    activeObject.set({
      lockMovementX: isLocked,
      lockMovementY: isLocked,
      lockRotation: isLocked,
      lockScalingX: isLocked,
      lockScalingY: isLocked,
      hasControls: !isLocked,
    });
    const finalState = activeObject.toObject(props);
    const command = new Commands.UpdateObjectCommand(
      canvasInstance,
      activeObject,
      initialState,
      finalState,
    );
    executeCommand(command);
    forceUpdate();
  }, [
    activeObject,
    canvasInstance,
    Commands.UpdateObjectCommand,
    executeCommand,
    forceUpdate,
  ]);

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
