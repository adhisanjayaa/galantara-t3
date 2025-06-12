// File: src/app/design/components/ObjectInspector.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import type { Canvas, FabricObject } from "fabric";
import { FabricText } from "fabric";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

interface ObjectInspectorProps {
  canvas: Canvas | null;
}

// Komponen untuk properti kanvas
function CanvasProperties({ canvas }: { canvas: Canvas }) {
  const [size, setSize] = useState({
    width: canvas.getWidth(),
    height: canvas.getHeight(),
  });

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSize((prev) => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  const applyCanvasSize = () => {
    canvas.setDimensions({ width: size.width, height: size.height });
    canvas.renderAll();
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Properti Kanvas</h3>
      <div className="space-y-2">
        <div>
          <Label htmlFor="canvas-width">Lebar (px)</Label>
          <Input
            id="canvas-width"
            name="width"
            type="number"
            value={size.width}
            onChange={handleSizeChange}
          />
        </div>
        <div>
          <Label htmlFor="canvas-height">Tinggi (px)</Label>
          <Input
            id="canvas-height"
            name="height"
            type="number"
            value={size.height}
            onChange={handleSizeChange}
          />
        </div>
      </div>
      <Button size="sm" onClick={applyCanvasSize} className="w-full">
        Terapkan Ukuran
      </Button>
    </div>
  );
}

export default function ObjectInspector({ canvas }: ObjectInspectorProps) {
  const [activeObject, setActiveObject] = useState<FabricObject | null>(null);

  const updateActiveObject = useCallback(() => {
    if (!canvas) return;
    setActiveObject(canvas.getActiveObject() ?? null);
  }, [canvas]);

  const deleteActiveObject = () => {
    if (activeObject && canvas) {
      canvas.remove(activeObject);
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  };

  useEffect(() => {
    if (!canvas) return;

    canvas.on("selection:created", updateActiveObject);
    canvas.on("selection:updated", updateActiveObject);
    canvas.on("selection:cleared", updateActiveObject);
    canvas.on("object:modified", updateActiveObject);

    return () => {
      canvas.off("selection:created", updateActiveObject);
      canvas.off("selection:updated", updateActiveObject);
      canvas.off("selection:cleared", updateActiveObject);
      canvas.off("object:modified", updateActiveObject);
    };
  }, [canvas, updateActiveObject]);

  const updateProperty = (prop: string, value: unknown) => {
    if (!activeObject || !canvas) return;
    activeObject.set(prop, value);
    canvas.renderAll();
    // [FIX] Ubah 'undefined' menjadi 'null' menggunakan operator '??'
    setActiveObject(canvas.getActiveObject() ?? null);
  };

  if (!activeObject) {
    return (
      <div className="bg-background p-4">
        {canvas ? (
          <CanvasProperties canvas={canvas} />
        ) : (
          <p className="text-muted-foreground text-sm">Memuat properti...</p>
        )}
      </div>
    );
  }

  const isText = activeObject instanceof FabricText;

  return (
    <div className="bg-background space-y-4 p-4">
      <h3 className="font-semibold">Properti Objek</h3>

      <div>
        <Label>Warna Isi (Fill)</Label>
        <Input
          type="color"
          value={(activeObject.fill as string) ?? "#000000"}
          onChange={(e) => updateProperty("fill", e.target.value)}
          className="h-8 w-full p-1"
        />
      </div>

      {isText && (
        <>
          <div>
            <Label>Isi Teks</Label>
            <Input
              type="text"
              value={(activeObject as FabricText).text ?? ""}
              onChange={(e) => updateProperty("text", e.target.value)}
            />
          </div>
          <div>
            <Label>Ukuran Font</Label>
            <Input
              type="number"
              value={(activeObject as FabricText).fontSize ?? 16}
              onChange={(e) =>
                updateProperty("fontSize", parseInt(e.target.value, 10) || 16)
              }
            />
          </div>
        </>
      )}

      <hr />

      <Button
        variant="destructive"
        size="sm"
        onClick={deleteActiveObject}
        className="w-full"
      >
        Hapus Objek
      </Button>
    </div>
  );
}
