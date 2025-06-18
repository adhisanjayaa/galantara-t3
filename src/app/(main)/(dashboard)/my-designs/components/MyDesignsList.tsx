// File: src/app/(dashboard)/my-designs/components/MyDesignsList.tsx [NEW]
"use client";

import Link from "next/link";
import Image from "next/image";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Loader2, Trash2 } from "lucide-react";
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
import { toast } from "sonner";

export function MyDesignsList() {
  const utils = api.useUtils();
  const { data: designs, isLoading } = api.design.getMyDesigns.useQuery();

  const addToCartMutation = api.cart.addItemToCart.useMutation({
    onSuccess: () => {
      toast.success("Desain berhasil ditambahkan ke keranjang!");
      void utils.cart.getCart.invalidate();
    },
    onError: (err) => {
      toast.error(`Gagal: ${err.message}`);
    },
  });

  const deleteMutation = api.design.deleteDesign.useMutation({
    onSuccess: () => {
      toast.success("Desain berhasil dihapus.");
      void utils.design.getMyDesigns.invalidate();
    },
    onError: (err) => {
      toast.error(`Gagal menghapus: ${err.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!designs || designs.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed py-16 text-center">
        <h3 className="text-xl font-semibold">Anda Belum Punya Desain</h3>
        <p className="text-muted-foreground mt-2 mb-4">Ayo mulai berkreasi!</p>
        <Button asChild>
          <Link href="/themes">Lihat Pilihan Produk</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {designs.map((design) => (
        <Card key={design.id} className="flex flex-col">
          <CardHeader>
            <div className="relative aspect-video w-full overflow-hidden rounded-md bg-gray-100">
              {design.product.images[0] && (
                <Image
                  src={design.product.images[0]}
                  alt={design.name}
                  fill
                  className="object-cover"
                />
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <CardTitle>{design.name}</CardTitle>
            <CardDescription>Template: {design.product.name}</CardDescription>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-2">
            <Button
              onClick={() =>
                addToCartMutation.mutate({
                  productId: design.productId,
                  userDesignId: design.id,
                  quantity: 1, // Atau sesuaikan jika perlu
                })
              }
              disabled={addToCartMutation.isPending}
            >
              Tambah ke Keranjang
            </Button>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="w-full">
                <Link href={`/design/${design.id}`}>Edit</Link>
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
                      Anda yakin ingin menghapus desain ini?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Tindakan ini tidak bisa dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate({ id: design.id })}
                    >
                      Ya, Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
