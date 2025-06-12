// File: src/app/admin/products/page.tsx

import { api } from "~/trpc/server";
import { ProductClient } from "./components/ProductClient";

export default async function AdminProductsPage() {
  // Ambil data awal di server untuk performa
  const products = await api.admin.getAllProducts();
  const productTypes = await api.admin.getProductTypes();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Manajemen Produk</h1>
      {/* Komponen Client untuk menangani semua interaksi */}
      <ProductClient initialProducts={products} productTypes={productTypes} />
    </div>
  );
}
