// File: src/app/admin/templates/hooks/useViewportHandler.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface ViewportProps {
  artboardWidth: number;
  artboardHeight: number;
  // [FIX] Izinkan ref untuk bisa null agar sesuai dengan inisialisasi useRef(null)
  mainWrapperRef: React.RefObject<HTMLElement | null>;
}

export function useViewportHandler({
  artboardWidth,
  artboardHeight,
  mainWrapperRef,
}: ViewportProps) {
  const [displaySize, setDisplaySize] = useState({
    width: 0,
    height: 0,
    scale: 1,
  });
  const panState = useRef({ isPanning: false, lastX: 0, lastY: 0 });

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
      const wrapper = mainWrapperRef.current;
      if (!wrapper) return;

      if (action === "reset") {
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
    [artboardWidth, artboardHeight, mainWrapperRef, updateScale],
  );

  // Effect for initial layout calculation and resize observation
  useEffect(() => {
    const wrapper = mainWrapperRef.current;
    if (!wrapper || artboardWidth === 0) return;

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
  }, [artboardWidth, artboardHeight, mainWrapperRef]);

  // Effect for pan and zoom event listeners
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
  }, [mainWrapperRef, updateScale]);

  return { displaySize, handleZoom };
}
