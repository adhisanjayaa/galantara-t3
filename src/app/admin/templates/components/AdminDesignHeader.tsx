"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import type { Canvas } from "fabric";
import { Save, Loader2, ArrowLeft } from "lucide-react";

interface AdminDesignHeaderProps {
  templateId: string | null;
  initialName: string;
  canvasInstance: Canvas | null;
}

export default function AdminDesignHeader({
  templateId: initialTemplateId,
  initialName,
  canvasInstance,
}: AdminDesignHeaderProps) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [templateName, setTemplateName] = useState(initialName);

  const saveMutation = api.admin.createOrUpdateDesignTemplate.useMutation({
    onSuccess: (data) => {
      toast.success("Template berhasil disimpan!");
      if (!templateId) {
        setTemplateId(data.id);
        const newUrl = `/admin/templates/${data.id}`;
        window.history.replaceState(
          { ...window.history.state, as: newUrl, url: newUrl },
          "",
          newUrl,
        );
      }
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
    // [FIX] Gunakan 'unknown' yang lebih aman daripada 'any'
    const designData: unknown = canvasInstance.toJSON();
    saveMutation.mutate({
      id: templateId ?? undefined,
      name: templateName,
      designData,
    });
  };

  return (
    <div className="bg-background flex h-16 items-center justify-between border-b px-4">
      <div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/templates")}
        >
          <ArrowLeft />
        </Button>
      </div>
      <div className="flex-grow text-center">
        <Input
          placeholder="Nama Template"
          type="text"
          className="mx-auto max-w-xs border-none text-center text-lg font-semibold shadow-none focus-visible:ring-0"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
        />
      </div>
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
    </div>
  );
}
