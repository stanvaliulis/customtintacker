import type { Canvas } from 'fabric';
/** Prevent partial load snapshots from reaching history or recovery storage. */
export const restoringCanvases = new WeakSet<Canvas>();
