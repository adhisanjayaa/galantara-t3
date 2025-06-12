// File: src/app/admin/page.tsx
import { api } from "~/trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default async function AdminDashboard() {
  const orders = await api.admin.getAllOrders();

  const totalRevenue = orders.reduce(
    (sum, order) => sum + (order.status === "PAID" ? order.totalAmount : 0),
    0,
  );
  const totalSales = orders.filter((order) => order.status === "PAID").length;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Pendapatan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
              }).format(totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Penjualan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalSales}</div>
          </CardContent>
        </Card>
      </div>
      {/* Di sini bisa ditambahkan tabel ringkasan pesanan terbaru */}
    </div>
  );
}
