"use client";

import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import type { Canvas } from "fabric";
import { Save, Loader2, ArrowLeft, Undo2, Redo2 } from "lucide-react";
import { Label } from "~/components/ui/label";

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
  getPagesForSave: () => any[]; // Function to get all pages data for saving
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

  // tRPC mutation for creating or updating a design template
  const saveMutation = api.admin.createOrUpdateDesignTemplate.useMutation({
    onSuccess: (data) => {
      toast.success("Template berhasil disimpan!");
      // If it was a new template, redirect to the edit page with the new ID
      if (!templateId) {
        router.replace(`/admin/templates/${data.id}`);
      }
      // Invalidate queries to refetch the list of templates
      void utils.admin.getDesignTemplates.invalidate();
    },
    onError: (error) => {
      toast.error(`Gagal menyimpan: ${error.message}`);
    },
  });

  /**
   * Handles the save action. It gets the current state of all pages
   * and sends it to the backend via the tRPC mutation.
   */
  const handleSave = () => {
    if (!canvasInstance || !templateName) {
      toast.error("Nama template tidak boleh kosong.");
      return;
    }

    // Call the provided function to get the data of all pages
    const designData = getPagesForSave();

    saveMutation.mutate({
      id: templateId ?? undefined,
      name: templateName,
      designData,
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
