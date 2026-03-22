'use client';

import { useState, useCallback, useRef } from 'react';
import type { Canvas } from 'fabric';

// ─── Configuration ─────────────────────────────────────────────────
const MAX_HISTORY_STATES = 30;

/**
 * Undo/redo history for a Fabric.js canvas.
 *
 * Usage:
 *   const { undo, redo, canUndo, canRedo, saveState } = useDesignHistory(canvas);
 *   // Call saveState() after every meaningful canvas mutation.
 */
export function useDesignHistory(canvas: Canvas | null) {
  // Using refs for the stacks to avoid re-rendering on every push.
  // We track a counter in state purely to force re-renders when
  // canUndo / canRedo change.
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const [revision, setRevision] = useState(0);

  // Guard against recursive calls while we are restoring state.
  const restoringRef = useRef(false);

  /**
   * Capture the current canvas state and push it onto the undo stack.
   * This should be called after every user-initiated modification.
   */
  const saveState = useCallback(() => {
    if (!canvas || restoringRef.current) return;

    const json = JSON.stringify(canvas.toJSON());

    // Only push if the state actually changed
    const lastState = undoStack.current[undoStack.current.length - 1];
    if (json === lastState) return;

    undoStack.current.push(json);

    // Trim to max size
    if (undoStack.current.length > MAX_HISTORY_STATES) {
      undoStack.current.shift();
    }

    // New action clears the redo stack
    redoStack.current = [];

    setRevision((r) => r + 1);
  }, [canvas]);

  /**
   * Undo the last canvas change.
   */
  const undo = useCallback(async () => {
    if (!canvas || undoStack.current.length === 0) return;

    restoringRef.current = true;

    try {
      // Save current state to redo stack before restoring
      const currentJson = JSON.stringify(canvas.toJSON());
      redoStack.current.push(currentJson);

      const previousJson = undoStack.current.pop()!;
      const parsed = JSON.parse(previousJson) as Record<string, unknown>;
      await canvas.loadFromJSON(parsed);
      canvas.requestRenderAll();
      setRevision((r) => r + 1);
    } finally {
      restoringRef.current = false;
    }
  }, [canvas]);

  /**
   * Redo the last undone canvas change.
   */
  const redo = useCallback(async () => {
    if (!canvas || redoStack.current.length === 0) return;

    restoringRef.current = true;

    try {
      // Save current state to undo stack before restoring
      const currentJson = JSON.stringify(canvas.toJSON());
      undoStack.current.push(currentJson);

      const nextJson = redoStack.current.pop()!;
      const parsed = JSON.parse(nextJson) as Record<string, unknown>;
      await canvas.loadFromJSON(parsed);
      canvas.requestRenderAll();
      setRevision((r) => r + 1);
    } finally {
      restoringRef.current = false;
    }
  }, [canvas]);

  // Derive boolean flags from the ref lengths.
  // The `revision` state ensures these re-evaluate on every push/pop.
  const canUndo = undoStack.current.length > 0;
  const canRedo = redoStack.current.length > 0;

  // Suppress the "unused variable" lint for the revision counter
  // (it exists solely to trigger re-renders).
  void revision;

  return { undo, redo, canUndo, canRedo, saveState };
}
