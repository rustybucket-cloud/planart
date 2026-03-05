# Canvas Feature

## Overview

The canvas is the main workspace where users create visual compositions with images and text.

## Persistence

Canvases are automatically saved to local storage using Tauri's file system API.

### Storage Location

Canvases are stored as JSON files in the Tauri app data directory:
- macOS: `~/Library/Application Support/com.pattonja.planart/canvases/`
- Linux: `~/.local/share/com.pattonja.planart/canvases/`
- Windows: `C:\Users\<user>\AppData\Roaming\com.pattonja.planart\canvases\`

### Auto-save

- Changes are automatically saved 2 seconds after the last modification
- A save status indicator appears in the header (Saving... / Saved)
- Images are converted to base64 for portable storage

### Data Schema

Each canvas is stored as a JSON file with the following structure:

```json
{
  "id": "uuid",
  "name": "Canvas Name",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp",
  "viewport": {
    "x": 0,
    "y": 0,
    "zoom": 1
  },
  "elements": [
    {
      "id": "uuid",
      "type": "image | text",
      "x": 100,
      "y": 200,
      "width": 300,
      "height": 400,
      "content": "base64 data or text",
      "rotation": 0
    }
  ]
}
```

## API Commands

The following Tauri commands are available:

- `create_canvas(name)` - Create a new canvas
- `save_canvas(canvas)` - Save canvas data
- `load_canvas(id)` - Load a canvas by ID
- `list_canvases()` - List all canvases
- `delete_canvas(id)` - Delete a canvas

## Tiling Mode

When tiling mode is enabled via the toolbar toggle:

- **Image placement**: New images are automatically placed adjacent to the selected element based on mouse direction (using `calculateAdjacentPosition`).
- **Snap-on-drag**: Dragging an element snaps it to nearby elements' edges. Snapping occurs on both axes independently with a 15px threshold and 10px spacing gap. Snap targets include:
  - Adjacent edges (left/right/top/bottom with spacing)
  - Aligned edges (matching left-to-left, top-to-top, etc.)

## Box Select (Multi-Selection)

When no placement tool is active, left-clicking and dragging on empty canvas space draws a selection rectangle:

- **Visual feedback**: A semi-transparent terracotta-tinted rectangle is drawn during the drag.
- **Selection**: On mouse-up, all elements that overlap the selection rectangle become selected (highlighted with the terracotta ring).
- **Single vs multi**: If only one element is captured, it becomes the single selected element. If multiple are captured, they enter multi-selection mode.
- **Multi-select drag**: Clicking and dragging any element within a multi-selection moves all selected elements together.
- **Delete**: Pressing Delete/Backspace removes all selected elements at once.
- **Deselect**: Clicking on empty space or pressing Escape clears the selection.
- **Tiling mode**: Tiling snap is only applied when dragging a single element; multi-element drags move freely.

## Related Files

- `src/pages/Canvas.tsx` - Main canvas page UI and interaction orchestration
- `src/pages/canvasNewRefState.ts` - Shared Strict Mode-safe refs for new-canvas creation flow
- `src-tauri/src/lib.rs` - Rust backend commands
- `src/services/canvasApi.ts` - TypeScript API wrapper
- `src/types/canvas.ts` - Shared type definitions
- `src/lib/imageUtils.ts` - Image conversion utilities
