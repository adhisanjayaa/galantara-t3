"use client";

import { api, type RouterOutputs } from "~/trpc/react"; // <-- 1. Impor RouterOutputs
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// 2. Definisikan tipe untuk satu entri riwayat menggunakan RouterOutputs
type HistoryEntry = RouterOutputs["order"]["getTrackingHistory"][number];

export function TrackingHistory({ trackingId }: { trackingId: string }) {
  const {
    data: history,
    isLoading,
    isError,
  } = api.order.getTrackingHistory.useQuery({ trackingId });

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-6">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      );
    }
    if (isError) {
      return (
        <div className="text-destructive flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="mb-2 h-6 w-6" />
          <p className="text-sm">Gagal memuat data pelacakan.</p>
        </div>
      );
    }
    if (!history || history.length === 0) {
      return (
        <p className="text-muted-foreground p-4 text-sm">
          Nomor resi terdeteksi, namun riwayat pelacakan belum tersedia dari
          pihak kurir. Silakan coba lagi nanti.
        </p>
      );
    }

    return (
      <div className="space-y-6">
        {history.map((entry: HistoryEntry, index: number) => (
          <div key={index} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`h-3 w-3 rounded-full ${
                  index === 0 ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              ></div>
              {index < history.length - 1 && (
                <div className="bg-muted-foreground/30 w-px flex-grow"></div>
              )}
            </div>
            <div>
              <p
                className={`text-sm font-semibold ${index === 0 ? "text-primary" : ""}`}
              >
                {entry.note}{" "}
                {/* Menggunakan `note` sesuai kemungkinan respons Biteship */}
              </p>
              <p className="text-muted-foreground text-xs">
                {format(new Date(entry.updated_at), "dd MMM, HH:mm", {
                  locale: id,
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lacak Pengiriman</CardTitle>
        <CardDescription>No. Resi: {trackingId}</CardDescription>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
