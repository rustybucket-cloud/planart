import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { FileImage, Images, Plus, Grid3x3, LayoutGrid, Search, Trash2, Loader2 } from "lucide-react";
import { canvasApi } from "@/services/canvasApi";
import { referenceCollectionApi } from "@/services/referenceCollectionApi";
import type { CanvasSummary } from "@/types/canvas";
import type { ReferenceCollectionSummary } from "@/types/referenceCollection";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ViewMode = "grid" | "list";

type HomeItem =
  | { type: "canvas"; id: string; name: string; updatedAt: string; elementCount: number }
  | { type: "collection"; id: string; name: string; updatedAt: string; imageCount: number; thumbnailContent?: string };

function toHomeItems(canvases: CanvasSummary[], collections: ReferenceCollectionSummary[]): HomeItem[] {
  const items: HomeItem[] = [
    ...canvases.map((c): HomeItem => ({ type: "canvas", ...c })),
    ...collections.map((c): HomeItem => ({ type: "collection", ...c })),
  ];
  return items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

function getGradientByIndex(index: number): string {
  const gradients = [
    "from-terracotta via-warm-orange to-golden-earth",
    "from-warm-orange via-terracotta to-[#c97a54]",
    "from-[#e89863] via-terracotta to-warm-orange",
    "from-terracotta via-[#e89863] to-[#f0ac7b]",
    "from-terracotta to-warm-orange",
    "from-golden-earth via-warm-orange to-terracotta",
  ];
  return gradients[index % gradients.length];
}

export default function Home() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [canvases, setCanvases] = useState<CanvasSummary[]>([]);
  const [collections, setCollections] = useState<ReferenceCollectionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: "canvas" | "collection"; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  useEffect(() => {
    Promise.all([canvasApi.list(), referenceCollectionApi.list()])
      .then(([canvasData, collectionData]) => {
        setCanvases(canvasData);
        setCollections(collectionData);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleCreateCanvas = () => {
    setShowCreateMenu(false);
    navigate("/canvas/new");
  };

  const handleCreateCollection = () => {
    setShowCreateMenu(false);
    navigate("/collection/new");
  };

  const handleDeleteItem = (e: React.MouseEvent, id: string, type: "canvas" | "collection", name: string) => {
    e.stopPropagation();
    setItemToDelete({ id, type, name });
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      if (itemToDelete.type === "canvas") {
        await canvasApi.delete(itemToDelete.id);
        setCanvases((prev) => prev.filter((c) => c.id !== itemToDelete.id));
      } else {
        await referenceCollectionApi.delete(itemToDelete.id);
        setCollections((prev) => prev.filter((c) => c.id !== itemToDelete.id));
      }
      setItemToDelete(null);
    } catch (error) {
      console.error(`Failed to delete ${itemToDelete.type}:`, error);
      alert(`Failed to delete ${itemToDelete.type}. Try again.`);
    } finally {
      setIsDeleting(false);
    }
  };

  const allItems = toHomeItems(canvases, collections);
  const filteredItems = allItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = allItems.length;

  return (
    <div className="h-screen bg-bg-deep text-white relative overflow-hidden flex flex-col">
      {/* Decorative background elements */}
      <div className="fixed top-20 right-[-10%] w-96 h-96 bg-terracotta/10 rounded-full blur-[120px] animate-pulse" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-terracotta/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 max-w-[1800px] mx-auto w-full flex flex-col h-full">
        {/* Fixed Header Section */}
        <div className="flex-shrink-0 px-8 pt-12 pb-8">
          {/* Header */}
          <header className="animate-in fade-in slide-in-from-top-4 duration-700 fill-mode-backwards">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h1 className="text-7xl font-black tracking-tighter mb-2 bg-gradient-to-br from-white via-white to-gray-500 bg-clip-text text-transparent leading-[1.1]">
                Your Work
              </h1>
              <p className="text-gray-400 text-lg font-medium mt-1">
                {totalItems} item{totalItems !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowCreateMenu((v) => !v)}
                className="group relative px-8 py-4 bg-gradient-to-r from-terracotta to-warm-orange text-white font-bold text-lg rounded-xl hover:shadow-[0_0_30px_rgba(212,132,94,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative flex items-center gap-2">
                  <Plus className="w-6 h-6" strokeWidth={2.5} />
                  New
                </span>
              </button>

              {showCreateMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowCreateMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 bg-bg-panel/95 backdrop-blur-xl border border-terracotta/20 rounded-xl shadow-2xl shadow-black/40 overflow-hidden min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
                    <button
                      onClick={handleCreateCanvas}
                      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-terracotta/10 transition-colors text-left"
                    >
                      <FileImage className="w-5 h-5 text-terracotta" />
                      <span className="font-medium">New Canvas</span>
                    </button>
                    <div className="h-px bg-terracotta/10" />
                    <button
                      onClick={handleCreateCollection}
                      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-terracotta/10 transition-colors text-left"
                    >
                      <Images className="w-5 h-5 text-terracotta" />
                      <span className="font-medium">New Collection</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Search and filters */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary group-focus-within:text-terracotta transition-colors" strokeWidth={2} />
              <input
                type="text"
                placeholder="Search canvases and collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-bg-panel/60 border border-terracotta/20 rounded-xl text-white placeholder:text-text-secondary focus:outline-none focus:border-terracotta/50 focus:bg-bg-panel/80 backdrop-blur-sm transition-all duration-300"
              />
            </div>

            <div className="flex gap-2 bg-bg-panel/60 p-2 rounded-xl border border-terracotta/20">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-3 rounded-lg transition-all duration-300 ${
                  viewMode === "grid"
                    ? "bg-terracotta text-white shadow-lg"
                    : "text-text-secondary hover:text-white hover:bg-terracotta/20"
                }`}
              >
                <LayoutGrid className="w-5 h-5" strokeWidth={2} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-3 rounded-lg transition-all duration-300 ${
                  viewMode === "list"
                    ? "bg-terracotta text-white shadow-lg"
                    : "text-text-secondary hover:text-white hover:bg-terracotta/20"
                }`}
              >
                <Grid3x3 className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
          </div>
          </header>
        </div>

        {/* Scrollable Content Section */}
        <div className="flex-1 overflow-y-auto px-8 pb-12 relative">
          {/* Subtle fade indicator at top */}
          <div className="sticky top-0 left-0 right-0 h-4 bg-gradient-to-b from-bg-deep to-transparent pointer-events-none z-10" />

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && totalItems === 0 && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-terracotta to-warm-orange flex items-center justify-center mb-6">
              <FileImage className="w-12 h-12 text-white" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-bold mb-2">No work yet</h2>
            <p className="text-text-secondary mb-6">Create a canvas or reference collection to get started</p>
            <div className="flex gap-3">
              <button
                onClick={handleCreateCanvas}
                className="px-6 py-3 bg-gradient-to-r from-terracotta to-warm-orange text-white font-bold rounded-xl hover:shadow-[0_0_30px_rgba(212,132,94,0.4)] transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-5 h-5" strokeWidth={2.5} />
                  Create Canvas
                </span>
              </button>
              <button
                onClick={handleCreateCollection}
                className="px-6 py-3 border border-terracotta/30 text-white font-bold rounded-xl hover:bg-terracotta/10 hover:border-terracotta/50 transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  <Images className="w-5 h-5" strokeWidth={2} />
                  New Collection
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Items */}
        {!isLoading && filteredItems.length > 0 && (
          viewMode === "grid" ? (
            <ItemGrid items={filteredItems} onDelete={handleDeleteItem} />
          ) : (
            <ItemList items={filteredItems} onDelete={handleDeleteItem} />
          )
        )}
        </div>
      </div>

      <DeleteDialog
        item={itemToDelete}
        isDeleting={isDeleting}
        onCancel={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

// --- Unified Grid / List ---

function ItemGrid({
  items,
  onDelete,
}: {
  items: HomeItem[];
  onDelete: (e: React.MouseEvent, id: string, type: "canvas" | "collection", name: string) => void;
}) {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-backwards" style={{ animationDelay: '100ms' }}>
      {items.map((item, index) => (
        <div
          key={`${item.type}-${item.id}`}
          onClick={() => navigate(item.type === "canvas" ? `/canvas/${item.id}` : `/collection/${item.id}`)}
          className="group relative bg-bg-panel/60 backdrop-blur-sm border border-terracotta/20 rounded-2xl overflow-hidden hover:border-terracotta/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(212,132,94,0.15)] cursor-pointer animate-in fade-in zoom-in-50 fill-mode-backwards"
          style={{ animationDelay: `${200 + index * 80}ms` }}
        >
          <div className={`aspect-video relative overflow-hidden ${item.type === "collection" && item.thumbnailContent ? "bg-bg-deep" : `bg-gradient-to-br ${getGradientByIndex(index)}`}`}>
            {item.type === "collection" && item.thumbnailContent ? (
              <img src={item.thumbnailContent} alt="" className="w-full h-full object-cover" />
            ) : item.type === "collection" ? (
              <div className="w-full h-full flex items-center justify-center">
                <Images className="w-12 h-12 text-white/60" strokeWidth={1.5} />
              </div>
            ) : null}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-terracotta flex items-center justify-center shadow-lg">
                {item.type === "canvas" ? (
                  <FileImage className="w-8 h-8 text-white" strokeWidth={2} />
                ) : (
                  <Images className="w-8 h-8 text-white" strokeWidth={2} />
                )}
              </div>
            </div>
            {/* Type badge */}
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-xs font-medium text-white/80">
              {item.type === "canvas" ? (
                <FileImage className="w-3.5 h-3.5" strokeWidth={2} />
              ) : (
                <Images className="w-3.5 h-3.5" strokeWidth={2} />
              )}
              {item.type === "canvas" ? "Canvas" : "Collection"}
            </div>
            <button
              onClick={(e) => onDelete(e, item.id, item.type, item.name)}
              className="absolute top-2 right-2 z-10 p-2 bg-red-500/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4 text-white" strokeWidth={2} />
            </button>
          </div>
          <div className="p-5">
            <h3 className="text-lg font-bold mb-1 group-hover:text-terracotta transition-colors truncate">
              {item.name}
            </h3>
            <p className="text-sm text-text-secondary font-medium mb-1">
              {item.type === "canvas"
                ? `${item.elementCount} object${item.elementCount !== 1 ? "s" : ""}`
                : `${item.imageCount} image${item.imageCount !== 1 ? "s" : ""}`}
            </p>
            <p className="text-xs text-text-secondary font-mono">
              {formatRelativeTime(item.updatedAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ItemList({
  items,
  onDelete,
}: {
  items: HomeItem[];
  onDelete: (e: React.MouseEvent, id: string, type: "canvas" | "collection", name: string) => void;
}) {
  const navigate = useNavigate();
  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-backwards" style={{ animationDelay: '100ms' }}>
      {items.map((item, index) => (
        <div
          key={`${item.type}-${item.id}`}
          onClick={() => navigate(item.type === "canvas" ? `/canvas/${item.id}` : `/collection/${item.id}`)}
          className="group flex items-center gap-4 bg-bg-panel/60 backdrop-blur-sm border border-terracotta/20 rounded-xl p-4 hover:border-terracotta/50 transition-all duration-300 hover:bg-bg-panel/80 cursor-pointer animate-in fade-in slide-in-from-left-4 fill-mode-backwards"
          style={{ animationDelay: `${200 + index * 60}ms` }}
        >
          <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 relative">
            {item.type === "collection" && item.thumbnailContent ? (
              <img src={item.thumbnailContent} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${getGradientByIndex(index)} flex items-center justify-center`}>
                {item.type === "collection" && (
                  <Images className="w-6 h-6 text-white/60" strokeWidth={1.5} />
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-text-secondary flex-shrink-0">
            {item.type === "canvas" ? (
              <FileImage className="w-4 h-4" strokeWidth={2} />
            ) : (
              <Images className="w-4 h-4" strokeWidth={2} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold truncate group-hover:text-terracotta transition-colors">
              {item.name}
            </h3>
            <p className="text-sm text-text-secondary font-medium">
              {item.type === "canvas"
                ? `${item.elementCount} object${item.elementCount !== 1 ? "s" : ""}`
                : `${item.imageCount} image${item.imageCount !== 1 ? "s" : ""}`}
            </p>
          </div>
          <p className="text-sm text-text-secondary font-mono flex-shrink-0">
            {formatRelativeTime(item.updatedAt)}
          </p>
          <button
            onClick={(e) => onDelete(e, item.id, item.type, item.name)}
            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      ))}
    </div>
  );
}

// --- Delete Dialog ---

function DeleteDialog({
  item,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  item: { id: string; type: "canvas" | "collection"; name: string } | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={item !== null} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="bg-bg-panel border-terracotta/20 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this {item?.type}?</AlertDialogTitle>
          <AlertDialogDescription className="text-text-secondary">
            {item
              ? `"${item.name}" will be permanently deleted. This cannot be undone.`
              : "This action cannot be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border border-terracotta/30 bg-bg-deep/80 text-white hover:bg-terracotta/20 hover:text-white">
            Cancel
          </AlertDialogCancel>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
