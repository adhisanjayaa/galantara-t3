// File: src/app/design/[designId]/page.tsx

"use client";

import { useParams, useSearchParams } from "next/navigation";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useReducer,
  useMemo,
} from "react";
import { api } from "~/trpc/react";
import { Loader2, Check, X } from "lucide-react";
import {
  type Canvas,
  type FabricObject,
  IText,
  Rect,
  FabricImage,
  Line,
} from "fabric";
import { toast } from "sonner";
import QRCode from "qrcode";

import CanvasEditor from "~/app/design/components/CanvasEditor";
import DesignHeader from "~/app/design/components/DesignHeader";
import EditorToolbar from "~/app/design/components/EditorToolbar";
import { ObjectPropertiesPopover } from "~/app/design/components/ObjectPropertiesPopover";
import { Button } from "~/components/ui/button";

type PageState = { name: string; data: Record<string, unknown> };
interface IQrCodeImage extends FabricImage {
  isQrcode: true;
  qrcodeData: string;
  qrcodeFill: string;
}
type HistoryState = { history: string[]; index: number };
type HistoryAction =
  | { type: "SAVE"; payload: string }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESET"; payload: string };

const initialHistoryState: HistoryState = { history: [], index: -1 };

function historyReducer(
  state: HistoryState,
  action: HistoryAction,
): HistoryState {
  switch (action.type) {
    case "SAVE": {
      if (state.history[state.index] === action.payload) return state;
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(action.payload);
      return { history: newHistory, index: newHistory.length - 1 };
    }
    case "UNDO":
      return { ...state, index: Math.max(0, state.index - 1) };
    case "REDO":
      return {
        ...state,
        index: Math.min(state.history.length - 1, state.index + 1),
      };
    case "RESET":
      return { history: [action.payload], index: 0 };
    default:
      return state;
  }
}

export default function DesignEditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const designId = params.designId as string;
  const isNewDesign = designId === "new";
  const templateId = searchParams.get("templateId");

  const [canvasInstance, setCanvasInstance] = useState<Canvas | null>(null);
  const [activeObject, setActiveObject] = useState<FabricObject | null>(null);
  const [historyState, dispatchHistory] = useReducer(
    historyReducer,
    initialHistoryState,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [displaySize, setDisplaySize] = useState({
    width: 0,
    height: 0,
    scale: 1,
  });
  const [canBringForward, setCanBringForward] = useState(false);
  const [canSendBackward, setCanSendBackward] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [pages, setPages] = useState<PageState[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const mainWrapperRef = useRef<HTMLElement>(null);
  const panState = useRef({ isPanning: false, lastX: 0, lastY: 0 });
  const isHistoryProcessing = useRef(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const isColorChanging = useRef(false);
  const cropRectRef = useRef<Rect | null>(null);
  const originalImageRef = useRef<FabricImage | null>(null);

  const { data: existingDesign, isLoading: isLoadingDesign } =
    api.design.getDesignById.useQuery(
      { id: designId },
      { enabled: !isNewDesign && !!designId },
    );
  const { data: templateProduct, isLoading: isLoadingTemplate } =
    api.product.getProductById.useQuery(
      { id: templateId! },
      { enabled: isNewDesign && !!templateId },
    );
  const createPresignedUrlMutation =
    api.storage.createPresignedUrl.useMutation();
  const isLoading = isLoadingDesign || isLoadingTemplate;

  const artboardWidth = useMemo(
    () =>
      (isNewDesign
        ? templateProduct?.designTemplate?.artboardWidth
        : existingDesign?.product.designTemplate?.artboardWidth) ?? 1200,
    [existingDesign, templateProduct, isNewDesign],
  );
  const artboardHeight = useMemo(
    () =>
      (isNewDesign
        ? templateProduct?.designTemplate?.artboardHeight
        : existingDesign?.product.designTemplate?.artboardHeight) ?? 800,
    [existingDesign, templateProduct, isNewDesign],
  );

  const saveHistory = useCallback(() => {
    if (isHistoryProcessing.current || !canvasInstance) return;
    const currentState = JSON.stringify(canvasInstance.toJSON());
    dispatchHistory({ type: "SAVE", payload: currentState });
  }, [canvasInstance]);

  const updateScale = useCallback(
    (delta: number) => {
      setDisplaySize((prev) => {
        const newScale = parseFloat(
          Math.min(Math.max(prev.scale + delta, 0.1), 3).toFixed(2),
        );
        return {
          width: artboardWidth * newScale,
          height: artboardHeight * newScale,
          scale: newScale,
        };
      });
    },
    [artboardWidth, artboardHeight],
  );

  const handleZoom = useCallback(
    (action: "in" | "out" | "reset") => {
      if (action === "reset") {
        const wrapper = mainWrapperRef.current;
        if (!wrapper) return;
        const padding = 32;
        const scaleX = (wrapper.offsetWidth - padding) / artboardWidth;
        const scaleY = (wrapper.offsetHeight - padding) / artboardHeight;
        const newScale = Math.min(scaleX, scaleY);
        setDisplaySize({
          width: artboardWidth * newScale,
          height: artboardHeight * newScale,
          scale: newScale,
        });
      } else {
        const delta = action === "in" ? 0.1 : -0.1;
        updateScale(delta);
      }
    },
    [artboardWidth, artboardHeight, updateScale],
  );

  const handleUndo = useCallback(async () => {
    if (historyState.index > 0 && canvasInstance) {
      isHistoryProcessing.current = true;
      const targetState = historyState.history[historyState.index - 1]!;
      await canvasInstance.loadFromJSON(targetState);
      canvasInstance.renderAll();
      dispatchHistory({ type: "UNDO" });
      isHistoryProcessing.current = false;
    }
  }, [canvasInstance, historyState.index, historyState.history]);

  const handleRedo = useCallback(async () => {
    if (
      historyState.index < historyState.history.length - 1 &&
      canvasInstance
    ) {
      isHistoryProcessing.current = true;
      const targetState = historyState.history[historyState.index + 1]!;
      await canvasInstance.loadFromJSON(targetState);
      canvasInstance.renderAll();
      dispatchHistory({ type: "REDO" });
      isHistoryProcessing.current = false;
    }
  }, [canvasInstance, historyState.index, historyState.history]);

  const loadPageData = useCallback(
    (data: Record<string, unknown>) => {
      if (!canvasInstance) return;
      canvasInstance.loadFromJSON(data ?? {}, () => {
        canvasInstance.renderAll();
        const newInitialState = JSON.stringify(canvasInstance.toJSON());
        dispatchHistory({ type: "RESET", payload: newInitialState });
      });
    },
    [canvasInstance],
  );

  const handlePageChange = (index: number) => {
    if (index === currentPageIndex || !canvasInstance) return;
    const currentPageData = canvasInstance.toJSON();
    setPages((currentPages) => {
      const newPages = [...currentPages];
      const page = newPages[currentPageIndex];
      if (page) page.data = currentPageData;
      loadPageData(newPages[index]?.data ?? {});
      return newPages;
    });
    setCurrentPageIndex(index);
  };

  const getPagesForSave = (): PageState[] => {
    if (!canvasInstance) return pages;
    const currentPageData = canvasInstance.toJSON();
    const pagesToSave = [...pages];
    const page = pagesToSave[currentPageIndex];
    if (page) page.data = currentPageData;
    return pagesToSave;
  };

  const updateQrcode = useCallback(
    async (
      qrcodeObject: IQrCodeImage,
      options: { newColor?: string; newData?: string },
    ) => {
      if (!canvasInstance) return;
      const data = options.newData ?? qrcodeObject.qrcodeData;
      const color = options.newColor ?? qrcodeObject.qrcodeFill;
      try {
        const dataUrl = await QRCode.toDataURL(data, {
          width: 200,
          margin: 1,
          color: { dark: color, light: "#0000" },
        });
        await qrcodeObject.setSrc(dataUrl);
        qrcodeObject.qrcodeData = data;
        qrcodeObject.qrcodeFill = color;
        canvasInstance.renderAll();
      } catch {
        toast.error("Gagal membuat QR Code. Pastikan link valid.");
      }
    },
    [canvasInstance],
  );

  const handleColorChange = useCallback(
    (color: string) => {
      if (!activeObject || !canvasInstance) return;
      if ((activeObject as IQrCodeImage).isQrcode) {
        void updateQrcode(activeObject as IQrCodeImage, { newColor: color });
      } else {
        activeObject.set("fill", color);
      }
      isColorChanging.current = true;
      canvasInstance.renderAll();
    },
    [activeObject, canvasInstance, updateQrcode],
  );

  const handleColorCommit = useCallback(() => {
    if (isColorChanging.current) {
      saveHistory();
      isColorChanging.current = false;
    }
  }, [saveHistory]);

  const handlePropertyChange = useCallback(
    (prop: string, value: unknown) => {
      if (!activeObject || !canvasInstance) return;
      if (prop === "cornerRadius" && activeObject instanceof Rect) {
        activeObject.set("rx", value as number);
        activeObject.set("ry", value as number);
      } else {
        activeObject.set(prop as keyof FabricObject, value);
      }
      canvasInstance.renderAll();
      saveHistory();
    },
    [activeObject, canvasInstance, saveHistory],
  );

  const handleQrcodeDataChange = useCallback(
    (data: string) => {
      if (!activeObject || !(activeObject as IQrCodeImage).isQrcode) return;
      void updateQrcode(activeObject as IQrCodeImage, { newData: data });
      saveHistory();
    },
    [activeObject, saveHistory, updateQrcode],
  );

  const handleTextAlignChange = useCallback(
    (align: "left" | "center" | "right") => {
      if (!(activeObject instanceof IText) || !canvasInstance) return;
      activeObject.set("textAlign", align);
      canvasInstance.renderAll();
      saveHistory();
    },
    [activeObject, canvasInstance, saveHistory],
  );

  const handleToggleStyle = useCallback(
    (style: "Bold" | "Italic" | "Underline") => {
      if (!(activeObject instanceof IText) || !canvasInstance) return;
      switch (style) {
        case "Bold":
          activeObject.set(
            "fontWeight",
            activeObject.fontWeight === "bold" ? "normal" : "bold",
          );
          break;
        case "Italic":
          activeObject.set(
            "fontStyle",
            activeObject.fontStyle === "italic" ? "normal" : "italic",
          );
          break;
        case "Underline":
          activeObject.set("underline", !activeObject.underline);
          break;
      }
      canvasInstance.renderAll();
      saveHistory();
    },
    [activeObject, canvasInstance, saveHistory],
  );

  const handleFontSizeStep = useCallback(
    (step: number) => {
      if (!(activeObject instanceof IText)) return;
      const newSize = Math.max(1, (activeObject.fontSize || 0) + step);
      handlePropertyChange("fontSize", newSize);
    },
    [activeObject, handlePropertyChange],
  );

  const handleToggleLock = useCallback(() => {
    if (!activeObject || !canvasInstance) return;
    const isLocked = !activeObject.lockMovementX;
    activeObject.set({
      lockMovementX: isLocked,
      lockMovementY: isLocked,
      lockRotation: isLocked,
      lockScalingX: isLocked,
      lockScalingY: isLocked,
      hasControls: !isLocked,
    });
    canvasInstance.renderAll();
  }, [activeObject, canvasInstance]);

  const handleDeleteObject = useCallback(() => {
    if (activeObject && canvasInstance) {
      canvasInstance.remove(activeObject);
      canvasInstance.discardActiveObject();
      canvasInstance.renderAll();
      saveHistory();
    }
  }, [activeObject, canvasInstance, saveHistory]);

  const handleBringForward = useCallback(() => {
    if (activeObject && canvasInstance) {
      canvasInstance.bringObjectForward(activeObject);
      canvasInstance.renderAll();
      saveHistory();
    }
  }, [activeObject, canvasInstance, saveHistory]);

  const handleSendBackwards = useCallback(() => {
    if (activeObject && canvasInstance) {
      canvasInstance.sendObjectBackwards(activeObject);
      canvasInstance.renderAll();
      saveHistory();
    }
  }, [activeObject, canvasInstance, saveHistory]);

  const handleAddQrcode = useCallback(async () => {
    if (!canvasInstance) return;
    const qrcodeValue = "https://galantara.com";
    try {
      const dataUrl = await QRCode.toDataURL(qrcodeValue, {
        width: 200,
        margin: 1,
        color: { dark: "#000000", light: "#0000" },
      });
      const img = await FabricImage.fromURL(dataUrl);
      Object.assign(img, {
        isQrcode: true,
        qrcodeData: qrcodeValue,
        qrcodeFill: "#000000",
      });
      canvasInstance.add(img);
      canvasInstance.centerObject(img);
      canvasInstance.setActiveObject(img);
      saveHistory();
    } catch {
      toast.error("Gagal membuat QR code.");
    }
  }, [canvasInstance, saveHistory]);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!canvasInstance) return;
      const file = e.target.files?.[0];
      if (!file) return;
      const objectToReplace = activeObject;
      const isReplacing = objectToReplace instanceof FabricImage;
      setIsUploading(true);
      toast.info(isReplacing ? "Mengganti gambar..." : "Mengunggah gambar...");
      try {
        const { uploadUrl, publicUrl } =
          await createPresignedUrlMutation.mutateAsync({ fileType: file.type });
        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });
        const cacheBustedUrl = `${publicUrl}?t=${new Date().getTime()}`;
        const newImg = await FabricImage.fromURL(cacheBustedUrl, undefined, {
          crossOrigin: "anonymous",
        });
        if (isReplacing) {
          const oldImg = objectToReplace;
          const newScale = oldImg.getScaledWidth() / (newImg.width ?? 1);
          newImg.set({
            left: oldImg.left,
            top: oldImg.top,
            angle: oldImg.angle ?? 0,
            scaleX: newScale,
            scaleY: newScale,
          });
          canvasInstance.remove(oldImg);
          canvasInstance.add(newImg);
          canvasInstance.setActiveObject(newImg);
        } else {
          newImg.scaleToWidth(200);
          canvasInstance.add(newImg);
          canvasInstance.centerObject(newImg);
          canvasInstance.setActiveObject(newImg);
        }
        canvasInstance.renderAll();
        saveHistory();
        toast.success(
          isReplacing
            ? "Gambar berhasil diganti!"
            : "Gambar berhasil ditambahkan!",
        );
      } catch (error) {
        toast.error("Gagal mengunggah gambar.");
        console.error("Image upload error:", error);
      } finally {
        setIsUploading(false);
        if (imageInputRef.current) {
          imageInputRef.current.value = "";
        }
      }
    },
    [canvasInstance, activeObject, createPresignedUrlMutation, saveHistory],
  );

  const triggerImageUpload = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const enterCropMode = useCallback(() => {
    if (!canvasInstance || !(activeObject instanceof FabricImage)) return;
    setIsCropping(true);
    originalImageRef.current = activeObject;
    canvasInstance.getObjects().forEach((obj) => {
      obj.selectable = false;
      obj.evented = false;
    });
    const cropRect = new Rect({
      left: activeObject.left,
      top: activeObject.top,
      width: activeObject.getScaledWidth(),
      height: activeObject.getScaledHeight(),
      fill: "rgba(0,0,0,0.3)",
      stroke: "rgba(255, 255, 255, 0.7)",
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      hasControls: true,
      lockRotation: true,
      excludeFromExport: true,
    });
    canvasInstance.add(cropRect);
    canvasInstance.setActiveObject(cropRect);
    cropRectRef.current = cropRect;
    canvasInstance.renderAll();
  }, [canvasInstance, activeObject]);

  const exitCropMode = useCallback(() => {
    if (!canvasInstance) return;
    setIsCropping(false);
    if (cropRectRef.current) {
      canvasInstance.remove(cropRectRef.current);
      cropRectRef.current = null;
    }
    canvasInstance.getObjects().forEach((obj) => {
      obj.selectable = true;
      obj.evented = true;
    });
    if (originalImageRef.current) {
      canvasInstance.setActiveObject(originalImageRef.current);
      originalImageRef.current = null;
    }
    canvasInstance.renderAll();
  }, [canvasInstance]);

  const applyCrop = useCallback(async () => {
    if (!canvasInstance || !originalImageRef.current || !cropRectRef.current)
      return;
    const fabricImg = originalImageRef.current;
    const cropZone = cropRectRef.current;
    try {
      const imgBounds = fabricImg.getBoundingRect();
      const zoneBounds = cropZone.getBoundingRect();
      const intersectLeft = Math.max(imgBounds.left, zoneBounds.left);
      const intersectTop = Math.max(imgBounds.top, zoneBounds.top);
      const intersectRight = Math.min(
        imgBounds.left + imgBounds.width,
        zoneBounds.left + zoneBounds.width,
      );
      const intersectBottom = Math.min(
        imgBounds.top + imgBounds.height,
        zoneBounds.top + zoneBounds.height,
      );
      const intersectWidth = intersectRight - intersectLeft;
      const intersectHeight = intersectBottom - intersectTop;
      if (intersectWidth <= 0 || intersectHeight <= 0) {
        toast.warning("Area crop berada di luar gambar.");
        exitCropMode();
        return;
      }
      const src = fabricImg.getSrc?.();
      if (!src) throw new Error("Tidak bisa mengambil URL gambar.");
      const safeImg = new Image();
      safeImg.crossOrigin = "anonymous";
      safeImg.src = src;
      await new Promise<void>((resolve, reject) => {
        safeImg.onload = () => resolve();
        safeImg.onerror = reject;
      });
      const scaleX = fabricImg.scaleX ?? 1;
      const scaleY = fabricImg.scaleY ?? 1;
      const sourceX = (intersectLeft - imgBounds.left) / scaleX;
      const sourceY = (intersectTop - imgBounds.top) / scaleY;
      const sourceWidth = intersectWidth / scaleX;
      const sourceHeight = intersectHeight / scaleY;
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = sourceWidth;
      tempCanvas.height = sourceHeight;
      const ctx = tempCanvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");
      ctx.drawImage(
        safeImg,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        sourceWidth,
        sourceHeight,
      );
      const croppedDataUrl = tempCanvas.toDataURL();
      const croppedImg = await FabricImage.fromURL(croppedDataUrl, undefined, {
        crossOrigin: "anonymous",
      });
      croppedImg.set({
        left: intersectLeft,
        top: intersectTop,
        scaleX: intersectWidth / croppedImg.width,
        scaleY: intersectHeight / croppedImg.height,
      });
      canvasInstance.remove(fabricImg);
      canvasInstance.add(croppedImg);
      canvasInstance.setActiveObject(croppedImg);
      saveHistory();
      exitCropMode();
    } catch (err) {
      console.error("Gagal crop:", err);
      toast.error(
        "Gagal melakukan crop. Gambar mungkin diblokir oleh browser.",
      );
      exitCropMode();
    }
  }, [canvasInstance, exitCropMode, saveHistory]);

  const handleDuplicateObject = useCallback(async () => {
    if (!canvasInstance || !activeObject) return;
    try {
      const cloned = await activeObject.clone([
        "isQrcode",
        "qrcodeData",
        "qrcodeFill",
      ]);
      cloned.set({
        left: (cloned.left ?? 0) + 10,
        top: (cloned.top ?? 0) + 10,
      });
      canvasInstance.add(cloned);
      canvasInstance.setActiveObject(cloned);
      canvasInstance.renderAll();
      saveHistory();
    } catch (error) {
      console.error("Gagal melakukan duplikasi:", error);
      toast.error("Gagal menduplikasi objek.");
    }
  }, [canvasInstance, activeObject, saveHistory]);

  useEffect(() => {
    if (isLoading || !canvasInstance) return;
    const dataToLoad = isNewDesign
      ? templateProduct?.designTemplate?.designData
      : existingDesign?.designData;
    let initialPages: PageState[] = [{ name: "Page 1", data: {} }];
    if (Array.isArray(dataToLoad) && dataToLoad.length > 0) {
      initialPages = dataToLoad.map((pageData, index) => {
        const page = pageData as Partial<PageState>;
        if (
          typeof page === "object" &&
          page !== null &&
          "data" in page &&
          "name" in page
        ) {
          return page as PageState;
        }
        return {
          name: `Page ${index + 1}`,
          data: pageData as Record<string, unknown>,
        };
      });
    }
    setPages(initialPages);
    loadPageData(initialPages[0]?.data ?? {});
  }, [
    canvasInstance,
    existingDesign,
    templateProduct,
    isNewDesign,
    isLoading,
    loadPageData,
  ]);

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

  useEffect(() => {
    if (!canvasInstance) return;
    canvasInstance.off();
    canvasInstance.setDimensions({
      width: artboardWidth,
      height: artboardHeight,
    });
    canvasInstance.backgroundColor = "white";
    canvasInstance.preserveObjectStacking = true;
    const verticalLine = new Line([0, 0, 0, 0], {
      stroke: "rgba(255, 0, 0, 0.5)",
      selectable: false,
      evented: false,
      visible: false,
      strokeWidth: 1,
      excludeFromExport: true,
    });
    const horizontalLine = new Line([0, 0, 0, 0], {
      stroke: "rgba(255, 0, 0, 0.5)",
      selectable: false,
      evented: false,
      visible: false,
      strokeWidth: 1,
      excludeFromExport: true,
    });
    canvasInstance.add(verticalLine, horizontalLine);
    const handleSelection = (e: { selected?: FabricObject[] }) => {
      if (!isCropping) {
        setActiveObject(e.selected?.[0] ?? null);
      }
    };
    const hideSnapLines = () => {
      verticalLine.visible = false;
      horizontalLine.visible = false;
      canvasInstance.requestRenderAll();
    };
    const handleObjectMoving = (e: { target?: FabricObject }) => {
      const target = e.target;
      if (target?.left === undefined || target?.top === undefined) return;

      const snapThreshold = 6;
      const canvasWidth = canvasInstance.getWidth();
      const canvasHeight = canvasInstance.getHeight();
      verticalLine.visible = false;
      horizontalLine.visible = false;

      const canvasCenter = canvasInstance.getCenterPoint();
      const targetCenter = target.getCenterPoint();

      if (Math.abs(targetCenter.x - canvasCenter.x) < snapThreshold) {
        target.set({ left: canvasCenter.x - target.getScaledWidth() / 2 });
        verticalLine
          .set({
            x1: canvasCenter.x,
            y1: 0,
            x2: canvasCenter.x,
            y2: canvasHeight,
          })
          .setCoords();
        verticalLine.visible = true;
        canvasInstance.bringObjectToFront(verticalLine);
      }

      if (Math.abs(targetCenter.y - canvasCenter.y) < snapThreshold) {
        target.set({ top: canvasCenter.y - target.getScaledHeight() / 2 });
        horizontalLine
          .set({
            x1: 0,
            y1: canvasCenter.y,
            x2: canvasWidth,
            y2: canvasCenter.y,
          })
          .setCoords();
        horizontalLine.visible = true;
        canvasInstance.bringObjectToFront(horizontalLine);
      }

      target.setCoords();
      canvasInstance.requestRenderAll();
    };
    const handleTextEditing = () => {
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 0);
    };
    const handleCanvasClick = () => {
      handleColorCommit();
    };
    canvasInstance.on("selection:created", handleSelection);
    canvasInstance.on("selection:updated", handleSelection);
    canvasInstance.on("selection:cleared", () => setActiveObject(null));
    canvasInstance.on("object:modified", saveHistory);
    canvasInstance.on("object:moving", handleObjectMoving);
    canvasInstance.on("mouse:up", hideSnapLines);
    canvasInstance.on("mouse:down", handleCanvasClick);
    canvasInstance.on("text:editing:entered", handleTextEditing);
    return () => {
      canvasInstance.off();
    };
  }, [
    canvasInstance,
    artboardWidth,
    artboardHeight,
    saveHistory,
    handleColorCommit,
    isCropping,
  ]);

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
    if (activeObjectIndex === -1) {
      setCanBringForward(false);
      setCanSendBackward(false);
      return;
    }
    setCanBringForward(activeObjectIndex < designObjects.length - 1);
    setCanSendBackward(activeObjectIndex > 0);
  }, [activeObject, canvasInstance, historyState]);

  useEffect(() => {
    const wrapper = mainWrapperRef.current;
    if (!wrapper) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        updateScale(e.deltaY > 0 ? -0.1 : 0.1);
      }
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (e.altKey) {
        e.preventDefault();
        panState.current = {
          isPanning: true,
          lastX: e.clientX,
          lastY: e.clientY,
        };
        wrapper.style.cursor = "grabbing";
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (panState.current.isPanning) {
        const dx = e.clientX - panState.current.lastX;
        const dy = e.clientY - panState.current.lastY;
        wrapper.scrollTop -= dy;
        wrapper.scrollLeft -= dx;
        panState.current.lastX = e.clientX;
        panState.current.lastY = e.clientY;
      }
    };
    const handleMouseUp = () => {
      if (panState.current.isPanning) {
        panState.current.isPanning = false;
        wrapper.style.cursor = "default";
      }
    };
    wrapper.addEventListener("wheel", handleWheel, { passive: false });
    wrapper.addEventListener("mousedown", handleMouseDown);
    wrapper.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      wrapper.removeEventListener("wheel", handleWheel);
      wrapper.removeEventListener("mousedown", handleMouseDown);
      wrapper.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [updateScale]);

  useEffect(() => {
    const wrapper = mainWrapperRef.current;
    if (isLoading || !wrapper || artboardWidth === 0) return;
    const calculateLayout = () => {
      const availableWidth = wrapper.offsetWidth;
      const availableHeight = wrapper.offsetHeight;
      const padding = 32;
      const scaleX = (availableWidth - padding) / artboardWidth;
      const scaleY = (availableHeight - padding) / artboardHeight;
      const newScale = Math.min(scaleX, scaleY);
      setDisplaySize({
        width: artboardWidth * newScale,
        height: artboardHeight * newScale,
        scale: newScale,
      });
    };
    const timeoutId = setTimeout(calculateLayout, 0);
    const resizeObserver = new ResizeObserver(calculateLayout);
    resizeObserver.observe(wrapper);
    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [isLoading, artboardWidth, artboardHeight]);

  const activeObjectProps = useMemo(() => {
    if (!activeObject) return null;
    const isText = activeObject instanceof IText;
    const isRect = activeObject instanceof Rect;
    const isQrcode = (activeObject as IQrCodeImage).isQrcode;
    let fill =
      typeof activeObject.fill === "string" ? activeObject.fill : "#000000";
    if (isQrcode) {
      fill = (activeObject as IQrCodeImage).qrcodeFill ?? "#000000";
    }
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
    };
  }, [activeObject]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  const productIdForHeader = isNewDesign
    ? templateId
    : existingDesign?.productId;
  const initialNameForHeader = isNewDesign
    ? `Desain - ${templateProduct?.name ?? ""}`
    : (existingDesign?.name ?? "");
  if (!productIdForHeader) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-destructive">Gagal memuat data produk template.</p>
      </div>
    );
  }

  return (
    <div className="bg-muted flex h-screen flex-col overflow-hidden">
      <DesignHeader
        {...{
          designId: isNewDesign ? null : designId,
          initialName: initialNameForHeader,
          productId: productIdForHeader,
          canvasInstance,
          onUndo: () => void handleUndo(),
          onRedo: () => void handleRedo(),
          canUndo: historyState.index > 0,
          canRedo: historyState.index < historyState.history.length - 1,
          getPagesForSave,
        }}
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
            {...{
              canvas: canvasInstance,
              onAddImage: triggerImageUpload,
              onAddQrcode: () => void handleAddQrcode(),
              scale: displaySize.scale,
              onZoom: handleZoom,
              pages,
              currentPageIndex,
              onPageChange: handlePageChange,
            }}
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
              onFillChange={handleColorChange}
              onFillChangeCommit={handleColorCommit}
              onToggleBold={() => handleToggleStyle("Bold")}
              onToggleItalic={() => handleToggleStyle("Italic")}
              onToggleUnderline={() => handleToggleStyle("Underline")}
              onFontSizeChange={(size) =>
                handlePropertyChange("fontSize", size)
              }
              onIncrementFontSize={() => handleFontSizeStep(1)}
              onDecrementFontSize={() => handleFontSizeStep(-1)}
              onFontFamilyChange={(font) =>
                handlePropertyChange("fontFamily", font)
              }
              onCornerRadiusChange={(radius) =>
                handlePropertyChange("cornerRadius", radius)
              }
              onToggleLock={handleToggleLock}
              onDeleteObject={handleDeleteObject}
              onChangeImage={triggerImageUpload}
              onCropImage={enterCropMode}
              onBringForward={handleBringForward}
              onSendBackward={handleSendBackwards}
              onDuplicateObject={() => void handleDuplicateObject()}
              onQrcodeDataChange={handleQrcodeDataChange}
              onTextAlignChange={handleTextAlignChange}
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
