/**
 * Static design template seed data with Fabric.js v6 JSON.
 * Coordinates use 72 PPI (matching the editor canvas).
 */

export interface DesignTemplateData {
  id: string;
  name: string;
  slug: string;
  shape: string;
  width: number;
  height: number;
  thumbnail: string;
  canvasJson: string;
  category: string;
  tags: string;
  isActive: boolean;
  sortOrder: number;
}

/* ── Helper: build canvas JSON at 72 PPI ──────────────────────────── */

function makeCanvas(
  widthIn: number,
  heightIn: number,
  bg: string,
  objects: Record<string, unknown>[]
) {
  const w = widthIn * 72;
  const h = heightIn * 72;
  // Scale object coordinates relative to canvas size
  return JSON.stringify({ version: '6.0.0', objects, background: bg, width: w, height: h });
}

/* ── 1. Classic Brewery — bottle-cap 22x22 ─────────────────────── */

const classicBrewery = makeCanvas(22, 22, '#1f2937', [
  { type: 'Circle', left: 792, top: 792, originX: 'center', originY: 'center', radius: 700, fill: 'transparent', stroke: '#b45309', strokeWidth: 4, selectable: true },
  { type: 'Circle', left: 792, top: 792, originX: 'center', originY: 'center', radius: 640, fill: 'transparent', stroke: '#d97706', strokeWidth: 2, selectable: true },
  { type: 'Textbox', left: 792, top: 300, originX: 'center', originY: 'center', width: 900, text: 'YOUR BREWERY', fontSize: 110, fontFamily: 'Georgia', fontWeight: 'bold', textAlign: 'center', fill: '#ffffff' },
  { type: 'Rect', left: 542, top: 550, width: 500, height: 400, fill: '#374151', stroke: '#d97706', strokeWidth: 3, rx: 12, ry: 12 },
  { type: 'Textbox', left: 792, top: 750, originX: 'center', originY: 'center', width: 400, text: 'YOUR\nLOGO\nHERE', fontSize: 72, fontFamily: 'Arial', fontWeight: 'bold', textAlign: 'center', fill: '#d97706', lineHeight: 1.2 },
  { type: 'Textbox', left: 792, top: 1150, originX: 'center', originY: 'center', width: 600, text: 'EST. 2024', fontSize: 80, fontFamily: 'Georgia', textAlign: 'center', fill: '#9ca3af', charSpacing: 200 },
]);

/* ── 2. Happy Hour — rectangle 12x24 ──────────────────────────── */

const happyHour = makeCanvas(24, 12, '#111827', [
  { type: 'Rect', left: 36, top: 36, width: 1656, height: 792, fill: 'transparent', stroke: '#d97706', strokeWidth: 4, rx: 8, ry: 8 },
  { type: 'Textbox', left: 864, top: 250, originX: 'center', originY: 'center', width: 1400, text: 'HAPPY HOUR', fontSize: 180, fontFamily: 'Arial', fontWeight: 'bold', textAlign: 'center', fill: '#fbbf24' },
  { type: 'Textbox', left: 864, top: 480, originX: 'center', originY: 'center', width: 1200, text: 'Monday - Friday  |  3pm - 6pm', fontSize: 64, fontFamily: 'Arial', textAlign: 'center', fill: '#ffffff' },
  { type: 'Textbox', left: 864, top: 650, originX: 'center', originY: 'center', width: 1200, text: '$4 Drafts  •  $5 Wells  •  $6 Wine', fontSize: 48, fontFamily: 'Arial', textAlign: 'center', fill: '#9ca3af' },
]);

/* ── 3. Simple Brand — circle 18x18 ───────────────────────────── */

const simpleBrand = makeCanvas(18, 18, '#1f2937', [
  { type: 'Circle', left: 648, top: 648, originX: 'center', originY: 'center', radius: 580, fill: 'transparent', stroke: '#9ca3af', strokeWidth: 3 },
  { type: 'Circle', left: 648, top: 648, originX: 'center', originY: 'center', radius: 520, fill: 'transparent', stroke: '#d97706', strokeWidth: 2 },
  { type: 'Textbox', left: 648, top: 550, originX: 'center', originY: 'center', width: 800, text: 'YOUR\nBRAND', fontSize: 140, fontFamily: 'Georgia', fontWeight: 'bold', textAlign: 'center', fill: '#ffffff', lineHeight: 1.1 },
  { type: 'Textbox', left: 648, top: 820, originX: 'center', originY: 'center', width: 600, text: 'SINCE 2024', fontSize: 48, fontFamily: 'Arial', textAlign: 'center', fill: '#9ca3af', charSpacing: 300 },
]);

/* ── 4. Craft Beer — square 18x18 ─────────────────────────────── */

const craftBeer = makeCanvas(18, 18, '#111827', [
  { type: 'Rect', left: 72, top: 72, width: 1152, height: 1152, fill: 'transparent', stroke: '#b45309', strokeWidth: 3 },
  { type: 'Textbox', left: 648, top: 200, originX: 'center', originY: 'center', width: 1000, text: 'CRAFT BREW CO.', fontSize: 90, fontFamily: 'Georgia', fontWeight: 'bold', textAlign: 'center', fill: '#fbbf24' },
  { type: 'Rect', left: 348, top: 380, width: 600, height: 400, fill: '#374151', stroke: '#6b7280', strokeWidth: 2, rx: 8, ry: 8 },
  { type: 'Textbox', left: 648, top: 580, originX: 'center', originY: 'center', width: 500, text: 'YOUR\nLOGO', fontSize: 80, fontFamily: 'Arial', fontWeight: 'bold', textAlign: 'center', fill: '#9ca3af', lineHeight: 1.2 },
  { type: 'Textbox', left: 648, top: 920, originX: 'center', originY: 'center', width: 900, text: 'PREMIUM IPA', fontSize: 100, fontFamily: 'Arial', fontWeight: 'bold', textAlign: 'center', fill: '#ffffff' },
  { type: 'Textbox', left: 648, top: 1060, originX: 'center', originY: 'center', width: 900, text: 'Small Batch  |  Bold Flavor', fontSize: 44, fontFamily: 'Arial', textAlign: 'center', fill: '#9ca3af' },
]);

/* ── 5. Directional — arrow (we'll use rectangle 24x6 dims) ──── */

const directional = makeCanvas(23, 5.5, '#1f2937', [
  { type: 'Textbox', left: 828, top: 120, originX: 'center', originY: 'center', width: 800, text: 'THIS WAY TO', fontSize: 48, fontFamily: 'Arial', textAlign: 'center', fill: '#d1d5db', charSpacing: 200 },
  { type: 'Textbox', left: 828, top: 280, originX: 'center', originY: 'center', width: 1200, text: 'COLD BEER →', fontSize: 100, fontFamily: 'Arial', fontWeight: 'bold', textAlign: 'center', fill: '#fbbf24' },
]);

/* ── 6. Tap Room — square 14x14 ───────────────────────────────── */

const tapRoom = makeCanvas(14, 14, '#0f172a', [
  { type: 'Textbox', left: 504, top: 200, originX: 'center', originY: 'center', width: 800, text: 'TAP ROOM', fontSize: 120, fontFamily: 'Arial', fontWeight: 'bold', textAlign: 'center', fill: '#f59e0b' },
  { type: 'Rect', left: 204, top: 300, width: 600, height: 4, fill: '#f59e0b' },
  { type: 'Textbox', left: 504, top: 430, originX: 'center', originY: 'center', width: 700, text: 'YOUR BREWERY NAME', fontSize: 56, fontFamily: 'Georgia', textAlign: 'center', fill: '#ffffff' },
  { type: 'Textbox', left: 504, top: 620, originX: 'center', originY: 'center', width: 700, text: '24 BEERS ON TAP', fontSize: 44, fontFamily: 'Arial', textAlign: 'center', fill: '#94a3b8' },
  { type: 'Textbox', left: 504, top: 820, originX: 'center', originY: 'center', width: 600, text: 'OPEN DAILY\n11AM - MIDNIGHT', fontSize: 40, fontFamily: 'Arial', textAlign: 'center', fill: '#64748b', lineHeight: 1.4 },
]);

/* ── 7. Dispensary — circle 14x14 ─────────────────────────────── */

const dispensary = makeCanvas(14, 14, '#14532d', [
  { type: 'Circle', left: 504, top: 504, originX: 'center', originY: 'center', radius: 440, fill: 'transparent', stroke: '#22c55e', strokeWidth: 3 },
  { type: 'Textbox', left: 504, top: 350, originX: 'center', originY: 'center', width: 700, text: 'YOUR BRAND', fontSize: 80, fontFamily: 'Arial', fontWeight: 'bold', textAlign: 'center', fill: '#ffffff' },
  { type: 'Textbox', left: 504, top: 504, originX: 'center', originY: 'center', width: 300, text: '✦', fontSize: 120, fontFamily: 'Arial', textAlign: 'center', fill: '#22c55e' },
  { type: 'Textbox', left: 504, top: 680, originX: 'center', originY: 'center', width: 600, text: 'PREMIUM CANNABIS', fontSize: 44, fontFamily: 'Arial', textAlign: 'center', fill: '#86efac', charSpacing: 200 },
]);

/* ── 8. Restaurant Special — rectangle 18x12 ──────────────────── */

const restaurant = makeCanvas(18, 12, '#1c1917', [
  { type: 'Rect', left: 50, top: 50, width: 1196, height: 764, fill: 'transparent', stroke: '#a16207', strokeWidth: 3, rx: 6, ry: 6 },
  { type: 'Textbox', left: 648, top: 180, originX: 'center', originY: 'center', width: 1000, text: "TODAY'S SPECIAL", fontSize: 90, fontFamily: 'Georgia', fontWeight: 'bold', textAlign: 'center', fill: '#fbbf24' },
  { type: 'Rect', left: 248, top: 260, width: 800, height: 3, fill: '#a16207' },
  { type: 'Textbox', left: 648, top: 420, originX: 'center', originY: 'center', width: 1000, text: 'Your Restaurant Name', fontSize: 64, fontFamily: 'Georgia', fontStyle: 'italic', textAlign: 'center', fill: '#ffffff' },
  { type: 'Textbox', left: 648, top: 600, originX: 'center', originY: 'center', width: 1000, text: 'Dish name & description here', fontSize: 44, fontFamily: 'Arial', textAlign: 'center', fill: '#a8a29e' },
  { type: 'Textbox', left: 648, top: 740, originX: 'center', originY: 'center', width: 400, text: '$XX.XX', fontSize: 72, fontFamily: 'Georgia', fontWeight: 'bold', textAlign: 'center', fill: '#f59e0b' },
]);

/* ── 9. Street Sign — street-sign 15x4 ────────────────────────── */

const streetSign = makeCanvas(15, 4, '#166534', [
  { type: 'Rect', left: 20, top: 20, width: 1040, height: 248, fill: 'transparent', stroke: '#ffffff', strokeWidth: 3, rx: 4, ry: 4 },
  { type: 'Textbox', left: 540, top: 144, originX: 'center', originY: 'center', width: 900, text: 'YOUR STREET', fontSize: 110, fontFamily: 'Arial', fontWeight: 'bold', textAlign: 'center', fill: '#ffffff' },
]);

/* ── 10. Can Shape — can 9x17.5 ───────────────────────────────── */

const canShape = makeCanvas(9, 17.5, '#111827', [
  { type: 'Textbox', left: 324, top: 300, originX: 'center', originY: 'center', width: 500, text: 'YOUR\nBEER', fontSize: 100, fontFamily: 'Arial', fontWeight: 'bold', textAlign: 'center', fill: '#fbbf24', lineHeight: 1.1 },
  { type: 'Rect', left: 74, top: 500, width: 500, height: 4, fill: '#d97706' },
  { type: 'Textbox', left: 324, top: 650, originX: 'center', originY: 'center', width: 500, text: 'BREWERY\nNAME', fontSize: 64, fontFamily: 'Georgia', textAlign: 'center', fill: '#ffffff', lineHeight: 1.2 },
  { type: 'Textbox', left: 324, top: 900, originX: 'center', originY: 'center', width: 400, text: 'IPA  •  6.5% ABV', fontSize: 36, fontFamily: 'Arial', textAlign: 'center', fill: '#9ca3af' },
  { type: 'Textbox', left: 324, top: 1100, originX: 'center', originY: 'center', width: 400, text: '12 FL OZ', fontSize: 32, fontFamily: 'Arial', textAlign: 'center', fill: '#6b7280' },
]);

/* ── 11. License Plate — license-plate 12x6 ───────────────────── */

const licensePlate = makeCanvas(12, 6, '#e5e7eb', [
  { type: 'Rect', left: 20, top: 20, width: 824, height: 392, fill: 'transparent', stroke: '#374151', strokeWidth: 3, rx: 8, ry: 8 },
  { type: 'Textbox', left: 432, top: 100, originX: 'center', originY: 'center', width: 700, text: 'YOUR STATE', fontSize: 36, fontFamily: 'Arial', textAlign: 'center', fill: '#6b7280' },
  { type: 'Textbox', left: 432, top: 230, originX: 'center', originY: 'center', width: 700, text: 'YOUR TAG', fontSize: 110, fontFamily: 'Arial', fontWeight: 'bold', textAlign: 'center', fill: '#1f2937', charSpacing: 100 },
  { type: 'Textbox', left: 432, top: 360, originX: 'center', originY: 'center', width: 700, text: 'YOUR SLOGAN HERE', fontSize: 28, fontFamily: 'Arial', textAlign: 'center', fill: '#6b7280' },
]);

/* ── Export ────────────────────────────────────────────────────── */

export const designTemplates: DesignTemplateData[] = [
  { id: 'tpl-classic-brewery', name: 'Classic Brewery', slug: 'classic-brewery', shape: 'bottle-cap', width: 22, height: 22, thumbnail: '', canvasJson: classicBrewery, category: 'brewery', tags: 'brewery,beer,classic,logo', isActive: true, sortOrder: 1 },
  { id: 'tpl-happy-hour', name: 'Happy Hour', slug: 'happy-hour', shape: 'rectangle', width: 24, height: 12, thumbnail: '', canvasJson: happyHour, category: 'bar', tags: 'bar,happy hour,promotion', isActive: true, sortOrder: 2 },
  { id: 'tpl-simple-brand', name: 'Simple Brand', slug: 'simple-brand', shape: 'circle', width: 18, height: 18, thumbnail: '', canvasJson: simpleBrand, category: 'general', tags: 'logo,brand,minimal', isActive: true, sortOrder: 3 },
  { id: 'tpl-craft-beer', name: 'Craft Beer Label', slug: 'craft-beer', shape: 'square', width: 18, height: 18, thumbnail: '', canvasJson: craftBeer, category: 'brewery', tags: 'craft beer,ipa,label', isActive: true, sortOrder: 4 },
  { id: 'tpl-directional', name: 'Directional', slug: 'directional', shape: 'arrow', width: 23, height: 5.5, thumbnail: '', canvasJson: directional, category: 'bar', tags: 'arrow,wayfinding,beer', isActive: true, sortOrder: 5 },
  { id: 'tpl-tap-room', name: 'Tap Room', slug: 'tap-room', shape: 'square', width: 14, height: 14, thumbnail: '', canvasJson: tapRoom, category: 'brewery', tags: 'taproom,brewery,hours', isActive: true, sortOrder: 6 },
  { id: 'tpl-dispensary', name: 'Dispensary', slug: 'dispensary', shape: 'circle', width: 14, height: 14, thumbnail: '', canvasJson: dispensary, category: 'cannabis', tags: 'cannabis,dispensary,green', isActive: true, sortOrder: 7 },
  { id: 'tpl-restaurant', name: 'Restaurant Special', slug: 'restaurant-special', shape: 'rectangle', width: 18, height: 12, thumbnail: '', canvasJson: restaurant, category: 'restaurant', tags: 'restaurant,special,food', isActive: true, sortOrder: 8 },
  { id: 'tpl-street-sign', name: 'Street Sign', slug: 'street-sign', shape: 'street-sign', width: 15, height: 4, thumbnail: '', canvasJson: streetSign, category: 'general', tags: 'street,sign,address', isActive: true, sortOrder: 9 },
  { id: 'tpl-can-shape', name: 'Beer Can', slug: 'beer-can', shape: 'can', width: 9, height: 17.5, thumbnail: '', canvasJson: canShape, category: 'brewery', tags: 'can,beer,tall', isActive: true, sortOrder: 10 },
  { id: 'tpl-license-plate', name: 'License Plate', slug: 'license-plate', shape: 'license-plate', width: 12, height: 6, thumbnail: '', canvasJson: licensePlate, category: 'general', tags: 'license,plate,tag', isActive: true, sortOrder: 11 },
];

export function getTemplatesByShape(shape?: string): DesignTemplateData[] {
  if (!shape) return designTemplates.filter((t) => t.isActive);
  return designTemplates.filter((t) => t.isActive && t.shape === shape);
}

export function getTemplateById(id: string): DesignTemplateData | undefined {
  return designTemplates.find((t) => t.id === id);
}
