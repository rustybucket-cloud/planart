import { useParams, useNavigate } from "react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import {
  ArrowLeft,
  Download,
  Trash2,
  Copy,
  Type,
  Image as ImageIcon,
  Grid3x3,
  ZoomIn,
  ZoomOut,
  Move,
  Undo2,
  Redo2,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuShortcut,
  ContextMenuSeparator,
  ContextMenuLabel,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toPng } from "html-to-image";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { canvasApi } from "@/services/canvasApi";
import {
  blobUrlToBase64,
  base64ToBlobUrl,
  isBlobUrl,
  isBase64,
} from "@/lib/imageUtils";
import type { CanvasElement, ViewportState } from "@/types/canvas";
import { createNewCanvasStartedRef, pendingNewCanvasIdRef } from "./canvasNewRefState";

// Configuration
const MAX_UNDO_HISTORY = 5;
const AUTO_SAVE_DELAY = 2000;
const FLOATING_PANEL_CLASS =
  "bg-bg-panel/90 backdrop-blur-xl border border-terracotta/20 rounded-2xl shadow-2xl shadow-black/40 p-3";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type PlacementObjectType = "text" | "image" | null;
type ResizeHandle = "nw" | "ne" | "sw" | "se" | "n" | "e" | "s" | "w";

interface PendingImage {
  url: string;
  width: number;
  height: number;
}

interface ResizeState {
  elementId: string;
  elementType: "image" | "text";
  handle: ResizeHandle;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startElementX: number;
  startElementY: number;
  aspectRatio: number;
  startFontScale: number;
}

interface GroupResizeState {
  handle: ResizeHandle;
  startX: number;
  startY: number;
  startBounds: { x: number; y: number; width: number; height: number };
  originalElements: Map<string, { x: number; y: number; width: number; height: number; fontScale: number }>;
}

interface BoxSelectState {
  startScreenX: number;
  startScreenY: number;
  currentScreenX: number;
  currentScreenY: number;
}

const MIN_SIZE = 20;
const RESIZE_THRESHOLD = 5;
const BASE_FONT_SIZE = 18;
const SCALE_TOLERANCE = 0.02;

const FONT_SCALE_PRESETS = [
  { key: "xs", label: "XS", scale: 0.67 },
  { key: "sm", label: "SM", scale: 0.78 },
  { key: "md", label: "MD", scale: 1.0 },
  { key: "lg", label: "LG", scale: 1.56 },
  { key: "xl", label: "XL", scale: 2.22 },
];

function getTextFontSize(fontScale: number = 1): number {
  return BASE_FONT_SIZE * fontScale;
}

const CORNER_HANDLES: ResizeHandle[] = ["nw", "ne", "sw", "se"];
const EDGE_HANDLES: ResizeHandle[] = ["n", "e", "s", "w"];

const HANDLE_CONFIGS: Record<ResizeHandle, { cursor: string; position: React.CSSProperties }> = {
  nw: { cursor: "nwse-resize", position: { top: -6, left: -6 } },
  ne: { cursor: "nesw-resize", position: { top: -6, right: -6 } },
  sw: { cursor: "nesw-resize", position: { bottom: -6, left: -6 } },
  se: { cursor: "nwse-resize", position: { bottom: -6, right: -6 } },
  n: { cursor: "ns-resize", position: { top: -6, left: "50%", transform: "translateX(-50%)" } },
  s: { cursor: "ns-resize", position: { bottom: -6, left: "50%", transform: "translateX(-50%)" } },
  e: { cursor: "ew-resize", position: { right: -6, top: "50%", transform: "translateY(-50%)" } },
  w: { cursor: "ew-resize", position: { left: -6, top: "50%", transform: "translateY(-50%)" } },
};

export default function Canvas() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [canvasName, setCanvasName] = useState("Untitled Canvas");
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [redoHistory, setRedoHistory] = useState<CanvasElement[][]>([]);
  const [viewport, setViewport] = useState<ViewportState>({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [tilingMode, setTilingMode] = useState(false);
  const [placingObjectType, setPlacingObjectType] = useState<PlacementObjectType>(null);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [previewPos, setPreviewPos] = useState<{ x: number; y: number } | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [canvasId, setCanvasId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const currentMousePos = useRef({ x: 0, y: 0 });

  const [resizingElement, setResizingElement] = useState<ResizeState | null>(null);
  const pendingResize = useRef<ResizeState | null>(null);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [groupResizing, setGroupResizing] = useState<GroupResizeState | null>(null);
  const pendingGroupResize = useRef<GroupResizeState | null>(null);
  const [boxSelect, setBoxSelect] = useState<BoxSelectState | null>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadCanvas() {
      if (id === "new") {
        if (createNewCanvasStartedRef.current) {
          if (pendingNewCanvasIdRef.current !== null) {
            navigate(`/canvas/${pendingNewCanvasIdRef.current}`, { replace: true });
          }
          setIsLoading(false);
          return;
        }
        createNewCanvasStartedRef.current = true;
        try {
          const newCanvas = await canvasApi.create("Untitled Canvas");
          pendingNewCanvasIdRef.current = newCanvas.id;
          setCanvasId(newCanvas.id);
          setCanvasName(newCanvas.name);
          setViewport(newCanvas.viewport);
          setElements([]);
          navigate(`/canvas/${newCanvas.id}`, { replace: true });
        } catch (error) {
          console.error("Failed to create canvas:", error);
          createNewCanvasStartedRef.current = false;
          pendingNewCanvasIdRef.current = null;
        }
        setIsLoading(false);
        return;
      }

      createNewCanvasStartedRef.current = false;
      pendingNewCanvasIdRef.current = null;

      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const canvas = await canvasApi.load(id);
        setCanvasId(canvas.id);
        setCanvasName(canvas.name);
        setViewport(canvas.viewport);

        const elementsWithBlobs = canvas.elements.map((el) => {
          if (el.type === "image" && isBase64(el.content)) {
            return { ...el, content: base64ToBlobUrl(el.content) };
          }
          return el;
        });
        setElements(elementsWithBlobs);
      } catch (error) {
        console.error("Failed to load canvas:", error);
      }
      setIsLoading(false);
    }

    loadCanvas();
  }, [id, navigate]);

  const saveCanvas = useCallback(async function saveCanvas() {
    if (!canvasId || isLoading) return;

    setSaveStatus("saving");
    try {
      const elementsToSave = await Promise.all(
        elements.map(async (el) => {
          if (el.type === "image" && isBlobUrl(el.content)) {
            return { ...el, content: await blobUrlToBase64(el.content) };
          }
          return el;
        })
      );

      await canvasApi.save({
        id: canvasId,
        name: canvasName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewport,
        elements: elementsToSave,
      });
      setSaveStatus("saved");
    } catch (error) {
      console.error("Failed to save canvas:", error);
      setSaveStatus("error");
    }
  }, [canvasId, canvasName, elements, viewport, isLoading]);

  useEffect(() => {
    if (!canvasId || isLoading) return;

    const timeoutId = setTimeout(() => {
      saveCanvas();
    }, AUTO_SAVE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [elements, viewport, canvasId, isLoading, saveCanvas]);

  useEffect(() => {
    if (saveStatus === "saved") {
      const timeoutId = setTimeout(() => setSaveStatus("idle"), 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [saveStatus]);

  function zoomIn() {
    setViewport((prev) => ({ ...prev, zoom: Math.min(5, prev.zoom * 1.2) }));
  }

  function zoomOut() {
    setViewport((prev) => ({ ...prev, zoom: Math.max(0.1, prev.zoom / 1.2) }));
  }

  function resetZoom() {
    setViewport({ x: 0, y: 0, zoom: 1 });
  }

  function pushHistory() {
    setHistory((prev) => [...prev.slice(-(MAX_UNDO_HISTORY - 1)), elements]);
    setRedoHistory([]);
  }

  function undo() {
    if (history.length === 0) return;
    setRedoHistory((prev) => [...prev.slice(-(MAX_UNDO_HISTORY - 1)), elements]);
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setElements(previous);
    setSelectedElement(null);
    setSelectedElements([]);
  }

  function redo() {
    if (redoHistory.length === 0) return;
    setHistory((prev) => [...prev.slice(-(MAX_UNDO_HISTORY - 1)), elements]);
    const next = redoHistory[redoHistory.length - 1];
    setRedoHistory((prev) => prev.slice(0, -1));
    setElements(next);
    setSelectedElement(null);
    setSelectedElements([]);
  }

  function deleteSelected() {
    if (selectedElements.length > 0) {
      pushHistory();
      const toDelete = new Set(selectedElements);
      setElements((prev) => prev.filter((el) => !toDelete.has(el.id)));
      setSelectedElements([]);
      setSelectedElement(null);
    } else if (selectedElement) {
      pushHistory();
      setElements((prev) => prev.filter((el) => el.id !== selectedElement));
      setSelectedElement(null);
    }
  }

  function duplicateSelected() {
    const elementsToDuplicate = selectedElements.length > 0
      ? elements.filter((el) => selectedElements.includes(el.id))
      : selectedElement
        ? elements.filter((el) => el.id === selectedElement)
        : [];

    if (elementsToDuplicate.length === 0) return;

    pushHistory();
    const offset = 20;
    const newElements: CanvasElement[] = elementsToDuplicate.map((element) => ({
      ...element,
      id: crypto.randomUUID(),
      x: element.x + offset,
      y: element.y + offset,
    }));

    setElements((prev) => [...prev, ...newElements]);

    if (newElements.length === 1) {
      setSelectedElement(newElements[0].id);
      setSelectedElements([]);
    } else {
      setSelectedElement(null);
      setSelectedElements(newElements.map((el) => el.id));
    }
  }

  function setSelectedFontScale(scale: number) {
    const idsToUpdate = selectedElements.length > 0
      ? selectedElements
      : selectedElement
        ? [selectedElement]
        : [];

    if (idsToUpdate.length === 0) return;

    pushHistory();
    setElements((prev) =>
      prev.map((el) =>
        idsToUpdate.includes(el.id) && el.type === "text"
          ? { ...el, fontScale: scale }
          : el
      )
    );
  }

  function cancelPlacement() {
    if (boxSelect) {
      setBoxSelect(null);
      return;
    }
    if (selectedElements.length > 0) {
      setSelectedElements([]);
      setSelectedElement(null);
      return;
    }
    if (pendingImage) {
      URL.revokeObjectURL(pendingImage.url);
    }
    setPlacingObjectType(null);
    setPreviewPos(null);
    setPendingImage(null);
  }

  function handleResizeStart(e: React.MouseEvent, elementId: string, handle: ResizeHandle) {
    e.stopPropagation();
    e.preventDefault();

    const element = elements.find((el) => el.id === elementId);
    if (!element) return;

    pushHistory();
    pendingResize.current = {
      elementId,
      elementType: element.type,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: element.width,
      startHeight: element.height,
      startElementX: element.x,
      startElementY: element.y,
      aspectRatio: element.width / element.height,
      startFontScale: element.fontScale ?? 1,
    };

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }

  function handleGroupResizeStart(e: React.MouseEvent, handle: ResizeHandle) {
    e.stopPropagation();
    e.preventDefault();

    const bounds = getSelectionBounds(elements, selectedElements);
    if (!bounds) return;

    pushHistory();

    const originalElements = new Map<string, { x: number; y: number; width: number; height: number; fontScale: number }>();
    for (const id of selectedElements) {
      const el = elements.find((e) => e.id === id);
      if (el) {
        originalElements.set(id, {
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          fontScale: el.fontScale ?? 1,
        });
      }
    }

    pendingGroupResize.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startBounds: bounds,
      originalElements,
    };

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;

    img.onload = () => {
      if (tilingMode) {
        placeImageWithTiling(url, img.width, img.height);
      } else {
        setPendingImage({ url, width: img.width, height: img.height });
        setPlacingObjectType("image");
      }
    };

    e.target.value = "";
  }

  function placeImageWithTiling(url: string, width: number, height: number) {
    pushHistory();

    const selectedEl = selectedElement ? elements.find((el) => el.id === selectedElement) : null;

    if (selectedEl) {
      const { x, y } = calculateAdjacentPosition(
        selectedEl,
        elements,
        currentMousePos.current.x,
        currentMousePos.current.y,
        width,
        height,
        viewport
      );

      const newElement: CanvasElement = {
        id: crypto.randomUUID(),
        type: "image",
        x,
        y,
        width,
        height,
        content: url,
      };
      setElements((prev) => [...prev, newElement]);
      setSelectedElement(newElement.id);
    } else {
      const canvasPos = {
        x: (window.innerWidth / 2 - viewport.x) / viewport.zoom,
        y: (window.innerHeight / 2 - viewport.y) / viewport.zoom,
      };
      const cols = 4;
      const rows = 3;
      const spacing = 10;
      let lastId = "";

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const id = crypto.randomUUID();
          lastId = id;
          const newElement: CanvasElement = {
            id,
            type: "image",
            x: canvasPos.x + col * (width + spacing),
            y: canvasPos.y + row * (height + spacing),
            width,
            height,
            content: url,
          };
          setElements((prev) => [...prev, newElement]);
        }
      }
      setSelectedElement(lastId);
    }
  }

  useKeyboardShortcuts({
    shortcuts: [
      { key: "+", callback: zoomIn, description: "Zoom in" },
      { key: "=", callback: zoomIn, description: "Zoom in" },
      { key: "-", callback: zoomOut, description: "Zoom out" },
      { key: "0", callback: resetZoom, description: "Reset zoom" },
      { key: "Delete", callback: deleteSelected, description: "Delete selected element" },
      { key: "Backspace", callback: deleteSelected, description: "Delete selected element" },
      { key: "Escape", callback: cancelPlacement, description: "Cancel placement" },
      { key: "z", ctrlOrMeta: true, callback: undo, description: "Undo" },
      { key: "y", ctrlOrMeta: true, callback: redo, description: "Redo" },
      { key: "z", ctrlOrMeta: true, shift: true, callback: redo, description: "Redo" },
    ],
  });

  function screenToCanvas(screenX: number, screenY: number) {
    return {
      x: (screenX - viewport.x) / viewport.zoom,
      y: (screenY - viewport.y) / viewport.zoom,
    };
  }

  const stateRef = useRef({
    isPanning,
    resizingElement,
    viewport,
    placingObjectType,
    tilingMode,
    selectedElement,
    selectedElements,
    elements,
    boxSelect,
    groupResizing,
  });

  useEffect(() => {
    stateRef.current = {
      isPanning,
      resizingElement,
      viewport,
      placingObjectType,
      tilingMode,
      selectedElement,
      selectedElements,
      elements,
      boxSelect,
      groupResizing,
    };
  });

  function handleMouseDown(e: React.MouseEvent) {
    if (placingObjectType && e.button === 0) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const canvasPos = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top);
        pushHistory();

        if (placingObjectType === "text") {
          const newElement: CanvasElement = {
            id: crypto.randomUUID(),
            type: "text",
            x: canvasPos.x - 100,
            y: canvasPos.y - 30,
            width: 200,
            height: 60,
            content: "",
          };
          setElements((prev) => [...prev, newElement]);
          setSelectedElement(newElement.id);
          setTimeout(() => setEditingElementId(newElement.id), 0);
        } else if (placingObjectType === "image" && pendingImage) {
          const newElement: CanvasElement = {
            id: crypto.randomUUID(),
            type: "image",
            x: canvasPos.x - pendingImage.width / 2,
            y: canvasPos.y - pendingImage.height / 2,
            width: pendingImage.width,
            height: pendingImage.height,
            content: pendingImage.url,
          };
          setElements((prev) => [...prev, newElement]);
          setSelectedElement(newElement.id);
          setPendingImage(null);
        }

        setPlacingObjectType(null);
        setPreviewPos(null);
      }
      return;
    }

    if (e.button === 1) {
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    } else if (e.button === 0 && !placingObjectType) {
      if (!e.shiftKey) {
        setSelectedElement(null);
        setSelectedElements([]);
      }
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        setBoxSelect({
          startScreenX: screenX,
          startScreenY: screenY,
          currentScreenX: screenX,
          currentScreenY: screenY,
        });
      }
    }
  }

  function handleElementMouseDown(e: React.MouseEvent, elementId: string) {
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    // Shift+click: toggle element in/out of multi-selection (no drag)
    if (e.shiftKey) {
      const isInMultiSelection = selectedElements.includes(elementId);
      const isSingleSelected = selectedElement === elementId;

      if (isInMultiSelection) {
        // Remove from multi-selection
        const updated = selectedElements.filter((id) => id !== elementId);
        if (updated.length === 1) {
          setSelectedElement(updated[0]);
          setSelectedElements([]);
        } else if (updated.length === 0) {
          setSelectedElement(null);
          setSelectedElements([]);
        } else {
          setSelectedElements(updated);
        }
      } else if (isSingleSelected) {
        // Deselect the only selected element
        setSelectedElement(null);
        setSelectedElements([]);
      } else if (selectedElement && !selectedElements.length) {
        // Promote single selection + new element into multi-selection
        setSelectedElements([selectedElement, elementId]);
        setSelectedElement(null);
      } else if (selectedElements.length > 0) {
        // Add to existing multi-selection
        setSelectedElements([...selectedElements, elementId]);
      } else {
        // Nothing was selected, just select this one
        setSelectedElement(elementId);
      }
      return;
    }

    const element = elements.find((el) => el.id === elementId);
    if (!element) return;

    const elementWidth = element.width;
    const elementHeight = element.height;
    const isInMultiSelection = selectedElements.includes(elementId);

    if (!isInMultiSelection) {
      setSelectedElement(elementId);
      setSelectedElements([]);
    }

    const movingIds = isInMultiSelection ? [...selectedElements] : [elementId];
    const startPositions = new Map<string, { x: number; y: number }>();
    for (const mid of movingIds) {
      const el = elements.find((e) => e.id === mid);
      if (el) startPositions.set(mid, { x: el.x, y: el.y });
    }

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    let hasMoved = false;

    function handleMove(ev: MouseEvent) {
      const dxScreen = ev.clientX - startClientX;
      const dyScreen = ev.clientY - startClientY;
      const distance = Math.sqrt(dxScreen * dxScreen + dyScreen * dyScreen);

      if (!hasMoved && distance < 3) {
        return;
      }

      if (!hasMoved) {
        hasMoved = true;
        pushHistory();
      }

      const { viewport: currentViewport, tilingMode: currentTilingMode, elements: currentElements } = stateRef.current;
      const dx = dxScreen / currentViewport.zoom;
      const dy = dyScreen / currentViewport.zoom;

      if (movingIds.length === 1) {
        const startPos = startPositions.get(movingIds[0])!;
        let newX = startPos.x + dx;
        let newY = startPos.y + dy;

        if (currentTilingMode) {
          const snapped = snapToTilePosition(newX, newY, elementWidth, elementHeight, elementId, currentElements);
          newX = snapped.x;
          newY = snapped.y;
        }

        setElements((prev) =>
          prev.map((el) => (el.id === movingIds[0] ? { ...el, x: newX, y: newY } : el))
        );
      } else {
        setElements((prev) =>
          prev.map((el) => {
            const startPos = startPositions.get(el.id);
            if (!startPos) return el;
            return { ...el, x: startPos.x + dx, y: startPos.y + dy };
          })
        );
      }
    }

    function handleUp() {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }

  function handleTextDoubleClick(element: CanvasElement) {
    if (element.type === "text") {
      setEditingElementId(element.id);
    }
  }

  function handleTextEditSave(elementId: string, newContent: string) {
    pushHistory();
    setElements((prev) =>
      prev.map((el) =>
        el.id === elementId ? { ...el, content: newContent || "Double-click to edit" } : el
      )
    );
    setEditingElementId(null);
  }

  function handleTextEditCancel() {
    setEditingElementId(null);
  }

  function handleElementContextMenu(elementId: string) {
    const isInMultiSelection = selectedElements.includes(elementId);
    const isSingleSelected = selectedElement === elementId;

    if (!isInMultiSelection && !isSingleSelected) {
      setSelectedElement(elementId);
      setSelectedElements([]);
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function trackMousePosition(e: MouseEvent) {
      currentMousePos.current = { x: e.clientX, y: e.clientY };
    }

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      const { viewport } = stateRef.current;
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, viewport.zoom * delta));

      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        setViewport((prev) => ({
          x: mouseX - (mouseX - prev.x) * (newZoom / prev.zoom),
          y: mouseY - (mouseY - prev.y) * (newZoom / prev.zoom),
          zoom: newZoom,
        }));
      }
    }

    function handleMouseMove(e: MouseEvent) {
      const { isPanning, resizingElement, viewport, placingObjectType, groupResizing } = stateRef.current;

      if (pendingResize.current && !resizingElement) {
        const dx = e.clientX - pendingResize.current.startX;
        const dy = e.clientY - pendingResize.current.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance >= RESIZE_THRESHOLD) {
          setResizingElement(pendingResize.current);
        }
      }

      if (pendingGroupResize.current && !groupResizing) {
        const dx = e.clientX - pendingGroupResize.current.startX;
        const dy = e.clientY - pendingGroupResize.current.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance >= RESIZE_THRESHOLD) {
          setGroupResizing(pendingGroupResize.current);
        }
      }

      if (resizingElement) {
        const {
          elementId,
          handle,
          startX,
          startWidth,
          startHeight,
          startElementX,
          startElementY,
          aspectRatio,
          startFontScale,
        } = resizingElement;

        const dx = (e.clientX - startX) / viewport.zoom;
        const dy = (e.clientY - resizingElement.startY) / viewport.zoom;
        const isImage = resizingElement.elementType === "image";
        const isText = resizingElement.elementType === "text";
        const isCornerHandle = ["nw", "ne", "sw", "se"].includes(handle);

        // For images: maintain aspect by default, shift to free resize
        // For text corners: always maintain aspect (scaling text)
        // For text edges: free resize (container only)
        const maintainAspect = isImage ? !e.shiftKey : isCornerHandle;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newX = startElementX;
        let newY = startElementY;
        let newFontScale = startFontScale;

        switch (handle) {
          case "se":
            newWidth = Math.max(MIN_SIZE, startWidth + dx);
            newHeight = maintainAspect ? newWidth / aspectRatio : Math.max(MIN_SIZE, startHeight + dy);
            break;
          case "sw":
            newWidth = Math.max(MIN_SIZE, startWidth - dx);
            newHeight = maintainAspect ? newWidth / aspectRatio : Math.max(MIN_SIZE, startHeight + dy);
            newX = startElementX + startWidth - newWidth;
            break;
          case "ne":
            newWidth = Math.max(MIN_SIZE, startWidth + dx);
            newHeight = maintainAspect ? newWidth / aspectRatio : Math.max(MIN_SIZE, startHeight - dy);
            newY = startElementY + startHeight - newHeight;
            break;
          case "nw":
            newWidth = Math.max(MIN_SIZE, startWidth - dx);
            newHeight = maintainAspect ? newWidth / aspectRatio : Math.max(MIN_SIZE, startHeight - dy);
            newX = startElementX + startWidth - newWidth;
            newY = startElementY + startHeight - newHeight;
            break;
          case "e":
            newWidth = Math.max(MIN_SIZE, startWidth + dx);
            break;
          case "w":
            newWidth = Math.max(MIN_SIZE, startWidth - dx);
            newX = startElementX + startWidth - newWidth;
            break;
          case "s":
            newHeight = Math.max(MIN_SIZE, startHeight + dy);
            break;
          case "n":
            newHeight = Math.max(MIN_SIZE, startHeight - dy);
            newY = startElementY + startHeight - newHeight;
            break;
        }

        // For text elements with corner handles, scale the font proportionally
        if (isText && isCornerHandle) {
          const scaleFactor = newWidth / startWidth;
          newFontScale = startFontScale * scaleFactor;
        }

        setElements((prev) =>
          prev.map((el) =>
            el.id === elementId
              ? { ...el, x: newX, y: newY, width: newWidth, height: newHeight, fontScale: newFontScale }
              : el
          )
        );
      } else if (groupResizing) {
        const { handle, startX, startY, startBounds, originalElements } = groupResizing;

        const dx = (e.clientX - startX) / viewport.zoom;
        const dy = (e.clientY - startY) / viewport.zoom;

        let newBoundsX = startBounds.x;
        let newBoundsY = startBounds.y;
        let newBoundsWidth = startBounds.width;
        let newBoundsHeight = startBounds.height;

        // Calculate new bounds based on handle
        switch (handle) {
          case "se":
            newBoundsWidth = Math.max(MIN_SIZE, startBounds.width + dx);
            newBoundsHeight = Math.max(MIN_SIZE, startBounds.height + dy);
            break;
          case "sw":
            newBoundsWidth = Math.max(MIN_SIZE, startBounds.width - dx);
            newBoundsHeight = Math.max(MIN_SIZE, startBounds.height + dy);
            newBoundsX = startBounds.x + startBounds.width - newBoundsWidth;
            break;
          case "ne":
            newBoundsWidth = Math.max(MIN_SIZE, startBounds.width + dx);
            newBoundsHeight = Math.max(MIN_SIZE, startBounds.height - dy);
            newBoundsY = startBounds.y + startBounds.height - newBoundsHeight;
            break;
          case "nw":
            newBoundsWidth = Math.max(MIN_SIZE, startBounds.width - dx);
            newBoundsHeight = Math.max(MIN_SIZE, startBounds.height - dy);
            newBoundsX = startBounds.x + startBounds.width - newBoundsWidth;
            newBoundsY = startBounds.y + startBounds.height - newBoundsHeight;
            break;
        }

        const scaleX = newBoundsWidth / startBounds.width;
        const scaleY = newBoundsHeight / startBounds.height;

        setElements((prev) =>
          prev.map((el) => {
            const original = originalElements.get(el.id);
            if (!original) return el;

            const relX = original.x - startBounds.x;
            const relY = original.y - startBounds.y;

            return {
              ...el,
              x: newBoundsX + relX * scaleX,
              y: newBoundsY + relY * scaleY,
              width: original.width * scaleX,
              height: original.height * scaleY,
              fontScale: original.fontScale * Math.min(scaleX, scaleY),
            };
          })
        );
      } else if (isPanning) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        setViewport((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }

      const { boxSelect: currentBoxSelect } = stateRef.current;
      if (currentBoxSelect) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          setBoxSelect({
            ...currentBoxSelect,
            currentScreenX: e.clientX - rect.left,
            currentScreenY: e.clientY - rect.top,
          });
        }
      }

      if (placingObjectType) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const canvasPos = {
            x: (e.clientX - rect.left - viewport.x) / viewport.zoom,
            y: (e.clientY - rect.top - viewport.y) / viewport.zoom,
          };
          setPreviewPos(canvasPos);
        }
      }
    }

    function handleMouseUp(e: MouseEvent) {
      setIsPanning(false);
      setResizingElement(null);
      pendingResize.current = null;
      setGroupResizing(null);
      pendingGroupResize.current = null;

      const { boxSelect: currentBoxSelect, viewport: currentViewport, elements: currentElements, selectedElements: currentSelectedElements, selectedElement: currentSelectedElement } = stateRef.current;
      if (currentBoxSelect) {
        const x1 = Math.min(currentBoxSelect.startScreenX, currentBoxSelect.currentScreenX);
        const y1 = Math.min(currentBoxSelect.startScreenY, currentBoxSelect.currentScreenY);
        const x2 = Math.max(currentBoxSelect.startScreenX, currentBoxSelect.currentScreenX);
        const y2 = Math.max(currentBoxSelect.startScreenY, currentBoxSelect.currentScreenY);

        const canvasX1 = (x1 - currentViewport.x) / currentViewport.zoom;
        const canvasY1 = (y1 - currentViewport.y) / currentViewport.zoom;
        const canvasX2 = (x2 - currentViewport.x) / currentViewport.zoom;
        const canvasY2 = (y2 - currentViewport.y) / currentViewport.zoom;

        const boxWidth = canvasX2 - canvasX1;
        const boxHeight = canvasY2 - canvasY1;

        if (boxWidth > 5 || boxHeight > 5) {
          const boxSelected = currentElements
            .filter((el) =>
              rectanglesOverlap(canvasX1, canvasY1, boxWidth, boxHeight, el.x, el.y, el.width, el.height)
            )
            .map((el) => el.id);

          if (e.shiftKey) {
            // Merge with existing selection
            const existing = currentSelectedElements.length > 0
              ? currentSelectedElements
              : currentSelectedElement
                ? [currentSelectedElement]
                : [];
            const merged = Array.from(new Set([...existing, ...boxSelected]));

            if (merged.length === 1) {
              setSelectedElement(merged[0]);
              setSelectedElements([]);
            } else if (merged.length > 1) {
              setSelectedElement(null);
              setSelectedElements(merged);
            }
          } else {
            if (boxSelected.length === 1) {
              setSelectedElement(boxSelected[0]);
              setSelectedElements([]);
            } else if (boxSelected.length > 1) {
              setSelectedElement(null);
              setSelectedElements(boxSelected);
            }
          }
        }

        setBoxSelect(null);
      }
    }

    async function handlePaste(e: ClipboardEvent) {
      const { tilingMode, selectedElement, elements, viewport } = stateRef.current;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.type.indexOf("image") !== -1) {
          const blob = item.getAsFile();
          if (!blob) continue;

          const url = URL.createObjectURL(blob);
          const img = new Image();
          img.src = url;

          img.onload = () => {
            setHistory((prev) => [...prev.slice(-(MAX_UNDO_HISTORY - 1)), stateRef.current.elements]);

            if (tilingMode) {
              const selectedEl = selectedElement ? elements.find((el) => el.id === selectedElement) : null;

              if (selectedEl) {
                const { x, y } = calculateAdjacentPosition(
                  selectedEl,
                  elements,
                  currentMousePos.current.x,
                  currentMousePos.current.y,
                  img.width,
                  img.height,
                  viewport
                );

                const newElement: CanvasElement = {
                  id: crypto.randomUUID(),
                  type: "image",
                  x,
                  y,
                  width: img.width,
                  height: img.height,
                  content: url,
                };
                setElements((prev) => [...prev, newElement]);
              } else {
                const canvasPos = {
                  x: (window.innerWidth / 2 - viewport.x) / viewport.zoom,
                  y: (window.innerHeight / 2 - viewport.y) / viewport.zoom,
                };
                const cols = 4;
                const rows = 3;
                const spacing = 10;

                for (let row = 0; row < rows; row++) {
                  for (let col = 0; col < cols; col++) {
                    const newElement: CanvasElement = {
                      id: crypto.randomUUID(),
                      type: "image",
                      x: canvasPos.x + col * (img.width + spacing),
                      y: canvasPos.y + row * (img.height + spacing),
                      width: img.width,
                      height: img.height,
                      content: url,
                    };
                    setElements((prev) => [...prev, newElement]);
                  }
                }
              }
            } else {
              const cursorPos = {
                x: (currentMousePos.current.x - viewport.x) / viewport.zoom,
                y: (currentMousePos.current.y - viewport.y) / viewport.zoom,
              };

              const newElement: CanvasElement = {
                id: crypto.randomUUID(),
                type: "image",
                x: cursorPos.x - img.width / 2,
                y: cursorPos.y - img.height / 2,
                width: img.width,
                height: img.height,
                content: url,
              };
              setElements((prev) => [...prev, newElement]);
            }
          };
        }
      }
    }

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousemove", trackMousePosition);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("paste", handlePaste);

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousemove", trackMousePosition);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("paste", handlePaste);
    };
  }, [isLoading]);

  async function handleExportPng() {
    const container = exportContainerRef.current;
    if (!container || elements.length === 0) return;

    setIsExporting(true);
    try {
      // Generate PNG data URL
      const dataUrl = await toPng(container, {
        backgroundColor: "#1a1d28",
        pixelRatio: 2,
      });

      // Show native save dialog
      const defaultFileName = `${canvasName.replace(/[^a-z0-9]/gi, "_")}.png`;
      const filePath = await save({
        defaultPath: defaultFileName,
        filters: [{ name: "PNG Image", extensions: ["png"] }],
      });

      if (filePath) {
        // Convert data URL to binary
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
        const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        
        // Write file to chosen location
        await writeFile(filePath, binaryData);
      }
      
      setIsExportDialogOpen(false);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-deep text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
          <p className="text-text-secondary font-mono">Loading canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-deep text-white overflow-hidden">
      <CanvasHeader
        canvasName={canvasName}
        saveStatus={saveStatus}
        objectCount={elements.length}
        onBack={() => navigate("/")}
        onRename={setCanvasName}
        onExport={() => setIsExportDialogOpen(true)}
      />

      <CanvasToolbar
        placingObjectType={placingObjectType}
        tilingMode={tilingMode}
        canUndo={history.length > 0}
        canRedo={redoHistory.length > 0}
        onToggleTextPlacement={() => setPlacingObjectType(placingObjectType === "text" ? null : "text")}
        onImageButtonClick={() => fileInputRef.current?.click()}
        onToggleTilingMode={setTilingMode}
        onUndo={undo}
        onRedo={redo}
      />

      <CanvasZoomControls zoom={viewport.zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onResetZoom={resetZoom} />

      <CanvasStatusBar viewport={viewport} objectCount={elements.length} />

      {elements.length === 0 && <CanvasEmptyState />}

      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={canvasRef}
            className={`fixed inset-0 top-[73px] select-none ${
              resizingElement || groupResizing ? "" : placingObjectType ? "cursor-crosshair" : boxSelect ? "cursor-crosshair" : "cursor-default"
            }`}
            style={{
              backgroundImage: `
                radial-gradient(circle, rgba(212, 132, 94, 0.15) 1px, transparent 1px),
                radial-gradient(circle, rgba(212, 132, 94, 0.08) 1px, transparent 1px)
              `,
              backgroundSize: `${40 * viewport.zoom}px ${40 * viewport.zoom}px, ${10 * viewport.zoom}px ${10 * viewport.zoom}px`,
              backgroundPosition: `${viewport.x}px ${viewport.y}px`,
              cursor: resizingElement
                ? HANDLE_CONFIGS[resizingElement.handle].cursor
                : groupResizing
                  ? HANDLE_CONFIGS[groupResizing.handle].cursor
                  : undefined,
            }}
            onMouseDown={handleMouseDown}
          >
            <div
              style={{
                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                transformOrigin: "0 0",
              }}
            >
              <CanvasElementsLayer
                elements={elements}
                selectedElement={selectedElement}
                selectedElements={selectedElements}
                editingElementId={editingElementId}
                placingObjectType={placingObjectType}
                previewPos={previewPos}
                pendingImage={pendingImage}
                onElementMouseDown={handleElementMouseDown}
                onTextDoubleClick={handleTextDoubleClick}
                onResizeStart={handleResizeStart}
                onTextEditSave={handleTextEditSave}
                onTextEditCancel={handleTextEditCancel}
                onElementContextMenu={handleElementContextMenu}
                onGroupResizeStart={handleGroupResizeStart}
              />
            </div>

            {boxSelect && (
              <div
                className="absolute pointer-events-none border-2 border-terracotta/60 bg-terracotta/10 rounded-sm"
                style={{
                  left: Math.min(boxSelect.startScreenX, boxSelect.currentScreenX),
                  top: Math.min(boxSelect.startScreenY, boxSelect.currentScreenY),
                  width: Math.abs(boxSelect.currentScreenX - boxSelect.startScreenX),
                  height: Math.abs(boxSelect.currentScreenY - boxSelect.startScreenY),
                }}
              />
            )}
          </div>
        </ContextMenuTrigger>
        {(selectedElement || selectedElements.length > 0) && (() => {
          const selectedIds = selectedElements.length > 0
            ? selectedElements
            : selectedElement
              ? [selectedElement]
              : [];
          const selectedEls = elements.filter((el) => selectedIds.includes(el.id));
          const allText = selectedEls.length > 0 && selectedEls.every((el) => el.type === "text");

          // Check if all selected text elements have the same scale
          const firstScale = allText && selectedEls.length > 0 ? (selectedEls[0].fontScale ?? 1) : null;
          const allSameScale = allText && firstScale !== null && selectedEls.every(
            (el) => Math.abs((el.fontScale ?? 1) - firstScale) < SCALE_TOLERANCE
          );
          const currentScale = allSameScale ? firstScale : null;

          return (
            <ContextMenuContent className="bg-bg-panel/90 backdrop-blur-xl border-terracotta/20">
              {allText && (
                <>
                  <ContextMenuLabel className="text-text-secondary text-xs px-2 py-1">
                    Text Size
                  </ContextMenuLabel>
                  <div className="flex gap-1 px-2 pb-1">
                    {FONT_SCALE_PRESETS.map((preset) => {
                      const isSelected = currentScale !== null && Math.abs(preset.scale - currentScale) < SCALE_TOLERANCE;
                      return (
                        <button
                          key={preset.key}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            isSelected
                              ? "bg-terracotta text-white"
                              : "bg-terracotta/10 text-text-secondary hover:bg-terracotta/25 hover:text-white"
                          }`}
                          onClick={() => setSelectedFontScale(preset.scale)}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                  <ContextMenuSeparator className="bg-terracotta/20" />
                </>
              )}
              <ContextMenuItem className="text-white" onClick={duplicateSelected}>
                <Copy className="w-4 h-4" />
                Duplicate
              </ContextMenuItem>
              <ContextMenuItem variant="destructive" onClick={deleteSelected}>
                <Trash2 className="w-4 h-4" />
                Delete
                <ContextMenuShortcut>Del</ContextMenuShortcut>
              </ContextMenuItem>
            </ContextMenuContent>
          );
        })()}
      </ContextMenu>

      <ExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        elements={elements}
        canvasName={canvasName}
        isExporting={isExporting}
        onExport={handleExportPng}
        exportContainerRef={exportContainerRef}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}

const TILE_SPACING = 10;

function snapToTilePosition(
  x: number,
  y: number,
  width: number,
  height: number,
  elementId: string,
  allElements: CanvasElement[]
): { x: number; y: number; snapped: boolean } {
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  // Find the element whose bounds the dragged element's center is inside (with padding)
  let hoveredElement: CanvasElement | null = null;
  let closestDist = Infinity;

  for (const other of allElements) {
    if (other.id === elementId) continue;

    const padX = width * 0.3;
    const padY = height * 0.3;

    if (
      centerX >= other.x - padX &&
      centerX <= other.x + other.width + padX &&
      centerY >= other.y - padY &&
      centerY <= other.y + other.height + padY
    ) {
      const otherCenterX = other.x + other.width / 2;
      const otherCenterY = other.y + other.height / 2;
      const dist = Math.abs(centerX - otherCenterX) + Math.abs(centerY - otherCenterY);
      if (dist < closestDist) {
        closestDist = dist;
        hoveredElement = other;
      }
    }
  }

  if (!hoveredElement) {
    return { x, y, snapped: false };
  }

  // Determine which side to snap to based on dragged center relative to hovered element center
  const hCenterX = hoveredElement.x + hoveredElement.width / 2;
  const hCenterY = hoveredElement.y + hoveredElement.height / 2;
  const dx = centerX - hCenterX;
  const dy = centerY - hCenterY;

  // Normalize by element dimensions so the direction accounts for aspect ratio
  const normDx = dx / (hoveredElement.width / 2 + width / 2);
  const normDy = dy / (hoveredElement.height / 2 + height / 2);

  let snapX: number;
  let snapY: number;
  let stepX = 0;
  let stepY = 0;

  if (Math.abs(normDx) > Math.abs(normDy)) {
    // Horizontal snap
    if (normDx > 0) {
      snapX = hoveredElement.x + hoveredElement.width + TILE_SPACING;
      stepX = width + TILE_SPACING;
    } else {
      snapX = hoveredElement.x - width - TILE_SPACING;
      stepX = -(width + TILE_SPACING);
    }
    snapY = hoveredElement.y;
  } else {
    // Vertical snap
    if (normDy > 0) {
      snapY = hoveredElement.y + hoveredElement.height + TILE_SPACING;
      stepY = height + TILE_SPACING;
    } else {
      snapY = hoveredElement.y - height - TILE_SPACING;
      stepY = -(height + TILE_SPACING);
    }
    snapX = hoveredElement.x;
  }

  // Walk forward in the snap direction, jumping past each blocking element
  const otherElements = allElements.filter((el) => el.id !== elementId);
  const maxAttempts = 50;
  const goingRight = stepX > 0;
  const goingDown = stepY > 0;

  for (let i = 0; i < maxAttempts; i++) {
    const blocker = otherElements.find((el) =>
      rectanglesOverlap(snapX, snapY, width, height, el.x, el.y, el.width, el.height)
    );
    if (!blocker) break;

    // Jump just past the blocking element's far edge
    if (stepX !== 0) {
      snapX = goingRight
        ? blocker.x + blocker.width + TILE_SPACING
        : blocker.x - width - TILE_SPACING;
    }
    if (stepY !== 0) {
      snapY = goingDown
        ? blocker.y + blocker.height + TILE_SPACING
        : blocker.y - height - TILE_SPACING;
    }
  }

  return { x: snapX, y: snapY, snapped: true };
}

function rectanglesOverlap(
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  x2: number,
  y2: number,
  w2: number,
  h2: number
) {
  return !(x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1);
}

function getSelectionBounds(
  elements: CanvasElement[],
  selectedIds: string[]
): { x: number; y: number; width: number; height: number } | null {
  if (selectedIds.length === 0) return null;

  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
  if (selectedElements.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of selectedElements) {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function calculateAdjacentPosition(
  selectedEl: CanvasElement,
  allElements: CanvasElement[],
  mouseScreenX: number,
  mouseScreenY: number,
  newWidth: number,
  newHeight: number,
  viewport: ViewportState
) {
  const spacing = 10;

  const selectedCenterX = selectedEl.x + selectedEl.width / 2;
  const selectedCenterY = selectedEl.y + selectedEl.height / 2;

  const mouseCanvas = {
    x: (mouseScreenX - viewport.x) / viewport.zoom,
    y: (mouseScreenY - viewport.y) / viewport.zoom,
  };

  const dx = mouseCanvas.x - selectedCenterX;
  const dy = mouseCanvas.y - selectedCenterY;
  const angle = Math.atan2(dy, dx);

  const degrees = ((angle * 180) / Math.PI + 360) % 360;

  let baseX = selectedEl.x;
  let baseY = selectedEl.y;
  let stepX = 0;
  let stepY = 0;

  if (degrees >= 337.5 || degrees < 22.5) {
    baseX = selectedEl.x + selectedEl.width + spacing;
    baseY = selectedEl.y;
    stepX = newWidth + spacing;
    stepY = 0;
  } else if (degrees >= 22.5 && degrees < 67.5) {
    baseX = selectedEl.x + selectedEl.width + spacing;
    baseY = selectedEl.y - newHeight - spacing;
    stepX = newWidth + spacing;
    stepY = -(newHeight + spacing);
  } else if (degrees >= 67.5 && degrees < 112.5) {
    baseX = selectedEl.x;
    baseY = selectedEl.y - newHeight - spacing;
    stepX = 0;
    stepY = -(newHeight + spacing);
  } else if (degrees >= 112.5 && degrees < 157.5) {
    baseX = selectedEl.x - newWidth - spacing;
    baseY = selectedEl.y - newHeight - spacing;
    stepX = -(newWidth + spacing);
    stepY = -(newHeight + spacing);
  } else if (degrees >= 157.5 && degrees < 202.5) {
    baseX = selectedEl.x - newWidth - spacing;
    baseY = selectedEl.y;
    stepX = -(newWidth + spacing);
    stepY = 0;
  } else if (degrees >= 202.5 && degrees < 247.5) {
    baseX = selectedEl.x - newWidth - spacing;
    baseY = selectedEl.y + selectedEl.height + spacing;
    stepX = -(newWidth + spacing);
    stepY = newHeight + spacing;
  } else if (degrees >= 247.5 && degrees < 292.5) {
    baseX = selectedEl.x;
    baseY = selectedEl.y + selectedEl.height + spacing;
    stepX = 0;
    stepY = newHeight + spacing;
  } else {
    baseX = selectedEl.x + selectedEl.width + spacing;
    baseY = selectedEl.y + selectedEl.height + spacing;
    stepX = newWidth + spacing;
    stepY = newHeight + spacing;
  }

  let x = baseX;
  let y = baseY;
  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    const hasOverlap = allElements.some((el) =>
      rectanglesOverlap(x, y, newWidth, newHeight, el.x, el.y, el.width, el.height)
    );

    if (!hasOverlap) {
      return { x, y };
    }

    x += stepX;
    y += stepY;
    attempts++;
  }

  return { x, y };
}

interface CanvasHeaderProps {
  canvasName: string;
  saveStatus: SaveStatus;
  objectCount: number;
  onBack: () => void;
  onRename: (newName: string) => void;
  onExport: () => void;
}

function CanvasHeader({ canvasName, saveStatus, objectCount, onBack, onRename, onExport }: CanvasHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(canvasName);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  function handleDoubleClick() {
    setEditValue(canvasName);
    cancelledRef.current = false;
    setIsEditing(true);
  }

  function commitRename() {
    if (cancelledRef.current) return;
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== canvasName) {
      onRename(trimmed);
    }
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      commitRename();
    } else if (e.key === "Escape") {
      cancelledRef.current = true;
      setIsEditing(false);
    }
  }

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  return (
    <header className="border-b border-terracotta/20 bg-bg-panel/80 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-black/20">
      <div className="max-w-[1800px] mx-auto px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBack}
            variant="ghost"
            size="icon"
            className="hover:bg-terracotta/10 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2} />
          </Button>
          <div>
            {isEditing ? (
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={handleKeyDown}
                className="text-xl font-bold tracking-tight bg-transparent border-b-2 border-terracotta/60 outline-none text-white px-0 py-0"
                style={{ fontFamily: "'Crimson Pro', serif" }}
              />
            ) : (
              <h1
                className="text-xl font-bold tracking-tight cursor-pointer hover:text-terracotta transition-colors duration-200"
                style={{ fontFamily: "'Crimson Pro', serif" }}
                onDoubleClick={handleDoubleClick}
              >
                {canvasName}
              </h1>
            )}
            <div className="flex items-center gap-2">
              {saveStatus === "saving" && (
                <span className="text-xs text-text-secondary font-mono flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="text-xs text-green-400 font-mono flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Saved
                </span>
              )}
              {saveStatus === "error" && (
                <span className="text-xs text-red-400 font-mono">Save failed</span>
              )}
              {saveStatus === "idle" && (
                <span className="text-xs text-text-secondary font-mono">{objectCount} objects</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onExport}
                  variant="ghost"
                  size="icon"
                  className="hover:bg-terracotta/10 hover:text-white transition-all duration-300"
                  title="Export Canvas"
                >
                  <Download className="w-5 h-5" strokeWidth={2} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
}

interface CanvasToolbarProps {
  placingObjectType: PlacementObjectType;
  tilingMode: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onToggleTextPlacement: () => void;
  onImageButtonClick: () => void;
  onToggleTilingMode: (checked: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
}

function CanvasToolbar({
  placingObjectType,
  tilingMode,
  canUndo,
  canRedo,
  onToggleTextPlacement,
  onImageButtonClick,
  onToggleTilingMode,
  onUndo,
  onRedo,
}: CanvasToolbarProps) {
  return (
    <div className="fixed left-8 top-1/2 -translate-y-1/2 z-40">
      <div className={`${FLOATING_PANEL_CLASS} space-y-2`}>
        <Button
          onClick={onToggleTextPlacement}
          variant="ghost"
          size="icon"
          className={`w-12 h-12 transition-all duration-300 group ${
            placingObjectType === "text"
              ? "bg-terracotta/20 ring-2 ring-terracotta/50"
              : "hover:bg-terracotta/20"
          }`}
          title="Add Text (T)"
        >
          <Type className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2} />
        </Button>

        <Button
          onClick={onImageButtonClick}
          variant="ghost"
          size="icon"
          className={`w-12 h-12 transition-all duration-300 group ${
            placingObjectType === "image"
              ? "bg-terracotta/20 ring-2 ring-terracotta/50"
              : "hover:bg-terracotta/20"
          }`}
          title="Add Image (I)"
        >
          <ImageIcon className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2} />
        </Button>

        <div className="h-px bg-terracotta/20 my-2" />

        <div className="flex flex-col items-center gap-2 py-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={tilingMode}
              onCheckedChange={onToggleTilingMode}
              className="data-[state=checked]:bg-terracotta"
            />
          </div>
          <span className="text-[10px] text-text-secondary font-mono">TILE</span>
        </div>

        <div className="h-px bg-terracotta/20 my-2" />

        <Button
          onClick={onUndo}
          disabled={!canUndo}
          variant="ghost"
          size="icon"
          className="w-12 h-12 hover:bg-terracotta/20 disabled:opacity-30 transition-all duration-300 group"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2} />
        </Button>

        <Button
          onClick={onRedo}
          disabled={!canRedo}
          variant="ghost"
          size="icon"
          className="w-12 h-12 hover:bg-terracotta/20 disabled:opacity-30 transition-all duration-300 group"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2} />
        </Button>
      </div>
    </div>
  );
}

interface CanvasZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

function CanvasZoomControls({ zoom, onZoomIn, onZoomOut, onResetZoom }: CanvasZoomControlsProps) {
  return (
    <div className="fixed right-8 bottom-8 z-40">
      <div className={`${FLOATING_PANEL_CLASS} space-y-2`}>
        <Button
          onClick={onZoomIn}
          variant="ghost"
          size="icon"
          className="w-12 h-12 hover:bg-terracotta/20 transition-all duration-300 group"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2} />
        </Button>

        <button
          onClick={onResetZoom}
          className="w-12 h-12 flex items-center justify-center hover:bg-terracotta/20 rounded-lg transition-all duration-300 font-mono text-xs text-text-secondary hover:text-terracotta"
          title="Reset Zoom (0)"
        >
          {Math.round(zoom * 100)}%
        </button>

        <Button
          onClick={onZoomOut}
          variant="ghost"
          size="icon"
          className="w-12 h-12 hover:bg-terracotta/20 transition-all duration-300 group"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2} />
        </Button>
      </div>
    </div>
  );
}

interface CanvasStatusBarProps {
  viewport: ViewportState;
  objectCount: number;
}

function CanvasStatusBar({ viewport, objectCount }: CanvasStatusBarProps) {
  return (
    <div className="fixed left-8 bottom-8 z-40">
      <div className="bg-bg-panel/90 backdrop-blur-xl border border-terracotta/20 rounded-xl shadow-2xl shadow-black/40 px-4 py-2">
        <div className="flex items-center gap-4 text-xs font-mono text-text-secondary">
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4" strokeWidth={2} />
            <span>X: {Math.round(viewport.x)}</span>
            <span>Y: {Math.round(viewport.y)}</span>
          </div>
          <div className="w-px h-4 bg-terracotta/20" />
          <div className="flex items-center gap-2">
            <Grid3x3 className="w-4 h-4" strokeWidth={2} />
            <span>{objectCount} objects</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CanvasEmptyState() {
  return (
    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
      <div className="bg-bg-panel/90 backdrop-blur-xl border border-terracotta/20 rounded-2xl shadow-2xl shadow-black/40 p-8 text-center animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-terracotta to-warm-orange flex items-center justify-center">
          <ImageIcon className="w-10 h-10 text-white" strokeWidth={2} />
        </div>
        <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Crimson Pro', serif" }}>
          Start Creating
        </h2>
        <div className="text-sm text-text-secondary space-y-2 max-w-md">
          <p className="font-mono">
            <kbd className="px-2 py-1 bg-terracotta/10 rounded text-terracotta">Ctrl+V</kbd> Paste images from
            clipboard
          </p>
          <p className="font-mono">
            <kbd className="px-2 py-1 bg-terracotta/10 rounded text-terracotta">Scroll</kbd> Zoom in/out
          </p>
          <p className="font-mono">
            <kbd className="px-2 py-1 bg-terracotta/10 rounded text-terracotta">+/-</kbd> or
            <kbd className="px-2 py-1 bg-terracotta/10 rounded text-terracotta ml-1">0</kbd> Zoom controls
          </p>
          <p className="font-mono">
            <kbd className="px-2 py-1 bg-terracotta/10 rounded text-terracotta">Click+Drag</kbd> Move objects
          </p>
        </div>
      </div>
    </div>
  );
}

interface CanvasElementsLayerProps {
  elements: CanvasElement[];
  selectedElement: string | null;
  selectedElements: string[];
  editingElementId: string | null;
  placingObjectType: PlacementObjectType;
  previewPos: { x: number; y: number } | null;
  pendingImage: PendingImage | null;
  onElementMouseDown: (e: React.MouseEvent, elementId: string) => void;
  onTextDoubleClick: (element: CanvasElement) => void;
  onResizeStart: (e: React.MouseEvent, elementId: string, handle: ResizeHandle) => void;
  onTextEditSave: (elementId: string, value: string) => void;
  onTextEditCancel: () => void;
  onElementContextMenu: (elementId: string) => void;
  onGroupResizeStart: (e: React.MouseEvent, handle: ResizeHandle) => void;
}

function CanvasElementsLayer({
  elements,
  selectedElement,
  selectedElements,
  editingElementId,
  placingObjectType,
  previewPos,
  pendingImage,
  onElementMouseDown,
  onTextDoubleClick,
  onResizeStart,
  onTextEditSave,
  onTextEditCancel,
  onElementContextMenu,
  onGroupResizeStart,
}: CanvasElementsLayerProps) {
  return (
    <>
      {elements.map((element) => (
        <div
          key={element.id}
          className={`absolute cursor-grab active:cursor-grabbing transition-shadow duration-200 ${
            selectedElement === element.id || selectedElements.includes(element.id)
              ? "ring-2 ring-terracotta shadow-lg shadow-terracotta/30"
              : "hover:ring-2 hover:ring-terracotta/50"
          }`}
          style={{
            left: element.x,
            top: element.y,
            width: element.width,
            height: element.height,
            transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
          }}
          onMouseDown={(e) => onElementMouseDown(e, element.id)}
          onDoubleClick={() => element.type === "text" && onTextDoubleClick(element)}
          onContextMenu={() => onElementContextMenu(element.id)}
        >
              {element.type === "image" ? (
                <>
                  <img
                    src={element.content}
                    alt="Canvas element"
                    className="w-full h-full object-cover rounded-lg"
                    draggable={false}
                  />
                  {selectedElement === element.id && (
                    <>
                      {CORNER_HANDLES.map((handle) => (
                        <div
                          key={handle}
                          className="absolute w-3 h-3 bg-terracotta rounded-full border-2 border-white
                                     shadow-md shadow-black/30 z-10
                                     transition-all duration-200 hover:scale-125 hover:bg-warm-orange"
                          style={{
                            cursor: HANDLE_CONFIGS[handle].cursor,
                            ...HANDLE_CONFIGS[handle].position,
                          }}
                          onMouseDown={(e) => onResizeStart(e, element.id, handle)}
                        />
                      ))}
                    </>
                  )}
                </>
              ) : editingElementId === element.id ? (
                <div className="w-full h-full rounded-lg p-2">
                  <textarea
                    autoFocus
                    defaultValue={element.content === "Double-click to edit" ? "" : element.content}
                    className="w-full h-full bg-transparent text-white text-center resize-none outline-none"
                    style={{ fontFamily: "'Crimson Pro', serif", fontSize: `${getTextFontSize(element.fontScale)}px` }}
                    onBlur={(e) => onTextEditSave(element.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onTextEditSave(element.id, e.currentTarget.value);
                      } else if (e.key === "Escape") {
                        onTextEditCancel();
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                  {selectedElement === element.id && (
                    <>
                      {/* Corner handles for scaling text */}
                      {CORNER_HANDLES.map((handle) => (
                        <div
                          key={handle}
                          className="absolute w-3 h-3 bg-terracotta rounded-full border-2 border-white
                                     shadow-md shadow-black/30 z-10
                                     transition-all duration-200 hover:scale-125 hover:bg-warm-orange"
                          style={{
                            cursor: HANDLE_CONFIGS[handle].cursor,
                            ...HANDLE_CONFIGS[handle].position,
                          }}
                          onMouseDown={(e) => onResizeStart(e, element.id, handle)}
                        />
                      ))}
                      {/* Edge handles for resizing container only */}
                      {EDGE_HANDLES.map((handle) => (
                        <div
                          key={handle}
                          className="absolute w-2 h-2 bg-white/80 rounded-sm border border-terracotta/50
                                     shadow-md shadow-black/30 z-10
                                     transition-all duration-200 hover:scale-125 hover:bg-white"
                          style={{
                            cursor: HANDLE_CONFIGS[handle].cursor,
                            ...HANDLE_CONFIGS[handle].position,
                          }}
                          onMouseDown={(e) => onResizeStart(e, element.id, handle)}
                        />
                      ))}
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <p
                      className="text-center break-words"
                      style={{ fontFamily: "'Crimson Pro', serif", fontSize: `${getTextFontSize(element.fontScale)}px` }}
                    >
                      {element.content}
                    </p>
                  </div>
                  {selectedElement === element.id && (
                    <>
                      {/* Corner handles for scaling text */}
                      {CORNER_HANDLES.map((handle) => (
                        <div
                          key={handle}
                          className="absolute w-3 h-3 bg-terracotta rounded-full border-2 border-white
                                     shadow-md shadow-black/30 z-10
                                     transition-all duration-200 hover:scale-125 hover:bg-warm-orange"
                          style={{
                            cursor: HANDLE_CONFIGS[handle].cursor,
                            ...HANDLE_CONFIGS[handle].position,
                          }}
                          onMouseDown={(e) => onResizeStart(e, element.id, handle)}
                        />
                      ))}
                      {/* Edge handles for resizing container only */}
                      {EDGE_HANDLES.map((handle) => (
                        <div
                          key={handle}
                          className="absolute w-2 h-2 bg-white/80 rounded-sm border border-terracotta/50
                                     shadow-md shadow-black/30 z-10
                                     transition-all duration-200 hover:scale-125 hover:bg-white"
                          style={{
                            cursor: HANDLE_CONFIGS[handle].cursor,
                            ...HANDLE_CONFIGS[handle].position,
                          }}
                          onMouseDown={(e) => onResizeStart(e, element.id, handle)}
                        />
                      ))}
                    </>
                  )}
                </>
              )}
        </div>
      ))}

      {selectedElements.length > 1 && (() => {
        const bounds = getSelectionBounds(elements, selectedElements);
        if (!bounds) return null;

        return (
          <div
            className="absolute border-2 border-terracotta/60 rounded-sm cursor-grab active:cursor-grabbing"
            style={{
              left: bounds.x,
              top: bounds.y,
              width: bounds.width,
              height: bounds.height,
            }}
            onMouseDown={(e) => {
              if (e.button !== 0 || e.shiftKey) return;
              e.preventDefault();
              e.stopPropagation();
              // Trigger multi-drag via the first selected element
              onElementMouseDown(e, selectedElements[0]);
            }}
          >
            {CORNER_HANDLES.map((handle) => (
              <div
                key={handle}
                className="absolute w-3 h-3 bg-terracotta rounded-full border-2 border-white
                           shadow-md shadow-black/30 z-10
                           transition-all duration-200 hover:scale-125 hover:bg-warm-orange"
                style={{
                  cursor: HANDLE_CONFIGS[handle].cursor,
                  ...HANDLE_CONFIGS[handle].position,
                }}
                onMouseDown={(e) => onGroupResizeStart(e, handle)}
              />
            ))}
          </div>
        );
      })()}

      {placingObjectType === "text" && previewPos && (
        <div
          className="absolute pointer-events-none opacity-50 ring-2 ring-terracotta/50 shadow-lg shadow-terracotta/20"
          style={{
            left: previewPos.x - 100,
            top: previewPos.y - 30,
            width: 200,
            height: 60,
          }}
        >
          <div className="w-full h-full flex items-center justify-center p-4">
            <p
              className="text-center text-text-secondary"
              style={{ fontFamily: "'Crimson Pro', serif", fontSize: "18px" }}
            >
              Text
            </p>
          </div>
        </div>
      )}

      {placingObjectType === "image" && previewPos && pendingImage && (
        <div
          className="absolute pointer-events-none opacity-50 ring-2 ring-terracotta/50 shadow-lg shadow-terracotta/20 rounded-lg overflow-hidden"
          style={{
            left: previewPos.x - Math.min(pendingImage.width, 200) / 2,
            top: previewPos.y - Math.min(pendingImage.height, 200) / 2,
            width: Math.min(pendingImage.width, 200),
            height: Math.min(pendingImage.height, 200),
          }}
        >
          <img src={pendingImage.url} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}
    </>
  );
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  elements: CanvasElement[];
  canvasName: string;
  isExporting: boolean;
  onExport: () => void;
  exportContainerRef: React.RefObject<HTMLDivElement | null>;
}

function ExportDialog({
  open,
  onOpenChange,
  elements,
  canvasName,
  isExporting,
  onExport,
  exportContainerRef,
}: ExportDialogProps) {
  const [showFullPreview, setShowFullPreview] = useState(false);
  const bounds = getElementsBounds(elements);

  // Calculate scale to fit preview in container
  const previewMaxWidth = 400;
  const previewMaxHeight = 200;
  const previewScale = bounds
    ? Math.min(previewMaxWidth / bounds.width, previewMaxHeight / bounds.height, 1)
    : 1;

  // Calculate scale for full preview (90% of viewport)
  const fullPreviewScale = bounds
    ? Math.min(
        (window.innerWidth * 0.9) / bounds.width,
        (window.innerHeight * 0.9) / bounds.height,
        1
      )
    : 1;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-bg-panel/95 backdrop-blur-xl border-terracotta/20 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle
              className="text-xl font-bold"
              style={{ fontFamily: "'Crimson Pro', serif" }}
            >
              Export Canvas
            </DialogTitle>
            <DialogDescription className="text-text-secondary">
              Export &ldquo;{canvasName}&rdquo; as a PNG image.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {elements.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No elements to export.</p>
                <p className="text-sm mt-1">Add some images or text to your canvas first.</p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-text-secondary space-y-1">
                  <p>Elements: {elements.length}</p>
                  {bounds && (
                    <p>
                      Size: {Math.round(bounds.width)} × {Math.round(bounds.height)} px
                    </p>
                  )}
                </div>

                {/* Clickable preview thumbnail */}
                <button
                  type="button"
                  onClick={() => setShowFullPreview(true)}
                  className="relative w-full bg-bg-deep rounded-lg overflow-hidden border border-terracotta/10 hover:border-terracotta/30 transition-colors cursor-pointer group"
                  style={{
                    height: bounds ? Math.min(previewMaxHeight, bounds.height * previewScale) : previewMaxHeight,
                  }}
                >
                  <div
                    className="absolute top-0 left-0 origin-top-left"
                    style={{
                      width: bounds?.width ?? previewMaxWidth,
                      height: bounds?.height ?? previewMaxHeight,
                      transform: `scale(${previewScale})`,
                    }}
                  >
                    {elements.map((element) => (
                      <div
                        key={element.id}
                        className="absolute"
                        style={{
                          left: bounds ? element.x - bounds.x : element.x,
                          top: bounds ? element.y - bounds.y : element.y,
                          width: element.width,
                          height: element.height,
                        }}
                      >
                        {element.type === "image" ? (
                          <img
                            src={element.content}
                            alt="Canvas element"
                            className="w-full h-full object-cover rounded-lg"
                            draggable={false}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-4">
                            <p
                              className="text-center break-words text-white"
                              style={{
                                fontFamily: "'Crimson Pro', serif",
                                fontSize: `${getTextFontSize(element.fontScale)}px`,
                              }}
                            >
                              {element.content}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                    <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to preview
                    </span>
                  </div>
                </button>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-terracotta/20 hover:bg-terracotta/10"
            >
              Cancel
            </Button>
            <Button
              onClick={onExport}
              disabled={isExporting || elements.length === 0}
              className="bg-gradient-to-br from-terracotta to-warm-orange hover:shadow-lg hover:shadow-terracotta/30 transition-all duration-300 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export PNG
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden export container - actual size for rendering (only rendered when dialog is open) */}
      {open && (
        <div className="fixed -left-[99999px] -top-[99999px]">
          <div
            ref={exportContainerRef}
            className="relative bg-bg-deep"
            style={{
              width: bounds?.width ?? 0,
              height: bounds?.height ?? 0,
            }}
          >
            {elements.map((element) => (
              <div
                key={element.id}
                className="absolute"
                style={{
                  left: bounds ? element.x - bounds.x : element.x,
                  top: bounds ? element.y - bounds.y : element.y,
                  width: element.width,
                  height: element.height,
                }}
              >
                {element.type === "image" ? (
                  <img
                    src={element.content}
                    alt="Canvas element"
                    className="w-full h-full object-cover rounded-lg"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <p
                      className="text-center break-words text-white"
                      style={{
                        fontFamily: "'Crimson Pro', serif",
                        fontSize: `${getTextFontSize(element.fontScale)}px`,
                      }}
                    >
                      {element.content}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full preview overlay */}
      {showFullPreview && bounds && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center cursor-pointer animate-fade-in"
          onClick={() => setShowFullPreview(false)}
        >
          <div
            className="relative bg-bg-deep rounded-lg shadow-2xl overflow-hidden"
            style={{
              width: bounds.width * fullPreviewScale,
              height: bounds.height * fullPreviewScale,
            }}
          >
            <div
              className="absolute top-0 left-0 origin-top-left"
              style={{
                width: bounds.width,
                height: bounds.height,
                transform: `scale(${fullPreviewScale})`,
              }}
            >
              {elements.map((element) => (
                <div
                  key={element.id}
                  className="absolute"
                  style={{
                    left: element.x - bounds.x,
                    top: element.y - bounds.y,
                    width: element.width,
                    height: element.height,
                  }}
                >
                  {element.type === "image" ? (
                    <img
                      src={element.content}
                      alt="Canvas element"
                      className="w-full h-full object-cover rounded-lg"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4">
                      <p
                        className="text-center break-words text-white"
                        style={{
                          fontFamily: "'Crimson Pro', serif",
                          fontSize: `${getTextFontSize(element.fontScale)}px`,
                        }}
                      >
                        {element.content}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            onClick={() => setShowFullPreview(false)}
          >
            <span className="text-sm">Press anywhere to close</span>
          </button>
        </div>
      )}
    </>
  );
}

function getElementsBounds(elements: CanvasElement[]): { x: number; y: number; width: number; height: number } | null {
  if (elements.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
