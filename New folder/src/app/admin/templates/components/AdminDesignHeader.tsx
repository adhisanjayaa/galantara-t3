// File: src/app/admin/templates/components/AdminDesignHeader.tsx

"use client";

import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import type { Canvas } from "fabric";
import { Save, Loader2, ArrowLeft, Undo2, Redo2 } from "lucide-react";
import { Label } from "~/components/ui/label";

// [FIX] Definisikan tipe spesifik untuk state halaman untuk menghindari 'any'.
type PageState = {
  name: string;
  data: Record<string, unknown>;
};

/**
 * Interface for the props of the AdminDesignHeader component.
 */
interface AdminDesignHeaderProps {
  templateId: string | null;
  templateName: string;
  setTemplateName: (name: string) => void;
  artboardWidth: number;
  setArtboardWidth: (width: number) => void;
  artboardHeight: number;
  setArtboardHeight: (height: number) => void;
  canvasInstance: Canvas | null;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  getPagesForSave: () => PageState[]; // [FIX] Gunakan tipe PageState yang sudah didefinisikan.
}

/**
 * Header component for the admin template editor.
 * Manages template name, artboard dimensions, and save/history actions.
 */
export default function AdminDesignHeader({
  templateId,
  templateName,
  setTemplateName,
  artboardWidth,
  setArtboardWidth,
  artboardHeight,
  setArtboardHeight,
  canvasInstance,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  getPagesForSave,
}: AdminDesignHeaderProps) {
  const router = useRouter();
  const utils = api.useUtils();

  const saveMutation = api.admin.createOrUpdateDesignTemplate.useMutation({
    onSuccess: (data) => {
      toast.success("Template berhasil disimpan!");
      if (!templateId) {
        router.replace(`/admin/templates/${data.id}`);
      }
      void utils.admin.getDesignTemplates.invalidate();
    },
    onError: (error) => {
      toast.error(`Gagal menyimpan: ${error.message}`);
    },
  });

  const handleSave = () => {
    if (!canvasInstance || !templateName) {
      toast.error("Nama template tidak boleh kosong.");
      return;
    }

    const designData = getPagesForSave();

    saveMutation.mutate({
      id: templateId ?? undefined,
      name: templateName,
      // Backend mengharapkan array of JSON, jadi kita kirim seluruh state halaman
      designData: designData,
      artboardWidth,
      artboardHeight,
    });
  };

  return (
    <header className="bg-background flex h-16 shrink-0 items-center justify-between border-b px-4">
      {/* Left side: Navigation & History */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/templates")}
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Kembali ke Daftar Template</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onUndo}
          disabled={!canUndo}
        >
          <Undo2 className="h-4 w-4" />
          <span className="sr-only">Undo</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRedo}
          disabled={!canRedo}
        >
          <Redo2 className="h-4 w-4" />
          <span className="sr-only">Redo</span>
        </Button>
      </div>

      {/* Center: Template Name and Dimensions */}
      <div className="flex flex-grow items-center justify-center gap-4 text-center">
        <Input
          placeholder="Nama Template"
          type="text"
          className="mx-auto max-w-xs border-none text-center text-lg font-semibold shadow-none focus-visible:ring-0"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <Label htmlFor="width" className="text-xs">
            W:
          </Label>
          <Input
            id="width"
            type="number"
            className="h-8 w-20"
            value={artboardWidth}
            onChange={(e) => setArtboardWidth(Number(e.target.value))}
            min={100}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="height" className="text-xs">
            H:
          </Label>
          <Input
            id="height"
            type="number"
            className="h-8 w-20"
            value={artboardHeight}
            onChange={(e) => setArtboardHeight(Number(e.target.value))}
            min={100}
          />
        </div>
      </div>

      {/* Right side: Save Action */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleSave}
          size="sm"
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Simpan Template
        </Button>
      </div>
    </header>
  );
}
