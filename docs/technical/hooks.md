# Custom React Hooks

## useKeyboardShortcuts

A reusable hook for registering keyboard shortcuts with automatic input field detection.

### Usage

```tsx
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function MyComponent() {
  const handleSave = () => console.log('Saved!');
  const handleDelete = () => console.log('Deleted!');

  useKeyboardShortcuts({
    shortcuts: [
      { key: 's', callback: handleSave, description: 'Save' },
      { key: 'Delete', callback: handleDelete, description: 'Delete' },
    ],
  });

  return <div>Content</div>;
}
```

### API Reference

#### Parameters

**`options`** (object):
- **`shortcuts`** (KeyboardShortcut[]): Array of keyboard shortcuts to register
  - `key` (string): The keyboard key to listen for (e.g., '+', 'Enter', 'Escape')
  - `callback` (function): Function to call when key is pressed
  - `description` (string, optional): Human-readable description of the shortcut
- **`enabled`** (boolean, optional, default: true): Whether shortcuts are active
- **`preventInInputs`** (boolean, optional, default: true): Whether to prevent shortcuts when typing in input fields

#### Behavior

- Automatically prevents shortcuts from firing when user is typing in `<input>`, `<textarea>`, or contentEditable elements
- Calls `e.preventDefault()` on matching key presses to prevent browser defaults
- Cleans up event listeners on component unmount
- Window-level listener ensures shortcuts work regardless of focus

#### Notes

- Use the exact key value from KeyboardEvent.key (e.g., '+', 'Enter', 'ArrowUp')
- Multiple components can register the same key - all callbacks will fire
- Shortcuts are case-sensitive

### Examples

#### Zoom Controls
```tsx
useKeyboardShortcuts({
  shortcuts: [
    { key: '+', callback: zoomIn },
    { key: '=', callback: zoomIn }, // Same as +
    { key: '-', callback: zoomOut },
    { key: '0', callback: resetZoom },
  ],
});
```

#### Modal Keyboard Navigation
```tsx
useKeyboardShortcuts({
  shortcuts: [
    { key: 'Escape', callback: closeModal },
    { key: 'Enter', callback: submitForm },
  ],
  enabled: isModalOpen, // Only active when modal is open
});
```

#### Editor Shortcuts (Allow in Inputs)
```tsx
useKeyboardShortcuts({
  shortcuts: [
    { key: 'F5', callback: refreshPreview },
  ],
  preventInInputs: false, // Allow F5 even when typing
});
```
