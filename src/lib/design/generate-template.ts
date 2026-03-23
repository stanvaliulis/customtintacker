import type { ProductShape } from '@/types/product';
import { BLEED_INCHES, SAFE_AREA_INCHES } from './bleed';

/**
 * Pixels per inch for the template SVG coordinate system.
 * We use 72 PPI to keep file sizes small; the template is vector-based
 * so it scales to any resolution.
 */
const PPI = 72;

interface TemplateOptions {
  shape: ProductShape;
  widthInches: number;
  heightInches: number;
  displaySize: string;
  productId: string;
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

  const bleedPx = Math.round(BLEED_INCHES * PPI);
  const safePx = Math.round(SAFE_AREA_INCHES * PPI);
  const trimW = Math.round(widthInches * PPI);
  const trimH = Math.round(heightInches * PPI);

  // Total canvas includes bleed on all sides
  const canvasW = trimW + bleedPx * 2;
  const canvasH = trimH + bleedPx * 2;

  // Offsets from canvas origin
  const trimX = bleedPx;
  const trimY = bleedPx;

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
    default:
      return getRectPaths(trimW, trimH, trimX, trimY, bleedPx, safePx);
  }
}

function getRectPaths(
  trimW: number,
  trimH: number,
  trimX: number,
  trimY: number,
  bleedPx: number,
  safePx: number
) {
  const r = Math.min(trimW, trimH) * 0.02;

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
    default: {
      const r = Math.min(trimW, trimH) * 0.02;
      return `<rect x="${trimX}" y="${trimY}" width="${trimW}" height="${trimH}" rx="${r}" fill="#ffffff" />`;
    }
  }
}
