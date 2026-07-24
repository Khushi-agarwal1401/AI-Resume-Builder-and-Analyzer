"use client";

import { useEffect } from "react";

interface Shortcuts {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCommandPalette?: () => void;
}

export function useKeyboardShortcuts({ onSave, onUndo, onRedo, onCommandPalette }: Shortcuts) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave?.();
      }

      if (cmdOrCtrl && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          onRedo?.();
        } else {
          onUndo?.();
        }
      }

      if (cmdOrCtrl && e.key === "/") {
        e.preventDefault();
        onCommandPalette?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSave, onUndo, onRedo, onCommandPalette]);
}
