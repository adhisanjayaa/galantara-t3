// File: src/app/admin/product-types/components/ProductTypeClient.tsx [NEW]
"use client";

import { useState } from "react";
import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { PlusCircle } from "lucide-react";
import { ProductTypeTable } from "./ProductTypeTable";
import { ProductTypeFormModal } from "./ProductTypeFormModal";

type ProductTypeWithCount = RouterOutputs["admin"]["getProductTypesWithCount"];

export function ProductTypeClient({
  initialProductTypes,
}: {
  initialProductTypes: ProductTypeWithCount;
}) {
  const { data: productTypes } = api.admin.getProductTypesWithCount.useQuery(
    undefined,
    {
      initialData: initialProductTypes,
    },
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Tambah Tipe Produk
        </Button>
      </div>
      <div className="rounded-lg border">
        {productTypes && <ProductTypeTable productTypes={productTypes} />}
      </div>
      <ProductTypeFormModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
