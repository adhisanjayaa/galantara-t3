// File: src/app/(main)/(dashboard)/my-orders/page.tsx

import { api } from "~/trpc/server";
import { OrderList } from "./components/OrderList";

export default async function MyOrdersPage() {
  const orders = await api.order.getMyOrders();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Pesanan Saya</h1>
        <p className="text-muted-foreground mt-1">
          Lihat riwayat semua transaksi dan status pesanan Anda.
        </p>
      </div>
      <OrderList initialOrders={orders} />
    </div>
  );
}
