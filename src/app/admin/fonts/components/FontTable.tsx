// File: src/app/admin/fonts/components/FontTable.tsx
"use client";

import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
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

type CustomFont = RouterOutputs["admin"]["getCustomFonts"][number];

interface FontTableProps {
  fonts: CustomFont[];
}

export function FontTable({ fonts }: FontTableProps) {
  const utils = api.useUtils();
  const deleteMutation = api.admin.deleteCustomFont.useMutation({
    onSuccess: () => {
      toast.success("Font berhasil dihapus.");
      void utils.admin.getCustomFonts.invalidate();
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
            <TableHead>Nama Font</TableHead>
            <TableHead>Berat</TableHead>
            <TableHead>Gaya</TableHead>
            <TableHead className="w-[100px]">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fonts.map((font) => (
            <TableRow key={font.id}>
              <TableCell
                className="font-medium"
                style={{
                  fontFamily: font.name,
                  fontWeight: font.weight,
                  fontStyle: font.style,
                }}
              >
                {font.name}
              </TableCell>
              <TableCell>{font.weight}</TableCell>
              <TableCell>{font.style}</TableCell>
              <TableCell>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Anda yakin ingin menghapus font ini?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Aksi ini akan menghapus file font dari storage dan tidak
                        bisa dibatalkan.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate({ id: font.id })}
                      >
                        Ya, Hapus
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
