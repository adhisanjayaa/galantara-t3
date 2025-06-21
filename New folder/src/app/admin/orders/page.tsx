// File: src/app/admin/orders/page.tsx
import { api } from "~/trpc/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import Link from "next/link";

export default async function OrdersPage() {
  const orders = await api.admin.getAllOrders();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Manajemen Pesanan</h1>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Tanggal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="cursor-pointer">
                <TableCell>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="block h-full w-full"
                  >
                    {order.customerName}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="block h-full w-full"
                  >
                    <Badge
                      variant={
                        order.status === "PAID" ? "default" : "secondary"
                      }
                    >
                      {order.status}
                    </Badge>
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="block h-full w-full"
                  >
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                    }).format(order.totalAmount)}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="block h-full w-full"
                  >
                    {new Date(order.createdAt).toLocaleDateString("id-ID")}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
