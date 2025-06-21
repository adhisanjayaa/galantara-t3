// File: src/app/admin/orders/[orderId]/page.tsx

import { api } from "~/trpc/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ShippingActionsCard } from "./components/ShippingActionsCard";
import { DesignDownloadCard } from "./components/DesignDownloadCard";
import { Badge } from "~/components/ui/badge";
import { type OrderStatus, type ShippingStatus } from "@prisma/client";

// Helper untuk memetakan status pembayaran ke tampilan
const orderStatusMap: Record<
  OrderStatus,
  { text: string; variant: "default" | "secondary" | "destructive" }
> = {
  PENDING: { text: "Menunggu Pembayaran", variant: "secondary" },
  PAID: { text: "Dibayar", variant: "default" },
  SHIPPED: { text: "Dikirim", variant: "default" },
  DELIVERED: { text: "Selesai", variant: "default" },
  FAILED: { text: "Gagal", variant: "destructive" },
  CANCELED: { text: "Dibatalkan", variant: "destructive" },
};

// Helper untuk memetakan status pengiriman ke tampilan
const shippingStatusMap: Record<
  ShippingStatus,
  { text: string; variant: "default" | "secondary" | "destructive" }
> = {
  PROCESSING: { text: "Perlu Diproses", variant: "secondary" },
  SHIPPED: { text: "Dikirim", variant: "default" },
  IN_TRANSIT: { text: "Dalam Perjalanan", variant: "default" },
  DELIVERED: { text: "Telah Diterima", variant: "default" },
  CANCELED: { text: "Dibatalkan", variant: "destructive" },
  RETURNED: { text: "Dikembalikan", variant: "destructive" },
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const order = await api.admin.getOrderDetails({ orderId });

  if (!order) {
    notFound();
  }

  // Cek apakah ada produk fisik dalam pesanan
  const hasPhysicalProduct = order.items.some(
    (item) => item.product.category === "PHYSICAL",
  );

  // Cek apakah ada item yang memiliki desain kustom
  const hasCustomDesign = order.items.some((item) => !!item.userDesignId);

  const orderStatusInfo = orderStatusMap[order.status];
  const shippingStatusInfo = order.shippingStatus
    ? shippingStatusMap[order.shippingStatus]
    : null;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" className="-ml-4">
          <Link href="/admin/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Pesanan
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle>
                    Detail Pesanan #{order.id.substring(0, 8)}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Status Pembayaran:{" "}
                    <Badge variant={orderStatusInfo.variant}>
                      {orderStatusInfo.text}
                    </Badge>
                  </CardDescription>
                </div>
                {shippingStatusInfo && (
                  <Badge variant={shippingStatusInfo.variant}>
                    {shippingStatusInfo.text}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <h4 className="mb-2 font-semibold">Item yang dipesan:</h4>
              <ul className="divide-y border-t">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-muted-foreground">x{item.quantity}</p>
                    </div>
                    <span className="font-mono">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <p className="text-muted-foreground">Subtotal</p>
                  <p className="font-medium">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(order.totalAmount - (order.shippingCost ?? 0))}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="text-muted-foreground">Ongkos Kirim</p>
                  <p className="font-medium">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(order.shippingCost ?? 0)}
                  </p>
                </div>
                <div className="flex justify-between border-t pt-2 text-base font-bold">
                  <p>Total</p>
                  <p>
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(order.totalAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tampilkan kartu unduh desain jika ada desain kustom */}
          {hasCustomDesign && <DesignDownloadCard orderId={order.id} />}
        </div>
        <div className="lg:col-span-1">
          {/* Tampilkan kartu aksi pengiriman jika ada produk fisik */}
          {hasPhysicalProduct ? (
            <ShippingActionsCard order={order} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Informasi Pengiriman</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Tidak ada pengiriman untuk pesanan ini (hanya produk digital).
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
