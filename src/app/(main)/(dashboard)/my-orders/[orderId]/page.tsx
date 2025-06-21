// File: src/app/(main)/(dashboard)/my-orders/[orderId]/page.tsx

import { api } from "~/trpc/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { TrackingHistory } from "./components/TrackingHistory";
import { Badge } from "~/components/ui/badge";
import { type ShippingStatus } from "@prisma/client";

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

// Fungsi getOrderDetails yang sudah ada tidak perlu diubah
async function getOrderDetails(orderId: string) {
  const order = await api.order.getOrderDetails({ orderId });
  if (!order) {
    notFound();
  }
  return order;
}

export default async function MyOrderDetailPage({
  params,
}: {
  // --- PERBAIKAN DI SINI ---
  params: Promise<{ orderId: string }>;
}) {
  // --- PERBAIKAN DI SINI ---
  const { orderId } = await params;
  const order = await getOrderDetails(orderId);

  const hasPhysicalProduct = order.items.some(
    (item) => item.product.category === "PHYSICAL",
  );

  const shippingStatusInfo = order.shippingStatus
    ? shippingStatusMap[order.shippingStatus]
    : null;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <Button asChild variant="ghost" className="-ml-4">
          <Link href="/my-orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Pesanan
          </Link>
        </Button>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">
          Detail Pesanan
        </h1>
        <p className="text-muted-foreground mt-1">
          Pesanan #{order.id.substring(0, 8)}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle>Item yang Dipesan</CardTitle>
                </div>
                {shippingStatusInfo && (
                  <Badge variant={shippingStatusInfo.variant}>
                    {shippingStatusInfo.text}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
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
        </div>
        <div className="md:col-span-1">
          {hasPhysicalProduct && order.trackingId ? (
            <TrackingHistory trackingId={order.trackingId} />
          ) : hasPhysicalProduct ? (
            <Card>
              <CardHeader>
                <CardTitle>Status Pengiriman</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Pesanan sedang diproses. Nomor resi akan segera tersedia
                  setelah pesanan dikirim.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
