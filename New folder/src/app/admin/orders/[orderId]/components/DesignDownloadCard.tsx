"use client";

import { useState } from "react";
import { api, type RouterOutputs } from "~/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
// import { StaticCanvas } from "fabric"; // <-- HAPUS IMPOR STATIS INI
import JSZip from "jszip";
import { saveAs } from "file-saver";

type DesignData = RouterOutputs["admin"]["getDesignsForOrder"];

interface DesignDownloadCardProps {
  orderId: string;
}

const dataURLtoBlob = (dataurl: string) => {
  const arr = dataurl.split(",");
  if (arr.length < 2)
    throw new Error("Invalid data URL: no comma separator found.");
  const mimeMatch = arr[0]?.match(/:(.*?);/);
  if (!mimeMatch || !mimeMatch[1])
    throw new Error("Could not determine mime type from data URL");
  const mime = mimeMatch[1];
  const bstr = atob(arr[1] ?? "");
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export function DesignDownloadCard({ orderId }: DesignDownloadCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const query = api.admin.getDesignsForOrder.useQuery(
    { orderId },
    { enabled: false },
  );

  const handleDownload = async () => {
    setIsProcessing(true);
    toast.info("Mempersiapkan unduhan...");

    try {
      // --- PERBAIKAN DI SINI: Impor fabric.js secara dinamis ---
      const { StaticCanvas } = await import("fabric");

      const result = await query.refetch();
      if (result.isError) {
        throw result.error;
      }
      const designs = result.data;

      if (!designs || designs.length === 0) {
        toast.info("Tidak ada desain kustom untuk diunduh pada pesanan ini.");
        setIsProcessing(false);
        return;
      }

      toast.info(
        `Memproses ${designs.length} desain... Ini mungkin memakan waktu.`,
      );

      const zip = new JSZip();

      for (const design of designs) {
        const designFolder = zip.folder(
          design.name.replace(/[^a-z0-9]/gi, "_"),
        );
        const designPages = design.designData as unknown as { data: object }[];

        let pageIndex = 1;
        for (const page of designPages) {
          const canvas = new StaticCanvas(); // Buat kanvas baru untuk setiap halaman
          const artboardWidth =
            design.product.designTemplate?.artboardWidth ?? 1200;
          const artboardHeight =
            design.product.designTemplate?.artboardHeight ?? 800;
          canvas.setDimensions({
            width: artboardWidth,
            height: artboardHeight,
          });

          await new Promise<void>((resolve, reject) => {
            canvas.loadFromJSON(page.data, () => {
              canvas.renderAll();
              const dataUrl = canvas.toDataURL({
                format: "png",
                quality: 1,
                multiplier: 1,
              });
              try {
                const blob = dataURLtoBlob(dataUrl);
                designFolder?.file(`Page_${pageIndex}.png`, blob);
                pageIndex++;
                resolve();
              } catch (e) {
                reject(e);
              } finally {
                canvas.dispose();
              }
            });
          });
        }
      }

      toast.success("File ZIP berhasil dibuat, unduhan akan dimulai...");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `designs_order_${orderId.substring(0, 8)}.zip`);
    } catch (error) {
      console.error("Gagal memproses unduhan:", error);
      toast.error(
        `Gagal: ${error instanceof Error ? error.message : "Terjadi kesalahan tidak dikenal."}`,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = isProcessing || query.isFetching;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unduh Desain</CardTitle>
        <CardDescription>
          Unduh semua hasil desain pelanggan dalam satu file ZIP.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleDownload}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {query.isFetching
            ? "Mengambil Data..."
            : isProcessing
              ? "Memproses File..."
              : "Unduh File Desain (.zip)"}
        </Button>
        <p className="text-muted-foreground mt-3 text-xs">
          Proses ini berjalan di browser Anda dan mungkin akan membebani
          komputer jika terdapat banyak desain.
        </p>
      </CardContent>
    </Card>
  );
}
