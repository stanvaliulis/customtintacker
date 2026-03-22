import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseConfigured, isBlobConfigured } from '@/lib/env';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

/** Allowed MIME types for design asset uploads. */
const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
  'application/pdf',
  'application/postscript',       // AI / EPS
  'application/illustrator',
  'image/vnd.adobe.photoshop',    // PSD
  'application/x-photoshop',
]);

/** Also allow by extension for types that browsers may not recognise. */
const ALLOWED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.tif',
  '.pdf', '.ai', '.psd', '.eps',
]);

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const sessionId = (formData.get('sessionId') as string) || 'anonymous';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 25 MB.` },
        { status: 400 },
      );
    }

    // Validate type
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_TYPES.has(file.type) && !ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Accepted: images, PDF, AI, PSD, EPS, SVG.' },
        { status: 400 },
      );
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    let url: string;

    // ── Upload to Vercel Blob if configured ──────────────────────────
    if (isBlobConfigured()) {
      const { put } = await import('@vercel/blob');
      const blob = await put(
        `designs/${sessionId}/${timestamp}-${safeName}`,
        file,
        { access: 'public' },
      );
      url = blob.url;
    } else {
      // ── Fallback: save to public/uploads/ ──────────────────────────
      const dir = path.join(process.cwd(), 'public', 'uploads', sessionId);
      await mkdir(dir, { recursive: true });
      const filename = `${timestamp}-${safeName}`;
      const filePath = path.join(dir, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);
      url = `/uploads/${sessionId}/${filename}`;
    }

    // ── Create DB record if configured ───────────────────────────────
    let recordId = `asset-${timestamp}`;

    if (isDatabaseConfigured()) {
      try {
        const { prisma } = await import('@/lib/db');
        const asset = await prisma.designAsset.create({
          data: {
            sessionId,
            filename: safeName,
            url,
            fileType: file.type || ext,
            fileSize: file.size,
          },
        });
        recordId = asset.id;
      } catch (err) {
        console.error('Design upload DB error (non-fatal):', err);
      }
    }

    return NextResponse.json({
      id: recordId,
      url,
      filename: safeName,
      fileType: file.type || ext,
      fileSize: file.size,
    });
  } catch (err) {
    console.error('Design upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
