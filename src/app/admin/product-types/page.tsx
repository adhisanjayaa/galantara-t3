// File: src/app/admin/product-types/page.tsx [NEW]
import { api } from "~/trpc/server";
import { ProductTypeClient } from "./components/ProductTypeClient";

export default async function AdminProductTypesPage() {
  const productTypes = await api.admin.getProductTypesWithCount();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Manajemen Tipe Produk</h1>
      <ProductTypeClient initialProductTypes={productTypes} />
    </div>
  );
}
