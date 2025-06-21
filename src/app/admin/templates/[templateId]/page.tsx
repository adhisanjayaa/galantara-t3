// File: src/app/admin/templates/[templateId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { api } from "~/trpc/react";
import { Loader2, Check, X } from "lucide-react";

// Impor tipe dan nilai dari 'fabric' secara terpisah
import type { Canvas, FabricObject, FabricImage } from "fabric";
import { IText, Rect } from "fabric";

// Impor semua hooks modular yang akan kita gunakan
import { useCanvasHistory } from "../hooks/useCanvasHistory";
import { usePageManager, type PageState } from "../hooks/usePageManager";
import { useViewportHandler } from "../hooks/useViewportHandler";
import { useImageHandler } from "../hooks/useImageHandler";
import { useCanvasHandlers } from "../hooks/useCanvasHandlers";
import { useCanvasSetup } from "../hooks/useCanvasSetup";
import { useFontLoader } from "../hooks/useFontLoader";

// Impor Komponen UI
import CanvasEditor from "~/app/design/components/CanvasEditor";
import AdminDesignHeader from "../components/AdminDesignHeader";
import EditorToolbar from "~/app/design/components/EditorToolbar";
import { ObjectPropertiesPopover } from "~/app/design/components/ObjectPropertiesPopover";
import { Button } from "~/components/ui/button";

interface IQrCodeImage extends FabricImage {
  isQrcode: true;
  qrcodeData: string;
  qrcodeFill: string;
}

export default function AdminTemplateEditorPage() {
  const params = useParams();
  const templateId = params.templateId as string;
  const isNewTemplate = templateId === "new";

  // State Inti Komponen
  const [templateName, setTemplateName] = useState("Template Baru");
  const [artboardWidth, setArtboardWidth] = useState(1200);
  const [artboardHeight, setArtboardHeight] = useState(800);
  const [canvasInstance, setCanvasInstance] = useState<Canvas | null>(null);
  const [activeObject, setActiveObject] = useState<FabricObject | null>(null);
  const [canBringForward, setCanBringForward] = useState(false);
  const [canSendBackward, setCanSendBackward] = useState(false);
  const [objectVersion, setObjectVersion] = useState(0);
  const forceUpdate = useCallback(() => setObjectVersion((v) => v + 1), []);

  // Refs
  const mainWrapperRef = useRef<HTMLElement | null>(null);

  // tRPC Hooks
  const { data: existingTemplate, isLoading } =
    api.admin.getDesignTemplateById.useQuery(
      { id: templateId },
      { enabled: !isNewTemplate },
    );

  // Inisialisasi Custom Hooks
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    executeCommand,
    recordObjectStateBeforeModify,
    createModificationCommand,
    commands,
  } = useCanvasHistory(canvasInstance);

  const {
    pages,
    setPages,
    currentPageIndex,
    handlePageChange,
    handleAddPage,
    handleRenamePage,
    getPagesForSave,
    loadPageData,
  } = usePageManager({ canvasInstance, clearHistory });

  const { displaySize, handleZoom } = useViewportHandler({
    artboardWidth,
    artboardHeight,
    mainWrapperRef,
  });

  const {
    isUploading,
    isCropping,
    imageInputRef,
    handleImageUpload,
    triggerImageUpload,
    enterCropMode,
    exitCropMode,
    applyCrop,
  } = useImageHandler({
    canvasInstance,
    activeObject,
    executeCommand,
    Commands: commands,
  });

  // --- PERBAIKAN DI SINI: Samakan nama fungsinya ---
  const {
    handleAddText,
    handleAddRectangle,
    handleAddCircle,
    handleAddQrcode,
    handlePropertyChange,
    handleDeleteObject,
    handleBringObjectForward, // <-- Nama yang benar
    handleSendObjectBackwards, // <-- Nama yang benar
    handleDuplicateObject,
    handleQrcodeDataChange,
    recordStateBeforeInteractiveChange,
    handleInteractiveChange,
    handleInteractiveChangeCommit,
    handleToggleLock,
  } = useCanvasHandlers({
    canvasInstance,
    activeObject,
    executeCommand,
    Commands: commands,
    forceUpdate,
  });

  useCanvasSetup({
    canvasInstance,
    artboardWidth,
    artboardHeight,
    setActiveObject,
    isCropping,
    recordObjectStateBeforeModify,
    createModificationCommand,
  });

  const { availableFonts, areFontsLoading } = useFontLoader();

  useEffect(() => {
    const originalBodyStyle = document.body.style.cssText;
    const originalHtmlStyle = document.documentElement.style.cssText;

    document.documentElement.style.position = "fixed";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.width = "100%";
    document.documentElement.style.height = "100%";

    return () => {
      document.body.style.cssText = originalBodyStyle;
      document.documentElement.style.cssText = originalHtmlStyle;
    };
  }, []);

  // Effects
  useEffect(() => {
    if (!canvasInstance) return;
    if (!isNewTemplate && isLoading) return;

    if (!isNewTemplate && existingTemplate) {
      setTemplateName(existingTemplate.name);
      setArtboardWidth(existingTemplate.artboardWidth ?? 1200);
      setArtboardHeight(existingTemplate.artboardHeight ?? 800);
      const dataToLoad = existingTemplate.designData as unknown;
      if (Array.isArray(dataToLoad) && dataToLoad.length > 0) {
        setPages(dataToLoad as PageState[]);
        loadPageData(dataToLoad[0]?.data ?? {});
      } else {
        const singlePage = {
          name: "Page 1",
          data: (dataToLoad ?? {}) as Record<string, unknown>,
        };
        setPages([singlePage]);
        loadPageData(singlePage.data);
      }
    } else if (isNewTemplate) {
      const firstPage = { name: "Page 1", data: {} };
      setPages([firstPage]);
      loadPageData(firstPage.data);
    }
  }, [
    canvasInstance,
    existingTemplate,
    isLoading,
    isNewTemplate,
    loadPageData,
    setPages,
  ]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    if (!canvasInstance || !activeObject) {
      setCanBringForward(false);
      setCanSendBackward(false);
      return;
    }
    const designObjects = canvasInstance
      .getObjects()
      .filter((obj) => !obj.excludeFromExport);
    const activeObjectIndex = designObjects.indexOf(activeObject);
    setCanBringForward(activeObjectIndex < designObjects.length - 1);
    setCanSendBackward(activeObjectIndex > 0);
  }, [activeObject, canvasInstance, objectVersion]);

  const activeObjectProps = useMemo(() => {
    if (!activeObject) return null;
    const isText = activeObject instanceof IText;
    const isRect = activeObject instanceof Rect;
    const isQrcode = (activeObject as IQrCodeImage).isQrcode;
    let fill =
      typeof activeObject.fill === "string" ? activeObject.fill : "#000000";
    if (isQrcode) fill = (activeObject as IQrCodeImage).qrcodeFill ?? "#000000";

    return {
      fill,
      isLocked: !!activeObject.lockMovementX,
      qrcodeData: isQrcode ? (activeObject as IQrCodeImage).qrcodeData : "",
      textAlign: (isText ? (activeObject as IText).textAlign : "left") as
        | "left"
        | "center"
        | "right",
      isBold: isText ? (activeObject as IText).fontWeight === "bold" : false,
      isItalic: isText ? (activeObject as IText).fontStyle === "italic" : false,
      isUnderline: isText ? !!(activeObject as IText).underline : false,
      fontSize: isText ? ((activeObject as IText).fontSize ?? 24) : 24,
      fontFamily: isText
        ? ((activeObject as IText).fontFamily ?? "Arial")
        : "Arial",
      cornerRadius: isRect ? ((activeObject as Rect).get("rx") ?? 0) : 0,
      charSpacing: isText ? ((activeObject as IText).charSpacing ?? 0) : 0,
      lineHeight: isText ? ((activeObject as IText).lineHeight ?? 1.2) : 1.2,
    };
  }, [activeObject]);

  if (isLoading && !isNewTemplate) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-muted flex h-[100dvh] flex-col overflow-hidden">
      <AdminDesignHeader
        templateId={isNewTemplate ? null : templateId}
        templateName={templateName}
        setTemplateName={setTemplateName}
        artboardWidth={artboardWidth}
        setArtboardWidth={setArtboardWidth}
        artboardHeight={artboardHeight}
        setArtboardHeight={setArtboardHeight}
        canvasInstance={canvasInstance}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        getPagesForSave={getPagesForSave}
      />
      <div className="bg-background flex h-14 items-center justify-center border-b px-4">
        {isCropping ? (
          <div className="flex w-full items-center justify-center gap-2">
            <Button variant="outline" onClick={exitCropMode} size="sm">
              <X className="mr-2 h-4 w-4" /> Batal
            </Button>
            <Button onClick={() => void applyCrop()} size="sm">
              <Check className="mr-2 h-4 w-4" /> Terapkan Crop
            </Button>
          </div>
        ) : (
          <EditorToolbar
            onAddImage={triggerImageUpload}
            onAddQrcode={() => {
              void handleAddQrcode();
            }}
            onAddText={handleAddText}
            onAddRectangle={handleAddRectangle}
            onAddCircle={handleAddCircle}
            scale={displaySize.scale}
            onZoom={handleZoom}
            pages={pages}
            currentPageIndex={currentPageIndex}
            onPageChange={handlePageChange}
            onAddPage={handleAddPage}
            onRenamePage={handleRenamePage}
          />
        )}
      </div>
      <main
        className="relative h-[calc(100dvh-7.5rem)] overflow-hidden bg-gray-200 p-4"
        ref={mainWrapperRef}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%)`,
            width: displaySize.width,
            height: displaySize.height,
          }}
        >
          <div
            style={{
              width: artboardWidth,
              height: artboardHeight,
              transform: `scale(${displaySize.scale})`,
              transformOrigin: "top left",
            }}
          >
            <div className="h-full w-full bg-white shadow-lg">
              <CanvasEditor onReady={setCanvasInstance} />
            </div>
          </div>
        </div>
        <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
          {activeObject && activeObjectProps && !isCropping && (
            <ObjectPropertiesPopover
              objectType={
                (activeObject as IQrCodeImage).isQrcode
                  ? "qrcode"
                  : (activeObject.type ?? null)
              }
              styles={activeObjectProps}
              isAtFront={!canBringForward}
              isAtBack={!canSendBackward}
              onInteractiveChangeStart={recordStateBeforeInteractiveChange}
              onInteractiveChange={handleInteractiveChange}
              onInteractiveChangeCommit={handleInteractiveChangeCommit}
              onPropertyChange={handlePropertyChange}
              onToggleLock={handleToggleLock}
              onDeleteObject={handleDeleteObject}
              onChangeImage={triggerImageUpload}
              onCropImage={enterCropMode}
              onBringForward={handleBringObjectForward} // <-- Nama yang benar
              onSendBackward={handleSendObjectBackwards} // <-- Nama yang benar
              onDuplicateObject={() => {
                void handleDuplicateObject();
              }}
              onQrcodeDataChange={handleQrcodeDataChange}
              fontFamilies={availableFonts}
              areFontsLoading={areFontsLoading}
            />
          )}
        </div>
      </main>
      <input
        type="file"
        accept="image/*"
        ref={imageInputRef}
        className="hidden"
        onChange={(e) => void handleImageUpload(e)}
        disabled={isUploading}
      />
    </div>
  );
}
