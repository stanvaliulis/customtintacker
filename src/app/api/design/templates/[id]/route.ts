import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/env';
import { getTemplateById } from '@/data/design-templates';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    // ── Try database first ───────────────────────────────────────────
    if (isDatabaseConfigured()) {
      try {
        const { prisma } = await import('@/lib/db');
        const template = await prisma.designTemplate.findUnique({
          where: { id },
        });

        if (template) {
          return NextResponse.json(template);
        }
      } catch (err) {
        console.error('Design template DB error:', err);
      }
    }

    // ── Fallback: static template data ───────────────────────────────
    const staticTemplate = getTemplateById(id);

    if (staticTemplate) {
      return NextResponse.json(staticTemplate);
    }

    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  } catch (err) {
    console.error('Design template detail error:', err);
    return NextResponse.json({ error: 'Failed to load template' }, { status: 500 });
  }
}
