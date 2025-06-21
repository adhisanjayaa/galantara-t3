// File: src/app/design/components/ObjectPropertiesPopover.tsx
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
  Pilcrow,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import { Slider } from "~/components/ui/slider";
import { Label } from "~/components/ui/label";

type TextAlign = "left" | "center" | "right";

// Interface props yang sudah diperbarui dengan handler generik
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
    charSpacing: number;
    lineHeight: number;
  };
  isAtFront: boolean;
  isAtBack: boolean;
  fontFamilies: string[];
  areFontsLoading: boolean;

  // Handler untuk perubahan interaktif (slider, color picker)
  onInteractiveChangeStart: () => void;
  onInteractiveChange: (prop: string, value: string | number) => void;
  onInteractiveChangeCommit: () => void;

  // Handler untuk perubahan properti sekali klik
  onPropertyChange: (prop: string, value: unknown) => void;

  // Handler aksi umum
  onToggleLock: () => void;
  onDeleteObject: () => void;
  onChangeImage: () => void;
  onCropImage: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onDuplicateObject: () => void;
  onQrcodeDataChange?: (newData: string) => void;
}

export function ObjectPropertiesPopover({
  objectType,
  styles,
  isAtFront,
  isAtBack,
  fontFamilies,
  areFontsLoading,
  onInteractiveChangeStart,
  onInteractiveChange,
  onInteractiveChangeCommit,
  onPropertyChange,
  onToggleLock,
  onDeleteObject,
  onChangeImage,
  onCropImage,
  onBringForward,
  onSendBackward,
  onDuplicateObject,
  onQrcodeDataChange,
}: ObjectPropertiesPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Efek untuk menyimpan perubahan (commit) saat pengguna mengklik di luar popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onInteractiveChangeCommit();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onInteractiveChangeCommit]);

  const isTextObject = objectType === "i-text" || objectType === "textbox";
  const isImageObject = objectType === "image";
  const isQrcodeObject = objectType === "qrcode";
  // Variabel `isShapeObject` dihapus karena tidak digunakan untuk menghindari warning ESLint

  const handleAlignClick = () => {
    const current = styles.textAlign ?? "left";
    const next: TextAlign =
      current === "left" ? "center" : current === "center" ? "right" : "left";
    onPropertyChange("textAlign", next);
  };

  return (
    <TooltipProvider>
      <div
        ref={popoverRef}
        className="bg-background no-scrollbar max-w-[95vw] overflow-x-auto rounded-lg border shadow-lg"
      >
        <div className="flex w-fit items-center gap-2 p-2">
          {/* Properti Warna & Bentuk */}
          {!isImageObject && (
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative h-8 w-8 cursor-pointer overflow-hidden rounded-md border bg-white">
                    <input
                      type="color"
                      value={styles.fill}
                      onFocus={onInteractiveChangeStart}
                      onInput={(e) =>
                        onInteractiveChange("fill", e.currentTarget.value)
                      }
                      onChange={onInteractiveChangeCommit}
                      onBlur={onInteractiveChangeCommit}
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
                        onPropertyChange("cornerRadius", Number(e.target.value))
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
                  onValueChange={(font) => onPropertyChange("fontFamily", font)}
                  disabled={areFontsLoading}
                >
                  <SelectTrigger className="h-8 w-[130px] rounded-md border shadow-sm">
                    <SelectValue
                      placeholder={areFontsLoading ? "Memuat..." : "Font"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {fontFamilies.map((font) => (
                      <SelectItem
                        key={font}
                        value={font}
                        style={{ fontFamily: font }}
                      >
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
                    onClick={() =>
                      onPropertyChange("fontSize", styles.fontSize - 1)
                    }
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={styles.fontSize}
                    onChange={(e) =>
                      onPropertyChange("fontSize", Number(e.target.value))
                    }
                    className="h-8 w-12 border-x-0 bg-transparent text-center focus-visible:ring-0"
                    min={1}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-l-none"
                    onClick={() =>
                      onPropertyChange("fontSize", styles.fontSize + 1)
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center rounded-md border p-0.5 shadow-sm">
                  <Toggle
                    size="sm"
                    pressed={styles.isBold}
                    onPressedChange={() =>
                      onPropertyChange(
                        "fontWeight",
                        styles.isBold ? "normal" : "bold",
                      )
                    }
                  >
                    <Bold className="h-4 w-4" />
                  </Toggle>
                  <Toggle
                    size="sm"
                    pressed={styles.isItalic}
                    onPressedChange={() =>
                      onPropertyChange(
                        "fontStyle",
                        styles.isItalic ? "normal" : "italic",
                      )
                    }
                  >
                    <Italic className="h-4 w-4" />
                  </Toggle>
                  <Toggle
                    size="sm"
                    pressed={styles.isUnderline}
                    onPressedChange={() =>
                      onPropertyChange("underline", !styles.isUnderline)
                    }
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
                {/* Kontrol Spasi Teks */}
                <Separator orientation="vertical" className="h-6" />
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pilcrow className="h-4 w-4" />
                          <span className="sr-only">Pengaturan Spasi Teks</span>
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Spasi Teks</p>
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent
                    className="w-56 p-2"
                    align="start"
                    onClick={(e) => e.stopPropagation()}
                    onPointerUp={onInteractiveChangeCommit}
                  >
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="letter-spacing" className="text-xs">
                          Jarak Huruf
                        </Label>
                        <Input
                          id="letter-spacing"
                          type="number"
                          value={styles.charSpacing}
                          onChange={(e) =>
                            onPropertyChange(
                              "charSpacing",
                              Number(e.target.value),
                            )
                          }
                          className="h-7 w-16 text-xs"
                        />
                      </div>
                      <Slider
                        value={[styles.charSpacing]}
                        onValueChange={([val]) =>
                          onInteractiveChange("charSpacing", val!)
                        }
                        onPointerDown={onInteractiveChangeStart}
                        onPointerUp={onInteractiveChangeCommit}
                        min={-100}
                        max={500}
                        step={5}
                      />
                    </div>
                    <DropdownMenuSeparator />
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="line-height" className="text-xs">
                          Tinggi Baris
                        </Label>
                        <Input
                          id="line-height"
                          type="number"
                          value={styles.lineHeight.toFixed(1)}
                          onChange={(e) =>
                            onPropertyChange(
                              "lineHeight",
                              Number(e.target.value),
                            )
                          }
                          className="h-7 w-16 text-xs"
                          step={0.1}
                        />
                      </div>
                      <Slider
                        value={[styles.lineHeight]}
                        onValueChange={([val]) =>
                          onInteractiveChange("lineHeight", val!)
                        }
                        onPointerDown={onInteractiveChangeStart}
                        onPointerUp={onInteractiveChangeCommit}
                        min={0.5}
                        max={3}
                        step={0.1}
                      />
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}

          {/* Properti Gambar */}
          {isImageObject && (
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
            <div className="flex items-center rounded-md border p-0.5 shadow-sm">
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
