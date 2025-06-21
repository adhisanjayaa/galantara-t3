// File: src/app/admin/templates/hooks/usePageManager.ts
"use client";

import { useState, useCallback } from "react";
import type { Canvas } from "fabric";
import { toast } from "sonner";

// Tipe PageState diekspor agar bisa digunakan di komponen utama.
export type PageState = { name: string; data: Record<string, unknown> };

interface PageManagerProps {
  canvasInstance: Canvas | null;
  // Menerima fungsi clearHistory dari useCanvasHistory.
  clearHistory: () => void;
}

export function usePageManager({
  canvasInstance,
  clearHistory,
}: PageManagerProps) {
  const [pages, setPages] = useState<PageState[]>([
    { name: "Page 1", data: {} },
  ]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const loadPageData = useCallback(
    (data: Record<string, unknown>) => {
      if (!canvasInstance) return;

      canvasInstance.loadFromJSON(data ?? {}, () => {
        requestAnimationFrame(() => {
          canvasInstance.renderAll();
        });

        clearHistory();
      });
    },
    [canvasInstance, clearHistory],
  );

  const handlePageChange = useCallback(
    (index: number) => {
      if (index === currentPageIndex || !canvasInstance) return;

      // Simpan state halaman saat ini sebelum beralih
      const currentPageData = canvasInstance.toJSON();
      setPages((currentPages) => {
        const newPages = [...currentPages];
        const page = newPages[currentPageIndex];
        if (page) {
          page.data = currentPageData as Record<string, unknown>;
        }

        // Muat data halaman yang baru
        loadPageData(newPages[index]?.data ?? {});
        return newPages;
      });

      setCurrentPageIndex(index);
    },
    [canvasInstance, currentPageIndex, loadPageData],
  );

  const handleAddPage = useCallback(() => {
    if (!canvasInstance) return;

    const currentPageData = canvasInstance.toJSON();
    const newPage: PageState = { name: `Page ${pages.length + 1}`, data: {} };

    setPages((currentPages) => {
      const updatedPages = [...currentPages];
      const page = updatedPages[currentPageIndex];
      if (page) {
        page.data = currentPageData as Record<string, unknown>;
      }
      return [...updatedPages, newPage];
    });

    setCurrentPageIndex(pages.length);
    loadPageData({}); // Muat kanvas kosong untuk halaman baru
    toast.success(`Page ${pages.length + 1} added.`);
  }, [canvasInstance, pages.length, currentPageIndex, loadPageData]);

  const handleRenamePage = useCallback((index: number, newName: string) => {
    setPages((currentPages) => {
      const newPages = [...currentPages];
      const pageToUpdate = newPages[index];
      if (pageToUpdate) {
        pageToUpdate.name = newName;
      }
      return newPages;
    });
    toast.success("Page name updated!");
  }, []);

  const getPagesForSave = useCallback((): PageState[] => {
    if (!canvasInstance) return pages;

    const currentPageData = canvasInstance.toJSON();
    const pagesToSave = [...pages];
    const page = pagesToSave[currentPageIndex];
    if (page) {
      page.data = currentPageData as Record<string, unknown>;
    }
    return pagesToSave;
  }, [canvasInstance, pages, currentPageIndex]);

  return {
    pages,
    setPages,
    currentPageIndex,
    handlePageChange,
    handleAddPage,
    handleRenamePage,
    getPagesForSave,
    loadPageData,
  };
}
