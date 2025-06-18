"use client";

import { useEffect } from "react";
import type { Canvas, FabricObject } from "fabric";
import { Line } from "fabric";

interface UseCanvasSetupProps {
  canvasInstance: Canvas | null;
  artboardWidth: number;
  artboardHeight: number;
  setActiveObject: (obj: FabricObject | null) => void;
  saveHistory: () => void;
}

export function useCanvasSetup({
  canvasInstance,
  artboardWidth,
  artboardHeight,
  setActiveObject,
  saveHistory,
}: UseCanvasSetupProps) {
  useEffect(() => {
    if (!canvasInstance) return;

    // Pengaturan dasar canvas
    canvasInstance.setDimensions({
      width: artboardWidth,
      height: artboardHeight,
    });
    canvasInstance.backgroundColor = "white";
    canvasInstance.preserveObjectStacking = true;

    // Inisialisasi Snap Lines
    const verticalLine = new Line([0, 0, 0, 0], {
      stroke: "rgba(255, 0, 0, 0.5)",
      selectable: false,
      evented: false,
      visible: false,
      strokeWidth: 1,
      excludeFromExport: true,
    });
    const horizontalLine = new Line([0, 0, 0, 0], {
      stroke: "rgba(255, 0, 0, 0.5)",
      selectable: false,
      evented: false,
      visible: false,
      strokeWidth: 1,
      excludeFromExport: true,
    });
    canvasInstance.add(verticalLine, horizontalLine);

    const hideSnapLines = () => {
      verticalLine.visible = false;
      horizontalLine.visible = false;
      canvasInstance.requestRenderAll();
    };

    const handleObjectMoving = (e: { target?: FabricObject }) => {
      const target = e.target;
      if (!target) return;
      const snapThreshold = 6;
      const canvasWidth = canvasInstance.getWidth();
      const canvasHeight = canvasInstance.getHeight();

      verticalLine.visible = false;
      horizontalLine.visible = false;

      // --- PERBAIKAN DEPRECATION ---
      // Menggunakan getCenterPoint() yang mengembalikan { x, y }
      const canvasCenter = canvasInstance.getCenterPoint();
      const targetCenter = target.getCenterPoint();

      // Snap to Center
      // Menggunakan .x untuk properti horizontal
      if (Math.abs(targetCenter.x - canvasCenter.x) < snapThreshold) {
        target.set({ left: canvasCenter.x - target.getScaledWidth() / 2 });
        verticalLine
          .set({
            x1: canvasCenter.x,
            y1: 0,
            x2: canvasCenter.x,
            y2: canvasHeight,
          })
          .setCoords();
        verticalLine.visible = true;
      }
      // Menggunakan .y untuk properti vertikal
      if (Math.abs(targetCenter.y - canvasCenter.y) < snapThreshold) {
        target.set({ top: canvasCenter.y - target.getScaledHeight() / 2 });
        horizontalLine
          .set({
            x1: 0,
            y1: canvasCenter.y,
            x2: canvasWidth,
            y2: canvasCenter.y,
          })
          .setCoords();
        horizontalLine.visible = true;
      }

      // Snap to Edges
      if (Math.abs(target.left ?? 0) < snapThreshold) {
        target.set({ left: 0 });
        verticalLine.set({ x1: 0, y1: 0, x2: 0, y2: canvasHeight }).setCoords();
        verticalLine.visible = true;
      } else if (
        Math.abs((target.left ?? 0) + target.getScaledWidth() - canvasWidth) <
        snapThreshold
      ) {
        target.set({ left: canvasWidth - target.getScaledWidth() });
        verticalLine
          .set({ x1: canvasWidth, y1: 0, x2: canvasWidth, y2: canvasHeight })
          .setCoords();
        verticalLine.visible = true;
      }
      if (Math.abs(target.top ?? 0) < snapThreshold) {
        target.set({ top: 0 });
        horizontalLine
          .set({ x1: 0, y1: 0, x2: canvasWidth, y2: 0 })
          .setCoords();
        horizontalLine.visible = true;
      } else if (
        Math.abs((target.top ?? 0) + target.getScaledHeight() - canvasHeight) <
        snapThreshold
      ) {
        target.set({ top: canvasHeight - target.getScaledHeight() });
        horizontalLine
          .set({ x1: 0, y1: canvasHeight, x2: canvasWidth, y2: canvasHeight })
          .setCoords();
        horizontalLine.visible = true;
      }

      target.setCoords();
    };

    const handleSelection = (e: { selected?: FabricObject[] }) =>
      setActiveObject(e.selected?.[0] ?? null);

    // Event Listeners
    canvasInstance.on("selection:created", handleSelection);
    canvasInstance.on("selection:updated", handleSelection);
    canvasInstance.on("selection:cleared", () => setActiveObject(null));
    canvasInstance.on("object:modified", saveHistory);
    canvasInstance.on("object:moving", handleObjectMoving);
    canvasInstance.on("mouse:up", hideSnapLines);

    canvasInstance.renderAll();

    // Cleanup
    return () => {
      canvasInstance.off();
    };
  }, [
    canvasInstance,
    artboardWidth,
    artboardHeight,
    saveHistory,
    setActiveObject,
  ]);
}
