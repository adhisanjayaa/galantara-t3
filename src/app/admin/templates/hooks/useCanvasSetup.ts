// File: src/app/admin/templates/hooks/useCanvasSetup.ts
"use client";

import { useEffect } from "react";
import {
  type Canvas,
  type FabricObject,
  type ModifiedEvent,
  type TPointerEventInfo,
  Line,
} from "fabric";

interface UseCanvasSetupProps {
  canvasInstance: Canvas | null;
  artboardWidth: number;
  artboardHeight: number;
  setActiveObject: (obj: FabricObject | null) => void;
  isCropping: boolean;
  recordObjectStateBeforeModify: (target: FabricObject) => void;
  createModificationCommand: (target: FabricObject) => void;
}

export function useCanvasSetup({
  canvasInstance,
  artboardWidth,
  artboardHeight,
  setActiveObject,
  isCropping,
  recordObjectStateBeforeModify,
  createModificationCommand,
}: UseCanvasSetupProps) {
  // Effect untuk setup event listeners
  useEffect(() => {
    if (!canvasInstance) return;

    canvasInstance.preserveObjectStacking = true;

    canvasInstance.off();

    const handleSelection = (e: { selected?: FabricObject[] }) => {
      if (!isCropping) {
        setActiveObject(e.selected?.[0] ?? null);
      }
    };

    const onMouseDown = (e: TPointerEventInfo) => {
      if (e.target) {
        recordObjectStateBeforeModify(e.target);
      }
    };

    const onObjectModified = (e: ModifiedEvent) => {
      if (e.target) {
        createModificationCommand(e.target);
      }
    };

    const snapThreshold = 6;

    const verticalLine = new Line([0, 0, 0, 0], {
      stroke: "rgba(255, 0, 0, 0.7)",
      strokeWidth: 1,
      selectable: false,
      evented: false,
      visible: false,
      excludeFromExport: true,
    });
    const horizontalLine = new Line([0, 0, 0, 0], {
      stroke: "rgba(255, 0, 0, 0.7)",
      strokeWidth: 1,
      selectable: false,
      evented: false,
      visible: false,
      excludeFromExport: true,
    });
    canvasInstance.add(verticalLine, horizontalLine);

    const onObjectMoving = (e: { target?: FabricObject }) => {
      const target = e.target;
      if (!target) return;

      const canvasWidth = canvasInstance.getWidth();
      const canvasHeight = canvasInstance.getHeight();
      const canvasCenter = canvasInstance.getCenterPoint();
      const targetCenter = target.getCenterPoint();
      const targetWidth = target.getScaledWidth();
      const targetHeight = target.getScaledHeight();

      verticalLine.visible = false;
      horizontalLine.visible = false;

      // Snap ke tengah vertikal
      if (Math.abs(targetCenter.x - canvasCenter.x) < snapThreshold) {
        target.set({ left: canvasCenter.x - targetWidth / 2 });
        verticalLine
          .set({
            x1: canvasCenter.x,
            x2: canvasCenter.x,
            y1: 0,
            y2: canvasHeight,
          })
          .setCoords();
        verticalLine.visible = true;
      }
      // Snap ke tepi kiri
      else if (Math.abs(target.left ?? 0) < snapThreshold) {
        target.set({ left: 0 });
        verticalLine.set({ x1: 0, x2: 0, y1: 0, y2: canvasHeight }).setCoords();
        verticalLine.visible = true;
      }
      // Snap ke tepi kanan
      else if (
        Math.abs((target.left ?? 0) + targetWidth - canvasWidth) < snapThreshold
      ) {
        target.set({ left: canvasWidth - targetWidth });
        verticalLine
          .set({ x1: canvasWidth, x2: canvasWidth, y1: 0, y2: canvasHeight })
          .setCoords();
        verticalLine.visible = true;
      }

      // Snap ke tengah horizontal
      if (Math.abs(targetCenter.y - canvasCenter.y) < snapThreshold) {
        target.set({ top: canvasCenter.y - targetHeight / 2 });
        horizontalLine
          .set({
            y1: canvasCenter.y,
            y2: canvasCenter.y,
            x1: 0,
            x2: canvasWidth,
          })
          .setCoords();
        horizontalLine.visible = true;
      }
      // Snap ke tepi atas
      else if (Math.abs(target.top ?? 0) < snapThreshold) {
        target.set({ top: 0 });
        horizontalLine
          .set({ y1: 0, y2: 0, x1: 0, x2: canvasWidth })
          .setCoords();
        horizontalLine.visible = true;
      }
      // Snap ke tepi bawah
      else if (
        Math.abs((target.top ?? 0) + targetHeight - canvasHeight) <
        snapThreshold
      ) {
        target.set({ top: canvasHeight - targetHeight });
        horizontalLine
          .set({ y1: canvasHeight, y2: canvasHeight, x1: 0, x2: canvasWidth })
          .setCoords();
        horizontalLine.visible = true;
      }

      if (verticalLine.visible) canvasInstance.bringObjectToFront(verticalLine);
      if (horizontalLine.visible)
        canvasInstance.bringObjectToFront(horizontalLine);

      target.setCoords();
      canvasInstance.renderAll();
    };

    const hideLines = () => {
      verticalLine.visible = false;
      horizontalLine.visible = false;
      canvasInstance.renderAll();
    };

    canvasInstance.on({
      "selection:created": handleSelection,
      "selection:updated": handleSelection,
      "selection:cleared": (_e) => {
        setActiveObject(null);
        hideLines();
      },
      "mouse:down": onMouseDown,
      "object:modified": onObjectModified,
      "object:moving": onObjectMoving,
      "mouse:up": hideLines,
    });

    return () => {
      if (canvasInstance) {
        canvasInstance.off();
        canvasInstance.remove(verticalLine, horizontalLine);
      }
    };
  }, [
    canvasInstance,
    setActiveObject,
    isCropping,
    recordObjectStateBeforeModify,
    createModificationCommand,
  ]);

  useEffect(() => {
    if (canvasInstance) {
      canvasInstance.setDimensions({
        width: artboardWidth,
        height: artboardHeight,
      });
      canvasInstance.calcOffset();
      canvasInstance.renderAll();
    }
  }, [artboardWidth, artboardHeight, canvasInstance]);
}
