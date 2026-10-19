'use client';
import {artworkFetch} from '@/lib/design/artwork-client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Canvas } from 'fabric';
import { createDocument, draftKey, parseDocument, type DesignProduct } from '@/lib/design/document';
import { restoringCanvases } from '@/lib/design/canvas-transaction';
import { designerConfig } from '@/data/designer-config';

export interface DraftAdapter { storageNamespace: string; sessionKey: string; saveEndpoint: string; legacyDraftPrefix?: string; }

export type SaveStatus = 'loading' | 'idle' | 'local' | 'saving' | 'saved' | 'error';
export function useDesignDraft(canvas: Canvas | null, product: DesignProduct, serialize: () => Record<string, unknown>, restore: (data: Record<string, unknown>) => Promise<void>, resetHistory: () => void, adapter: DraftAdapter = designerConfig) {
  const [status, setStatus] = useState<SaveStatus>('loading');
  const [message, setMessage] = useState('Opening your design…');
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);
  const savePromise = useRef<Promise<string | null> | null>(null);
  const generation = useRef(0);
  const saveController = useRef<AbortController | null>(null);
  const serverSnapshot = useRef<string | null>(null);
  const serverId = useRef<string | undefined>(undefined);
  const damagedDraft = useRef<string | null>(null);
  const productKey = JSON.stringify(product);
  // Use a stable adapter value, independent of the caller's render cycle.
  const stableProduct = useMemo(() => JSON.parse(productKey) as DesignProduct, [productKey]);
  const key = draftKey(stableProduct.id, adapter.storageNamespace);
  const persist = useCallback(() => {
    if (!canvas || !readyRef.current || restoringCanvases.has(canvas)) return false;
    try {
      if (damagedDraft.current) {
        localStorage.setItem(key + ':recovery', damagedDraft.current);
        damagedDraft.current = null;
      }
      const snapshot = serialize();
      const isServerCurrent = JSON.stringify(snapshot) === serverSnapshot.current;
      localStorage.setItem(key, JSON.stringify(createDocument(stableProduct, snapshot, isServerCurrent ? serverId.current : undefined)));
      if (!savePromise.current) {
        setStatus(isServerCurrent ? 'saved' : 'local');
        setMessage(isServerCurrent ? 'Saved online and on this device' : 'Draft saved on this device');
      }
      return true;
    } catch {
      setStatus('error'); setMessage('Device storage is unavailable or full. Download an editable backup.');
      return false;
    }
  }, [canvas, serialize, stableProduct, key]);
  useEffect(() => {
    if (!canvas) return;
    let cancelled = false;
    const openGeneration = ++generation.current;
    serverSnapshot.current = null; serverId.current = undefined; damagedDraft.current = null;
    setStatus('loading'); setMessage('Opening your design.');
    readyRef.current = false; setReady(false);
    const open = async () => {
      let raw: string | null = null;
      try {
        raw = localStorage.getItem(key) || (adapter.legacyDraftPrefix ? localStorage.getItem(adapter.legacyDraftPrefix + stableProduct.id) : null);
        if (raw) {
          const doc = parseDocument(raw, stableProduct);
          await restore(doc.canvas);
          if (cancelled) return;
          serverId.current = doc.serverId;
          // Migrations can add optional intent IDs/metadata. Do not reuse an old
          // server receipt for a serialized design that the server has never seen.
          if (doc.serverId) serverSnapshot.current = JSON.stringify(doc.canvas);
          const current = !!doc.serverId && JSON.stringify(serialize()) === serverSnapshot.current;
          setStatus(current ? 'saved' : 'local'); setMessage('Reopened your saved draft.');
        } else { setStatus('idle'); setMessage('Add a template, text, or artwork to begin.'); }
      } catch {
        damagedDraft.current = raw;
        if (!cancelled) { setStatus('error'); setMessage('Could not reopen the previous draft. Its stored copy has been kept. Download your work before leaving.'); }
      } finally {
        if (!cancelled) { resetHistory(); readyRef.current = true; setReady(true); }
      }
    };
    void open();
    return () => {
      cancelled = true; readyRef.current = false; generation.current = openGeneration + 1;
      saveController.current?.abort(); saveController.current = null; savePromise.current = null;
    };
  }, [canvas, stableProduct, restore, resetHistory, serialize, key, adapter.legacyDraftPrefix]);
  useEffect(() => {
    if (!canvas) return;
    const flush = () => { persist(); };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!persist() && readyRef.current) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', beforeUnload);
    return () => { window.removeEventListener('pagehide', flush); window.removeEventListener('beforeunload', beforeUnload); };
  }, [canvas, persist]);
  const saveOnline = useCallback((): Promise<string | null> => {
    if (savePromise.current) return savePromise.current;
    if (!readyRef.current || !canvas || restoringCanvases.has(canvas)) return Promise.resolve(null);
    persist();
    const snapshot = JSON.stringify(serialize());
    if (snapshot === serverSnapshot.current && serverId.current) return Promise.resolve(serverId.current);
    const requestGeneration = generation.current;
    const controller = new AbortController(); saveController.current = controller;
    const timeout = setTimeout(() => controller.abort(), 20000);
    const isCurrent = () => generation.current === requestGeneration && readyRef.current;
    setStatus('saving'); setMessage('Saving online…');
    const request = (async () => {
      // Defer execution until savePromise has been assigned, even if storage throws.
      await Promise.resolve();
      try {
        if (!isCurrent() || controller.signal.aborted) return null;
        const sessionId = localStorage.getItem(adapter.sessionKey) || crypto.randomUUID();
        localStorage.setItem(adapter.sessionKey, sessionId);
        const res = await artworkFetch(adapter.saveEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
          signal: controller.signal, body: JSON.stringify({ sessionId, productId: stableProduct.id, shape: stableProduct.shape, width: stableProduct.width, height: stableProduct.height, canvasJson: snapshot }) });
        if (!res.ok) throw new Error('Save failed');
        const data = await res.json();
        if (typeof data.id !== 'string') throw new Error('Save did not return a design');
        // Never serialize a disposed/replaced canvas or attach a receipt to another product.
        if (!isCurrent() || controller.signal.aborted) return null;
        serverId.current = data.id; serverSnapshot.current = snapshot;
        const currentCanvas = serialize();
        const current = JSON.stringify(currentCanvas) === snapshot;
        try {
          localStorage.setItem(key, JSON.stringify(createDocument(stableProduct, currentCanvas, current ? data.id : undefined)));
          setStatus(current ? 'saved' : 'local');
          setMessage(current ? 'Saved online and on this device' : 'New changes are saved on this device. Save again to update online.');
        } catch {
          setStatus('error'); setMessage('Online save completed, but device storage is unavailable or full. Download an editable backup.');
        }
        return current ? data.id : null;
      } catch {
        if (isCurrent()) { setStatus('error'); setMessage('Online save failed. Keep this tab open or download an editable backup.'); }
        return null;
      } finally {
        clearTimeout(timeout);
        if (isCurrent()) { savePromise.current = null; saveController.current = null; }
      }
    })();
    savePromise.current = request;
    return request;
  }, [canvas, persist, serialize, stableProduct, adapter.sessionKey, adapter.saveEndpoint, key]);
  return { status, message, ready, persist, saveOnline };
}
