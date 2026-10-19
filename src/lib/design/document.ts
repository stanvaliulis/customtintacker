import type { ProductShape } from '@/types/product';
import { validateProofMetadata } from './proof-intent';
import {validateGuided, guidedPreference} from './guided-review';

export const DESIGN_VERSION = 1;
export const MAX_DESIGN_BYTES = 8 * 1024 * 1024;
export interface DesignProduct { id: string; shape: ProductShape; width: number; height: number; }
export interface DesignDocument {
  version: 1; product: DesignProduct; updatedAt: string;
  canvas: Record<string, unknown>; serverId?: string;
}
export const draftKey = (productId: string, namespace = 'ctt') => `${namespace}:designer:v1:${productId}`;
export function createDocument(product: DesignProduct, canvas: Record<string, unknown>, serverId?: string): DesignDocument {
  return { version: DESIGN_VERSION, product, updatedAt: new Date().toISOString(), canvas, ...(serverId ? { serverId } : {}) };
}
/** Validate before replacing visible work. Old local snapshots are migrated in memory. */
export function parseDocument(raw: string, product: DesignProduct): DesignDocument {
  if (raw.length > MAX_DESIGN_BYTES) throw new Error('This design is too large. Use a file smaller than 8 MB.');
  const value = JSON.parse(raw);
  if (!value || typeof value !== 'object') throw new Error('Invalid design file.');
  const document = !value.product && !value.canvas && Array.isArray(value.objects)
    ? createDocument(product, value) : value;
  if (document.version !== DESIGN_VERSION || !document.product || !document.canvas) throw new Error('This is not a supported editable design file.');
  if (document.product.id !== product.id || document.product.shape !== product.shape ||
      document.product.width !== product.width || document.product.height !== product.height) {
    throw new Error('Open this file with the same product and dimensions it was saved for.');
  }
  validateCanvas(document.canvas);
  if(document.canvas.guidedUpload)throw Error('Open this saved review in Upload & emboss to preserve the original artwork and notes.');
  return document;
}
export function validateCanvas(canvas: Record<string, unknown>) {
  if(canvas.guidedUpload!==undefined){
    validateGuided(canvas.guidedUpload);
    if(!Array.isArray(canvas.objects)||canvas.objects.length||JSON.stringify(canvas).length>MAX_DESIGN_BYTES||(canvas.proofIntent as {preference?:string})?.preference!==guidedPreference(canvas.guidedUpload))throw Error('Invalid guided review envelope or size. Keep your recovery packet.');
  }
  validateProofMetadata(canvas);
  if (!Array.isArray(canvas.objects) || canvas.objects.length > 500) throw new Error('Invalid design objects.');
  const allowed = new Set(['rect', 'circle', 'ellipse', 'line', 'polygon', 'path', 'textbox', 'i-text', 'text', 'image', 'group']);
  let count = 0;
  const check = (objects: unknown[], depth: number) => {
    if (depth > 12) throw new Error('This design has too many nested groups.');
    for (const entry of objects) {
      if (!entry || typeof entry !== 'object') throw new Error('Invalid design object.');
      const obj = entry as Record<string, unknown>;
      if (++count > 500 || !allowed.has(String(obj.type).toLowerCase())) throw new Error('Unsupported design object.');
      for (const key of ['left', 'top', 'width', 'height', 'scaleX', 'scaleY', 'fontSize', 'angle']) {
        if (obj[key] !== undefined && (typeof obj[key] !== 'number' || !Number.isFinite(obj[key]) || Math.abs(obj[key] as number) > 100000)) throw new Error('Invalid design dimensions.');
      }
      if (obj.src && !(typeof obj.src === 'string' && /^(data:image\/(png|jpeg|webp);base64,|https:\/\/|\/uploads\/)/i.test(obj.src))) throw new Error('Unsupported image source in this design.');
      if (obj.objects) {
        if (!Array.isArray(obj.objects)) throw new Error('Invalid group.');
        check(obj.objects, depth + 1);
      }
    }
  };
  check(canvas.objects, 0);
}
/** Contain and center without stretching typography. */
export function fitTemplate(sourceW: number, sourceH: number, targetW: number, targetH: number) {
  if ([sourceW, sourceH, targetW, targetH].some(n => !Number.isFinite(n) || n <= 0)) throw new Error('Invalid template size.');
  const scale = Math.min(targetW / sourceW, targetH / sourceH);
  return { scale, left: (targetW - sourceW * scale) / 2, top: (targetH - sourceH * scale) / 2 };
}
