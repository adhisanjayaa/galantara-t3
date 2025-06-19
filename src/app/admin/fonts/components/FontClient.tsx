// File: src/app/admin/fonts/components/FontClient.tsx
"use client";

import { useState } from "react";
import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { PlusCircle } from "lucide-react";
import { FontTable } from "./FontTable";
import { FontUploadModal } from "./FontUploadModal";
import { Loader2 } from "lucide-react";

type InitialFonts = RouterOutputs["admin"]["getCustomFonts"];

export function FontClient({ initialFonts }: { initialFonts: InitialFonts }) {
  const { data: fonts, isLoading } = api.admin.getCustomFonts.useQuery(
    undefined,
    {
      initialData: initialFonts,
      refetchOnWindowFocus: false,
    },
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Unggah Font Baru
        </Button>
      </div>

      {isLoading && !fonts ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : fonts ? (
        <FontTable fonts={fonts} />
      ) : (
        <p>Gagal memuat data font.</p>
      )}

      <FontUploadModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
