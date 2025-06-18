// File: src/app/profile/components/AddressModal.tsx
"use client";

import { useState, useEffect } from "react";
import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  // Hapus 'DialogDescription' yang tidak terpakai
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

type Address = RouterOutputs["profile"]["getAddresses"][number];

interface AddressModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  addressToEdit?: Address | null;
}

export function AddressModal({
  isOpen,
  onOpenChange,
  addressToEdit,
}: AddressModalProps) {
  const utils = api.useUtils();

  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (addressToEdit) {
      setStreet(addressToEdit.street);
      setCity(addressToEdit.city);
      setProvince(addressToEdit.province);
      setPostalCode(addressToEdit.postalCode);
      setPhoneNumber(addressToEdit.phoneNumber ?? "");
    } else {
      setStreet("");
      setCity("");
      setProvince("");
      setPostalCode("");
      setPhoneNumber("");
    }
  }, [addressToEdit, isOpen]);

  const addMutation = api.profile.addAddress.useMutation();
  const updateMutation = api.profile.updateAddress.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const commonData = {
      street,
      city,
      province,
      postalCode,
      country: "Indonesia",
      phoneNumber: phoneNumber || undefined,
    };

    try {
      // PERBAIKAN: Pisahkan logika untuk 'edit' dan 'add'
      if (addressToEdit) {
        // Logika untuk mode EDIT
        await updateMutation.mutateAsync({
          ...commonData,
          addressId: addressToEdit.id, // addressId dijamin ada di sini
        });
        toast.success("Alamat berhasil diperbarui!");
      } else {
        // Logika untuk mode TAMBAH
        await addMutation.mutateAsync(commonData);
        toast.success("Alamat berhasil ditambahkan!");
      }

      void utils.profile.getAddresses.invalidate();
      onOpenChange(false);
    } catch (error) {
      // PERBAIKAN: Beri tipe pada error untuk akses yang aman
      if (error instanceof Error) {
        toast.error(`Gagal: ${error.message}`);
      } else {
        toast.error("Terjadi kesalahan yang tidak diketahui.");
      }
    }
  };

  const isPending = addMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {addressToEdit ? "Edit Alamat" : "Tambah Alamat Baru"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <input
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Alamat Jalan"
              className="rounded-md border p-2"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Kota"
                className="rounded-md border p-2"
                required
              />
              <input
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="Provinsi"
                className="rounded-md border p-2"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="Kode Pos"
                className="rounded-md border p-2"
                required
              />
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Nomor Telepon (Opsional)"
                className="rounded-md border p-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan Alamat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
