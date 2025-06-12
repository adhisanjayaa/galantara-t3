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
              <TableRow key={order.id}>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>
                  <Badge
                    variant={order.status === "PAID" ? "default" : "secondary"}
                  >
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  }).format(order.totalAmount)}
                </TableCell>
                <TableCell>
                  {new Date(order.createdAt).toLocaleDateString("id-ID")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
