import { useParams, useNavigate } from "react-router";
import { useState, useRef, useEffect } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import {
  ArrowLeft,
  Download,
  Share2,
  Trash2,
  Settings,
  Type,
  Image as ImageIcon,
  Grid3x3,
  ZoomIn,
  ZoomOut,
  Move,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";

interface CanvasElement {
  id: string;
  type: "image" | "text";
  x: number;
  y: number;
  width: number;
  height: number;
  content: string; // URL for images, text for text elements
  rotation?: number;
}

interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

// Helper function to check if two rectangles overlap
const rectanglesOverlap = (
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  x2: number,
  y2: number,
  w2: number,
  h2: number
) => {
  return !(x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1);
};

// Calculate position for adjacent tile based on cursor direction
const calculateAdjacentPosition = (
  selectedEl: CanvasElement,
  allElements: CanvasElement[],
  mouseScreenX: number,
  mouseScreenY: number,
  newWidth: number,
  newHeight: number,
  viewport: ViewportState
) => {
  const spacing = 10;

  // Calculate selected element center in canvas coordinates
  const selectedCenterX = selectedEl.x + selectedEl.width / 2;
  const selectedCenterY = selectedEl.y + selectedEl.height / 2;

  // Convert mouse position to canvas coordinates
  const mouseCanvas = {
    x: (mouseScreenX - viewport.x) / viewport.zoom,
    y: (mouseScreenY - viewport.y) / viewport.zoom,
  };

  // Calculate angle from selected center to mouse position
  const dx = mouseCanvas.x - selectedCenterX;
  const dy = mouseCanvas.y - selectedCenterY;
  const angle = Math.atan2(dy, dx);

  // Convert angle to degrees (0-360)
  const degrees = ((angle * 180) / Math.PI + 360) % 360;

  // Determine direction and step vectors
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
};

export default function Canvas() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Canvas state
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [viewport, setViewport] = useState<ViewportState>({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [tilingMode, setTilingMode] = useState(false);
  const [placingObjectType, setPlacingObjectType] = useState<"text" | "image" | null>(null);
  const [pendingImage, setPendingImage] = useState<{
    url: string;
    width: number;
    height: number;
  } | null>(null);
  const [previewPos, setPreviewPos] = useState<{ x: number; y: number } | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const currentMousePos = useRef({ x: 0, y: 0 });
  const pendingDrag = useRef<{ elementId: string; startX: number; startY: number } | null>(null);
  const DRAG_THRESHOLD = 5; // pixels before drag starts

  // Resize state
  type ResizeCorner = "nw" | "ne" | "sw" | "se";

  interface ResizeState {
    elementId: string;
    corner: ResizeCorner;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startElementX: number;
    startElementY: number;
    aspectRatio: number;
  }

  const [resizingElement, setResizingElement] = useState<ResizeState | null>(null);
  const pendingResize = useRef<ResizeState | null>(null);
  const MIN_SIZE = 20;
  const RESIZE_THRESHOLD = 5;

  const HANDLE_CONFIGS: Record<ResizeCorner, { cursor: string; position: React.CSSProperties }> = {
    nw: { cursor: "nwse-resize", position: { top: -6, left: -6 } },
    ne: { cursor: "nesw-resize", position: { top: -6, right: -6 } },
    sw: { cursor: "nesw-resize", position: { bottom: -6, left: -6 } },
    se: { cursor: "nwse-resize", position: { bottom: -6, right: -6 } },
  };

  // Zoom controls
  const zoomIn = () => {
    setViewport((prev) => ({ ...prev, zoom: Math.min(5, prev.zoom * 1.2) }));
  };

  const zoomOut = () => {
    setViewport((prev) => ({ ...prev, zoom: Math.max(0.1, prev.zoom / 1.2) }));
  };

  const resetZoom = () => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  };

  // Delete selected element
  const deleteSelected = () => {
    if (selectedElement) {
      setElements((prev) => prev.filter((el) => el.id !== selectedElement));
      setSelectedElement(null);
    }
  };

  // Delete a specific element by ID
  const deleteElement = (elementId: string) => {
    setElements((prev) => prev.filter((el) => el.id !== elementId));
    if (selectedElement === elementId) {
      setSelectedElement(null);
    }
  };

  // Cancel placement mode
  const cancelPlacement = () => {
    if (pendingImage) {
      URL.revokeObjectURL(pendingImage.url);
    }
    setPlacingObjectType(null);
    setPreviewPos(null);
    setPendingImage(null);
  };

  // Handle resize start on corner handle
  const handleResizeStart = (
    e: React.MouseEvent,
    elementId: string,
    corner: ResizeCorner
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const element = elements.find((el) => el.id === elementId);
    if (!element) return;

    pendingResize.current = {
      elementId,
      corner,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: element.width,
      startHeight: element.height,
      startElementX: element.x,
      startElementY: element.y,
      aspectRatio: element.width / element.height,
    };

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  // Handle file selection for image upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;

    img.onload = () => {
      setPendingImage({ url, width: img.width, height: img.height });
      setPlacingObjectType("image");
    };

    // Reset input so same file can be selected again
    e.target.value = "";
  };

  // Keyboard shortcuts for zoom, delete, and cancel
  useKeyboardShortcuts({
    shortcuts: [
      { key: '+', callback: zoomIn, description: 'Zoom in' },
      { key: '=', callback: zoomIn, description: 'Zoom in' },
      { key: '-', callback: zoomOut, description: 'Zoom out' },
      { key: '0', callback: resetZoom, description: 'Reset zoom' },
      { key: 'Delete', callback: deleteSelected, description: 'Delete selected element' },
      { key: 'Backspace', callback: deleteSelected, description: 'Delete selected element' },
      { key: 'Escape', callback: cancelPlacement, description: 'Cancel placement' },
    ],
  });

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = (screenX: number, screenY: number) => {
    return {
      x: (screenX - viewport.x) / viewport.zoom,
      y: (screenY - viewport.y) / viewport.zoom,
    };
  };

  // Refs to store current state values for stable event handlers
  const stateRef = useRef({
    isPanning,
    draggedElement,
    resizingElement,
    viewport,
    placingObjectType,
    tilingMode,
    selectedElement,
    elements,
  });

  // Update state ref in effect (not during render)
  useEffect(() => {
    stateRef.current = {
      isPanning,
      draggedElement,
      resizingElement,
      viewport,
      placingObjectType,
      tilingMode,
      selectedElement,
      elements,
    };
  });

  // Handle panning and placement
  const handleMouseDown = (e: React.MouseEvent) => {
    // Handle placement mode click
    if (placingObjectType && e.button === 0 && !e.shiftKey) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const canvasPos = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top);

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
          // Delay to ensure element is rendered before entering edit mode
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

    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      // Middle mouse or Shift+Left mouse for panning
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };


  // Handle element drag start - uses threshold to allow double-clicks
  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    if (e.button === 0 && !e.shiftKey) {
      e.stopPropagation();
      // Don't start drag immediately - wait for mouse to move past threshold
      pendingDrag.current = { elementId, startX: e.clientX, startY: e.clientY };
      setSelectedElement(elementId);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  // Handle text editing - enter inline edit mode
  const handleTextDoubleClick = (element: CanvasElement) => {
    if (element.type === "text") {
      setEditingElementId(element.id);
    }
  };

  // Save text edit
  const handleTextEditSave = (elementId: string, newContent: string) => {
    setElements((prev) =>
      prev.map((el) =>
        el.id === elementId ? { ...el, content: newContent || "Double-click to edit" } : el
      )
    );
    setEditingElementId(null);
  };

  // Cancel text edit
  const handleTextEditCancel = () => {
    setEditingElementId(null);
  };

  // Effects - event listeners with stable handlers that read from stateRef
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Track global mouse position for paste direction calculation
    const trackMousePosition = (e: MouseEvent) => {
      currentMousePos.current = { x: e.clientX, y: e.clientY };
    };

    // Handle mouse wheel for zooming
    const handleWheel = (e: WheelEvent) => {
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
    };

    // Handle mouse move for drag, resize, and pan
    const handleMouseMove = (e: MouseEvent) => {
      const { isPanning, draggedElement, resizingElement, viewport, placingObjectType } = stateRef.current;

      // Check if pending drag should become actual drag
      if (pendingDrag.current && !draggedElement) {
        const dx = e.clientX - pendingDrag.current.startX;
        const dy = e.clientY - pendingDrag.current.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance >= DRAG_THRESHOLD) {
          setDraggedElement(pendingDrag.current.elementId);
          lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
      }

      // Check if pending resize should become actual resize
      if (pendingResize.current && !resizingElement) {
        const dx = e.clientX - pendingResize.current.startX;
        const dy = e.clientY - pendingResize.current.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance >= RESIZE_THRESHOLD) {
          setResizingElement(pendingResize.current);
        }
      }

      // Handle active resize
      if (resizingElement) {
        const {
          elementId,
          corner,
          startX,
          startWidth,
          startHeight,
          startElementX,
          startElementY,
          aspectRatio,
        } = resizingElement;

        const dx = (e.clientX - startX) / viewport.zoom;
        const dy = (e.clientY - resizingElement.startY) / viewport.zoom;
        const maintainAspect = !e.shiftKey;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newX = startElementX;
        let newY = startElementY;

        switch (corner) {
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
        }

        setElements((prev) =>
          prev.map((el) =>
            el.id === elementId ? { ...el, x: newX, y: newY, width: newWidth, height: newHeight } : el
          )
        );
      } else if (isPanning) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        setViewport((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      } else if (draggedElement) {
        const dx = (e.clientX - lastMousePos.current.x) / viewport.zoom;
        const dy = (e.clientY - lastMousePos.current.y) / viewport.zoom;
        setElements((prev) =>
          prev.map((el) => (el.id === draggedElement ? { ...el, x: el.x + dx, y: el.y + dy } : el))
        );
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }

      // Update preview position when in placement mode
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
    };

    // Handle mouse up
    const handleMouseUp = () => {
      setIsPanning(false);
      setDraggedElement(null);
      setResizingElement(null);
      pendingDrag.current = null;
      pendingResize.current = null;
    };

    // Handle paste from clipboard
    const handlePaste = async (e: ClipboardEvent) => {
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
    };

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
  }, []);

  return (
    <div className="min-h-screen bg-bg-deep text-white overflow-hidden">
      {/* Header */}
      <header className="border-b border-terracotta/20 bg-bg-panel/80 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-black/20">
        <div className="max-w-[1800px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              size="icon"
              className="hover:bg-terracotta/10 transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2} />
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Crimson Pro', serif" }}>
                Canvas {id}
              </h1>
              <p className="text-sm text-text-secondary font-mono">Project Workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-terracotta/10 transition-all duration-300"
            >
              <Settings className="w-5 h-5" strokeWidth={2} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-terracotta/10 transition-all duration-300"
            >
              <Share2 className="w-5 h-5" strokeWidth={2} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-terracotta/10 transition-all duration-300"
            >
              <Download className="w-5 h-5" strokeWidth={2} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-red-500/20 text-red-400 transition-all duration-300"
            >
              <Trash2 className="w-5 h-5" strokeWidth={2} />
            </Button>
          </div>
        </div>
      </header>

      {/* Floating Toolbar */}
      <div className="fixed left-8 top-1/2 -translate-y-1/2 z-40">
        <div className="bg-bg-panel/90 backdrop-blur-xl border border-terracotta/20 rounded-2xl shadow-2xl shadow-black/40 p-3 space-y-2">
          <Button
            onClick={() => setPlacingObjectType(placingObjectType === "text" ? null : "text")}
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
            onClick={() => fileInputRef.current?.click()}
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
                onCheckedChange={setTilingMode}
                className="data-[state=checked]:bg-terracotta"
              />
            </div>
            <span className="text-[10px] text-text-secondary font-mono">TILE</span>
          </div>

          <div className="h-px bg-terracotta/20 my-2" />

          <Button
            onClick={deleteSelected}
            disabled={!selectedElement}
            variant="ghost"
            size="icon"
            className="w-12 h-12 hover:bg-red-500/20 text-red-400 disabled:opacity-30 transition-all duration-300 group"
            title="Delete (Del)"
          >
            <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2} />
          </Button>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="fixed right-8 bottom-8 z-40">
        <div className="bg-bg-panel/90 backdrop-blur-xl border border-terracotta/20 rounded-2xl shadow-2xl shadow-black/40 p-3 space-y-2">
          <Button
            onClick={zoomIn}
            variant="ghost"
            size="icon"
            className="w-12 h-12 hover:bg-terracotta/20 transition-all duration-300 group"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2} />
          </Button>

          <button
            onClick={resetZoom}
            className="w-12 h-12 flex items-center justify-center hover:bg-terracotta/20 rounded-lg transition-all duration-300 font-mono text-xs text-text-secondary hover:text-terracotta"
            title="Reset Zoom (0)"
          >
            {Math.round(viewport.zoom * 100)}%
          </button>

          <Button
            onClick={zoomOut}
            variant="ghost"
            size="icon"
            className="w-12 h-12 hover:bg-terracotta/20 transition-all duration-300 group"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2} />
          </Button>
        </div>
      </div>

      {/* Status Bar */}
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
              <span>{elements.length} objects</span>
            </div>
          </div>
        </div>
      </div>

      {/* Help Tooltip */}
      {elements.length === 0 && (
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
                <kbd className="px-2 py-1 bg-terracotta/10 rounded text-terracotta">Ctrl+V</kbd> Paste images from clipboard
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
      )}

      {/* Canvas Area */}
      <div
        ref={canvasRef}
        className={`fixed inset-0 top-[73px] select-none ${
          resizingElement
            ? ""
            : placingObjectType
              ? "cursor-crosshair"
              : "cursor-move"
        }`}
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(212, 132, 94, 0.15) 1px, transparent 1px),
            radial-gradient(circle, rgba(212, 132, 94, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: `${40 * viewport.zoom}px ${40 * viewport.zoom}px, ${10 * viewport.zoom}px ${10 * viewport.zoom}px`,
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
          cursor: resizingElement ? HANDLE_CONFIGS[resizingElement.corner].cursor : undefined,
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Render elements */}
        <div
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {elements.map((element) => (
            <ContextMenu key={element.id}>
              <ContextMenuTrigger asChild>
                <div
                  className={`absolute cursor-grab active:cursor-grabbing transition-shadow duration-200 ${
                    selectedElement === element.id
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
                  onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                  onDoubleClick={() => element.type === "text" && handleTextDoubleClick(element)}
                >
                  {element.type === "image" ? (
                    <>
                      <img
                        src={element.content}
                        alt="Canvas element"
                        className="w-full h-full object-cover rounded-lg"
                        draggable={false}
                      />
                      {/* Resize handles for selected images */}
                      {selectedElement === element.id && (
                        <>
                          {(["nw", "ne", "sw", "se"] as ResizeCorner[]).map((corner) => (
                            <div
                              key={corner}
                              className="absolute w-3 h-3 bg-terracotta rounded-full border-2 border-white
                                         shadow-md shadow-black/30 z-10
                                         transition-all duration-200 hover:scale-125 hover:bg-warm-orange"
                              style={{
                                cursor: HANDLE_CONFIGS[corner].cursor,
                                ...HANDLE_CONFIGS[corner].position,
                              }}
                              onMouseDown={(e) => handleResizeStart(e, element.id, corner)}
                            />
                          ))}
                        </>
                      )}
                    </>
                  ) : editingElementId === element.id ? (
                    <div className="w-full h-full bg-bg-panel/90 backdrop-blur-sm border-2 border-terracotta rounded-lg p-2">
                      <textarea
                        autoFocus
                        defaultValue={element.content === "Double-click to edit" ? "" : element.content}
                        className="w-full h-full bg-transparent text-white text-center resize-none outline-none"
                        style={{ fontFamily: "'Crimson Pro', serif", fontSize: "18px" }}
                        onBlur={(e) => handleTextEditSave(element.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleTextEditSave(element.id, e.currentTarget.value);
                          } else if (e.key === "Escape") {
                            handleTextEditCancel();
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-bg-panel/80 backdrop-blur-sm border-2 border-dashed border-terracotta/40 rounded-lg p-4">
                      <p
                        className="text-center break-words"
                        style={{ fontFamily: "'Crimson Pro', serif", fontSize: "18px" }}
                      >
                        {element.content}
                      </p>
                    </div>
                  )}
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="bg-bg-panel/90 backdrop-blur-xl border-terracotta/20">
                <ContextMenuItem
                  variant="destructive"
                  onClick={() => deleteElement(element.id)}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                  <ContextMenuShortcut>Del</ContextMenuShortcut>
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}

          {/* Preview element for placement mode */}
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
              <div className="w-full h-full flex items-center justify-center bg-bg-panel/80 backdrop-blur-sm border-2 border-dashed border-terracotta/40 rounded-lg p-4">
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
              <img
                src={pendingImage.url}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input for image upload */}
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
