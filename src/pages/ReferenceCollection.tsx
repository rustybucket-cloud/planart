import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Upload,
  Link,
  Plus,
  Minus,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  StickyNote,
  Tag,
  AlertTriangle,
  Check,
} from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import { referenceCollectionApi } from "@/services/referenceCollectionApi";
import {
  createNewCollectionStartedRef,
  pendingNewCollectionIdRef,
} from "./collectionNewRefState";
import type {
  ReferenceCollectionData,
  ReferenceImage,
} from "@/types/referenceCollection";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const IMAGE_SOFT_LIMIT = 100;
const MIN_COLUMNS = 2;
const MAX_COLUMNS = 8;
const DEFAULT_COLUMNS = 4;

export default function ReferenceCollection() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<ReferenceCollectionData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "saving" | "unsaved"
  >("saved");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [columnCount, setColumnCount] = useState(DEFAULT_COLUMNS);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load or create collection
  useEffect(() => {
    if (!id) return;

    if (id === "new") {
      if (createNewCollectionStartedRef.current) {
        if (pendingNewCollectionIdRef.current !== null) {
          navigate(`/collection/${pendingNewCollectionIdRef.current}`, {
            replace: true,
          });
        }
        setIsLoading(false);
        return;
      }
      createNewCollectionStartedRef.current = true;

      referenceCollectionApi
        .create("Untitled Collection")
        .then((newCollection) => {
          pendingNewCollectionIdRef.current = newCollection.id;
          navigate(`/collection/${newCollection.id}`, { replace: true });
        })
        .catch((err) => {
          console.error("Failed to create collection:", err);
          createNewCollectionStartedRef.current = false;
          pendingNewCollectionIdRef.current = null;
          navigate("/");
        });
      return;
    }

    createNewCollectionStartedRef.current = false;
    pendingNewCollectionIdRef.current = null;

    referenceCollectionApi
      .load(id)
      .then((data) => {
        setCollection(data);
        setNameValue(data.name);
      })
      .catch((err) => {
        console.error("Failed to load collection:", err);
        navigate("/");
      })
      .finally(() => setIsLoading(false));
  }, [id, navigate]);

  // Auto-save with debounce
  const scheduleAutoSave = useCallback(
    (updated: ReferenceCollectionData) => {
      setSaveStatus("unsaved");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        setSaveStatus("saving");
        try {
          const withTimestamp = {
            ...updated,
            updatedAt: new Date().toISOString(),
          };
          await referenceCollectionApi.save(withTimestamp);
          setCollection(withTimestamp);
          setSaveStatus("saved");
        } catch (err) {
          console.error("Failed to save collection:", err);
          setSaveStatus("unsaved");
        }
      }, 2000);
    },
    []
  );

  // Cleanup save timer
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const updateCollection = useCallback(
    (updater: (prev: ReferenceCollectionData) => ReferenceCollectionData) => {
      setCollection((prev) => {
        if (!prev) return prev;
        const updated = updater(prev);
        scheduleAutoSave(updated);
        return updated;
      });
    },
    [scheduleAutoSave]
  );

  const addImage = useCallback(
    (base64Content: string) => {
      const image: ReferenceImage = {
        id: crypto.randomUUID(),
        content: base64Content,
        tags: [],
        addedAt: new Date().toISOString(),
      };
      updateCollection((prev) => ({
        ...prev,
        images: [...prev.images, image],
      }));
    },
    [updateCollection]
  );

  // Handle file upload via Tauri dialog
  const handleUpload = useCallback(async () => {
    try {
      const filePath = await open({
        multiple: false,
        filters: [
          {
            name: "Images",
            extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg"],
          },
        ],
      });
      if (!filePath) return;

      const bytes = await readFile(filePath);
      const extension = filePath.split(".").pop()?.toLowerCase() ?? "png";
      const mimeMap: Record<string, string> = {
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        gif: "image/gif",
        webp: "image/webp",
        svg: "image/svg+xml",
      };
      const mime = mimeMap[extension] ?? "image/png";

      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      addImage(`data:${mime};base64,${base64}`);
    } catch (err) {
      console.error("Failed to upload image:", err);
    }
  }, [addImage]);

  // Handle URL fetch
  const handleUrlAdd = useCallback(async () => {
    if (!urlValue.trim()) return;
    setUrlLoading(true);
    setUrlError("");
    try {
      const base64 = await referenceCollectionApi.fetchImageFromUrl(
        urlValue.trim()
      );
      addImage(base64);
      setUrlValue("");
      setShowUrlInput(false);
    } catch (err) {
      setUrlError(
        err instanceof Error ? err.message : "Failed to fetch image"
      );
    } finally {
      setUrlLoading(false);
    }
  }, [urlValue, addImage]);

  // Handle paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!collection) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (!blob) continue;
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === "string") {
              addImage(reader.result);
            }
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [collection, addImage]);

  // Keyboard +/- to change column count
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      if (isInput) return;

      if (e.key === "=" || e.key === "+") {
        setColumnCount((prev) => Math.min(MAX_COLUMNS, prev + 1));
      } else if (e.key === "-" || e.key === "_") {
        setColumnCount((prev) => Math.max(MIN_COLUMNS, prev - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleDeleteImage = useCallback(
    (imageId: string) => {
      updateCollection((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img.id !== imageId),
      }));
    },
    [updateCollection]
  );

  // Keep lightbox index in bounds when images change (e.g. deletion)
  useEffect(() => {
    if (lightboxIndex === null || !collection) return;
    // We can't reference filteredImages here since it's derived after early returns,
    // but the effect runs after render, so we recalculate.
    const selTags = [...selectedTags];
    const filtered =
      selTags.length === 0
        ? collection.images
        : collection.images.filter((img) =>
            selTags.every((tag) => img.tags.includes(tag))
          );
    if (filtered.length === 0) {
      setLightboxIndex(null);
    } else if (lightboxIndex >= filtered.length) {
      setLightboxIndex(filtered.length - 1);
    }
  }, [collection, lightboxIndex, selectedTags]);

  const handleUpdateImageNote = useCallback(
    (imageId: string, note: string) => {
      updateCollection((prev) => ({
        ...prev,
        images: prev.images.map((img) =>
          img.id === imageId ? { ...img, note: note || undefined } : img
        ),
      }));
    },
    [updateCollection]
  );

  const handleAddTag = useCallback(
    (imageId: string, tag: string) => {
      const trimmed = tag.trim().toLowerCase();
      if (!trimmed) return;
      updateCollection((prev) => ({
        ...prev,
        images: prev.images.map((img) =>
          img.id === imageId && !img.tags.includes(trimmed)
            ? { ...img, tags: [...img.tags, trimmed] }
            : img
        ),
      }));
    },
    [updateCollection]
  );

  const handleRemoveTag = useCallback(
    (imageId: string, tag: string) => {
      updateCollection((prev) => ({
        ...prev,
        images: prev.images.map((img) =>
          img.id === imageId
            ? { ...img, tags: img.tags.filter((t) => t !== tag) }
            : img
        ),
      }));
    },
    [updateCollection]
  );

  const handleNameSubmit = useCallback(() => {
    setEditingName(false);
    if (!nameValue.trim() || !collection) return;
    if (nameValue.trim() === collection.name) return;
    updateCollection((prev) => ({ ...prev, name: nameValue.trim() }));
  }, [nameValue, collection, updateCollection]);

  if (isLoading) {
    return (
      <div className="h-screen bg-bg-deep flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
      </div>
    );
  }

  if (!collection) return null;

  const atLimit = collection.images.length >= IMAGE_SOFT_LIMIT;
  const nearLimit = collection.images.length >= IMAGE_SOFT_LIMIT - 10;

  // Derive all unique tags across images (sorted alphabetically)
  const allTags = [...new Set(collection.images.flatMap((img) => img.tags))].sort();

  // Clean up selectedTags if tags were removed from all images
  const activeSelectedTags = new Set(
    [...selectedTags].filter((tag) => allTags.includes(tag))
  );

  // Filter images by selected tags (AND logic: image must have ALL selected tags)
  const filteredImages =
    activeSelectedTags.size === 0
      ? collection.images
      : collection.images.filter((img) =>
          [...activeSelectedTags].every((tag) => img.tags.includes(tag))
        );

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const handleClearTagFilter = () => {
    setSelectedTags(new Set());
  };

  return (
    <div className="h-screen bg-bg-deep text-white flex flex-col overflow-hidden">
      <CollectionHeader
        name={collection.name}
        editingName={editingName}
        nameValue={nameValue}
        nameInputRef={nameInputRef}
        saveStatus={saveStatus}
        imageCount={collection.images.length}
        onBack={() => navigate("/")}
        onNameClick={() => {
          setEditingName(true);
          setNameValue(collection.name);
          setTimeout(() => nameInputRef.current?.select(), 0);
        }}
        onNameChange={setNameValue}
        onNameSubmit={handleNameSubmit}
        onUpload={handleUpload}
        onToggleUrl={() => setShowUrlInput((v) => !v)}
        atLimit={atLimit}
      />

      {showUrlInput && (
        <UrlInputBar
          value={urlValue}
          loading={urlLoading}
          error={urlError}
          onChange={setUrlValue}
          onSubmit={handleUrlAdd}
          onClose={() => {
            setShowUrlInput(false);
            setUrlError("");
          }}
        />
      )}

      {nearLimit && !atLimit && (
        <div className="px-8 py-2">
          <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-400/10 px-4 py-2 rounded-lg border border-yellow-400/20">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              Approaching limit: {collection.images.length}/{IMAGE_SOFT_LIMIT}{" "}
              images
            </span>
          </div>
        </div>
      )}

      {atLimit && (
        <div className="px-8 py-2">
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg border border-red-400/20">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              Collection limit reached ({IMAGE_SOFT_LIMIT} images). Remove
              images to add more.
            </span>
          </div>
        </div>
      )}

      <TagFilterBar
        allTags={allTags}
        selectedTags={activeSelectedTags}
        onToggleTag={handleToggleTag}
        onClear={handleClearTagFilter}
        filteredCount={filteredImages.length}
        totalCount={collection.images.length}
      />

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {collection.images.length === 0 ? (
          <EmptyState onUpload={handleUpload} />
        ) : filteredImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] animate-in fade-in duration-300">
            <p className="text-text-secondary text-sm">
              No images match the selected tags
            </p>
            <button
              onClick={handleClearTagFilter}
              className="mt-3 text-xs text-terracotta hover:text-terracotta/80 transition-colors"
            >
              Clear filter
            </button>
          </div>
        ) : (
          <>
            <ColumnControl
              columnCount={columnCount}
              onColumnCountChange={setColumnCount}
            />
            <ImageGrid
              images={filteredImages}
              columnCount={columnCount}
              onImageClick={(index) => setLightboxIndex(index)}
              onDeleteImage={handleDeleteImage}
            />
          </>
        )}
      </div>

      {lightboxIndex !== null && filteredImages[lightboxIndex] && (
        <Lightbox
          images={filteredImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
          onUpdateNote={handleUpdateImageNote}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          onDeleteImage={handleDeleteImage}
        />
      )}
    </div>
  );
}

// --- Header ---

function CollectionHeader({
  name,
  editingName,
  nameValue,
  nameInputRef,
  saveStatus,
  imageCount,
  onBack,
  onNameClick,
  onNameChange,
  onNameSubmit,
  onUpload,
  onToggleUrl,
  atLimit,
}: {
  name: string;
  editingName: boolean;
  nameValue: string;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  saveStatus: "saved" | "saving" | "unsaved";
  imageCount: number;
  onBack: () => void;
  onNameClick: () => void;
  onNameChange: (v: string) => void;
  onNameSubmit: () => void;
  onUpload: () => void;
  onToggleUrl: () => void;
  atLimit: boolean;
}) {
  return (
    <header className="flex-shrink-0 px-8 pt-6 pb-4 border-b border-terracotta/10">
      <div className="flex items-center justify-between max-w-[1800px] mx-auto w-full">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-terracotta/20 transition-colors duration-200"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>

          <div className="min-w-0">
            {editingName ? (
              <input
                ref={nameInputRef}
                value={nameValue}
                onChange={(e) => onNameChange(e.target.value)}
                onBlur={onNameSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onNameSubmit();
                  if (e.key === "Escape") onNameSubmit();
                }}
                className="text-2xl font-bold bg-transparent border-b-2 border-terracotta outline-none w-full max-w-md"
                style={{ fontFamily: "'Crimson Pro', serif" }}
              />
            ) : (
              <h1
                onClick={onNameClick}
                className="text-2xl font-bold truncate cursor-pointer hover:text-terracotta transition-colors"
                style={{ fontFamily: "'Crimson Pro', serif" }}
              >
                {name}
              </h1>
            )}
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-text-secondary">
                {imageCount} image{imageCount !== 1 ? "s" : ""}
              </span>
              <SaveStatusIndicator status={saveStatus} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!atLimit && <PasteHint />}
          <button
            onClick={onToggleUrl}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-terracotta/20 hover:border-terracotta/50 hover:bg-terracotta/10 transition-all duration-200 text-sm font-medium"
          >
            <Link className="w-4 h-4" />
            URL
          </button>
          <button
            onClick={onUpload}
            disabled={atLimit}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-terracotta to-warm-orange text-white font-medium text-sm rounded-lg hover:shadow-[0_0_20px_rgba(212,132,94,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
        </div>
      </div>
    </header>
  );
}

const isMac = navigator.platform.toUpperCase().includes("MAC");

function PasteHint() {
  return (
    <span className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-text-tertiary">
      <kbd className="px-1.5 py-0.5 bg-terracotta/10 rounded text-terracotta font-mono text-xs">
        {isMac ? "⌘" : "Ctrl"}+V
      </kbd>
      <span>to paste</span>
    </span>
  );
}

function SaveStatusIndicator({
  status,
}: {
  status: "saved" | "saving" | "unsaved";
}) {
  if (status === "saving") {
    return (
      <span className="text-xs text-text-tertiary flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        Saving...
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="text-xs text-text-tertiary flex items-center gap-1">
        <Check className="w-3 h-3" />
        Saved
      </span>
    );
  }
  return <span className="text-xs text-text-tertiary">Unsaved</span>;
}

// --- URL Input Bar ---

function UrlInputBar({
  value,
  loading,
  error,
  onChange,
  onSubmit,
  onClose,
}: {
  value: string;
  loading: boolean;
  error: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <div className="px-8 py-3 border-b border-terracotta/10 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-3 max-w-[1800px] mx-auto">
        <Link className="w-4 h-4 text-text-secondary flex-shrink-0" />
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
            if (e.key === "Escape") onClose();
          }}
          placeholder="Paste image URL..."
          className="flex-1 bg-bg-panel/60 border border-terracotta/20 rounded-lg px-4 py-2 text-sm text-white placeholder:text-text-secondary focus:outline-none focus:border-terracotta/50 transition-colors"
          autoFocus
        />
        <button
          onClick={onSubmit}
          disabled={loading || !value.trim()}
          className="px-4 py-2 bg-terracotta text-white text-sm font-medium rounded-lg hover:bg-terracotta/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Add
        </button>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-terracotta/20 transition-colors"
          aria-label="Close URL input"
        >
          <X className="w-4 h-4 text-text-secondary" />
        </button>
      </div>
      {error && (
        <p className="text-red-400 text-xs mt-2 max-w-[1800px] mx-auto">
          {error}
        </p>
      )}
    </div>
  );
}

// --- Empty State ---

// --- Tag Filter Bar ---

function TagFilterBar({
  allTags,
  selectedTags,
  onToggleTag,
  onClear,
  filteredCount,
  totalCount,
}: {
  allTags: string[];
  selectedTags: Set<string>;
  onToggleTag: (tag: string) => void;
  onClear: () => void;
  filteredCount: number;
  totalCount: number;
}) {
  if (allTags.length === 0) return null;

  const hasActiveFilter = selectedTags.size > 0;

  return (
    <div className="px-8 py-3 border-b border-terracotta/10 animate-in fade-in duration-200">
      <div className="flex items-center gap-3 max-w-[1800px] mx-auto">
        <Tag className="w-4 h-4 text-text-secondary flex-shrink-0" />

        <div className="flex-1 flex items-center gap-2 overflow-x-auto">
          {allTags.map((tag) => {
            const isActive = selectedTags.has(tag);
            return (
              <button
                key={tag}
                onClick={() => onToggleTag(tag)}
                className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${
                  isActive
                    ? "bg-terracotta/20 border-terracotta/50 text-terracotta"
                    : "bg-bg-panel/60 border-terracotta/20 text-text-secondary hover:border-terracotta/40 hover:text-text-primary"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {hasActiveFilter && (
          <div className="flex items-center gap-3 flex-shrink-0 animate-in fade-in duration-200">
            <span className="text-xs text-text-secondary font-mono">
              {filteredCount} of {totalCount}
            </span>
            <button
              onClick={onClear}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-text-secondary hover:text-white hover:bg-terracotta/20 transition-colors duration-200"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Column Control ---

function ColumnControl({
  columnCount,
  onColumnCountChange,
}: {
  columnCount: number;
  onColumnCountChange: (count: number) => void;
}) {
  const controlRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = controlRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        onColumnCountChange(Math.min(MAX_COLUMNS, columnCount + 1));
      } else if (e.deltaY > 0) {
        onColumnCountChange(Math.max(MIN_COLUMNS, columnCount - 1));
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [columnCount, onColumnCountChange]);

  return (
    <div className="flex justify-end mb-4">
      <div
        ref={controlRef}
        className="flex items-center gap-1 select-none"
      >
        <button
          onClick={() =>
            onColumnCountChange(Math.max(MIN_COLUMNS, columnCount - 1))
          }
          disabled={columnCount <= MIN_COLUMNS}
          className="p-1.5 rounded-lg hover:bg-terracotta/20 text-text-secondary hover:text-white transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Fewer columns"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-6 text-center text-xs font-mono text-text-secondary tabular-nums">
          {columnCount}
        </span>
        <button
          onClick={() =>
            onColumnCountChange(Math.min(MAX_COLUMNS, columnCount + 1))
          }
          disabled={columnCount >= MAX_COLUMNS}
          className="p-1.5 rounded-lg hover:bg-terracotta/20 text-text-secondary hover:text-white transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="More columns"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// --- Empty State ---

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] animate-in fade-in duration-500">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-terracotta to-warm-orange flex items-center justify-center mb-6">
        <Upload className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-xl font-bold mb-2">No reference images yet</h2>
      <p className="text-text-secondary mb-2 text-center max-w-sm">
        Upload images, paste from clipboard, or add from a URL
      </p>
      <p className="text-text-tertiary text-sm mb-6">
        Tip: You can paste images directly with Ctrl+V / Cmd+V
      </p>
      <button
        onClick={onUpload}
        className="px-6 py-3 bg-gradient-to-r from-terracotta to-warm-orange text-white font-bold rounded-xl hover:shadow-[0_0_30px_rgba(212,132,94,0.4)] transition-all duration-300"
      >
        <span className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Image
        </span>
      </button>
    </div>
  );
}

// --- Image Grid ---

function ImageGrid({
  images,
  columnCount,
  onImageClick,
  onDeleteImage,
}: {
  images: ReferenceImage[];
  columnCount: number;
  onImageClick: (index: number) => void;
  onDeleteImage: (id: string) => void;
}) {
  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
      }}
    >
      {images.map((image, index) => (
        <ImageTile
          key={image.id}
          image={image}
          index={index}
          onClick={() => onImageClick(index)}
          onDelete={() => onDeleteImage(image.id)}
        />
      ))}
    </div>
  );
}

function ImageTile({
  image,
  index,
  onClick,
  onDelete,
}: {
  image: ReferenceImage;
  index: number;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="group relative aspect-square bg-bg-panel/60 rounded-xl overflow-hidden border border-terracotta/10 hover:border-terracotta/40 transition-all duration-300 cursor-pointer hover:shadow-[0_0_30px_rgba(212,132,94,0.1)] animate-in fade-in zoom-in-95"
      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
      onClick={onClick}
    >
      <img
        src={image.content}
        alt={image.note || "Reference image"}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200" />

      {/* Metadata indicators */}
      {(image.note || image.tags.length > 0) && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
          {image.note && (
            <div className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm">
              <StickyNote className="w-3 h-3 text-white/80" />
            </div>
          )}
          {image.tags.length > 0 && (
            <div className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm flex items-center gap-1">
              <Tag className="w-3 h-3 text-white/80" />
              <span className="text-[10px] text-white/80 font-medium">
                {image.tags.length}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-2 right-2 p-1.5 bg-red-500/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        aria-label="Delete image"
      >
        <Trash2 className="w-3.5 h-3.5 text-white" />
      </button>
    </div>
  );
}

// --- Lightbox ---

function Lightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
  onUpdateNote,
  onAddTag,
  onRemoveTag,
  onDeleteImage,
}: {
  images: ReferenceImage[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onUpdateNote: (id: string, note: string) => void;
  onAddTag: (id: string, tag: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
  onDeleteImage: (id: string) => void;
}) {
  const image = images[currentIndex];
  const [showMetadata, setShowMetadata] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle navigation keys when typing in inputs
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && !isInput) {
        if (currentIndex > 0) onNavigate(currentIndex - 1);
      } else if (e.key === "ArrowRight" && !isInput) {
        if (currentIndex < images.length - 1) onNavigate(currentIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, images.length, onClose, onNavigate]);

  if (!image) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] bg-bg-panel/95 backdrop-blur-xl border-terracotta/20 p-0 flex flex-col overflow-hidden sm:max-w-[95vw]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Image viewer</DialogTitle>
          <DialogDescription>
            Viewing image {currentIndex + 1} of {images.length}
          </DialogDescription>
        </DialogHeader>

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-terracotta/10 flex-shrink-0">
          <span className="text-sm text-text-secondary font-mono">
            {currentIndex + 1} / {images.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMetadata((v) => !v)}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                showMetadata
                  ? "bg-terracotta/20 text-terracotta"
                  : "hover:bg-terracotta/10 text-text-secondary"
              }`}
              aria-label="Toggle metadata panel"
            >
              <StickyNote className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onDeleteImage(image.id);
              }}
              className="p-2 rounded-lg hover:bg-red-500/20 text-text-secondary hover:text-red-400 transition-colors duration-200"
              aria-label="Delete image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-terracotta/20 text-text-secondary hover:text-white transition-colors duration-200"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Image area */}
          <div className="flex-1 relative flex items-center justify-center p-6 min-w-0">
            {/* Prev arrow */}
            {currentIndex > 0 && (
              <button
                onClick={() => onNavigate(currentIndex - 1)}
                className="absolute left-4 z-10 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors duration-200 backdrop-blur-sm"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <img
              src={image.content}
              alt={image.note || "Reference image"}
              className="max-w-full max-h-full object-contain rounded-lg"
            />

            {/* Next arrow */}
            {currentIndex < images.length - 1 && (
              <button
                onClick={() => onNavigate(currentIndex + 1)}
                className="absolute right-4 z-10 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors duration-200 backdrop-blur-sm"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Metadata panel */}
          {showMetadata && (
            <MetadataPanel
              key={image.id}
              image={image}
              onUpdateNote={onUpdateNote}
              onAddTag={onAddTag}
              onRemoveTag={onRemoveTag}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Metadata Panel ---

function MetadataPanel({
  image,
  onUpdateNote,
  onAddTag,
  onRemoveTag,
}: {
  image: ReferenceImage;
  onUpdateNote: (id: string, note: string) => void;
  onAddTag: (id: string, tag: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
}) {
  const [tagInput, setTagInput] = useState("");
  return (
    <div className="w-80 flex-shrink-0 border-l border-terracotta/10 p-5 overflow-y-auto animate-in slide-in-from-right-4 duration-200">
      <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">
        Details
      </h3>

      {/* Note */}
      <div className="mb-6">
        <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
          <StickyNote className="w-3.5 h-3.5" />
          Note
        </label>
        <textarea
          value={image.note ?? ""}
          onChange={(e) => onUpdateNote(image.id, e.target.value)}
          placeholder="Add a note..."
          className="w-full bg-bg-deep/60 border border-terracotta/20 rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-tertiary focus:outline-none focus:border-terracotta/50 transition-colors resize-none min-h-[80px]"
          rows={3}
        />
      </div>

      {/* Tags */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
          <Tag className="w-3.5 h-3.5" />
          Tags
        </label>

        {image.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {image.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-terracotta/15 text-terracotta text-xs font-medium rounded-full"
              >
                {tag}
                <button
                  onClick={() => onRemoveTag(image.id, tag)}
                  className="hover:text-red-400 transition-colors"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && tagInput.trim()) {
              onAddTag(image.id, tagInput);
              setTagInput("");
            }
          }}
          placeholder="Add tag, press Enter"
          className="w-full bg-bg-deep/60 border border-terracotta/20 rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-tertiary focus:outline-none focus:border-terracotta/50 transition-colors"
        />
      </div>

      {/* Added date */}
      <div className="mt-6 pt-4 border-t border-terracotta/10">
        <p className="text-xs text-text-tertiary font-mono">
          Added {new Date(image.addedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
