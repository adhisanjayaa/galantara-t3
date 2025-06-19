// File: src/app/admin/product-types/page.tsx

import { api } from "~/trpc/server";
import { ProductTypeClient } from "./components/ProductTypeClient";

export default async function ProductTypesPage() {
  // Mengambil data awal di server
  const productTypes = await api.admin.getAllProductTypes();

  return (
    <div className="container mx-auto py-10">
      <ProductTypeClient initialData={productTypes} />
    </div>
  );
}
