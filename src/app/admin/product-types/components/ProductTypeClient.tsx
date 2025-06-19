// File: src/app/admin/product-types/components/ProductTypeClient.tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ProductTypeTable } from "./ProductTypeTable";
import { ProductTypeFormModal } from "./ProductTypeFormModal";
import type { RouterOutputs } from "~/trpc/react";

type ProductType = RouterOutputs["admin"]["getAllProductTypes"][number];

interface ProductTypeClientProps {
  initialData: ProductType[];
}

export function ProductTypeClient({ initialData }: ProductTypeClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productTypeToEdit, setProductTypeToEdit] =
    useState<ProductType | null>(null);

  const handleOpenModal = (productType?: ProductType) => {
    setProductTypeToEdit(productType ?? null);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tipe Produk</h1>
          <p className="text-muted-foreground">
            Kelola tipe produk untuk mengkategorikan item Anda.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Tipe Baru
        </Button>
      </div>

      <ProductTypeTable data={initialData} onEdit={handleOpenModal} />

      <ProductTypeFormModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        productTypeToEdit={productTypeToEdit}
      />
    </div>
  );
}
