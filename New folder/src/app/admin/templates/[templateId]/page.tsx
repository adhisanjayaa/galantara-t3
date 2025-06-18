"use client";

import { useParams, useRouter } from "next/navigation";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useReducer,
  useMemo,
} from "react";
import { api } from "~/trpc/react";
import { Loader2, Hand, Check, X } from "lucide-react";
import { Canvas, FabricObject, IText, Rect, FabricImage, Line } from "fabric";
import { toast } from "sonner";
import QRCode from "qrcode";

// Component Imports
import CanvasEditor from "~/app/design/components/CanvasEditor";
import AdminDesignHeader from "../components/AdminDesignHeader";
import EditorToolbar from "~/app/design/components/EditorToolbar";
import { ObjectPropertiesPopover } from "~/app/design/components/ObjectPropertiesPopover";
import { Button } from "~/components/ui/button";

type PageState = {
  name: string;
  data: any; // data JSON dari Fabric.js
};

// --- History State Management ---
type HistoryState = {
  history: string[];
  index: number;
};
type HistoryAction =
  | { type: "SAVE"; payload: string }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESET"; payload: string };

const initialHistoryState: HistoryState = {
  history: [],
  index: -1,
};

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

// --- Main Component ---
export default function AdminTemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;
  const isNewTemplate = templateId === "new";

  // --- STATE & REFS ---
  const [templateName, setTemplateName] = useState("Template Baru");
  const [artboardWidth, setArtboardWidth] = useState(1200);
  const [artboardHeight, setArtboardHeight] = useState(800);
  const [canvasInstance, setCanvasInstance] = useState<Canvas | null>(null);
  const [activeObject, setActiveObject] = useState<FabricObject | null>(null);
  const [historyState, dispatchHistory] = useReducer(
    historyReducer,
    initialHistoryState,
  );

  const [pages, setPages] = useState<PageState[]>([
    { name: "Page 1", data: {} },
  ]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const [isUploading, setIsUploading] = useState(false);
  const [displaySize, setDisplaySize] = useState({
    width: 0,
    height: 0,
    scale: 1,
  });
  const [canBringForward, setCanBringForward] = useState(false);
  const [canSendBackward, setCanSendBackward] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [forceRender, setForceRender] = useState(0);

  const cropRectRef = useRef<Rect | null>(null);
  const originalImageRef = useRef<FabricImage | null>(null);
  const mainWrapperRef = useRef<HTMLElement>(null);
  const panState = useRef({ isPanning: false, lastX: 0, lastY: 0 });
  const isHistoryProcessing = useRef(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const isColorChanging = useRef(false);

  // --- DATA FETCHING (tRPC Admin Router) ---
  const { data: existingTemplate, isLoading } =
    api.admin.getDesignTemplateById.useQuery(
      { id: templateId },
      { enabled: !isNewTemplate },
    );
  const createPresignedUrlMutation =
    api.storage.createPresignedUrl.useMutation();

  // --- CANVAS HANDLERS ---
  const saveHistory = useCallback(() => {
    if (isHistoryProcessing.current || !canvasInstance) return;
    // --- PERBAIKAN DI SINI ---
    // @ts-ignore
    const currentState = JSON.stringify(canvasInstance.toJSON());
    dispatchHistory({ type: "SAVE", payload: currentState });
  }, [canvasInstance]);

  const loadPageData = useCallback(
    (data: any) => {
      if (!canvasInstance) return;
      canvasInstance.loadFromJSON(data ?? {}, () => {
        canvasInstance.renderAll();
        // --- PERBAIKAN DI SINI ---
        // @ts-ignore
        const newInitialState = JSON.stringify(canvasInstance.toJSON());
        dispatchHistory({ type: "RESET", payload: newInitialState });
      });
    },
    [canvasInstance],
  );

  const handlePageChange = (index: number) => {
    if (index === currentPageIndex || !canvasInstance) return;

    // @ts-ignore
    const currentPageData = canvasInstance.toJSON([
      "isQrcode",
      "qrcodeData",
      "qrcodeFill",
    ]);
    setPages((currentPages) => {
      const newPages = [...currentPages];
      const page = newPages[currentPageIndex];
      if (page) {
        page.data = currentPageData;
      }
      loadPageData(newPages[index]?.data);
      return newPages;
    });
    setCurrentPageIndex(index);
  };

  const handleAddPage = () => {
    if (!canvasInstance) return;

    // @ts-ignore
    const currentPageData = canvasInstance.toJSON([
      "isQrcode",
      "qrcodeData",
      "qrcodeFill",
    ]);
    const newPage: PageState = { name: `Page ${pages.length + 1}`, data: {} };

    setPages((currentPages) => {
      const updatedPages = [...currentPages];
      const page = updatedPages[currentPageIndex];
      if (page) {
        page.data = currentPageData;
      }
      return [...updatedPages, newPage];
    });

    setCurrentPageIndex(pages.length);
    loadPageData({});
    toast.success(`Halaman ${pages.length + 1} ditambahkan.`);
  };

  const handleRenamePage = (index: number, newName: string) => {
    setPages((currentPages) => {
      const newPages = [...currentPages];
      const pageToUpdate = newPages[index];
      if (pageToUpdate) {
        pageToUpdate.name = newName;
      }
      return newPages;
    });
    toast.success("Nama halaman berhasil diperbarui!");
  };

  const getPagesForSave = (): PageState[] => {
    if (!canvasInstance) return pages;
    // @ts-ignore
    const currentPageData = canvasInstance.toJSON([
      "isQrcode",
      "qrcodeData",
      "qrcodeFill",
    ]);
    const pagesToSave = [...pages];
    const page = pagesToSave[currentPageIndex];
    if (page) {
      page.data = currentPageData;
    }
    return pagesToSave;
  };

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

  const updateQrcode = useCallback(
    async (
      qrcodeObject: FabricObject,
      options: { newColor?: string; newData?: string },
    ) => {
      if (!canvasInstance) return;
      const data =
        options.newData ?? ((qrcodeObject as any).qrcodeData as string);
      const color =
        options.newColor ?? ((qrcodeObject as any).qrcodeFill as string);
      try {
        const dataUrl = await QRCode.toDataURL(data, {
          width: 200,
          margin: 1,
          color: { dark: color, light: "#0000" },
        });
        await (qrcodeObject as FabricImage).setSrc(dataUrl);
        (qrcodeObject as any).qrcodeData = data;
        (qrcodeObject as any).qrcodeFill = color;
        canvasInstance.renderAll();
      } catch (err) {
        toast.error("Gagal membuat QR Code. Pastikan link valid.");
      }
    },
    [canvasInstance],
  );

  const handleColorChange = useCallback(
    (color: string) => {
      if (!activeObject || !canvasInstance) return;
      if ((activeObject as any).isQrcode) {
        void updateQrcode(activeObject, { newColor: color });
      } else {
        activeObject.set("fill", color);
      }
      isColorChanging.current = true;
      canvasInstance.renderAll();
      setForceRender((c) => c + 1);
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
    (prop: string, value: any) => {
      if (!activeObject || !canvasInstance) return;
      if (prop === "cornerRadius" && activeObject instanceof Rect) {
        activeObject.set("rx", value as number);
        activeObject.set("ry", value as number);
      } else {
        activeObject.set(prop as keyof FabricObject, value);
      }
      canvasInstance.renderAll();
      saveHistory();
      setForceRender((c) => c + 1);
    },
    [activeObject, canvasInstance, saveHistory],
  );

  const handleQrcodeDataChange = useCallback(
    (data: string) => {
      if (!activeObject || !(activeObject as any).isQrcode) return;
      void updateQrcode(activeObject, { newData: data });
      saveHistory();
      setForceRender((c) => c + 1);
    },
    [activeObject, updateQrcode, saveHistory],
  );

  const handleTextAlignChange = useCallback(
    (align: "left" | "center" | "right") => {
      if (!(activeObject instanceof IText) || !canvasInstance) return;
      activeObject.set("textAlign", align);
      canvasInstance.renderAll();
      saveHistory();
      setForceRender((c) => c + 1);
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
      setForceRender((c) => c + 1);
    },
    [activeObject, canvasInstance, saveHistory],
  );

  const handleFontSizeStep = useCallback(
    (step: number) => {
      if (!(activeObject instanceof IText)) return;
      const newSize = Math.max(1, (activeObject.fontSize || 0) + step);
      handlePropertyChange("fontSize", newSize);
    },
    [handlePropertyChange],
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
    setForceRender((c) => c + 1);
  }, [activeObject, canvasInstance]);

  const handleDeleteObject = useCallback(() => {
    if (activeObject && canvasInstance) {
      canvasInstance.remove(activeObject);
      canvasInstance.discardActiveObject();
      canvasInstance.renderAll();
      saveHistory();
    }
  }, [activeObject, canvasInstance, saveHistory]);

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
    } catch (err) {
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
          const oldImg = objectToReplace as FabricImage;
          const newScale = oldImg.getScaledWidth() / newImg.width!;
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
      } finally {
        setIsUploading(false);
        if (imageInputRef.current) imageInputRef.current.value = "";
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
      await new Promise((resolve, reject) => {
        safeImg.onload = resolve;
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
        scaleX: intersectWidth / croppedImg.width!,
        scaleY: intersectHeight / croppedImg.height!,
      });
      canvasInstance.remove(fabricImg);
      canvasInstance.add(croppedImg);
      canvasInstance.setActiveObject(croppedImg);
      saveHistory();
      exitCropMode();
    } catch (err) {
      console.error("Gagal crop:", err);
      toast.error("Gagal melakukan crop.");
      exitCropMode();
    }
  }, [canvasInstance, exitCropMode, saveHistory]);

  // --- EFFECTS ---
  useEffect(() => {
    if (isLoading || !canvasInstance) return;
    const loadInitialData = async () => {
      if (existingTemplate) {
        setTemplateName(existingTemplate.name);
        setArtboardWidth(existingTemplate.artboardWidth ?? 1200);
        setArtboardHeight(existingTemplate.artboardHeight ?? 800);

        const initialData = existingTemplate.designData;
        if (Array.isArray(initialData) && initialData.length > 0) {
          const formattedPages = initialData.map((pageData, index) => {
            if (
              typeof pageData === "object" &&
              pageData !== null &&
              "data" in pageData &&
              "name" in pageData
            ) {
              return pageData as PageState;
            }
            return { name: `Page ${index + 1}`, data: pageData };
          });
          setPages(formattedPages);
          loadPageData(formattedPages[0]!.data);
        } else {
          const firstPage = { name: "Page 1", data: {} };
          setPages([firstPage]);
          loadPageData(firstPage.data);
        }
      } else {
        const firstPage = { name: "Page 1", data: {} };
        setPages([firstPage]);
        loadPageData(firstPage.data);
      }
    };
    void loadInitialData();
  }, [canvasInstance, existingTemplate, isLoading, loadPageData]);

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
      if (!target || !target.left || !target.top) return;
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
        wrapper.scrollTop -= e.clientY - panState.current.lastY;
        wrapper.scrollLeft -= e.clientX - panState.current.lastX;
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

  useEffect(() => {
    if (isLoading || !canvasInstance) return;
    const loadInitialData = async () => {
      if (existingTemplate) {
        setTemplateName(existingTemplate.name);
        setArtboardWidth(existingTemplate.artboardWidth ?? 1200);
        setArtboardHeight(existingTemplate.artboardHeight ?? 800);

        if (existingTemplate.designData) {
          const data =
            typeof existingTemplate.designData === "string"
              ? JSON.parse(existingTemplate.designData)
              : existingTemplate.designData;
          await canvasInstance.loadFromJSON(data);
          canvasInstance.renderAll();
        }
      }
      setTimeout(() => {
        // @ts-ignore - Suppress error for the same reason as in saveHistory.
        const initialCanvasState = JSON.stringify(canvasInstance.toJSON());
        dispatchHistory({ type: "RESET", payload: initialCanvasState });
      }, 100);
    };
    void loadInitialData();
  }, [canvasInstance, existingTemplate, isLoading]);

  const activeObjectProps = useMemo(() => {
    if (!activeObject) return null;
    const isText = activeObject instanceof IText;
    const isRect = activeObject instanceof Rect;
    const isQrcode = (activeObject as any).isQrcode;
    let fill =
      typeof activeObject.fill === "string" ? activeObject.fill : "#000000";
    if (isQrcode) fill = (activeObject as any).qrcodeFill ?? "#000000";
    return {
      fill,
      isLocked: !!activeObject.lockMovementX,
      qrcodeData: isQrcode ? (activeObject as any).qrcodeData : "",
      textAlign: isText
        ? ((activeObject as IText).textAlign as "left" | "center" | "right")
        : "left",
      isBold: isText ? (activeObject as IText).fontWeight === "bold" : false,
      isItalic: isText ? (activeObject as IText).fontStyle === "italic" : false,
      isUnderline: isText ? !!(activeObject as IText).underline : false,
      fontSize: isText ? ((activeObject as IText).fontSize ?? 24) : 24,
      fontFamily: isText
        ? ((activeObject as IText).fontFamily ?? "Arial")
        : "Arial",
      cornerRadius: isRect ? ((activeObject as Rect).get("rx") ?? 0) : 0,
    };
  }, [activeObject, forceRender]);

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
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyState.index > 0}
        canRedo={historyState.index < historyState.history.length - 1}
        getPagesForSave={getPagesForSave}
      />
      {/* --- START: BLOK YANG DIPERBARUI --- */}
      <div className="bg-background flex h-14 items-center justify-center border-b px-4">
        {isCropping ? (
          <div className="flex w-full items-center justify-center gap-2">
            {/* Placeholder untuk UI Crop */}
          </div>
        ) : (
          <EditorToolbar
            canvas={canvasInstance}
            onAddImage={triggerImageUpload}
            onAddQrcode={handleAddQrcode}
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
      {/* --- END: BLOK YANG DIPERBARUI --- */}
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
        {/* --- START: BLOK YANG DIPERBARUI --- */}
        <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
          {activeObject && activeObjectProps && !isCropping && (
            <ObjectPropertiesPopover
              objectType={
                (activeObject as any).isQrcode
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
              onCropImage={() => {}}
              onBringForward={handleBringForward}
              onSendBackward={handleSendBackwards}
              onDuplicateObject={handleDuplicateObject}
              onQrcodeDataChange={() => {}}
              onTextAlignChange={() => {}}
            />
          )}
        </div>
        {/* --- END: BLOK YANG DIPERBARUI --- */}
      </main>
      <input
        type="file"
        accept="image/*"
        ref={imageInputRef}
        className="hidden"
        onChange={handleImageUpload}
        disabled={isUploading}
      />
    </div>
  );
}
