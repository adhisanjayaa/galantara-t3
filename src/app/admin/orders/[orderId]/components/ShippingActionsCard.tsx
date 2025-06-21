"use client";

import { type RouterOutputs, api } from "~/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { Loader2, Printer, CheckCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { ShippingStatus } from "@prisma/client";

type OrderDetails = NonNullable<RouterOutputs["admin"]["getOrderDetails"]>;

export function ShippingActionsCard({ order }: { order: OrderDetails }) {
  const utils = api.useUtils();
  const createShipmentMutation = api.admin.createShipment.useMutation({
    // --- PERBAIKAN DI SINI ---
    onSuccess: () => {
      // Ubah pesan toast agar sesuai dengan alur baru
      toast.success("Pengiriman berhasil dibuat! Nomor resi telah disimpan.");
      // Hapus window.open()
      utils.admin.getOrderDetails.invalidate({ orderId: order.id });
    },
    onError: (error) => {
      toast.error(`Gagal: ${error.message}`);
    },
  });

  const handleCreateShipment = () => {
    createShipmentMutation.mutate({ orderId: order.id });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informasi Pengiriman</CardTitle>
        <CardDescription>
          Buat pengiriman dan cetak label untuk produk fisik.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold">Jasa Kirim</h4>
          <p className="text-muted-foreground">{order.shippingProvider}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Alamat Tujuan</h4>
          <p className="text-muted-foreground whitespace-pre-line">
            {order.shippingAddress}
          </p>
        </div>

        {/* Tampilkan tombol jika pesanan masih perlu diproses */}
        {order.shippingStatus === ShippingStatus.PROCESSING && (
          <Button
            onClick={handleCreateShipment}
            disabled={createShipmentMutation.isPending}
            className="w-full"
          >
            {createShipmentMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Printer className="mr-2 h-4 w-4" />
            )}
            Buat Pengiriman di Biteship
          </Button>
        )}

        {/* --- PERBAIKAN TAMPILAN SETELAH BERHASIL --- */}
        {/* Tampilkan ini jika pesanan SUDAH dikirim */}
        {order.shippingStatus !== ShippingStatus.PROCESSING &&
          order.trackingId && (
            <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-sm font-semibold text-green-800">
                  Pengiriman sudah dibuat!
                </p>
              </div>
              <div>
                <p className="text-xs font-medium">No. Resi</p>
                <p className="font-mono text-sm">{order.trackingId}</p>
              </div>
              <div>
                <p className="text-muted-foreground mt-2 mb-2 text-xs">
                  Silakan unduh dan cetak label pengiriman dari dashboard
                  Biteship.
                </p>
                <Button asChild size="sm" className="w-full">
                  <Link href="https://dashboard.biteship.com/" target="_blank">
                    Buka Dashboard Biteship
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
