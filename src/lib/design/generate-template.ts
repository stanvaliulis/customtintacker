import type { ProductShape } from '@/types/product';
import { BLEED_INCHES, SAFE_AREA_INCHES } from './bleed';

/**
 * Pixels per inch for the template SVG coordinate system.
 * We use 72 PPI to keep file sizes small; the template is vector-based
 * so it scales to any resolution.
 */
const PPI = 72;

export interface TemplateOptions {
  shape: ProductShape;
  widthInches: number;
  heightInches: number;
  displaySize: string;
  productId: string;
}

export interface TemplateMetrics {
  bleedPx: number;
  safePx: number;
  trimW: number;
  trimH: number;
  canvasW: number;
  canvasH: number;
  trimX: number;
  trimY: number;
}

/**
 * The box arithmetic every template format shares: trim size at {@link PPI},
 * padded by the bleed on all four sides.
 *
 * Exported so the SVG and PDF generators cannot drift apart.
 */
export function templateMetrics(widthInches: number, heightInches: number): TemplateMetrics {
  const bleedPx = Math.round(BLEED_INCHES * PPI);
  const safePx = Math.round(SAFE_AREA_INCHES * PPI);
  const trimW = Math.round(widthInches * PPI);
  const trimH = Math.round(heightInches * PPI);

  return {
    bleedPx,
    safePx,
    trimW,
    trimH,
    canvasW: trimW + bleedPx * 2,
    canvasH: trimH + bleedPx * 2,
    trimX: bleedPx,
    trimY: bleedPx,
  };
}

/** A single template outline, in a form both SVG and PDF can render. */
export type Outline =
  | { kind: 'path'; d: string }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; r: number }
  | { kind: 'circle'; cx: number; cy: number; r: number };

/**
 * The trim outline for a shape, inset by `inset` pixels — negative insets
 * grow the outline outward for the bleed line, positive shrink it inward
 * for the safe area.
 */
export function outlineFor(
  shape: ProductShape,
  m: TemplateMetrics,
  inset: number
): Outline {
  const box = {
    x: m.trimX + inset,
    y: m.trimY + inset,
    w: m.trimW - inset * 2,
    h: m.trimH - inset * 2,
  };

  switch (shape) {
    case 'circle':
    case 'bottle-cap':
      return {
        kind: 'circle',
        cx: m.trimX + m.trimW / 2,
        cy: m.trimY + m.trimH / 2,
        r: Math.min(m.trimW, m.trimH) / 2 - inset,
      };
    case 'can':
    case 'shield':
    case 'arrow':
      return { kind: 'path', d: silhouetteD(shape, box) };
    default:
      return { ...box, kind: 'rect', r: cornerRadius(shape, m.trimW, m.trimH) };
  }
}

/**
 * Generates an SVG artwork template string for a given product.
 *
 * The SVG includes:
 *   - Bleed line (red dashed, 0.125" outside trim)
 *   - Trim / cut line (solid black)
 *   - Safe area line (green dashed, 0.25" inside trim)
 *   - Labels for each line
 *   - "YOUR ARTWORK HERE" text in the center
 *   - Dimension labels
 */
export function generateTemplateSVG(options: TemplateOptions): string {
  const { shape, widthInches, heightInches, displaySize, productId } = options;

  const { bleedPx, safePx, trimW, trimH, canvasW, canvasH, trimX, trimY } =
    templateMetrics(widthInches, heightInches);

  const cx = canvasW / 2;
  const cy = canvasH / 2;

  const shapeLabel = shape.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // Build the shape-specific trim and bleed paths
  const { trimPath, bleedPath, safePath } = getShapePaths(shape, trimW, trimH, trimX, trimY, bleedPx, safePx);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 ${canvasW} ${canvasH}"
     width="${canvasW}" height="${canvasH}"
     style="background:#ffffff">

  <!-- Template Info -->
  <!-- Product: ${productId} -->
  <!-- Shape: ${shapeLabel} -->
  <!-- Size: ${displaySize} -->
  <!-- Bleed: ${BLEED_INCHES}" on all sides -->
  <!-- Safe Area: ${SAFE_AREA_INCHES}" from trim edge -->

  <defs>
    <style>
      .label { font-family: Arial, Helvetica, sans-serif; }
      .trim-line { fill: none; stroke: #000000; stroke-width: 1.5; }
      .bleed-line { fill: none; stroke: #FF0000; stroke-width: 1; stroke-dasharray: 6 3; }
      .safe-line { fill: none; stroke: #00AA00; stroke-width: 1; stroke-dasharray: 4 4; }
    </style>
  </defs>

  <!-- Light gray background for bleed area -->
  <rect x="0" y="0" width="${canvasW}" height="${canvasH}" fill="#f5f5f5" />

  <!-- White fill for trim area -->
  ${getTrimFill(shape, trimW, trimH, trimX, trimY)}

  <!-- Bleed line (red dashed) -->
  ${bleedPath}

  <!-- Trim / Cut line (solid black) -->
  ${trimPath}

  <!-- Safe area line (green dashed) -->
  ${safePath}

  <!-- Center text -->
  <text x="${cx}" y="${cy - 20}" text-anchor="middle" class="label"
        font-size="18" font-weight="bold" fill="#888888">
    YOUR ARTWORK HERE
  </text>
  <text x="${cx}" y="${cy + 6}" text-anchor="middle" class="label"
        font-size="11" fill="#aaaaaa">
    ${displaySize} ${shapeLabel} Tin Tacker
  </text>
  <text x="${cx}" y="${cy + 24}" text-anchor="middle" class="label"
        font-size="9" fill="#bbbbbb">
    customtintackers.com
  </text>
  ${
    shape === 'die-cut'
      ? `<text x="${cx}" y="${cy + 44}" text-anchor="middle" class="label"
        font-size="9" fill="#c26a00">
    Custom die-cut: the box below is the maximum artwork area, not the cut line.
  </text>
  <text x="${cx}" y="${cy + 57}" text-anchor="middle" class="label"
        font-size="9" fill="#c26a00">
    Fill it edge to edge — the final die follows your approved outline.
  </text>`
      : ''
  }

  <!-- Dimension labels -->
  <!-- Width -->
  <line x1="${trimX}" y1="${trimY - 15}" x2="${trimX + trimW}" y2="${trimY - 15}"
        stroke="#666666" stroke-width="0.5" marker-start="url(#arrow)" marker-end="url(#arrow)" />
  <text x="${cx}" y="${trimY - 20}" text-anchor="middle" class="label"
        font-size="10" fill="#666666">
    ${widthInches}&quot;
  </text>

  <!-- Height -->
  <line x1="${trimX + trimW + 15}" y1="${trimY}" x2="${trimX + trimW + 15}" y2="${trimY + trimH}"
        stroke="#666666" stroke-width="0.5" />
  <text x="${trimX + trimW + 20}" y="${cy + 4}" text-anchor="start" class="label"
        font-size="10" fill="#666666" transform="rotate(90, ${trimX + trimW + 20}, ${cy + 4})">
    ${heightInches}&quot;
  </text>

  <!-- Legend -->
  <g transform="translate(${trimX + 8}, ${trimY + trimH - 50})">
    <line x1="0" y1="0" x2="25" y2="0" class="bleed-line" />
    <text x="30" y="4" class="label" font-size="8" fill="#FF0000">Bleed (${BLEED_INCHES}&quot;)</text>

    <line x1="0" y1="14" x2="25" y2="14" class="trim-line" />
    <text x="30" y="18" class="label" font-size="8" fill="#000000">Trim / Cut Line</text>

    <line x1="0" y1="28" x2="25" y2="28" class="safe-line" />
    <text x="30" y="32" class="label" font-size="8" fill="#00AA00">Safe Area (${SAFE_AREA_INCHES}&quot;)</text>
  </g>

</svg>`;
}

// ─── Shape-specific path helpers ─────────────────────────────────────

function getShapePaths(
  shape: ProductShape,
  trimW: number,
  trimH: number,
  trimX: number,
  trimY: number,
  bleedPx: number,
  safePx: number
) {
  switch (shape) {
    case 'circle':
    case 'bottle-cap':
      return getCirclePaths(trimW, trimH, trimX, trimY, bleedPx, safePx);
    case 'can':
    case 'shield':
    case 'arrow':
      return getSilhouettePaths(shape, trimW, trimH, trimX, trimY, bleedPx, safePx);
    default:
      return getRectPaths(trimW, trimH, trimX, trimY, bleedPx, safePx, shape);
  }
}

/**
 * Trim, bleed and safe outlines for shapes that are neither a rectangle
 * nor a circle — cans, shields and arrows.
 *
 * Each silhouette is defined as a function of its bounding box, so the
 * three lines come from the same geometry evaluated at three box sizes:
 * grown by the bleed, exact, and shrunk by the safe area. That keeps the
 * three curves parallel without needing a true path-offset algorithm.
 */
function getSilhouettePaths(
  shape: ProductShape,
  trimW: number,
  trimH: number,
  trimX: number,
  trimY: number,
  bleedPx: number,
  safePx: number
) {
  const d = (inset: number) =>
    silhouetteD(shape, {
      x: trimX + inset,
      y: trimY + inset,
      w: trimW - inset * 2,
      h: trimH - inset * 2,
    });

  return {
    trimPath: `<path d="${d(0)}" class="trim-line" />`,
    bleedPath: `<path d="${d(-bleedPx)}" class="bleed-line" />`,
    safePath: `<path d="${d(safePx)}" class="safe-line" />`,
  };
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const n = (v: number) => Math.round(v * 100) / 100;

export function silhouetteD(shape: ProductShape, b: Box): string {
  switch (shape) {
    case 'can':
      return canD(b);
    case 'shield':
      return shieldD(b);
    case 'arrow':
      return arrowD(b);
    default:
      return `M ${n(b.x)} ${n(b.y)} H ${n(b.x + b.w)} V ${n(b.y + b.h)} H ${n(b.x)} Z`;
  }
}

/** Beverage-can silhouette: narrowed rim, tapered shoulder, rounded base. */
function canD({ x, y, w, h }: Box): string {
  const rim = w * 0.14;      // horizontal inset of the top rim
  const shoulder = h * 0.05; // straight run below the rim before the taper
  const taperEnd = h * 0.14; // where the body reaches full width
  const baseStart = h * 0.93;
  return [
    `M ${n(x + rim)} ${n(y)}`,
    `H ${n(x + w - rim)}`,
    `V ${n(y + shoulder)}`,
    `C ${n(x + w - rim)} ${n(y + taperEnd * 0.6)} ${n(x + w)} ${n(y + taperEnd * 0.7)} ${n(x + w)} ${n(y + taperEnd)}`,
    `V ${n(y + baseStart)}`,
    `C ${n(x + w)} ${n(y + h)} ${n(x + w - rim * 0.5)} ${n(y + h)} ${n(x + w - rim)} ${n(y + h)}`,
    `H ${n(x + rim)}`,
    `C ${n(x + rim * 0.5)} ${n(y + h)} ${n(x)} ${n(y + h)} ${n(x)} ${n(y + baseStart)}`,
    `V ${n(y + taperEnd)}`,
    `C ${n(x)} ${n(y + taperEnd * 0.7)} ${n(x + rim)} ${n(y + taperEnd * 0.6)} ${n(x + rim)} ${n(y + shoulder)}`,
    'Z',
  ].join(' ');
}

/** Crest / highway-shield silhouette: square shoulders, pointed base. */
function shieldD({ x, y, w, h }: Box): string {
  const r = Math.min(w, h) * 0.08; // top corner radius
  const straight = h * 0.55;       // straight sides before the curve inward
  return [
    `M ${n(x + r)} ${n(y)}`,
    `H ${n(x + w - r)}`,
    `Q ${n(x + w)} ${n(y)} ${n(x + w)} ${n(y + r)}`,
    `V ${n(y + straight)}`,
    `C ${n(x + w)} ${n(y + h * 0.8)} ${n(x + w * 0.68)} ${n(y + h * 0.94)} ${n(x + w / 2)} ${n(y + h)}`,
    `C ${n(x + w * 0.32)} ${n(y + h * 0.94)} ${n(x)} ${n(y + h * 0.8)} ${n(x)} ${n(y + straight)}`,
    `V ${n(y + r)}`,
    `Q ${n(x)} ${n(y)} ${n(x + r)} ${n(y)}`,
    'Z',
  ].join(' ');
}

/**
 * Directional arrow. Points right on landscape products and down on
 * portrait ones, matching how the signs are actually hung.
 */
function arrowD({ x, y, w, h }: Box): string {
  if (w >= h) {
    const shaftTop = y + h * 0.24;
    const shaftBottom = y + h * 0.76;
    const headStart = x + w * 0.6;
    return [
      `M ${n(x)} ${n(shaftTop)}`,
      `H ${n(headStart)}`,
      `V ${n(y)}`,
      `L ${n(x + w)} ${n(y + h / 2)}`,
      `L ${n(headStart)} ${n(y + h)}`,
      `V ${n(shaftBottom)}`,
      `H ${n(x)}`,
      'Z',
    ].join(' ');
  }
  const shaftLeft = x + w * 0.24;
  const shaftRight = x + w * 0.76;
  const headStart = y + h * 0.6;
  return [
    `M ${n(shaftLeft)} ${n(y)}`,
    `V ${n(headStart)}`,
    `H ${n(x)}`,
    `L ${n(x + w / 2)} ${n(y + h)}`,
    `L ${n(x + w)} ${n(headStart)}`,
    `H ${n(shaftRight)}`,
    `V ${n(y)}`,
    'Z',
  ].join(' ');
}

function getRectPaths(
  trimW: number,
  trimH: number,
  trimX: number,
  trimY: number,
  bleedPx: number,
  safePx: number,
  shape: ProductShape = 'rectangle'
) {
  const r = cornerRadius(shape, trimW, trimH);

  const trimPath = `<rect x="${trimX}" y="${trimY}" width="${trimW}" height="${trimH}" rx="${r}" class="trim-line" />`;
  const bleedPath = `<rect x="${trimX - bleedPx}" y="${trimY - bleedPx}" width="${trimW + bleedPx * 2}" height="${trimH + bleedPx * 2}" rx="${r}" class="bleed-line" />`;
  const safePath = `<rect x="${trimX + safePx}" y="${trimY + safePx}" width="${trimW - safePx * 2}" height="${trimH - safePx * 2}" rx="${r}" class="safe-line" />`;

  return { trimPath, bleedPath, safePath };
}

function getCirclePaths(
  trimW: number,
  trimH: number,
  trimX: number,
  trimY: number,
  bleedPx: number,
  safePx: number
) {
  const cx = trimX + trimW / 2;
  const cy = trimY + trimH / 2;
  const trimR = Math.min(trimW, trimH) / 2;

  const trimPath = `<circle cx="${cx}" cy="${cy}" r="${trimR}" class="trim-line" />`;
  const bleedPath = `<circle cx="${cx}" cy="${cy}" r="${trimR + bleedPx}" class="bleed-line" />`;
  const safePath = `<circle cx="${cx}" cy="${cy}" r="${trimR - safePx}" class="safe-line" />`;

  return { trimPath, bleedPath, safePath };
}

function getTrimFill(
  shape: ProductShape,
  trimW: number,
  trimH: number,
  trimX: number,
  trimY: number
) {
  switch (shape) {
    case 'circle':
    case 'bottle-cap': {
      const cx = trimX + trimW / 2;
      const cy = trimY + trimH / 2;
      const r = Math.min(trimW, trimH) / 2;
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" />`;
    }
    case 'can':
    case 'shield':
    case 'arrow': {
      const d = silhouetteD(shape, { x: trimX, y: trimY, w: trimW, h: trimH });
      return `<path d="${d}" fill="#ffffff" />`;
    }
    default: {
      const r = cornerRadius(shape, trimW, trimH);
      return `<rect x="${trimX}" y="${trimY}" width="${trimW}" height="${trimH}" rx="${r}" fill="#ffffff" />`;
    }
  }
}

/**
 * Corner radius for the rectangular family. License plates and street
 * signs are noticeably rounded on the real product; squares, rectangles
 * and die-cut bounding boxes are near-square.
 */
export function cornerRadius(shape: ProductShape, w: number, h: number): number {
  const min = Math.min(w, h);
  switch (shape) {
    case 'license-plate':
      return n(min * 0.08);
    case 'street-sign':
      return n(min * 0.06);
    default:
      return n(min * 0.02);
  }
}
