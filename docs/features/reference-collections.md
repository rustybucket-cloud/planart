# Reference Collections Feature

## Overview

Reference collections allow users to organize reference images for artistic projects. Collections are standalone entities (not linked to canvases) and appear as a second section on the Home page below "Your Canvases."

## Adding Images

Images can be added to a collection via three methods:

- **File upload**: Uses Tauri native file dialog. Supports PNG, JPG, JPEG, GIF, WebP, SVG.
- **URL fetch**: Fetches an image from a URL via the Rust backend and stores it as base64.
- **Clipboard paste**: Paste images directly with Ctrl+V / Cmd+V from anywhere.

All images are stored as base64 data URIs for portable, offline access.

### Soft Limit

Collections have a soft limit of 100 images:
- A yellow warning appears at 90 images ("Approaching limit")
- A red warning appears at 100 images ("Collection limit reached")
- The Upload button is disabled at 100 images

## Image Grid

Images are displayed in a uniform (non-masonry) grid layout:
- Responsive columns: 2 → 3 → 4 → 5 based on viewport width
- Chronological order by add date (no drag-to-reorder)
- Hover effects: slight scale-up, overlay, delete button appears
- Metadata indicators: note icon and tag count badges on tiles

### Tag Filtering

A tag filter bar appears below the header when any images in the collection have tags:
- Displays all unique tags across images as clickable chips, sorted alphabetically
- Clicking a tag toggles it on/off. Active tags use terracotta highlight; inactive are subtle/ghost style
- Uses AND logic: when multiple tags are selected, only images with ALL selected tags are shown
- Shows "X of Y" count when a filter is active, plus a "Clear" button to reset
- If no images match the active filter, a "No images match" message appears with a clear option
- The lightbox navigates only the filtered image set when a filter is active
- Hidden entirely when no images have tags

## Lightbox

Clicking an image opens a full-screen lightbox dialog:

- **Navigation**: Prev/next arrow buttons + keyboard arrow keys
- **Metadata panel**: Toggle via button to view/edit notes and tags
- **Delete**: Delete current image from within the lightbox
- **Close**: X button or Escape key

## Image Metadata

Each image supports:
- **Note**: Free-text note (textarea)
- **Tags**: Lowercase tags, added by typing + Enter, removable with X

Metadata is edited in the lightbox metadata panel.

## Persistence

### Storage Location

Collections are stored as JSON files in the Tauri app data directory:
- macOS: `~/Library/Application Support/com.pattonja.planart/reference_collections/`
- Linux: `~/.local/share/com.pattonja.planart/reference_collections/`
- Windows: `C:\Users\<user>\AppData\Roaming\com.pattonja.planart\reference_collections\`

### Auto-save

- Changes are automatically saved 2 seconds after the last modification
- A save status indicator appears in the header (Saving... / Saved / Unsaved)

### Data Schema

Each collection is stored as a JSON file:

```json
{
  "id": "uuid",
  "name": "Collection Name",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp",
  "images": [
    {
      "id": "uuid",
      "content": "data:image/png;base64,...",
      "note": "optional note text",
      "tags": ["tag1", "tag2"],
      "addedAt": "ISO timestamp"
    }
  ]
}
```

## API Commands

The following Tauri commands are available:

- `create_reference_collection(name)` - Create a new collection
- `save_reference_collection(collection)` - Save collection data
- `load_reference_collection(id)` - Load a collection by ID
- `list_reference_collections()` - List all collections (summaries with thumbnail)
- `delete_reference_collection(id)` - Delete a collection
- `fetch_image_from_url(url)` - Download an image and return as base64 data URI

## Home Page Integration

The Home page shows both canvases and collections:
- "New" button opens a dropdown menu with "New Canvas" and "New Collection" options
- Search filters both canvases and collections
- Each section ("Your Canvases", "Your Collections") displays independently
- Collection cards show name, image count, last updated, and a thumbnail from the first image

## Related Files

- `src/pages/ReferenceCollection.tsx` - Main collection page UI
- `src/pages/Home.tsx` - Home page with collections section
- `src-tauri/src/lib.rs` - Rust backend commands
- `src/services/referenceCollectionApi.ts` - TypeScript API wrapper
- `src/types/referenceCollection.ts` - Shared type definitions
