import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseConfigured, isBlobConfigured } from '@/lib/env';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

interface SaveDesignBody {
  sessionId: string;
  email?: string;
  name?: string;
  productId: string;
  shape: string;
  width: number;
  height: number;
  canvasJson: string;
  thumbnailDataUrl?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: SaveDesignBody = await req.json();

    if (!body.sessionId || !body.productId || !body.canvasJson) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, productId, canvasJson' },
        { status: 400 },
      );
    }

    // ── Upload thumbnail if provided ─────────────────────────────────
    let thumbnailUrl = '';

    if (body.thumbnailDataUrl) {
      try {
        // Convert data URL to Buffer
        const matches = body.thumbnailDataUrl.match(
          /^data:image\/(\w+);base64,(.+)$/,
        );
        if (matches) {
          const buffer = Buffer.from(matches[2], 'base64');
          const filename = `thumb-${Date.now()}.png`;

          if (isBlobConfigured()) {
            const { put } = await import('@vercel/blob');
            const blob = await put(
              `designs/${body.sessionId}/thumbnails/${filename}`,
              buffer,
              {
                access: 'public',
                contentType: 'image/png',
              },
            );
            thumbnailUrl = blob.url;
          } else {
            // Fallback: save to public/uploads/
            const dir = path.join(
              process.cwd(),
              'public',
              'uploads',
              body.sessionId,
              'thumbnails',
            );
            await mkdir(dir, { recursive: true });
            const filePath = path.join(dir, filename);
            await writeFile(filePath, buffer);
            thumbnailUrl = `/uploads/${body.sessionId}/thumbnails/${filename}`;
          }
        }
      } catch (err) {
        console.error('Thumbnail upload error (non-fatal):', err);
      }
    }

    // ── Save design to DB or JSON fallback ───────────────────────────
    let designId: string;

    if (isDatabaseConfigured()) {
      const { prisma } = await import('@/lib/db');

      // Upsert: if there is already a design for this session+product, update it
      const existing = await prisma.savedDesign.findFirst({
        where: {
          sessionId: body.sessionId,
          productId: body.productId,
          status: 'draft',
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (existing) {
        const updated = await prisma.savedDesign.update({
          where: { id: existing.id },
          data: {
            email: body.email ?? existing.email,
            name: body.name ?? existing.name,
            shape: body.shape,
            width: body.width,
            height: body.height,
            canvasJson: body.canvasJson,
            thumbnailUrl: thumbnailUrl || existing.thumbnailUrl,
          },
        });
        designId = updated.id;
      } else {
        const created = await prisma.savedDesign.create({
          data: {
            sessionId: body.sessionId,
            email: body.email ?? '',
            name: body.name ?? 'My Design',
            productId: body.productId,
            shape: body.shape,
            width: body.width,
            height: body.height,
            canvasJson: body.canvasJson,
            thumbnailUrl,
          },
        });
        designId = created.id;
      }
    } else {
      // Fallback: save to data/saved-designs/{id}.json
      designId = `design-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const dir = path.join(process.cwd(), 'data', 'saved-designs');
      await mkdir(dir, { recursive: true });

      const record = {
        id: designId,
        sessionId: body.sessionId,
        email: body.email ?? '',
        name: body.name ?? 'My Design',
        productId: body.productId,
        shape: body.shape,
        width: body.width,
        height: body.height,
        canvasJson: body.canvasJson,
        thumbnailUrl,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await writeFile(
        path.join(dir, `${designId}.json`),
        JSON.stringify(record, null, 2),
      );
    }

    return NextResponse.json({ id: designId, thumbnailUrl });
  } catch (err) {
    console.error('Design save error:', err);
    return NextResponse.json({ error: 'Failed to save design' }, { status: 500 });
  }
}
