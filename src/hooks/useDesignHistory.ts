'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import type { Canvas } from 'fabric';
import { DesignHistory } from '@/lib/design/history';

export function useDesignHistory(canvas: Canvas | null, serialize: () => Record<string, unknown>, restore: (data: string) => Promise<void>) {
  const history = useRef(new DesignHistory());
  const restoringRef = useRef(false);
  const [, update] = useState(0);
  const [busy, setBusy] = useState(false);
  const saveState = useCallback(() => {
    if (!canvas || restoringRef.current) return;
    if (history.current.push(JSON.stringify(serialize()))) update(n => n + 1);
  }, [canvas, serialize]);
  const resetHistory = useCallback(() => {
    history.current.reset(JSON.stringify(serialize()));
    update(n => n + 1);
  }, [serialize]);
  useEffect(() => { if (canvas) resetHistory(); }, [canvas, resetHistory]);
  const travel = useCallback(async (direction: -1 | 1) => {
    if (!canvas || restoringRef.current) return;
    const target = history.current.peek(direction);
    if (target === undefined) return;
    restoringRef.current = true;
    setBusy(true);
    try {
      await restore(target);
      history.current.move(direction);
      update(n => n + 1);
    } finally { restoringRef.current = false; setBusy(false); }
  }, [canvas, restore]);
  const undo = useCallback(() => travel(-1), [travel]);
  const redo = useCallback(() => travel(1), [travel]);
  return { undo, redo, canUndo: !busy && history.current.canUndo, canRedo: !busy && history.current.canRedo, saveState, resetHistory, busy, restoringRef };
}
