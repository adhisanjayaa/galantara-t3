// File: src/app/profile/components/AddressManager.tsx
"use client";

import { useState } from "react";
import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { AddressCard } from "./AddressCard";
import { AddressModal } from "./AddressModal";

type Address = RouterOutputs["profile"]["getAddresses"][number];

export function AddressManager() {
  const { data: addresses, isLoading } = api.profile.getAddresses.useQuery();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<Address | null>(null);

  const handleAddNew = () => {
    setAddressToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (address: Address) => {
    setAddressToEdit(address);
    setIsModalOpen(true);
  };

  if (isLoading) return <div>Memuat alamat...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Alamat Pengiriman</h2>
        {(addresses?.length ?? 0) < 2 && (
          <Button onClick={handleAddNew}>Tambah Alamat Baru</Button>
        )}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {addresses && addresses.length > 0 ? (
          addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={handleEdit}
            />
          ))
        ) : (
          <div className="text-muted-foreground col-span-full rounded-lg border-2 border-dashed p-8 text-center">
            <p>Anda belum menambahkan alamat.</p>
          </div>
        )}
      </div>
      <AddressModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        addressToEdit={addressToEdit}
      />
    </div>
  );
}
