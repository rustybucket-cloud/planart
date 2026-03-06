# Projects

## Overview

Projects are a top-level organizational entity that groups canvases and reference collections together. They appear alongside loose items on the Home page.

## Data Model

A project stores references to its items rather than owning them. Canvases and collections remain independent entities.

```typescript
interface ProjectItem {
  id: string;
  type: "canvas" | "collection";
}

interface ProjectData {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: ProjectItem[];
}

interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: string;
  itemCount: number;
}
```

## Persistence

- Stored as JSON files in the `projects/` directory under the app data directory
- Each project is a `{uuid}.json` file
- Deleting a project does NOT delete the canvases/collections inside it

## API (Tauri Commands)

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `create_project` | `name: String` | `ProjectData` | Creates a new empty project |
| `save_project` | `project: ProjectData` | `void` | Saves project data |
| `load_project` | `id: String` | `ProjectData` | Loads a project by ID |
| `list_projects` | none | `ProjectSummary[]` | Lists all projects (sorted by updatedAt desc) |
| `delete_project` | `id: String` | `void` | Deletes a project file |

## Home Page Behavior

- Projects appear in the unified item list alongside loose canvases and collections
- Items that belong to a project are **hidden** from the Home page top-level list
- The item count reflects visible items only (loose items + projects)
- Search filters across project names as well as loose items
- "New" menu includes "New Project" option (creates project and navigates to it)

## Project Page

- Displays all items in the project in grid or list view
- Search bar filters project items by name
- Back navigation to Home page
- Inline-editable project name (click pencil icon, confirm with Enter or check button)
- "New" button creates canvases/collections directly inside the project
- "Add Existing..." option in the "New" menu opens a dialog to add pre-existing canvases/collections to the project
  - Dialog shows all canvases and collections not already in the project
  - Items are sorted by most recently updated
  - Search input filters items by name
  - Multi-select with checkboxes; confirm to add all selected items at once
  - Also available as a button in the empty state
- Each item has a three-dot menu (visible on hover) with two options:
  - **Remove from project**: removes the item reference without deleting the underlying canvas/collection
  - **Delete**: permanently deletes the canvas/collection itself (and removes it from the project)
- Delete project button (with confirmation; does not delete contained items)

## Key Design Decisions

1. **Reference-based model**: Projects store item references (`{id, type}`), not the items themselves. This avoids coupling and means no migration of existing canvas/collection data was needed.
2. **Home page filtering**: The Home page loads full project data to determine which item IDs are "claimed" by projects, then filters them from the top-level list.
3. **Non-destructive removal**: Removing an item from a project only updates the project's `items` array. Deleting a project only deletes the project file.
