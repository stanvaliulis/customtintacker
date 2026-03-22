import { NextRequest, NextResponse } from 'next/server';

interface ExportBody {
  canvasJson: string;
  width: number;
  height: number;
  format: 'png' | 'svg';
  dpi?: number;
  dataUrl?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ExportBody = await req.json();

    if (!body.canvasJson || !body.width || !body.height || !body.format) {
      return NextResponse.json(
        { error: 'Missing required fields: canvasJson, width, height, format' },
        { status: 400 },
      );
    }

    // ── PNG export ───────────────────────────────────────────────────
    if (body.format === 'png') {
      // Server-side rendering with node-canvas + Fabric.js is complex
      // and requires native dependencies.  For now the client provides
      // the rendered dataUrl and we return it as a downloadable file.
      if (body.dataUrl) {
        const matches = body.dataUrl.match(
          /^data:image\/(\w+);base64,(.+)$/,
        );
        if (matches) {
          const buffer = Buffer.from(matches[2], 'base64');
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': 'image/png',
              'Content-Disposition': `attachment; filename="design-${Date.now()}.png"`,
              'Content-Length': String(buffer.length),
            },
          });
        }
      }

      // If no dataUrl was provided, return the JSON back for the client
      // to render locally.
      return NextResponse.json({
        message: 'PNG export requires client-side rendering. Please provide dataUrl.',
        canvasJson: body.canvasJson,
      });
    }

    // ── SVG export ───────────────────────────────────────────────────
    if (body.format === 'svg') {
      // Parse the canvas JSON and build a basic SVG
      const dpi = body.dpi || 72;
      const pxWidth = body.width * dpi;
      const pxHeight = body.height * dpi;

      let canvasData: { objects?: Array<Record<string, unknown>>; background?: string };
      try {
        canvasData = JSON.parse(body.canvasJson);
      } catch {
        return NextResponse.json({ error: 'Invalid canvasJson' }, { status: 400 });
      }

      const objects = canvasData.objects || [];
      const bg = canvasData.background || '#ffffff';

      let svgContent = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      svgContent += `<svg xmlns="http://www.w3.org/2000/svg" width="${pxWidth}" height="${pxHeight}" viewBox="0 0 ${pxWidth} ${pxHeight}">\n`;
      svgContent += `  <rect width="100%" height="100%" fill="${bg}" />\n`;

      // Scale factor from template coordinates to output pixels
      const scaleX = pxWidth / (body.width * 10); // templates use 10 px/inch
      const scaleY = pxHeight / (body.height * 10);

      for (const obj of objects) {
        const type = obj.type as string;
        const left = ((obj.left as number) || 0) * scaleX;
        const top = ((obj.top as number) || 0) * scaleY;
        const fill = (obj.fill as string) || 'transparent';
        const stroke = (obj.stroke as string) || 'none';
        const strokeWidth = ((obj.strokeWidth as number) || 0) * Math.min(scaleX, scaleY);

        if (type === 'Rect') {
          const w = ((obj.width as number) || 0) * scaleX;
          const h = ((obj.height as number) || 0) * scaleY;
          const rx = ((obj.rx as number) || 0) * Math.min(scaleX, scaleY);
          svgContent += `  <rect x="${left}" y="${top}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />\n`;
        } else if (type === 'Circle') {
          const r = ((obj.radius as number) || 0) * Math.min(scaleX, scaleY);
          svgContent += `  <circle cx="${left}" cy="${top}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />\n`;
        } else if (type === 'Textbox' || type === 'Text' || type === 'IText') {
          const text = (obj.text as string) || '';
          const fontSize = ((obj.fontSize as number) || 12) * Math.min(scaleX, scaleY);
          const fontWeight = (obj.fontWeight as string) || 'normal';
          const textAnchor = (obj.textAlign as string) === 'center' ? 'middle' : 'start';
          const textFill = fill === 'transparent' ? '#000000' : fill;
          svgContent += `  <text x="${left}" y="${top}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${textFill}" text-anchor="${textAnchor}" dominant-baseline="central">${escapeXml(text)}</text>\n`;
        }
      }

      svgContent += `</svg>`;

      return new NextResponse(svgContent, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Content-Disposition': `attachment; filename="design-${Date.now()}.svg"`,
          'Content-Length': String(Buffer.byteLength(svgContent)),
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
  } catch (err) {
    console.error('Design export error:', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

/** Escape special characters for XML embedding. */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
