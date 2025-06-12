// File: src/app/admin/product-types/components/ProductTypeTable.tsx [NEW]
"use client";

import type { RouterOutputs } from "~/trpc/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

type ProductTypeWithCount = RouterOutputs["admin"]["getProductTypesWithCount"];

export function ProductTypeTable({
  productTypes,
}: {
  productTypes: ProductTypeWithCount;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama Tipe Produk</TableHead>
          <TableHead className="w-[200px]">Jumlah Produk Terkait</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {productTypes.map((pt) => (
          <TableRow key={pt.id}>
            <TableCell className="font-medium">{pt.name}</TableCell>
            <TableCell>{pt._count.products}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
