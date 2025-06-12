// File: src/app/checkout/page.tsx

import { CheckoutForm } from "./components/CheckoutForm"; // <-- Pastikan mengimpor CheckoutForm

export default function CheckoutPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
        <p className="text-muted-foreground mt-1">
          Satu langkah lagi untuk menyelesaikan pesanan Anda.
        </p>
      </div>

      {/* Pastikan yang di-render adalah CheckoutForm */}
      <CheckoutForm />
    </main>
  );
}
