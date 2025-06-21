// File: src/app/admin/products/components/ProductFormModal.tsx
"use client";

import { useState, useEffect } from "react";
import type { RouterOutputs } from "~/trpc/react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { Switch } from "~/components/ui/switch";
import { toast } from "sonner";
import { ProductCategory } from "@prisma/client";
import { Loader2 } from "lucide-react";

type Product = RouterOutputs["admin"]["getAllProducts"][number];
type ProductType = RouterOutputs["admin"]["getProductTypes"];

interface ProductFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  productToEdit?: Product | null;
  productTypes: ProductType;
}

export function ProductFormModal({
  isOpen,
  onOpenChange,
  productToEdit,
  productTypes,
}: ProductFormModalProps) {
  const utils = api.useUtils();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [images, setImages] = useState("");
  const [category, setCategory] = useState<ProductCategory>(
    ProductCategory.DIGITAL,
  );
  const [productTypeId, setProductTypeId] = useState("");
  const [weightGram, setWeightGram] = useState<number | undefined>(undefined);
  const [themeIdentifier, setThemeIdentifier] = useState<string | undefined>();
  const [isActive, setIsActive] = useState(true);
  const [isDesignable, setIsDesignable] = useState(false);
  const [designTemplateId, setDesignTemplateId] = useState<
    string | undefined
  >();

  const { data: availableThemes, isLoading: isLoadingThemes } =
    api.theme.getAvailableThemes.useQuery(undefined, {
      enabled: isOpen && category === ProductCategory.DIGITAL,
    });

  const { data: designTemplates, isLoading: isLoadingTemplates } =
    api.admin.getDesignTemplates.useQuery(undefined, {
      enabled: isOpen && category === "PHYSICAL",
    });

  useEffect(() => {
    if (productToEdit && isOpen) {
      setName(productToEdit.name);
      setDescription(productToEdit.description);
      setPrice(productToEdit.price);
      setImages(productToEdit.images.join(", "));
      setCategory(productToEdit.category);
      setProductTypeId(productToEdit.productTypeId);
      setWeightGram(productToEdit.weightGram ?? undefined);
      setThemeIdentifier(productToEdit.themeIdentifier ?? undefined);
      setIsActive(productToEdit.isActive);
      setIsDesignable(productToEdit.isDesignable);
      setDesignTemplateId(productToEdit.designTemplateId ?? undefined);
    } else if (!isOpen) {
      // Reset all fields when modal is closed
      setName("");
      setDescription("");
      setPrice(0);
      setImages("");
      setCategory(ProductCategory.DIGITAL);
      setProductTypeId("");
      setWeightGram(undefined);
      setThemeIdentifier(undefined);
      setIsActive(true);
      setIsDesignable(false);
      setDesignTemplateId(undefined);
    }
  }, [productToEdit, isOpen]);

  const createMutation = api.admin.createProduct.useMutation();
  const updateMutation = api.admin.updateProduct.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const imageArray = images
      .split(",")
      .map((img) => img.trim())
      .filter((img) => img);
    if (imageArray.length === 0) {
      toast.error("Minimal harus ada satu URL gambar.");
      return;
    }

    try {
      if (productToEdit) {
        // Logika untuk UPDATE
        await updateMutation.mutateAsync({
          id: productToEdit.id,
          name,
          description,
          price,
          isActive,
          images: imageArray,
          category,
          productTypeId,
          weightGram: category === "PHYSICAL" ? weightGram : undefined,
          themeIdentifier: category === "DIGITAL" ? themeIdentifier : undefined,
          isDesignable: category === "PHYSICAL" ? isDesignable : false,
          designTemplateId:
            category === "PHYSICAL" && isDesignable
              ? designTemplateId === "none"
                ? null
                : designTemplateId
              : null,
        });
        toast.success("Produk berhasil diperbarui!");
      } else {
        // Logika untuk CREATE
        await createMutation.mutateAsync({
          name,
          description,
          price,
          images: imageArray,
          category,
          productTypeId,
          weightGram: category === "PHYSICAL" ? weightGram : undefined,
          themeIdentifier: category === "DIGITAL" ? themeIdentifier : undefined,
          isDesignable: category === "PHYSICAL" ? isDesignable : false,
          designTemplateId:
            category === "PHYSICAL" && isDesignable
              ? designTemplateId === "none"
                ? undefined
                : designTemplateId
              : undefined,
        });
        toast.success("Produk berhasil dibuat!");
      }
      void utils.admin.getAllProducts.invalidate();
      onOpenChange(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Gagal: ${error.message}`);
      } else {
        toast.error("Terjadi kesalahan yang tidak diketahui.");
      }
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {productToEdit ? "Edit Produk" : "Tambah Produk Baru"}
            </DialogTitle>
            <DialogDescription>
              Isi semua detail produk di bawah ini.
            </DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[70vh] gap-4 overflow-y-auto py-4 pr-6">
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
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Deskripsi
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Harga
              </Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="images" className="text-right">
                URL Gambar
              </Label>
              <Textarea
                id="images"
                value={images}
                onChange={(e) => setImages(e.target.value)}
                className="col-span-3"
                placeholder="Pisahkan dengan koma (,)"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Kategori</Label>
              <Select
                value={category}
                onValueChange={(v) => {
                  const newCategory = v as ProductCategory;
                  setCategory(newCategory);
                  if (newCategory === "DIGITAL") setIsDesignable(false);
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ProductCategory.DIGITAL}>
                    Digital
                  </SelectItem>
                  <SelectItem value={ProductCategory.PHYSICAL}>
                    Fisik
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {category === "PHYSICAL" && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="weight" className="text-right">
                    Berat (gram)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    value={weightGram ?? ""}
                    onChange={(e) => setWeightGram(Number(e.target.value))}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-start gap-4 pt-2">
                  <Label htmlFor="is-designable" className="pt-2 text-right">
                    Bisa Didesain?
                  </Label>
                  <Switch
                    id="is-designable"
                    checked={isDesignable}
                    onCheckedChange={setIsDesignable}
                  />
                </div>

                {isDesignable && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="design-template" className="text-right">
                      Template Awal
                    </Label>
                    <Select
                      value={designTemplateId}
                      onValueChange={setDesignTemplateId}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue
                          placeholder={
                            isLoadingTemplates ? "Memuat..." : "Pilih Template"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          Tanpa Template (Kosong)
                        </SelectItem>
                        {designTemplates?.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Tipe Produk</Label>
              <Select
                value={productTypeId}
                onValueChange={setProductTypeId}
                required
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Pilih Tipe Produk" />
                </SelectTrigger>
                <SelectContent>
                  {productTypes.map((pt) => (
                    <SelectItem key={pt.id} value={pt.id}>
                      {pt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {category === "DIGITAL" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Desain Tema</Label>
                <Select
                  value={themeIdentifier}
                  onValueChange={setThemeIdentifier}
                  required={category === "DIGITAL"}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue
                      placeholder={
                        isLoadingThemes
                          ? "Memuat tema..."
                          : "Pilih Desain Tema Visual"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingThemes ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      availableThemes?.map((themeName) => (
                        <SelectItem key={themeName} value={themeName}>
                          {themeName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            {productToEdit && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status Aktif
                </Label>
                <Switch
                  id="status"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
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
