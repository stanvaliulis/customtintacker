import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { BLEED_INCHES, SAFE_AREA_INCHES } from './bleed';
import {
  templateMetrics,
  outlineFor,
  type Outline,
  type TemplateOptions,
} from './generate-template';

/**
 * Print-ready PDF artwork template.
 *
 * The page is the trim size plus bleed on all four sides, at 1pt per pixel —
 * the SVG template uses 72 PPI, and a PDF point is 1/72", so the page comes
 * out at exactly the physical size with no scaling.
 *
 * Geometry comes from the same `outlineFor` used by the SVG template, so the
 * two formats always describe the same dieline.
 */

const BLACK = rgb(0, 0, 0);
const RED = rgb(1, 0, 0);
const GREEN = rgb(0, 0.667, 0);
const GREY = rgb(0.4, 0.4, 0.4);
const LIGHT = rgb(0.53, 0.53, 0.53);
const AMBER = rgb(0.76, 0.42, 0);

/** Convert any outline into an SVG path string so one draw path handles all. */
function toPath(o: Outline): string {
  const n = (v: number) => Math.round(v * 100) / 100;

  if (o.kind === 'path') return o.d;

  if (o.kind === 'circle') {
    const { cx, cy, r } = o;
    return [
      `M ${n(cx - r)} ${n(cy)}`,
      `A ${n(r)} ${n(r)} 0 1 0 ${n(cx + r)} ${n(cy)}`,
      `A ${n(r)} ${n(r)} 0 1 0 ${n(cx - r)} ${n(cy)}`,
      'Z',
    ].join(' ');
  }

  const { x, y, w, h } = o;
  const r = Math.min(o.r, w / 2, h / 2);
  if (r <= 0) return `M ${n(x)} ${n(y)} H ${n(x + w)} V ${n(y + h)} H ${n(x)} Z`;
  return [
    `M ${n(x + r)} ${n(y)}`,
    `H ${n(x + w - r)}`,
    `Q ${n(x + w)} ${n(y)} ${n(x + w)} ${n(y + r)}`,
    `V ${n(y + h - r)}`,
    `Q ${n(x + w)} ${n(y + h)} ${n(x + w - r)} ${n(y + h)}`,
    `H ${n(x + r)}`,
    `Q ${n(x)} ${n(y + h)} ${n(x)} ${n(y + h - r)}`,
    `V ${n(y + r)}`,
    `Q ${n(x)} ${n(y)} ${n(x + r)} ${n(y)}`,
    'Z',
  ].join(' ');
}

export async function generateTemplatePDF(options: TemplateOptions): Promise<Uint8Array> {
  const { shape, widthInches, heightInches, displaySize, productId } = options;
  const m = templateMetrics(widthInches, heightInches);

  const doc = await PDFDocument.create();
  doc.setTitle(`${displaySize} ${shape} tin tacker artwork template`);
  doc.setSubject(`Trim ${widthInches}" x ${heightInches}" — bleed ${BLEED_INCHES}" — safe area ${SAFE_AREA_INCHES}"`);
  doc.setProducer('customtintackers.com');
  doc.setCreator('customtintackers.com');
  doc.setKeywords([productId, shape, displaySize, 'artwork template', 'dieline']);

  const page = doc.addPage([m.canvasW, m.canvasH]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // SVG paths are y-down; anchoring at the page top makes them line up.
  const top = m.canvasH;
  const draw = (
    o: Outline,
    opts: { border: ReturnType<typeof rgb>; dash?: number[]; width?: number; fill?: ReturnType<typeof rgb> }
  ) =>
    page.drawSvgPath(toPath(o), {
      x: 0,
      y: top,
      borderColor: opts.border,
      borderWidth: opts.width ?? 1,
      borderDashArray: opts.dash,
      color: opts.fill,
    });

  // Bleed area background, then the white trim area
  page.drawRectangle({ x: 0, y: 0, width: m.canvasW, height: m.canvasH, color: rgb(0.96, 0.96, 0.96) });
  draw(outlineFor(shape, m, 0), { border: rgb(1, 1, 1), width: 0, fill: rgb(1, 1, 1) });

  // Guides: bleed outside, trim on the cut, safe area inside
  draw(outlineFor(shape, m, -m.bleedPx), { border: RED, dash: [6, 3] });
  draw(outlineFor(shape, m, 0), { border: BLACK, width: 1.5 });
  draw(outlineFor(shape, m, m.safePx), { border: GREEN, dash: [4, 4] });

  // Centre labels — PDF text is y-up, so measure down from the top
  const shapeLabel = shape.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const centre = (text: string, dy: number, size: number, f = font, color = LIGHT) => {
    const w = f.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (m.canvasW - w) / 2, y: top - m.canvasH / 2 - dy, size, font: f, color });
  };

  centre('YOUR ARTWORK HERE', -6, 18, bold, rgb(0.53, 0.53, 0.53));
  centre(`${displaySize} ${shapeLabel} Tin Tacker`, 12, 11);
  centre('customtintackers.com', 28, 9, font, rgb(0.73, 0.73, 0.73));

  if (shape === 'die-cut') {
    centre('Custom die-cut: the box is the maximum artwork area, not the cut line.', 48, 9, font, AMBER);
    centre('Fill it edge to edge - the final die follows your approved outline.', 61, 9, font, AMBER);
  }

  // Legend, bottom-left inside the trim area
  const legend = [
    { label: `Bleed (${BLEED_INCHES}")`, color: RED, dash: [6, 3] as number[] | undefined },
    { label: 'Trim / Cut Line', color: BLACK, dash: undefined },
    { label: `Safe Area (${SAFE_AREA_INCHES}")`, color: GREEN, dash: [4, 4] as number[] | undefined },
  ];
  legend.forEach((row, i) => {
    const y = m.bleedPx + 40 - i * 14;
    page.drawLine({
      start: { x: m.trimX + 8, y },
      end: { x: m.trimX + 33, y },
      thickness: 1,
      color: row.color,
      dashArray: row.dash,
    });
    page.drawText(row.label, { x: m.trimX + 38, y: y - 3, size: 8, font, color: row.color });
  });

  // Dimensions
  page.drawText(`${widthInches}"`, {
    x: m.canvasW / 2 - font.widthOfTextAtSize(`${widthInches}"`, 10) / 2,
    y: top - m.trimY + 8,
    size: 10,
    font,
    color: GREY,
  });
  page.drawText(`${heightInches}"`, {
    x: m.trimX + m.trimW + 6,
    y: m.canvasH / 2,
    size: 10,
    font,
    color: GREY,
  });

  return doc.save();
}
