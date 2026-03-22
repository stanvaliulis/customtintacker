import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/env';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Design ID is required' }, { status: 400 });
    }

    // ── Try database first ───────────────────────────────────────────
    if (isDatabaseConfigured()) {
      try {
        const { prisma } = await import('@/lib/db');
        const design = await prisma.savedDesign.findUnique({
          where: { id },
        });

        if (design) {
          return NextResponse.json(design);
        }
      } catch (err) {
        console.error('Design load DB error:', err);
      }
    }

    // ── Fallback: load from JSON file ────────────────────────────────
    try {
      const filePath = path.join(
        process.cwd(),
        'data',
        'saved-designs',
        `${id}.json`,
      );
      const content = await readFile(filePath, 'utf-8');
      return NextResponse.json(JSON.parse(content));
    } catch {
      // File not found
    }

    return NextResponse.json({ error: 'Design not found' }, { status: 404 });
  } catch (err) {
    console.error('Design load error:', err);
    return NextResponse.json({ error: 'Failed to load design' }, { status: 500 });
  }
}
