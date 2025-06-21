// File: src/app/admin/layout.tsx [MODIFIED]
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <aside className="bg-muted/40 hidden border-r md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link
              href="/admin"
              className="flex items-center gap-2 font-semibold"
            >
              <ShieldCheck className="h-6 w-6" />
              <span>Admin Dashboard</span>
            </Link>
          </div>
          <nav className="flex-1 overflow-auto px-2 py-4 text-sm font-medium">
            <Link
              href="/admin"
              className="text-muted-foreground hover:text-primary flex items-center gap-3 rounded-lg px-3 py-2 transition-all"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/orders"
              className="text-muted-foreground hover:text-primary flex items-center gap-3 rounded-lg px-3 py-2 transition-all"
            >
              Pesanan
            </Link>
            <Link
              href="/admin/products"
              className="text-muted-foreground hover:text-primary flex items-center gap-3 rounded-lg px-3 py-2 transition-all"
            >
              Produk
            </Link>
            {/* --- [NEW] Tambahkan link ke manajemen Tipe Produk --- */}
            <Link
              href="/admin/product-types"
              className="text-muted-foreground hover:text-primary flex items-center gap-3 rounded-lg px-3 py-2 transition-all"
            >
              Tipe Produk
            </Link>
            <Link
              href="/admin/templates"
              className="text-muted-foreground hover:text-primary flex items-center gap-3 rounded-lg px-3 py-2 transition-all"
            >
              Template Desain
            </Link>
            <Link
              href="/admin/fonts"
              className="text-muted-foreground hover:text-primary flex items-center gap-3 rounded-lg px-3 py-2 transition-all"
            >
              Font Kustom
            </Link>
          </nav>
        </div>
      </aside>
      <main className="flex flex-col p-4 sm:p-6">{children}</main>
    </div>
  );
}
