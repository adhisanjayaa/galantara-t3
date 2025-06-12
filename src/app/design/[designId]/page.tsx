"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";
import { Loader2 } from "lucide-react";
import type { Canvas } from "fabric";
import { toast } from "sonner";
import DesignHeader from "../components/DesignHeader";
import CanvasEditor from "../components/CanvasEditor";
import EditorToolbar from "../components/EditorToolbar";
import ObjectInspector from "../components/ObjectInspector";

export default function DesignEditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const designId = params.designId as string;
  const isNewDesign = designId === "new";

  const templateId = searchParams.get("templateId");

  const [canvasInstance, setCanvasInstance] = useState<Canvas | null>(null);

  const { data: existingDesign, isLoading: isLoadingDesign } =
    api.design.getDesignById.useQuery(
      { id: designId },
      { enabled: !isNewDesign && !!designId },
    );

  const { data: templateProduct, isLoading: isLoadingTemplate } =
    api.product.getProductById.useQuery(
      { id: templateId! },
      { enabled: isNewDesign && !!templateId },
    );

  const isLoading = isLoadingDesign || isLoadingTemplate;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const productId = isNewDesign ? templateId : existingDesign?.productId;
  const initialName = isNewDesign
    ? `Desain - ${templateProduct?.name ?? ""}`
    : (existingDesign?.name ?? "");

  // [FIX] Buat fungsi parsing yang aman secara tipe
  const parseJsonData = (data: unknown): object | null => {
    if (typeof data === "object" && data !== null) {
      return data;
    }
    if (typeof data === "string") {
      try {
        const parsedData: unknown = JSON.parse(data);
        if (typeof parsedData === "object" && parsedData !== null) {
          return parsedData;
        }
      } catch (error) {
        console.error("Gagal mem-parsing designData dari string:", error);
        toast.error("Gagal memuat data desain. Data mungkin korup.");
        return null;
      }
    }
    return null;
  };

  let initialData: object | null = null;
  if (isNewDesign) {
    initialData = parseJsonData(templateProduct?.designTemplate?.designData);
  } else {
    initialData = parseJsonData(existingDesign?.designData);
  }

  if (!productId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-destructive">
          Gagal memuat data. Pastikan template produk valid.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-muted flex h-screen flex-col">
      <DesignHeader
        designId={isNewDesign ? null : designId}
        initialName={initialName}
        productId={productId}
        canvasInstance={canvasInstance}
      />
      <main className="grid flex-grow grid-cols-[240px_1fr_280px]">
        <aside className="bg-background border-r">
          <EditorToolbar canvas={canvasInstance} />
        </aside>
        <div className="flex-grow overflow-auto">
          <CanvasEditor initialData={initialData} onReady={setCanvasInstance} />
        </div>
        <aside className="bg-background border-l">
          <ObjectInspector canvas={canvasInstance} />
        </aside>
      </main>
    </div>
  );
}
