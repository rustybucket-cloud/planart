import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Plus, Grid3x3, LayoutGrid, Trash2, FileImage, Images, FolderOpen, Loader2, Pencil, Check, X, Search, PackagePlus, MoreHorizontal } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { projectApi } from "@/services/projectApi";
import { canvasApi } from "@/services/canvasApi";
import { referenceCollectionApi } from "@/services/referenceCollectionApi";
import type { ProjectData } from "@/types/project";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ViewMode = "grid" | "list";

type ProjectItemResolved =
  | { type: "canvas"; id: string; name: string; updatedAt: string; elementCount: number }
  | { type: "collection"; id: string; name: string; updatedAt: string; imageCount: number; thumbnailContent?: string };

export default function Project() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [resolvedItems, setResolvedItems] = useState<ProjectItemResolved[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ type: "project" | "item" | "delete-item"; id: string; name: string; itemType?: "canvas" | "collection" } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddExisting, setShowAddExisting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const loadProject = useCallback(async (projectId: string) => {
    try {
      const data = await projectApi.load(projectId);
      setProject(data);
      setEditName(data.name);
      await resolveItems(data);
    } catch (error) {
      console.error("Failed to load project:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    loadProject(id);
  }, [id, loadProject]);

  const resolveItems = async (data: ProjectData) => {
    const [allCanvases, allCollections] = await Promise.all([
      canvasApi.list(),
      referenceCollectionApi.list(),
    ]);

    const canvasMap = new Map(allCanvases.map((c) => [c.id, c]));
    const collectionMap = new Map(allCollections.map((c) => [c.id, c]));

    const resolved: ProjectItemResolved[] = [];
    for (const item of data.items) {
      if (item.type === "canvas") {
        const canvas = canvasMap.get(item.id);
        if (canvas) resolved.push({ type: "canvas", ...canvas });
      } else {
        const collection = collectionMap.get(item.id);
        if (collection) resolved.push({ type: "collection", ...collection });
      }
    }
    setResolvedItems(resolved);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setTimeout(() => nameInputRef.current?.select(), 0);
  };

  const handleSaveName = async () => {
    if (!project || !editName.trim()) return;
    const updated = { ...project, name: editName.trim(), updatedAt: new Date().toISOString() };
    await projectApi.save(updated);
    setProject(updated);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(project?.name ?? "");
    setIsEditing(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSaveName();
    if (e.key === "Escape") handleCancelEdit();
  };

  const handleCreateCanvas = async () => {
    if (!project) return;
    setShowCreateMenu(false);
    try {
      const canvas = await canvasApi.create("Untitled Canvas");
      const updated: ProjectData = {
        ...project,
        items: [...project.items, { id: canvas.id, type: "canvas" }],
        updatedAt: new Date().toISOString(),
      };
      await projectApi.save(updated);
      navigate(`/canvas/${canvas.id}`);
    } catch (error) {
      console.error("Failed to create canvas:", error);
    }
  };

  const handleCreateCollection = async () => {
    if (!project) return;
    setShowCreateMenu(false);
    try {
      const collection = await referenceCollectionApi.create("Untitled Collection");
      const updated: ProjectData = {
        ...project,
        items: [...project.items, { id: collection.id, type: "collection" }],
        updatedAt: new Date().toISOString(),
      };
      await projectApi.save(updated);
      navigate(`/collection/${collection.id}`);
    } catch (error) {
      console.error("Failed to create collection:", error);
    }
  };

  const handleRemoveItem = (e: React.MouseEvent, itemId: string, name: string, itemType: "canvas" | "collection") => {
    e.stopPropagation();
    setDeleteTarget({ type: "item", id: itemId, name, itemType });
  };

  const handleDeleteItem = (e: React.MouseEvent, itemId: string, name: string, itemType: "canvas" | "collection") => {
    e.stopPropagation();
    setDeleteTarget({ type: "delete-item", id: itemId, name, itemType });
  };

  const handleDeleteProject = () => {
    if (!project) return;
    setDeleteTarget({ type: "project", id: project.id, name: project.name });
  };

  const handleAddExisting = async (items: Array<{ id: string; type: "canvas" | "collection" }>) => {
    if (!project || items.length === 0) return;
    const updated: ProjectData = {
      ...project,
      items: [...project.items, ...items.map(({ id, type }) => ({ id, type }))],
      updatedAt: new Date().toISOString(),
    };
    await projectApi.save(updated);
    setProject(updated);
    await resolveItems(updated);
    setShowAddExisting(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !project) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === "project") {
        await projectApi.delete(project.id);
        navigate("/");
      } else if (deleteTarget.type === "delete-item") {
        // Permanently delete the item
        if (deleteTarget.itemType === "canvas") {
          await canvasApi.delete(deleteTarget.id);
        } else {
          await referenceCollectionApi.delete(deleteTarget.id);
        }
        // Also remove from project
        const updated: ProjectData = {
          ...project,
          items: project.items.filter((i) => i.id !== deleteTarget.id),
          updatedAt: new Date().toISOString(),
        };
        await projectApi.save(updated);
        setProject(updated);
        setResolvedItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        // Remove from project only
        const updated: ProjectData = {
          ...project,
          items: project.items.filter((i) => i.id !== deleteTarget.id),
          updatedAt: new Date().toISOString(),
        };
        await projectApi.save(updated);
        setProject(updated);
        setResolvedItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredItems = resolvedItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="h-screen bg-bg-deep text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen bg-bg-deep text-white flex flex-col items-center justify-center gap-4">
        <FolderOpen className="w-16 h-16 text-text-secondary" strokeWidth={1.5} />
        <p className="text-text-secondary text-lg">Project not found</p>
        <button onClick={() => navigate("/")} className="text-terracotta hover:underline font-medium">
          Back to home
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-bg-deep text-white relative overflow-hidden flex flex-col">
      {/* Decorative background elements */}
      <div className="fixed top-20 right-[-10%] w-96 h-96 bg-terracotta/10 rounded-full blur-[120px] animate-pulse" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-terracotta/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 max-w-[1800px] mx-auto w-full flex flex-col h-full">
        {/* Fixed Header Section */}
        <div className="flex-shrink-0 px-8 pt-12 pb-8">
          <header className="animate-in fade-in slide-in-from-top-4 duration-700 fill-mode-backwards">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-text-secondary hover:text-white transition-colors mb-6 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" strokeWidth={2.5} />
              <span className="font-bold">Back to home</span>
            </button>

            <div className="flex items-end justify-between mb-6">
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex items-center gap-3">
                    <input
                      ref={nameInputRef}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={handleNameKeyDown}
                      className="text-5xl font-black tracking-tighter bg-transparent border-b-2 border-terracotta outline-none text-white w-full max-w-[600px]"
                    />
                    <button onClick={handleSaveName} className="p-2 hover:bg-terracotta/20 rounded-lg transition-colors">
                      <Check className="w-6 h-6 text-terracotta" strokeWidth={2.5} />
                    </button>
                    <button onClick={handleCancelEdit} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors">
                      <X className="w-6 h-6 text-text-secondary" strokeWidth={2.5} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 group/name">
                    <h1 className="text-7xl font-black tracking-tighter bg-gradient-to-br from-white via-white to-gray-500 bg-clip-text text-transparent leading-[1.1] truncate">
                      {project.name}
                    </h1>
                    <button
                      onClick={handleStartEdit}
                      className="p-2 hover:bg-terracotta/20 rounded-lg transition-all opacity-0 group-hover/name:opacity-100"
                    >
                      <Pencil className="w-5 h-5 text-text-secondary" strokeWidth={2} />
                    </button>
                  </div>
                )}
                <p className="text-gray-400 text-lg font-medium mt-1">
                  {resolvedItems.length} item{resolvedItems.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleDeleteProject}
                  className="p-2.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                >
                  <Trash2 className="w-4.5 h-4.5" strokeWidth={2} />
                </button>

                <div className="relative">
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setShowCreateMenu((v) => !v)}
                          aria-label="Add to project"
                          className="group relative p-2.5 bg-gradient-to-r from-terracotta to-warm-orange text-white rounded-xl hover:shadow-[0_0_20px_rgba(212,132,94,0.3)] transition-all duration-300 active:scale-95 overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                          <Plus className="relative w-5 h-5" strokeWidth={2.5} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={8}>
                        Add to project
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

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
                        <div className="h-px bg-terracotta/10" />
                        <button
                          onClick={() => { setShowCreateMenu(false); setShowAddExisting(true); }}
                          className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-terracotta/10 transition-colors text-left"
                        >
                          <PackagePlus className="w-5 h-5 text-terracotta" />
                          <span className="font-medium">Add Existing...</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Search and view controls */}
            {resolvedItems.length > 0 && (
              <div className="flex gap-4 items-center">
                <div className="flex-1 relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary group-focus-within:text-terracotta transition-colors" strokeWidth={2} />
                  <input
                    type="text"
                    placeholder="Search items in this project..."
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
            )}
          </header>
        </div>

        {/* Scrollable Content Section */}
        <div className="flex-1 overflow-y-auto px-8 pb-12 relative">
          <div className="sticky top-0 left-0 right-0 h-4 bg-gradient-to-b from-bg-deep to-transparent pointer-events-none z-10" />

          {/* Empty State */}
          {resolvedItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-terracotta to-warm-orange flex items-center justify-center mb-6">
                <FolderOpen className="w-12 h-12 text-white" strokeWidth={2} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Empty project</h2>
              <p className="text-text-secondary mb-6">Add a canvas or collection to get started</p>
              <div className="flex gap-3">
                <button
                  onClick={handleCreateCanvas}
                  className="px-6 py-3 bg-gradient-to-r from-terracotta to-warm-orange text-white font-bold rounded-xl hover:shadow-[0_0_30px_rgba(212,132,94,0.4)] transition-all duration-300"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="w-5 h-5" strokeWidth={2.5} />
                    New Canvas
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
                <button
                  onClick={() => setShowAddExisting(true)}
                  className="px-6 py-3 border border-terracotta/30 text-white font-bold rounded-xl hover:bg-terracotta/10 hover:border-terracotta/50 transition-all duration-300"
                >
                  <span className="flex items-center gap-2">
                    <PackagePlus className="w-5 h-5" strokeWidth={2} />
                    Add Existing
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Items Grid/List */}
          {filteredItems.length > 0 && (
            viewMode === "grid" ? (
              <ProjectItemGrid items={filteredItems} onRemove={handleRemoveItem} onDelete={handleDeleteItem} />
            ) : (
              <ProjectItemList items={filteredItems} onRemove={handleRemoveItem} onDelete={handleDeleteItem} />
            )
          )}
        </div>
      </div>

      <ProjectDeleteDialog
        target={deleteTarget}
        isDeleting={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      {project && (
        <AddExistingDialog
          open={showAddExisting}
          onOpenChange={setShowAddExisting}
          projectItems={project.items}
          onAdd={handleAddExisting}
        />
      )}
    </div>
  );
}

// --- Grid / List views ---

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

function getItemSubtext(item: ProjectItemResolved): string {
  if (item.type === "canvas") return `${item.elementCount} object${item.elementCount !== 1 ? "s" : ""}`;
  return `${item.imageCount} image${item.imageCount !== 1 ? "s" : ""}`;
}

function ProjectItemGrid({
  items,
  onRemove,
  onDelete,
}: {
  items: ProjectItemResolved[];
  onRemove: (e: React.MouseEvent, id: string, name: string, itemType: "canvas" | "collection") => void;
  onDelete: (e: React.MouseEvent, id: string, name: string, itemType: "canvas" | "collection") => void;
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
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-xs font-medium text-white/80">
              {item.type === "canvas" ? (
                <FileImage className="w-3.5 h-3.5" strokeWidth={2} />
              ) : (
                <Images className="w-3.5 h-3.5" strokeWidth={2} />
              )}
              {item.type === "canvas" ? "Canvas" : "Collection"}
            </div>
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <ItemDropdownMenu item={item} onRemove={onRemove} onDelete={onDelete} />
            </div>
          </div>
          <div className="p-5">
            <h3 className="text-lg font-bold mb-1 group-hover:text-terracotta transition-colors truncate">
              {item.name}
            </h3>
            <p className="text-sm text-text-secondary font-medium mb-1">
              {getItemSubtext(item)}
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

function ProjectItemList({
  items,
  onRemove,
  onDelete,
}: {
  items: ProjectItemResolved[];
  onRemove: (e: React.MouseEvent, id: string, name: string, itemType: "canvas" | "collection") => void;
  onDelete: (e: React.MouseEvent, id: string, name: string, itemType: "canvas" | "collection") => void;
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
              {getItemSubtext(item)}
            </p>
          </div>
          <p className="text-sm text-text-secondary font-mono flex-shrink-0">
            {formatRelativeTime(item.updatedAt)}
          </p>
          <div className="opacity-0 group-hover:opacity-100 transition-all">
            <ItemDropdownMenu item={item} onRemove={onRemove} onDelete={onDelete} />
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Item Dropdown Menu ---

function ItemDropdownMenu({
  item,
  onRemove,
  onDelete,
}: {
  item: ProjectItemResolved;
  onRemove: (e: React.MouseEvent, id: string, name: string, itemType: "canvas" | "collection") => void;
  onDelete: (e: React.MouseEvent, id: string, name: string, itemType: "canvas" | "collection") => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="p-2 rounded-lg hover:bg-terracotta/20 transition-colors"
          aria-label="Item options"
        >
          <MoreHorizontal className="w-4 h-4 text-white" strokeWidth={2} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-bg-panel/95 backdrop-blur-xl border-terracotta/20 shadow-2xl shadow-black/40 min-w-[180px]"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem
          onClick={(e) => onRemove(e as unknown as React.MouseEvent, item.id, item.name, item.type)}
          className="text-white focus:bg-terracotta/10 focus:text-white cursor-pointer"
        >
          <X className="w-4 h-4 mr-2" strokeWidth={2} />
          Remove from project
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => onDelete(e as unknown as React.MouseEvent, item.id, item.name, item.type)}
          className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
        >
          <Trash2 className="w-4 h-4 mr-2" strokeWidth={2} />
          Delete {item.type === "canvas" ? "canvas" : "collection"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// --- Delete / Remove Dialog ---

function ProjectDeleteDialog({
  target,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  target: { type: "project" | "item" | "delete-item"; id: string; name: string; itemType?: "canvas" | "collection" } | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isProject = target?.type === "project";
  const isDeleteItem = target?.type === "delete-item";
  const itemTypeLabel = target?.itemType === "canvas" ? "canvas" : "collection";

  const title = isProject
    ? "Delete this project?"
    : isDeleteItem
      ? `Delete this ${itemTypeLabel}?`
      : "Remove from project?";

  const description = isProject
    ? `"${target?.name}" will be permanently deleted. Items inside this project will not be deleted.`
    : isDeleteItem
      ? `"${target?.name}" will be permanently deleted. This cannot be undone.`
      : `"${target?.name}" will be removed from this project. The ${itemTypeLabel} itself will not be deleted.`;

  const isDestructive = isProject || isDeleteItem;
  const confirmLabel = isProject || isDeleteItem ? "Delete" : "Remove";
  const loadingLabel = isProject || isDeleteItem ? "Deleting..." : "Removing...";

  return (
    <AlertDialog open={target !== null} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="bg-bg-panel border-terracotta/20 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-text-secondary">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border border-terracotta/30 bg-bg-deep/80 text-white hover:bg-terracotta/20 hover:text-white">
            Cancel
          </AlertDialogCancel>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className={isDestructive ? "bg-red-600 text-white hover:bg-red-700" : "bg-terracotta text-white hover:bg-terracotta/80"}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {loadingLabel}
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// --- Add Existing Items Dialog ---

type AvailableItem =
  | { type: "canvas"; id: string; name: string; updatedAt: string; detail: string }
  | { type: "collection"; id: string; name: string; updatedAt: string; detail: string };

function AddExistingDialog({
  open,
  onOpenChange,
  projectItems,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectItems: Array<{ id: string; type: string }>;
  onAdd: (items: Array<{ id: string; type: "canvas" | "collection" }>) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [available, setAvailable] = useState<AvailableItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setSelected(new Set());
    setIsLoading(true);

    const existingIds = new Set(projectItems.map((i) => i.id));
    Promise.all([canvasApi.list(), referenceCollectionApi.list()])
      .then(([canvases, collections]) => {
        const items: AvailableItem[] = [
          ...canvases
            .filter((c) => !existingIds.has(c.id))
            .map((c): AvailableItem => ({
              type: "canvas",
              id: c.id,
              name: c.name,
              updatedAt: c.updatedAt,
              detail: `${c.elementCount} object${c.elementCount !== 1 ? "s" : ""}`,
            })),
          ...collections
            .filter((c) => !existingIds.has(c.id))
            .map((c): AvailableItem => ({
              type: "collection",
              id: c.id,
              name: c.name,
              updatedAt: c.updatedAt,
              detail: `${c.imageCount} image${c.imageCount !== 1 ? "s" : ""}`,
            })),
        ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setAvailable(items);
      })
      .catch((error) => {
        console.error("Failed to load available items:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [open, projectItems]);

  const toggleItem = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    const items = available
      .filter((i) => selected.has(i.id))
      .map(({ id, type }) => ({ id, type }));
    setIsSaving(true);
    try {
      await onAdd(items);
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = available.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="bg-bg-panel border-terracotta/20 text-white sm:max-w-lg p-0 gap-0 overflow-hidden"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          searchInputRef.current?.focus();
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-xl font-bold">Add existing items</DialogTitle>
          <DialogDescription className="text-text-secondary text-sm">
            Select canvases and collections to add to this project.
          </DialogDescription>
        </DialogHeader>

        {/* Search input */}
        <div className="px-6 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
            <input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full pl-10 pr-4 py-2.5 bg-bg-deep/80 border border-terracotta/20 rounded-lg text-white placeholder:text-text-secondary focus:outline-none focus:border-terracotta/50 transition-colors text-sm"
            />
          </div>
        </div>

        {/* Item list */}
        <div className="px-6 py-4 max-h-[320px] min-h-[200px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-terracotta" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
              {available.length === 0 ? (
                <>
                  <PackagePlus className="w-10 h-10 mb-3 opacity-40" />
                  <p className="text-sm font-medium">No items available</p>
                  <p className="text-xs mt-1">All canvases and collections are already in this project.</p>
                </>
              ) : (
                <>
                  <Search className="w-10 h-10 mb-3 opacity-40" />
                  <p className="text-sm font-medium">No matches for &ldquo;{search}&rdquo;</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((item) => {
                const isSelected = selected.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left ${
                      isSelected
                        ? "bg-terracotta/15 border border-terracotta/40"
                        : "hover:bg-bg-deep/60 border border-transparent"
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all duration-200 ${
                        isSelected
                          ? "bg-terracotta border-terracotta"
                          : "border-text-secondary/40"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>

                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {item.type === "canvas" ? (
                        <FileImage className="w-4 h-4 text-terracotta" strokeWidth={2} />
                      ) : (
                        <Images className="w-4 h-4 text-terracotta" strokeWidth={2} />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-text-secondary">{item.detail}</p>
                    </div>

                    {/* Type badge */}
                    <span className="text-xs text-text-secondary font-medium flex-shrink-0">
                      {item.type === "canvas" ? "Canvas" : "Collection"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-terracotta/10">
          <p className="text-xs text-text-secondary">
            {selected.size > 0
              ? `${selected.size} item${selected.size !== 1 ? "s" : ""} selected`
              : "No items selected"}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-terracotta/30 bg-bg-deep/80 text-white hover:bg-terracotta/20 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selected.size === 0 || isSaving}
              className="bg-terracotta text-white hover:bg-terracotta/80 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                `Add ${selected.size > 0 ? selected.size : ""} item${selected.size !== 1 ? "s" : ""}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
