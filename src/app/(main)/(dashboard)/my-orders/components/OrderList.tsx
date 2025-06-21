// File: src/app/(main)/(dashboard)/my-orders/components/OrderList.tsx
"use client";

import { type RouterOutputs } from "~/trpc/react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { OrderStatus, ShippingStatus } from "@prisma/client"; // <-- Impor ShippingStatus

type Order = RouterOutputs["order"]["getMyOrders"][number];

// --- FUNGSI HELPER BARU YANG LEBIH CERDAS ---
const getDisplayBadge = (
  order: Order,
): { text: string; variant: "default" | "secondary" | "destructive" } => {
  // Prioritaskan status utama jika bukan 'PAID'
  if (order.status === OrderStatus.PENDING) {
    return { text: "Menunggu Pembayaran", variant: "secondary" };
  }
  if (
    order.status === OrderStatus.CANCELED ||
    order.status === OrderStatus.FAILED
  ) {
    return { text: "Dibatalkan/Gagal", variant: "destructive" };
  }

  // Jika status sudah 'PAID', kita lihat status pengirimannya
  if (order.status === OrderStatus.PAID) {
    switch (order.shippingStatus) {
      case ShippingStatus.PROCESSING:
        return { text: "Diproses", variant: "default" };
      case ShippingStatus.SHIPPED:
      case ShippingStatus.IN_TRANSIT:
        return { text: "Dikirim", variant: "default" };
      case ShippingStatus.DELIVERED:
        return { text: "Telah Diterima", variant: "default" };
      case ShippingStatus.CANCELED:
      case ShippingStatus.RETURNED:
        return { text: "Pengiriman Bermasalah", variant: "destructive" };
      default:
        // Jika tidak ada shippingStatus (misal, produk digital), tampilkan "Dibayar"
        return { text: "Dibayar", variant: "default" };
    }
  }

  // Fallback untuk status lain seperti DELIVERED atau SHIPPED pada OrderStatus
  if (order.status === OrderStatus.DELIVERED) {
    return { text: "Selesai", variant: "default" };
  }
  if (order.status === OrderStatus.SHIPPED) {
    return { text: "Dikirim", variant: "default" };
  }

  // Default jika tidak ada yang cocok
  return { text: order.status, variant: "secondary" };
};

export function OrderList({ initialOrders }: { initialOrders: Order[] }) {
  if (initialOrders.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed py-16 text-center">
        <h3 className="text-xl font-semibold">Anda Belum Memiliki Pesanan</h3>
        <p className="text-muted-foreground mt-2 mb-4">
          Ayo mulai berbelanja untuk membuat pesanan pertama Anda!
        </p>
        <Button asChild>
          <Link href="/themes">Lihat Pilihan Tema</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {initialOrders.map((order) => {
        // Panggil fungsi helper untuk setiap pesanan
        const badgeInfo = getDisplayBadge(order);

        return (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Pesanan #{order.id.substring(0, 8)}
                  </CardTitle>
                  <CardDescription>
                    {format(order.createdAt, "dd MMMM yyyy, HH:mm", {
                      locale: id,
                    })}
                  </CardDescription>
                </div>
                {/* Gunakan hasil dari fungsi helper */}
                <Badge variant={badgeInfo.variant} className="h-fit w-fit">
                  {badgeInfo.text}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="text-muted-foreground list-disc pl-5 text-sm">
                {order.items.map((item, index) => (
                  <li key={index}>
                    {item.productName} (x{item.quantity})
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="justify-between">
              <span className="font-semibold">
                Total:{" "}
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                }).format(order.totalAmount)}
              </span>
              <Button asChild variant="outline" size="sm">
                <Link href={`/my-orders/${order.id}`}>Lihat Detail</Link>
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
