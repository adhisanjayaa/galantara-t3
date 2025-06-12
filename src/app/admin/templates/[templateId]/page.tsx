// File: src/app/admin/templates/[templateId]/page.tsx [FIXED]
"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";
import { Loader2 } from "lucide-react";
import type { Canvas } from "fabric";
import CanvasEditor from "~/app/design/components/CanvasEditor";
import AdminDesignHeader from "../components/AdminDesignHeader";
import EditorToolbar from "~/app/design/components/EditorToolbar";
import ObjectInspector from "~/app/design/components/ObjectInspector";
import { toast } from "sonner";

export default function AdminTemplateEditorPage() {
  const params = useParams();
  const templateId = params.templateId as string;
  const isNewTemplate = templateId === "new";

  const [canvasInstance, setCanvasInstance] = useState<Canvas | null>(null);

  const { data: existingTemplate, isLoading } =
    api.admin.getDesignTemplateById.useQuery(
      { id: templateId },
      { enabled: !isNewTemplate },
    );

  const isEditorReady = !isLoading && (isNewTemplate || !!existingTemplate);

  if (!isEditorReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const initialName = isNewTemplate
    ? "Template Baru"
    : (existingTemplate?.name ?? "");

  // [FIX] Logika penanganan data yang lebih aman.
  // Blok ini akan mem-parsing `designData` jika tipenya string,
  // atau menggunakannya langsung jika sudah berupa objek.
  let parsedInitialData: object | null = null;
  if (!isNewTemplate && existingTemplate?.designData) {
    const data = existingTemplate.designData;

    if (typeof data === "string") {
      try {
        // Coba parsing jika data adalah string
        parsedInitialData = JSON.parse(data) as object;
      } catch (error) {
        console.error("Gagal mem-parsing designData dari string:", error);
        toast.error("Gagal memuat data desain. Data mungkin korup.");
        // Kembali ke kanvas kosong jika parsing gagal
        parsedInitialData = null;
      }
    } else if (typeof data === "object" && data !== null) {
      // Gunakan langsung jika sudah berupa objek
      parsedInitialData = data;
    }
  }

  return (
    <div className="bg-muted flex h-screen flex-col">
      <AdminDesignHeader
        templateId={isNewTemplate ? null : templateId}
        initialName={initialName}
        canvasInstance={canvasInstance}
      />
      <main className="grid flex-grow grid-cols-[240px_1fr_280px]">
        <aside className="bg-background border-r">
          <EditorToolbar canvas={canvasInstance} />
        </aside>

        <div className="flex-grow overflow-auto">
          {/* Teruskan data yang sudah pasti berupa objek atau null */}
          <CanvasEditor
            initialData={parsedInitialData}
            onReady={setCanvasInstance}
          />
        </div>

        <aside className="bg-background border-l">
          <ObjectInspector canvas={canvasInstance} />
        </aside>
      </main>
    </div>
  );
}
