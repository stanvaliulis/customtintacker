import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/env';
import { getTemplatesByShape } from '@/data/design-templates';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shape = searchParams.get('shape') || undefined;

    // ── Try database first ───────────────────────────────────────────
    if (isDatabaseConfigured()) {
      try {
        const { prisma } = await import('@/lib/db');

        const where: Record<string, unknown> = { isActive: true };
        if (shape) where.shape = shape;

        const templates = await prisma.designTemplate.findMany({
          where,
          select: {
            id: true,
            name: true,
            slug: true,
            shape: true,
            width: true,
            height: true,
            thumbnail: true,
            category: true,
            tags: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: 'asc' },
        });

        if (templates.length > 0) {
          return NextResponse.json(templates);
        }
      } catch (err) {
        console.error('Design templates DB error:', err);
      }
    }

    // ── Fallback: static template data ───────────────────────────────
    const staticTemplates = getTemplatesByShape(shape);

    const result = staticTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      shape: t.shape,
      width: t.width,
      height: t.height,
      thumbnail: t.thumbnail,
      category: t.category,
      tags: t.tags,
      sortOrder: t.sortOrder,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error('Design templates error:', err);
    return NextResponse.json({ error: 'Failed to load templates' }, { status: 500 });
  }
}
