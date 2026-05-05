'use client';

import { useRef, useCallback } from 'react';

/**
 * Provides honeypot + timestamp fields that get merged into form data
 * before submission. The honeypot input should be rendered but hidden
 * from humans via CSS (not display:none — bots detect that).
 */
export function useSpamProtection() {
  const loadedAt = useRef(Date.now());

  /** Merge these into your JSON body before fetch() */
  const getSpamFields = useCallback(() => ({
    _hp: '',           // stays empty unless a bot fills it
    _ts: loadedAt.current,
  }), []);

  return { getSpamFields };
}
