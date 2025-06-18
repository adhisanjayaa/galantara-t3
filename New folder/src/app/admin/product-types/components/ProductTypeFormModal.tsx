// File: src/app/admin/product-types/components/ProductTypeFormModal.tsx [NEW]
"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
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
import { toast } from "sonner";

interface ProductTypeFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ProductTypeFormModal({
  isOpen,
  onOpenChange,
}: ProductTypeFormModalProps) {
  const utils = api.useUtils();
  const [name, setName] = useState("");

  const createMutation = api.admin.createProductType.useMutation({
    onSuccess: () => {
      toast.success("Tipe produk berhasil ditambahkan.");
      void utils.admin.getProductTypesWithCount.invalidate();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Gagal: ${error.message}`);
    },
  });

  // Reset state saat modal ditutup
  useEffect(() => {
    if (!isOpen) {
      setName("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ name });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Tambah Tipe Produk Baru</DialogTitle>
            <DialogDescription>
              Masukkan nama unik untuk tipe produk baru Anda.
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
                required
                placeholder="cth. Undangan Pernikahan"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
