// File: src/app/admin/products/components/ProductClient.tsx
"use client";

import { useState } from "react";
import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { PlusCircle } from "lucide-react";
import { ProductTable } from "./ProductTable";
import { ProductFormModal } from "./ProductFormModal";

type Product = RouterOutputs["admin"]["getAllProducts"][number];
type ProductType = RouterOutputs["admin"]["getProductTypes"];

export function ProductClient({
  initialProducts,
  productTypes,
}: {
  initialProducts: Product[];
  productTypes: ProductType;
}) {
  const { data: products } = api.admin.getAllProducts.useQuery(undefined, {
    initialData: initialProducts,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const handleAddNew = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Tambah Produk Baru
        </Button>
      </div>
      <div className="rounded-lg border">
        {products && <ProductTable products={products} onEdit={handleEdit} />}
      </div>
      <ProductFormModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        productToEdit={productToEdit}
        productTypes={productTypes}
      />
    </>
  );
}
