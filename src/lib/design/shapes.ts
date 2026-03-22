import type { ProductShape } from '@/types/product';

/**
 * Shape definition for the design editor clip-path system.
 * Each shape provides functions to generate SVG path data and viewBox
 * strings scaled to the actual product dimensions (in pixels).
 */
export interface ShapeDefinition {
  id: ProductShape;
  label: string;
  /** Returns an SVG path string for the cut line */
  getPath: (widthPx: number, heightPx: number) => string;
  /** Returns a viewBox string like "0 0 W H" */
  getViewBox: (widthPx: number, heightPx: number) => string;
}

// ─── Helper: simple viewBox from pixel dimensions ──────────────────
function vbox(w: number, h: number): string {
  return `0 0 ${w} ${h}`;
}

// ─── Square ────────────────────────────────────────────────────────
const square: ShapeDefinition = {
  id: 'square',
  label: 'Square',
  getPath(w, h) {
    const r = Math.min(w, h) * 0.02; // subtle corner radius
    return (
      `M ${r},0` +
      ` L ${w - r},0 Q ${w},0 ${w},${r}` +
      ` L ${w},${h - r} Q ${w},${h} ${w - r},${h}` +
      ` L ${r},${h} Q 0,${h} 0,${h - r}` +
      ` L 0,${r} Q 0,0 ${r},0 Z`
    );
  },
  getViewBox: vbox,
};

// ─── Rectangle ─────────────────────────────────────────────────────
const rectangle: ShapeDefinition = {
  id: 'rectangle',
  label: 'Rectangle',
  getPath(w, h) {
    const r = Math.min(w, h) * 0.02;
    return (
      `M ${r},0` +
      ` L ${w - r},0 Q ${w},0 ${w},${r}` +
      ` L ${w},${h - r} Q ${w},${h} ${w - r},${h}` +
      ` L ${r},${h} Q 0,${h} 0,${h - r}` +
      ` L 0,${r} Q 0,0 ${r},0 Z`
    );
  },
  getViewBox: vbox,
};

// ─── Circle ────────────────────────────────────────────────────────
const circle: ShapeDefinition = {
  id: 'circle',
  label: 'Circle',
  getPath(w, h) {
    // Draw a circle inscribed in the bounding box
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(cx, cy);
    // Circle as two arcs
    return (
      `M ${cx - r},${cy}` +
      ` A ${r},${r} 0 1,1 ${cx + r},${cy}` +
      ` A ${r},${r} 0 1,1 ${cx - r},${cy} Z`
    );
  },
  getViewBox: vbox,
};

// ─── Can Shape ─────────────────────────────────────────────────────
// Tall narrow can shape with curved dome top and slight taper
// (based on canPath from ProductImagePlaceholder)
const can: ShapeDefinition = {
  id: 'can',
  label: 'Can Shape',
  getPath(w, h) {
    const cx = w / 2;
    const halfW = w * 0.4;
    const topR = w * 0.1;
    const botR = w * 0.04;
    const domeH = h * 0.045;
    const topY = 0;
    const botY = h;

    return [
      `M ${cx - halfW + topR},${topY + domeH}`,
      `Q ${cx - halfW + topR},${topY} ${cx},${topY}`,
      `Q ${cx + halfW - topR},${topY} ${cx + halfW - topR},${topY + domeH}`,
      `L ${cx + halfW},${topY + domeH + h * 0.05}`,
      `L ${cx + halfW},${botY - botR}`,
      `Q ${cx + halfW},${botY} ${cx + halfW - botR},${botY}`,
      `L ${cx - halfW + botR},${botY}`,
      `Q ${cx - halfW},${botY} ${cx - halfW},${botY - botR}`,
      `L ${cx - halfW},${topY + domeH + h * 0.05}`,
      'Z',
    ].join(' ');
  },
  getViewBox: vbox,
};

// ─── Bottle Cap ────────────────────────────────────────────────────
// Star-like serrated edge (based on bottleCapPoints from ProductImagePlaceholder)
const bottleCap: ShapeDefinition = {
  id: 'bottle-cap',
  label: 'Bottle Cap',
  getPath(w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const outerR = Math.min(cx, cy);
    const innerR = outerR * 0.91; // ratio from original (155/170)
    const teeth = 32;

    const segments: string[] = [];
    for (let i = 0; i < teeth; i++) {
      const outerAngle = (i * 2 * Math.PI) / teeth - Math.PI / 2;
      const innerAngle = ((i + 0.5) * 2 * Math.PI) / teeth - Math.PI / 2;

      const ox = cx + Math.cos(outerAngle) * outerR;
      const oy = cy + Math.sin(outerAngle) * outerR;
      const ix = cx + Math.cos(innerAngle) * innerR;
      const iy = cy + Math.sin(innerAngle) * innerR;

      if (i === 0) {
        segments.push(`M ${ox},${oy}`);
      } else {
        segments.push(`L ${ox},${oy}`);
      }
      segments.push(`L ${ix},${iy}`);
    }
    segments.push('Z');
    return segments.join(' ');
  },
  getViewBox: vbox,
};

// ─── Die-Cut ───────────────────────────────────────────────────────
// Organic irregular custom shape (based on dieCutPath from ProductImagePlaceholder)
const dieCut: ShapeDefinition = {
  id: 'die-cut',
  label: 'Custom Die-Cut',
  getPath(w, h) {
    const cx = w / 2;
    const cy = h / 2;
    // Scale factors relative to a 400x400 base where original radius ~165
    const sx = w / 400;
    const sy = h / 400;

    function px(dx: number): number { return cx + dx * sx; }
    function py(dy: number): number { return cy + dy * sy; }

    return [
      `M ${px(-40)},${py(-160)}`,
      `C ${px(-140)},${py(-155)} ${px(-165)},${py(-100)} ${px(-155)},${py(-50)}`,
      `C ${px(-148)},${py(-10)} ${px(-170)},${py(20)} ${px(-150)},${py(70)}`,
      `C ${px(-130)},${py(120)} ${px(-100)},${py(155)} ${px(-40)},${py(160)}`,
      `C ${px(0)},${py(165)} ${px(50)},${py(150)} ${px(90)},${py(140)}`,
      `C ${px(140)},${py(125)} ${px(165)},${py(80)} ${px(160)},${py(30)}`,
      `C ${px(155)},${py(-20)} ${px(170)},${py(-70)} ${px(150)},${py(-120)}`,
      `C ${px(130)},${py(-160)} ${px(60)},${py(-165)} ${px(-40)},${py(-160)}`,
      'Z',
    ].join(' ');
  },
  getViewBox: vbox,
};

// ─── Shield ────────────────────────────────────────────────────────
// Based on shieldPath from ProductImagePlaceholder
const shield: ShapeDefinition = {
  id: 'shield',
  label: 'Shield',
  getPath(w, h) {
    const cx = w / 2;
    const cy = h / 2;
    // Original shield used w=140 spread, total height ~(topH+bodyH)*2 + pointH ≈ 400
    const sx = w / 360;
    const sy = h / 440;

    const shieldW = 140 * sx;
    const topH = 30 * sy;
    const bodyH = 140 * sy;
    const pointH = 60 * sy;

    return [
      `M ${cx},${cy - topH - bodyH}`,
      `C ${cx + shieldW * 0.3},${cy - topH - bodyH - 8 * sy} ${cx + shieldW * 0.7},${cy - topH - bodyH + 5 * sy} ${cx + shieldW},${cy - bodyH}`,
      `L ${cx + shieldW},${cy + bodyH * 0.3}`,
      `C ${cx + shieldW},${cy + bodyH * 0.6} ${cx + shieldW * 0.6},${cy + bodyH * 0.85} ${cx},${cy + bodyH + pointH}`,
      `C ${cx - shieldW * 0.6},${cy + bodyH * 0.85} ${cx - shieldW},${cy + bodyH * 0.6} ${cx - shieldW},${cy + bodyH * 0.3}`,
      `L ${cx - shieldW},${cy - bodyH}`,
      `C ${cx - shieldW * 0.7},${cy - topH - bodyH + 5 * sy} ${cx - shieldW * 0.3},${cy - topH - bodyH - 8 * sy} ${cx},${cy - topH - bodyH}`,
      'Z',
    ].join(' ');
  },
  getViewBox: vbox,
};

// ─── Arrow ─────────────────────────────────────────────────────────
// Based on arrowPoints from ProductImagePlaceholder
const arrow: ShapeDefinition = {
  id: 'arrow',
  label: 'Arrow',
  getPath(w, h) {
    const cx = w / 2;
    const cy = h / 2;
    // Original arrow in 500x320 viewBox: bodyW=160, bodyH=90, pointW=70
    const sx = w / 500;
    const sy = h / 320;

    const bodyW = 160 * sx;
    const bodyH = 90 * sy;
    const pointW = 70 * sx;
    const notch = 30 * sx;

    // Polygon path
    return [
      `M ${cx - bodyW - 10 * sx},${cy - bodyH * 0.55}`,
      `L ${cx + bodyW},${cy - bodyH * 0.55}`,
      `L ${cx + bodyW + pointW},${cy}`,
      `L ${cx + bodyW},${cy + bodyH * 0.55}`,
      `L ${cx - bodyW - 10 * sx},${cy + bodyH * 0.55}`,
      `L ${cx - bodyW - notch},${cy}`,
      'Z',
    ].join(' ');
  },
  getViewBox: vbox,
};

// ─── Street Sign ───────────────────────────────────────────────────
// Wide rectangular with rounded corners (thin profile)
const streetSign: ShapeDefinition = {
  id: 'street-sign',
  label: 'Street Sign',
  getPath(w, h) {
    const r = Math.min(w, h) * 0.05;
    return (
      `M ${r},0` +
      ` L ${w - r},0 Q ${w},0 ${w},${r}` +
      ` L ${w},${h - r} Q ${w},${h} ${w - r},${h}` +
      ` L ${r},${h} Q 0,${h} 0,${h - r}` +
      ` L 0,${r} Q 0,0 ${r},0 Z`
    );
  },
  getViewBox: vbox,
};

// ─── License Plate ─────────────────────────────────────────────────
// Wider rectangle with more pronounced rounded corners
const licensePlate: ShapeDefinition = {
  id: 'license-plate',
  label: 'License Plate',
  getPath(w, h) {
    const r = Math.min(w, h) * 0.06;
    return (
      `M ${r},0` +
      ` L ${w - r},0 Q ${w},0 ${w},${r}` +
      ` L ${w},${h - r} Q ${w},${h} ${w - r},${h}` +
      ` L ${r},${h} Q 0,${h} 0,${h - r}` +
      ` L 0,${r} Q 0,0 ${r},0 Z`
    );
  },
  getViewBox: vbox,
};

// ─── All shapes indexed by ProductShape id ─────────────────────────
export const SHAPE_DEFINITIONS: Record<ProductShape, ShapeDefinition> = {
  'square': square,
  'rectangle': rectangle,
  'circle': circle,
  'can': can,
  'bottle-cap': bottleCap,
  'die-cut': dieCut,
  'shield': shield,
  'arrow': arrow,
  'street-sign': streetSign,
  'license-plate': licensePlate,
};

/**
 * Get the shape definition for a given ProductShape.
 * Throws if the shape id is unknown.
 */
export function getShapeDefinition(shape: ProductShape): ShapeDefinition {
  const def = SHAPE_DEFINITIONS[shape];
  if (!def) {
    throw new Error(`Unknown shape: ${shape}`);
  }
  return def;
}
