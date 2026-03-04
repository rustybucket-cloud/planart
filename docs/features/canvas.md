# Canvas

## Overview
The infinite canvas is the core creative workspace of PlanArt. It allows users to compose visual ideas by adding images and text elements in an unbounded 2D space with intuitive pan and zoom controls.

## Current Implementation Status

### ✅ Completed Features

#### Core Canvas System
- **Infinite pan & zoom**: Smooth viewport controls with coordinate tracking
- **Paste from clipboard** (Ctrl+V): Direct image pasting from system clipboard at cursor position
- **Drag & drop positioning**: Click and drag any element to reposition
- **Selection system**: Visual selection ring with delete capability
- **Viewport controls**: Pan by scrolling or Shift+Click+Drag
- **Zoom controls**: Ctrl+Scroll or dedicated zoom buttons (10% - 500%)

#### Element Types
- **Image elements**: Paste from clipboard, displays at natural dimensions
- **Text elements**: Add via toolbar, double-click to edit content

#### Tiling Mode ✨
- **Toggle switch** in left toolbar
- **Smart adjacent tiling**: When an element is selected, pasting creates a single tile adjacent to it in the direction of your cursor
  - Supports 8 cardinal directions (N, NE, E, SE, S, SW, W, NW)
  - 10px spacing between tiles
  - **Collision detection**: Automatically finds the next available spot if the initial position is occupied
  - Tiles "slide" in the cursor direction until finding a clear space
  - Perfect for building custom grids and patterns with precise control
- **Grid mode**: When no element is selected, pasting creates a **4×3 grid** (12 total tiles)
  - Centered at viewport
  - Ideal for quick pattern exploration and mood boards

#### User Interface
- **Floating left toolbar**: Text tool, image info, tiling toggle, delete button
- **Floating zoom controls**: Zoom in/out buttons with percentage display
- **Status bar**: Viewport coordinates (X, Y) and object count
- **Header bar**: Navigation back to home, settings, share, download, delete project
- **Help overlay**: Keyboard shortcuts display when canvas is empty

#### Visual Design
- **Architect's Studio aesthetic**: Technical precision meets warm creative energy
- **Dot grid background**: Scales with zoom level, creates blueprint feel
- **Glass-morphic UI panels**: Subtle backdrop blur with terracotta accents
- **Warm color palette**: Deep navy (#1a1d28) base with terracotta accent (#d4845e)
- **Typography**: Crimson Pro serif for elegance, monospace for technical data

### Keyboard Shortcuts
- `Ctrl+V` - Paste images from clipboard
- `Scroll` / `Mouse Wheel` - Zoom in/out (toward cursor position)
- `+` / `=` - Zoom in
- `-` - Zoom out
- `0` - Reset zoom to 100%
- `Shift+Click+Drag` - Pan canvas
- `Click+Drag` on element - Move element
- `Double-Click` on text - Edit text content
- `Del` - Delete selected element (via toolbar button)

### Technical Details

#### Coordinate System
- Canvas uses a coordinate space independent of viewport
- Screen coordinates converted to canvas coordinates based on zoom and pan
- Elements store absolute canvas positions (x, y)

#### State Management
- Elements array stores all canvas objects
- Viewport state tracks pan position (x, y) and zoom level
- Selection tracking for active element
- Tiling mode toggle state

#### Performance Considerations
- Transform-based rendering (CSS transform for pan/zoom)
- No re-render of element content during pan/zoom
- Blob URLs for pasted images (auto-managed by browser)

## Future Enhancements

### Planned Features
- [ ] Image upload via file picker
- [ ] Export canvas as image (PNG/JPG/SVG)
- [ ] Element rotation and resizing
- [ ] Layer ordering (bring forward, send backward)
- [ ] Multi-select with marquee tool
- [ ] Undo/redo system
- [ ] Canvas persistence (save to database)
- [x] Keyboard shortcuts for zoom (+/-, 0 to reset)
- [ ] Keyboard shortcuts for delete (Del key)
- [ ] Context menu for element actions
- [ ] Grid snap mode
- [ ] Canvas background color picker
- [ ] Element opacity controls
- [ ] Copy/paste elements within canvas
- [ ] Alignment guides and smart snapping

### Tiling Mode Enhancements
- [ ] Configurable grid size (rows × columns)
- [ ] Configurable spacing between tiles
- [ ] Pattern offset options (brick pattern, etc.)
- [ ] Auto-scale tiles to fit grid

### Text Enhancements
- [ ] Rich text formatting (bold, italic, color)
- [ ] Font selection
- [ ] Font size adjustment
- [ ] Text alignment options
- [ ] Text background/box styling

## Design Rationale

### Why Infinite Canvas?
- **Freedom**: No artificial boundaries on creative exploration
- **Flexibility**: Organize ideas spatially however makes sense
- **Scalability**: Start small, expand as needed

### Why Tiling Mode?
- **Pattern Design**: Quickly test how images tile seamlessly
- **Mood Boards**: Rapidly fill space with repeated elements
- **Efficiency**: One paste creates full composition

### Why Paste-Focused?
- **Speed**: Fastest way to get content onto canvas
- **Natural workflow**: Users already copy images from web, screenshots, etc.
- **Cross-platform**: Works everywhere clipboard API is supported
- **Intuitive placement**: Images paste exactly where your cursor is pointing