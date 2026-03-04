import { useParams, useNavigate } from "react-router";
import { useState, useRef, useEffect, useCallback } from "react";
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

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      return {
        x: (screenX - viewport.x) / viewport.zoom,
        y: (screenY - viewport.y) / viewport.zoom,
      };
    },
    [viewport]
  );

  // Handle mouse wheel for zooming
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(5, viewport.zoom * delta));

        // Zoom towards mouse position
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
    },
    [viewport.zoom]
  );

  // Handle panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      // Middle mouse or Shift+Left mouse for panning
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isPanning) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        setViewport((prev) => ({
          ...prev,
          x: prev.x + dx,
          y: prev.y + dy,
        }));
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      } else if (draggedElement) {
        const dx = (e.clientX - lastMousePos.current.x) / viewport.zoom;
        const dy = (e.clientY - lastMousePos.current.y) / viewport.zoom;

        setElements((prev) =>
          prev.map((el) =>
            el.id === draggedElement
              ? { ...el, x: el.x + dx, y: el.y + dy }
              : el
          )
        );
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
    },
    [isPanning, draggedElement, viewport.zoom]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDraggedElement(null);
  }, []);

  // Handle paste from clipboard
  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
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
            const canvasPos = screenToCanvas(
              window.innerWidth / 2,
              window.innerHeight / 2
            );

            if (tilingMode) {
              // In tiling mode, create a grid of images
              const cols = 4;
              const rows = 3;
              const spacing = 10;

              for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                  const newElement: CanvasElement = {
                    id: `${Date.now()}-${row}-${col}`,
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
            } else {
              // Normal mode: add single image
              const newElement: CanvasElement = {
                id: Date.now().toString(),
                type: "image",
                x: canvasPos.x,
                y: canvasPos.y,
                width: img.width,
                height: img.height,
                content: url,
              };
              setElements((prev) => [...prev, newElement]);
            }
          };
        }
      }
    },
    [screenToCanvas, tilingMode]
  );

  // Add text element
  const addTextElement = () => {
    const canvasPos = screenToCanvas(
      window.innerWidth / 2,
      window.innerHeight / 2
    );

    const newElement: CanvasElement = {
      id: Date.now().toString(),
      type: "text",
      x: canvasPos.x,
      y: canvasPos.y,
      width: 200,
      height: 60,
      content: "Double-click to edit",
    };
    setElements((prev) => [...prev, newElement]);
  };

  // Delete selected element
  const deleteSelected = () => {
    if (selectedElement) {
      setElements((prev) => prev.filter((el) => el.id !== selectedElement));
      setSelectedElement(null);
    }
  };

  // Handle element drag start
  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    if (e.button === 0 && !e.shiftKey) {
      e.stopPropagation();
      setDraggedElement(elementId);
      setSelectedElement(elementId);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  // Handle text editing
  const handleTextDoubleClick = (elementId: string) => {
    const element = elements.find((el) => el.id === elementId);
    if (element && element.type === "text") {
      const newText = prompt("Edit text:", element.content);
      if (newText !== null) {
        setElements((prev) =>
          prev.map((el) =>
            el.id === elementId ? { ...el, content: newText } : el
          )
        );
      }
    }
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

  // Effects
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("paste", handlePaste);

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("paste", handlePaste);
    };
  }, [handleWheel, handleMouseMove, handleMouseUp, handlePaste]);

  return (
    <div className="min-h-screen bg-[#1a1d28] text-white overflow-hidden">
      {/* Header */}
      <header className="border-b border-[#d4845e]/20 bg-[#0f1117]/80 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-black/20">
        <div className="max-w-[1800px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              size="icon"
              className="hover:bg-[#d4845e]/10 transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2} />
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Crimson Pro', serif" }}>
                Canvas {id}
              </h1>
              <p className="text-sm text-[#8b8d98] font-mono">Project Workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-[#d4845e]/10 transition-all duration-300"
            >
              <Settings className="w-5 h-5" strokeWidth={2} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-[#d4845e]/10 transition-all duration-300"
            >
              <Share2 className="w-5 h-5" strokeWidth={2} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-[#d4845e]/10 transition-all duration-300"
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
        <div className="bg-[#0f1117]/90 backdrop-blur-xl border border-[#d4845e]/20 rounded-2xl shadow-2xl shadow-black/40 p-3 space-y-2">
          <Button
            onClick={addTextElement}
            variant="ghost"
            size="icon"
            className="w-12 h-12 hover:bg-[#d4845e]/20 transition-all duration-300 group"
            title="Add Text (T)"
          >
            <Type className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 hover:bg-[#d4845e]/20 transition-all duration-300 group"
            title="Add Image (Ctrl+V to paste)"
          >
            <ImageIcon className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2} />
          </Button>

          <div className="h-px bg-[#d4845e]/20 my-2" />

          <div className="flex flex-col items-center gap-2 py-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={tilingMode}
                onCheckedChange={setTilingMode}
                className="data-[state=checked]:bg-[#d4845e]"
              />
            </div>
            <span className="text-[10px] text-[#8b8d98] font-mono">TILE</span>
          </div>

          <div className="h-px bg-[#d4845e]/20 my-2" />

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
        <div className="bg-[#0f1117]/90 backdrop-blur-xl border border-[#d4845e]/20 rounded-2xl shadow-2xl shadow-black/40 p-3 space-y-2">
          <Button
            onClick={zoomIn}
            variant="ghost"
            size="icon"
            className="w-12 h-12 hover:bg-[#d4845e]/20 transition-all duration-300 group"
            title="Zoom In (Ctrl + Scroll)"
          >
            <ZoomIn className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2} />
          </Button>

          <button
            onClick={resetZoom}
            className="w-12 h-12 flex items-center justify-center hover:bg-[#d4845e]/20 rounded-lg transition-all duration-300 font-mono text-xs text-[#8b8d98] hover:text-[#d4845e]"
            title="Reset Zoom (1:1)"
          >
            {Math.round(viewport.zoom * 100)}%
          </button>

          <Button
            onClick={zoomOut}
            variant="ghost"
            size="icon"
            className="w-12 h-12 hover:bg-[#d4845e]/20 transition-all duration-300 group"
            title="Zoom Out (Ctrl + Scroll)"
          >
            <ZoomOut className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2} />
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="fixed left-8 bottom-8 z-40">
        <div className="bg-[#0f1117]/90 backdrop-blur-xl border border-[#d4845e]/20 rounded-xl shadow-2xl shadow-black/40 px-4 py-2">
          <div className="flex items-center gap-4 text-xs font-mono text-[#8b8d98]">
            <div className="flex items-center gap-2">
              <Move className="w-4 h-4" strokeWidth={2} />
              <span>X: {Math.round(viewport.x)}</span>
              <span>Y: {Math.round(viewport.y)}</span>
            </div>
            <div className="w-px h-4 bg-[#d4845e]/20" />
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
          <div className="bg-[#0f1117]/90 backdrop-blur-xl border border-[#d4845e]/20 rounded-2xl shadow-2xl shadow-black/40 p-8 text-center animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#d4845e] to-[#fb923c] flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-white" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Crimson Pro', serif" }}>
              Start Creating
            </h2>
            <div className="text-sm text-[#8b8d98] space-y-2 max-w-md">
              <p className="font-mono">
                <kbd className="px-2 py-1 bg-[#d4845e]/10 rounded text-[#d4845e]">Ctrl+V</kbd> Paste images from clipboard
              </p>
              <p className="font-mono">
                <kbd className="px-2 py-1 bg-[#d4845e]/10 rounded text-[#d4845e]">Scroll</kbd> Pan canvas
              </p>
              <p className="font-mono">
                <kbd className="px-2 py-1 bg-[#d4845e]/10 rounded text-[#d4845e]">Ctrl+Scroll</kbd> Zoom in/out
              </p>
              <p className="font-mono">
                <kbd className="px-2 py-1 bg-[#d4845e]/10 rounded text-[#d4845e]">Click+Drag</kbd> Move objects
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div
        ref={canvasRef}
        className="fixed inset-0 top-[73px] cursor-move select-none"
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(212, 132, 94, 0.15) 1px, transparent 1px),
            radial-gradient(circle, rgba(212, 132, 94, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: `${40 * viewport.zoom}px ${40 * viewport.zoom}px, ${10 * viewport.zoom}px ${10 * viewport.zoom}px`,
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
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
            <div
              key={element.id}
              className={`absolute cursor-grab active:cursor-grabbing transition-shadow duration-200 ${
                selectedElement === element.id
                  ? "ring-2 ring-[#d4845e] shadow-lg shadow-[#d4845e]/30"
                  : "hover:ring-2 hover:ring-[#d4845e]/50"
              }`}
              style={{
                left: element.x,
                top: element.y,
                width: element.width,
                height: element.height,
                transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
              }}
              onMouseDown={(e) => handleElementMouseDown(e, element.id)}
              onDoubleClick={() => element.type === "text" && handleTextDoubleClick(element.id)}
            >
              {element.type === "image" ? (
                <img
                  src={element.content}
                  alt="Canvas element"
                  className="w-full h-full object-cover rounded-lg"
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#0f1117]/80 backdrop-blur-sm border-2 border-dashed border-[#d4845e]/40 rounded-lg p-4">
                  <p
                    className="text-center break-words"
                    style={{ fontFamily: "'Crimson Pro', serif", fontSize: "18px" }}
                  >
                    {element.content}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
