// File: src/app/admin/product-types/components/ProductTypeTable.tsx

"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import type { RouterOutputs } from "~/trpc/react";

// Tipe ini akan diperbarui secara otomatis setelah server di-restart
type ProductType = RouterOutputs["admin"]["getAllProductTypes"][number];

interface ProductTypeTableProps {
  data: ProductType[];
  onEdit: (productType: ProductType) => void;
}

export function ProductTypeTable({ data, onEdit }: ProductTypeTableProps) {
  const utils = api.useUtils();

  const deleteMutation = api.admin.deleteProductType.useMutation({
    onSuccess: () => {
      toast.success("Tipe produk berhasil dihapus.");
      void utils.admin.getAllProductTypes.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Tipe Produk</TableHead>
            <TableHead>Identifier Skema</TableHead>
            <TableHead className="w-[120px]">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="h-24 text-center">
                Belum ada tipe produk yang dibuat.
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  {/* Kode ini akan valid setelah tipe diperbarui */}
                  {item.schemaIdentifier ? (
                    <Badge variant="secondary">{item.schemaIdentifier}</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          disabled={
                            deleteMutation.isPending &&
                            deleteMutation.variables?.id === item.id
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Anda yakin ingin menghapus &quot;{item.name}&quot;?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Tindakan ini tidak bisa dibatalkan dan akan
                            menghapus tipe produk secara permanen.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              deleteMutation.mutate({ id: item.id })
                            }
                          >
                            Ya, Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
