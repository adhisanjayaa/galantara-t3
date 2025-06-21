// File: src/app/admin/product-types/components/ProductTypeFormModal.tsx

"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"; // Impor Select
import { api } from "~/trpc/react";
import { toast } from "sonner";
import type { RouterOutputs } from "~/trpc/react";

type ProductType = RouterOutputs["admin"]["getAllProductTypes"][number];

interface ProductTypeFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  productTypeToEdit: ProductType | null;
}

// Daftar identifier skema yang tersedia
const availableSchemas = [
  { id: "WEDDING_V1", name: "Undangan Pernikahan (v1)" },
  { id: "BIRTHDAY_V1", name: "Undangan Ulang Tahun (v1)" },
];

export function ProductTypeFormModal({
  isOpen,
  onOpenChange,
  productTypeToEdit,
}: ProductTypeFormModalProps) {
  const [name, setName] = useState("");
  // [TAMBAHKAN] State untuk schemaIdentifier
  const [schemaIdentifier, setSchemaIdentifier] = useState<string | undefined>(
    undefined,
  );

  const utils = api.useUtils();

  useEffect(() => {
    if (productTypeToEdit && isOpen) {
      setName(productTypeToEdit.name);
      setSchemaIdentifier(productTypeToEdit.schemaIdentifier ?? undefined);
    } else if (!isOpen) {
      setName("");
      setSchemaIdentifier(undefined);
    }
  }, [productTypeToEdit, isOpen]);

  const createMutation = api.admin.createProductType.useMutation();
  const updateMutation = api.admin.updateProductType.useMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (productTypeToEdit) {
        await updateMutation.mutateAsync({
          id: productTypeToEdit.id,
          name,
          schemaIdentifier,
        });
        toast.success("Tipe produk berhasil diperbarui!");
      } else {
        await createMutation.mutateAsync({ name, schemaIdentifier });
        toast.success("Tipe produk berhasil dibuat!");
      }
      void utils.admin.getAllProductTypes.invalidate();
      onOpenChange(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Terjadi kesalahan";
      toast.error(`Gagal: ${errorMessage}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {productTypeToEdit
                ? "Edit Tipe Produk"
                : "Tambah Tipe Produk Baru"}
            </DialogTitle>
            <DialogDescription>
              Isi detail tipe produk di bawah ini.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nama
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
              />
            </div>
            {/* [TAMBAHKAN] Input Select untuk schemaIdentifier */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="schema" className="text-right">
                Skema Form
              </Label>
              <Select
                value={schemaIdentifier}
                onValueChange={setSchemaIdentifier}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Pilih skema (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  {availableSchemas.map((schema) => (
                    <SelectItem key={schema.id} value={schema.id}>
                      {schema.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
