import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  callback: () => void;
  description?: string;
  ctrlOrMeta?: boolean;
  shift?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  preventInInputs?: boolean;
}

/**
 * Custom hook for handling keyboard shortcuts
 *
 * @param options - Configuration object
 * @param options.shortcuts - Array of keyboard shortcuts to register
 * @param options.enabled - Whether shortcuts are active (default: true)
 * @param options.preventInInputs - Whether to prevent shortcuts when typing in inputs (default: true)
 *
 * @example
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     { key: '+', callback: () => zoomIn(), description: 'Zoom in' },
 *     { key: '-', callback: () => zoomOut(), description: 'Zoom out' },
 *   ]
 * });
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
  preventInInputs = true,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in text inputs
      if (preventInInputs) {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
      }

      // Find matching shortcut
      const shortcut = shortcuts.find((s) => {
        if (s.key !== e.key) return false;
        if (s.ctrlOrMeta && !(e.ctrlKey || e.metaKey)) return false;
        if (!s.ctrlOrMeta && (e.ctrlKey || e.metaKey)) return false;
        if (s.shift && !e.shiftKey) return false;
        if (!s.shift && e.shiftKey) return false;
        return true;
      });
      if (shortcut) {
        e.preventDefault();
        shortcut.callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled, preventInInputs]);
}
