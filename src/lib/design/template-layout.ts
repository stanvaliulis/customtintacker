import type { ProductShape } from '@/types/product';
import { validateCanvas, fitTemplate } from './document';
import { PPI } from './bleed';
export interface TemplateStyle {
  background: string; ink: string; accent: string; font: 'Georgia' | 'Arial';
  kicker: string; title: string; detail: string; footer: string;
}
/** Database templates may keep physical dimensions outside their Fabric JSON. */
export function canvasForTemplate(template: { shape: ProductShape; width: number; height: number; canvasJson: string; style?: TemplateStyle }, shape: ProductShape, width: number, height: number): Record<string, unknown> {
  if (template.shape !== shape) throw new Error('Choose a template for this product shape.');
  if (template.style) return buildTemplateCanvas(shape, width, height, template.style);
  const canvas = JSON.parse(template.canvasJson);
  if (!canvas || typeof canvas !== 'object') throw new Error('Invalid template artwork.');
  validateCanvas(canvas);
  canvas.width = canvas.width ?? template.width * PPI;
  canvas.height = canvas.height ?? template.height * PPI;
  fitTemplate(Number(canvas.width), Number(canvas.height), width * PPI, height * PPI);
  return canvas;
}
/** Product-sized editable type and rules; independent of branding, APIs and storage. */
export function buildTemplateCanvas(shape: ProductShape, widthInches: number, heightInches: number, style: TemplateStyle) {
  const w = widthInches * 72, h = heightInches * 72;
  const wide = w / h > 2.5;
  const rounded = shape === 'circle' || shape === 'bottle-cap';
  const inset = rounded ? .21 : shape === 'arrow' ? .24 : shape === 'shield' || shape === 'die-cut' ? .26 : .13;
  const contentW = w * (1 - 2 * inset);
  const objects: Record<string, unknown>[] = [];
  const text = (value: string, y: number, size: number, fill: string, bold = false) => {
    const longest = Math.max(...value.split('\n').map(line => line.length));
    objects.push({ type: 'Textbox', left: w / 2, top: h * y, originX: 'center', originY: 'center',
      width: contentW, text: value, fontSize: Math.min(size, contentW / (Math.max(1, longest) * .72)),
      fontFamily: bold ? style.font : 'Arial', fontWeight: bold ? 'bold' : 'normal', textAlign: 'center',
      lineHeight: 1.12, fill, editable: true });
  };
  if (rounded) {
    objects.push({ type: 'Circle', left: w / 2, top: h / 2, originX: 'center', originY: 'center', radius: Math.min(w, h) * .42, fill: 'transparent', stroke: style.accent, strokeWidth: 3 });
    objects.push({ type: 'Circle', left: w / 2, top: h / 2, originX: 'center', originY: 'center', radius: Math.min(w, h) * .39, fill: 'transparent', stroke: style.accent, strokeWidth: 1 });
  } else if (['square', 'rectangle', 'license-plate', 'street-sign'].includes(shape)) {
    const m = Math.max(27, Math.min(w, h) * .075);
    objects.push({ type: 'Rect', left: m, top: m, width: w - m * 2, height: h - m * 2, fill: 'transparent', stroke: style.accent, strokeWidth: 2, rx: 5, ry: 5 });
  }
  // The existing arrow silhouette uses only the central band of its bounding box.
  if (shape === 'arrow') {
    text(style.kicker, .42, h * .04, style.accent);
    text(style.title, .5, Math.min(w * .12, h * .08), style.ink, true);
    text(style.footer, .58, h * .04, style.accent);
    return { version: '6.0.0', width: w, height: h, background: style.background, objects };
  }
  text(style.kicker, wide ? .27 : .25, Math.min(w * .035, h * .09), style.accent);
  text(style.title, wide ? .51 : .43, Math.min(w * .12, h * .18), style.ink, true);
  if (!wide) {
    objects.push({ type: 'Rect', left: w * .4, top: h * .59, width: w * .2, height: 3, fill: style.accent });
    text(style.detail, .68, Math.min(w * .04, h * .07), style.ink);
  }
  text(style.footer, wide ? .76 : .78, Math.min(w * .026, h * .07), style.accent);
  return { version: '6.0.0', width: w, height: h, background: style.background, objects };
}
