"use client";

import { useState, useCallback } from "react";

export function useHistory<T>(initialState: T | null) {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T | null>(initialState);
  const [future, setFuture] = useState<T[]>([]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const set = useCallback((newState: T | ((curr: T | null) => T | null)) => {
    setPresent((current) => {
      const resolvedState = typeof newState === "function" ? (newState as (curr: T | null) => T | null)(current) : newState;
      if (current === resolvedState) return current;
      if (current !== null) {
        setPast((p) => [...p, current]);
      }
      setFuture([]);
      return resolvedState;
    });
  }, []);

  const undo = useCallback(() => {
    if (!canUndo) return;
    setPresent((current) => {
      if (current === null) return null;
      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      setPast(newPast);
      setFuture((f) => [current, ...f]);
      return previous;
    });
  }, [canUndo, past]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    setPresent((current) => {
      if (current === null) return null;
      const next = future[0];
      const newFuture = future.slice(1);
      setPast((p) => [...p, current]);
      setFuture(newFuture);
      return next;
    });
  }, [canRedo, future]);

  const reset = useCallback((newState: T | null) => {
    setPast([]);
    setPresent(newState);
    setFuture([]);
  }, []);

  return { state: present, set, undo, redo, canUndo, canRedo, reset };
}
