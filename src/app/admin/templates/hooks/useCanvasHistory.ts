// File: src/app/admin/templates/hooks/useCanvasHistory.ts
"use client";

import { useState, useCallback, useRef } from "react";
import type { Canvas, FabricObject } from "fabric";

/**
 * Antarmuka (Interface) untuk semua perintah (Command).
 * Setiap aksi yang bisa di-undo/redo harus mengimplementasikan ini.
 */
export interface ICommand {
  execute(): void;
  undo(): void;
}

// --- Kelas-kelas Perintah Konkret ---

/**
 * Command untuk menangani pembaruan properti objek (posisi, skala, warna, dll).
 */
class UpdateObjectCommand implements ICommand {
  constructor(
    private canvas: Canvas,
    private target: FabricObject,
    private initialState: Record<string, unknown>,
    private finalState: Record<string, unknown>,
  ) {}

  execute(): void {
    const stateToApply = { ...this.finalState };
    delete stateToApply.type;
    this.target.set(stateToApply);
    this.target.setCoords();
    this.canvas.requestRenderAll();
  }

  undo(): void {
    const stateToRestore = { ...this.initialState };
    delete stateToRestore.type;
    this.target.set(stateToRestore);
    this.target.setCoords();
    this.canvas.requestRenderAll();
  }
}

/**
 * Command untuk menangani penambahan objek baru ke kanvas.
 */
class AddObjectCommand implements ICommand {
  constructor(
    private canvas: Canvas,
    private target: FabricObject,
  ) {}

  execute(): void {
    this.canvas.add(this.target);
    this.canvas.setActiveObject(this.target);
  }

  undo(): void {
    this.canvas.remove(this.target);
  }
}

/**
 * Command untuk menangani penghapusan objek dari kanvas.
 */
class RemoveObjectCommand implements ICommand {
  private initialIndex = -1;
  private wasActive = false;

  constructor(
    private canvas: Canvas,
    private target: FabricObject,
  ) {
    this.initialIndex = this.canvas.getObjects().indexOf(this.target);
    this.wasActive = this.canvas.getActiveObject() === this.target;
  }

  execute(): void {
    this.canvas.remove(this.target);
  }

  undo(): void {
    // Masukkan kembali objek ke posisi layer aslinya
    this.canvas.insertAt(this.initialIndex, this.target);
    if (this.wasActive) {
      this.canvas.setActiveObject(this.target);
    }
    this.canvas.renderAll();
  }
}

/**
 * Command baru untuk menangani aksi penggantian objek,
 * seperti saat crop atau mengganti gambar.
 */
class ReplaceObjectCommand implements ICommand {
  private originalIndex: number;

  constructor(
    private canvas: Canvas,
    private oldObject: FabricObject,
    private newObject: FabricObject,
  ) {
    // Simpan posisi layer dari objek lama
    this.originalIndex = canvas.getObjects().indexOf(oldObject);
  }

  execute(): void {
    // Hapus objek lama, tambahkan yang baru di posisi yang sama
    this.canvas.remove(this.oldObject);
    this.canvas.insertAt(this.originalIndex, this.newObject);
    this.canvas.setActiveObject(this.newObject);
    this.canvas.renderAll();
  }

  undo(): void {
    // Hapus objek baru, kembalikan yang lama di posisi yang sama
    this.canvas.remove(this.newObject);
    this.canvas.insertAt(this.originalIndex, this.oldObject);
    this.canvas.setActiveObject(this.oldObject);
    this.canvas.renderAll();
  }
}

// --- Custom Hook untuk Manajemen Riwayat ---

export function useCanvasHistory(canvasInstance: Canvas | null) {
  const [undoStack, setUndoStack] = useState<ICommand[]>([]);
  const [redoStack, setRedoStack] = useState<ICommand[]>([]);
  const objectStateBeforeModify = useRef<Record<string, unknown> | null>(null);
  const isHistoryProcessing = useRef(false);

  /**
   * Menjalankan sebuah command, menambahkannya ke undo stack,
   * dan membersihkan redo stack.
   */
  const executeCommand = useCallback((command: ICommand) => {
    isHistoryProcessing.current = true;
    command.execute();
    setUndoStack((prev) => [...prev, command]);
    setRedoStack([]);
    isHistoryProcessing.current = false;
  }, []);

  /**
   * Merekam state sebuah objek sebelum dimodifikasi (misal: saat mouse down).
   */
  const recordObjectStateBeforeModify = useCallback((target: FabricObject) => {
    if (isHistoryProcessing.current) return;
    const relevantProps = [
      "left",
      "top",
      "scaleX",
      "scaleY",
      "angle",
      "skewX",
      "skewY",
      "fill",
      "stroke",
      "strokeWidth",
      "fontWeight",
      "fontStyle",
      "underline",
      "textAlign",
      "fontSize",
      "fontFamily",
      "rx",
      "ry",
      "lockMovementX",
    ];
    objectStateBeforeModify.current = target.toObject(relevantProps);
  }, []);

  /**
   * Membuat command update setelah sebuah objek selesai dimodifikasi.
   */
  const createModificationCommand = useCallback(
    (target: FabricObject) => {
      if (isHistoryProcessing.current) return;
      const initialState = objectStateBeforeModify.current;
      if (initialState && canvasInstance) {
        const finalState = target.toObject(Object.keys(initialState));
        // Hanya buat command jika ada perubahan nyata
        if (JSON.stringify(initialState) !== JSON.stringify(finalState)) {
          const command = new UpdateObjectCommand(
            canvasInstance,
            target,
            initialState,
            finalState,
          );
          setUndoStack((prev) => [...prev, command]);
          setRedoStack([]);
        }
        objectStateBeforeModify.current = null;
      }
    },
    [canvasInstance],
  );

  /**
   * Melakukan aksi Undo.
   */
  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    isHistoryProcessing.current = true;
    const commandToUndo = undoStack[undoStack.length - 1];
    if (commandToUndo) {
      commandToUndo.undo();
      setUndoStack((prev) => prev.slice(0, prev.length - 1));
      setRedoStack((prev) => [commandToUndo, ...prev]);
    }
    isHistoryProcessing.current = false;
  }, [undoStack]);

  /**
   * Melakukan aksi Redo.
   */
  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    isHistoryProcessing.current = true;
    const commandToRedo = redoStack[0];
    if (commandToRedo) {
      commandToRedo.execute();
      setRedoStack((prev) => prev.slice(1));
      setUndoStack((prev) => [...prev, commandToRedo]);
    }
    isHistoryProcessing.current = false;
  }, [redoStack]);

  /**
   * Membersihkan semua riwayat (berguna saat ganti halaman).
   */
  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return {
    executeCommand,
    recordObjectStateBeforeModify,
    createModificationCommand,
    undo,
    redo,
    clearHistory,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undoStackLength: undoStack.length,
    redoStackLength: redoStack.length,
    commands: {
      UpdateObjectCommand,
      AddObjectCommand,
      RemoveObjectCommand,
      ReplaceObjectCommand, // Ekspor command baru
    },
  };
}
