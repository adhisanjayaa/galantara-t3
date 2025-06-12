// File: src/app/checkout/page.tsx
// File: src/app/cart/page.tsx

import { api } from "~/trpc/server";
import { CartView } from "./components/CartView"; // <-- Pastikan mengimpor CartView

export default async function CartPage() {
  // Ambil data awal di server untuk menghindari loading di klien
  const initialCart = await api.cart.getCart();

  return (
    <main className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Keranjang Belanja</h1>
        <p className="text-muted-foreground mt-1">
          Periksa kembali pesanan Anda sebelum melanjutkan ke checkout.
        </p>
      </div>

      {/* Pastikan yang di-render adalah CartView */}
      <CartView initialCart={initialCart} />
    </main>
  );
}
