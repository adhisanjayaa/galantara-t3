"use client";

import React, { useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Image as ImageIcon,
  Crop,
  Minus,
  Plus,
  Trash2,
  Lock,
  Unlock,
  ArrowUpFromLine,
  ArrowDownToLine,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
} from "lucide-react";
import { Toggle } from "~/components/ui/toggle";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

type TextAlign = "left" | "center" | "right";

interface ObjectPropertiesPopoverProps {
  objectType: string | null;
  styles: {
    isBold: boolean;
    isItalic: boolean;
    isUnderline: boolean;
    isLocked: boolean;
    fill: string;
    fontSize: number;
    fontFamily: string;
    cornerRadius: number;
    qrcodeData?: string;
    textAlign?: TextAlign;
  };
  isAtFront: boolean; // [BARU] Prop untuk status lapisan depan
  isAtBack: boolean; // [BARU] Prop untuk status lapisan belakang
  onFillChange: (newColor: string) => void;
  onFillChangeCommit?: () => void;
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onToggleUnderline: () => void;
  onFontSizeChange: (newSize: number) => void;
  onIncrementFontSize: () => void;
  onDecrementFontSize: () => void;
  onFontFamilyChange: (newFont: string) => void;
  onCornerRadiusChange: (radius: number) => void;
  onToggleLock: () => void;
  onDeleteObject: () => void;
  onChangeImage: () => void;
  onCropImage: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onDuplicateObject: () => void;
  onQrcodeDataChange?: (newData: string) => void;
  onTextAlignChange?: (align: TextAlign) => void;
}

export function ObjectPropertiesPopover({
  objectType,
  styles,
  isAtFront, // Ambil prop baru
  isAtBack, // Ambil prop baru
  onFillChange,
  onFillChangeCommit,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onFontSizeChange,
  onIncrementFontSize,
  onDecrementFontSize,
  onFontFamilyChange,
  onCornerRadiusChange,
  onToggleLock,
  onDeleteObject,
  onChangeImage,
  onCropImage,
  onBringForward,
  onSendBackward,
  onDuplicateObject,
  onQrcodeDataChange,
  onTextAlignChange,
}: ObjectPropertiesPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onFillChangeCommit?.();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onFillChangeCommit]);

  const FONT_FAMILIES = [
    "Arial",
    "Helvetica",
    "Georgia",
    "Times New Roman",
    "Verdana",
  ];
  const isTextObject = objectType === "i-text" || objectType === "textbox";
  const isQrcodeObject = objectType === "qrcode";

  const handleAlignClick = () => {
    const current = styles.textAlign ?? "left";
    let next: TextAlign = "center";
    if (current === "left") {
      next = "center";
    } else if (current === "center") {
      next = "right";
    } else {
      next = "left";
    }
    onTextAlignChange?.(next);
  };

  return (
    <TooltipProvider>
      <div
        ref={popoverRef}
        className="no-scrollbar w-full max-w-[calc(100vw-2rem)] overflow-x-auto sm:max-w-none sm:overflow-x-visible"
      >
        <div className="flex w-fit items-center gap-3 p-1">
          {/* Properti Warna & Bentuk */}
          {objectType !== "image" && (
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative h-8 w-8 cursor-pointer overflow-hidden rounded-md border bg-white">
                    <input
                      type="color"
                      value={styles.fill}
                      onChange={(e) => onFillChange(e.target.value)}
                      className="absolute -top-1 -left-1 h-10 w-10 cursor-pointer"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Warna Isi</p>
                </TooltipContent>
              </Tooltip>
              {objectType === "rect" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Input
                      type="number"
                      value={styles.cornerRadius}
                      onChange={(e) =>
                        onCornerRadiusChange(Number(e.target.value))
                      }
                      className="h-8 w-14 rounded-md border text-center"
                      min={0}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sudut Melengkung</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}

          {/* Properti Teks */}
          {isTextObject && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <Select
                  value={styles.fontFamily}
                  onValueChange={onFontFamilyChange}
                >
                  <SelectTrigger className="h-8 w-[130px] rounded-md border shadow-sm">
                    <SelectValue placeholder="Font" />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map((font) => (
                      <SelectItem key={font} value={font}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center rounded-md border shadow-sm">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-r-none"
                    onClick={onDecrementFontSize}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={styles.fontSize}
                    onChange={(e) => onFontSizeChange(Number(e.target.value))}
                    className="h-8 w-12 border-x-0 bg-transparent text-center focus-visible:ring-0"
                    min={1}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-l-none"
                    onClick={onIncrementFontSize}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center rounded-md border p-0.5 shadow-sm">
                  <Toggle
                    size="sm"
                    pressed={styles.isBold}
                    onPressedChange={onToggleBold}
                  >
                    <Bold className="h-4 w-4" />
                  </Toggle>
                  <Toggle
                    size="sm"
                    pressed={styles.isItalic}
                    onPressedChange={onToggleItalic}
                  >
                    <Italic className="h-4 w-4" />
                  </Toggle>
                  <Toggle
                    size="sm"
                    pressed={styles.isUnderline}
                    onPressedChange={onToggleUnderline}
                  >
                    <Underline className="h-4 w-4" />
                  </Toggle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleAlignClick}
                      >
                        {styles.textAlign === "left" && (
                          <AlignLeft className="h-4 w-4" />
                        )}
                        {styles.textAlign === "center" && (
                          <AlignCenter className="h-4 w-4" />
                        )}
                        {styles.textAlign === "right" && (
                          <AlignRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Perataan Teks</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </>
          )}

          {/* Properti Gambar */}
          {objectType === "image" && (
            <div className="flex items-center rounded-md border p-0.5 shadow-sm">
              <Button variant="ghost" size="sm" onClick={onChangeImage}>
                <ImageIcon className="mr-2 h-4 w-4" /> Ganti
              </Button>
              <Button variant="ghost" size="sm" onClick={onCropImage}>
                <Crop className="mr-2 h-4 w-4" /> Crop
              </Button>
            </div>
          )}

          {/* Properti QR Code */}
          {isQrcodeObject && (
            <div className="flex items-center rounded-md border p-1 shadow-sm">
              <LinkIcon className="text-muted-foreground ml-1 h-4 w-4" />
              <Input
                type="url"
                placeholder="https://example.com"
                value={styles.qrcodeData ?? ""}
                onChange={(e) => onQrcodeDataChange?.(e.target.value)}
                className="h-7 w-40 border-none focus-visible:ring-0"
              />
            </div>
          )}

          {/* Aksi Umum */}
          <Separator orientation="vertical" className="mx-1 h-6" />
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border p-0.5 shadow-sm">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onBringForward}
                    disabled={isAtFront}
                  >
                    <ArrowUpFromLine className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Maju Selapis</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onSendBackward}
                    disabled={isAtBack}
                  >
                    <ArrowDownToLine className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mundur Selapis</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* --- KODE LAMA TOMBOL DUPLIKAT DIHAPUS DARI SINI --- */}

            {/* --- DIV UNTUK MENGGABUNGKAN TOMBOL AKSI --- */}
            <div className="flex items-center rounded-md border p-0.5 shadow-sm">
              {/* --- PINDAHKAN TOMBOL DUPLIKAT KE SINI --- */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onDuplicateObject}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Duplikat Objek</p>
                </TooltipContent>
              </Tooltip>

              {/* Tombol Lock */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size="sm"
                    pressed={styles.isLocked}
                    onPressedChange={onToggleLock}
                  >
                    {styles.isLocked ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Unlock className="h-4 w-4" />
                    )}
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{styles.isLocked ? "Buka Kunci" : "Kunci Objek"}</p>
                </TooltipContent>
              </Tooltip>

              {/* Tombol Delete */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-destructive/10 h-8 w-8"
                    onClick={onDeleteObject}
                  >
                    <Trash2 className="text-destructive h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Hapus Objek</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
