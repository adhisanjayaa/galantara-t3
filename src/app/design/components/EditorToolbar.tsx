// File: src/app/design/components/EditorToolbar.tsx

"use client";

import React from "react";
import type { Canvas } from "fabric";
import {
  Type,
  Square,
  Circle as CircleIcon,
  Image as ImageIcon,
  QrCode,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  File as FileIcon,
  Plus,
  Pencil,
  PlusCircle,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Separator } from "~/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
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
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

type PageState = {
  name: string;
  data: Record<string, unknown>;
};

// [DIUBAH] Interface props diperbarui untuk menerima semua handler dari parent
interface EditorToolbarProps {
  onAddImage: () => void;
  onAddQrcode: () => void;
  onAddText: () => void;
  onAddRectangle: () => void;
  onAddCircle: () => void;
  scale: number;
  onZoom: (action: "in" | "out" | "reset") => void;
  pages: PageState[];
  currentPageIndex: number;
  onPageChange: (index: number) => void;
  onAddPage?: () => void;
  onRenamePage?: (index: number, newName: string) => void;
}

// Komponen dialog untuk mengubah nama halaman tetap ada di sini
function RenamePageDialog({
  pageName,
  onSave,
  children,
}: {
  pageName: string;
  onSave: (newName: string) => void;
  children: React.ReactNode;
}) {
  const [name, setName] = React.useState(pageName);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <AlertDialog
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setName(pageName);
        }
      }}
    >
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ubah Nama Halaman</AlertDialogTitle>
          <AlertDialogDescription>
            Masukkan nama baru untuk halaman ini.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="page-name" className="sr-only">
            Nama Halaman
          </Label>
          <Input
            id="page-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSave();
                (e.target as HTMLElement)
                  .closest<HTMLElement>('div[role="dialog"]')
                  ?.querySelector<HTMLButtonElement>(
                    'button[data-slot="dialog-close"]',
                  )
                  ?.click();
              }
            }}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleSave}>Simpan</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function EditorToolbar({
  onAddImage,
  onAddQrcode,
  onAddText,
  onAddRectangle,
  onAddCircle,
  scale,
  onZoom,
  pages,
  currentPageIndex,
  onPageChange,
  onAddPage,
  onRenamePage,
}: EditorToolbarProps) {
  // [DIHAPUS] Fungsi-fungsi internal untuk menambah objek dihapus.
  // Logikanya sekarang diangkat ke parent (page.tsx) dan diterima melalui props.

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 p-1">
        {/* Add Object Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-20">
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="center" className="w-48">
            {/* [DIUBAH] onClick sekarang memanggil fungsi dari props */}
            <DropdownMenuItem onClick={onAddText} className="cursor-pointer">
              <Type className="mr-2 h-4 w-4" />
              <span>Text</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onAddRectangle}
              className="cursor-pointer"
            >
              <Square className="mr-2 h-4 w-4" />
              <span>Rectangle</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAddCircle} className="cursor-pointer">
              <CircleIcon className="mr-2 h-4 w-4" />
              <span>Circle</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAddImage} className="cursor-pointer">
              <ImageIcon className="mr-2 h-4 w-4" />
              <span>Image</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAddQrcode} className="cursor-pointer">
              <QrCode className="mr-2 h-4 w-4" />
              <span>QR Code</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Pages Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-28 justify-start">
              <FileIcon className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {pages[currentPageIndex]?.name ??
                  `Page ${currentPageIndex + 1}`}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="center" className="w-56">
            {pages.map((page, index) => (
              <DropdownMenuItem
                key={index}
                className="flex cursor-pointer justify-between"
                onSelect={(e) => {
                  if (
                    (e.target as HTMLElement).closest(".rename-btn-wrapper")
                  ) {
                    e.preventDefault();
                  } else if (index !== currentPageIndex) {
                    onPageChange(index);
                  } else {
                    e.preventDefault();
                  }
                }}
              >
                <span
                  className={index === currentPageIndex ? "font-semibold" : ""}
                >
                  {page.name}
                </span>
                {onRenamePage && (
                  <div className="rename-btn-wrapper">
                    <RenamePageDialog
                      pageName={page.name}
                      onSave={(newName) => onRenamePage(index, newName)}
                    >
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Pencil className="h-3 w-3" />
                        <span className="sr-only">Rename Page</span>
                      </Button>
                    </RenamePageDialog>
                  </div>
                )}
              </DropdownMenuItem>
            ))}
            {onAddPage && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onAddPage}
                  className="cursor-pointer"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Page
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Zoom Controls */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => onZoom("out")}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Perkecil (Ctrl+Scroll)</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => onZoom("reset")}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reset Zoom</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => onZoom("in")}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Perbesar (Ctrl+Scroll)</p>
          </TooltipContent>
        </Tooltip>
        <span className="text-muted-foreground hidden w-14 text-center text-sm font-medium sm:inline">
          {Math.round(scale * 100)}%
        </span>
      </div>
    </TooltipProvider>
  );
}
