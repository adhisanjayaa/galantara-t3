// File: src/app/admin/templates/components/TemplateTable.tsx [NEW]
"use client";

import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";
import Link from "next/link";
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

type Template = RouterOutputs["admin"]["getDesignTemplates"][number];

export function TemplateTable({ templates }: { templates: Template[] }) {
  const utils = api.useUtils();
  const deleteMutation = api.admin.deleteDesignTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template berhasil dihapus.");
      void utils.admin.getDesignTemplates.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama Template</TableHead>
          <TableHead>Tanggal Dibuat</TableHead>
          <TableHead>Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {templates.map((template) => (
          <TableRow key={template.id}>
            <TableCell>{template.name}</TableCell>
            <TableCell>
              {new Date(template.createdAt).toLocaleDateString("id-ID")}
            </TableCell>
            <TableCell className="flex gap-2">
              <Button variant="outline" size="icon" asChild>
                <Link href={`/admin/templates/${template.id}`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
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
                      Anda yakin ingin menghapus template ini?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Tindakan ini tidak bisa dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate({ id: template.id })}
                      className="bg-destructive hover:bg-destructive/90"
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
  );
}
