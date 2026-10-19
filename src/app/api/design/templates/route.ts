import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/env';
import { getTemplatesByShape } from '@/data/design-templates';

export async function GET(req: NextRequest) {
  const shape = req.nextUrl.searchParams.get('shape') || undefined;
  const builtIn = getTemplatesByShape(shape);
  // Updated built-ins always win; retain active custom database templates by ID.
  if (isDatabaseConfigured()) {
    try {
      const { prisma } = await import('@/lib/db');
      const custom = await prisma.designTemplate.findMany({ where: { isActive: true, ...(shape ? { shape } : {}) }, orderBy: { sortOrder: 'asc' } });
      return NextResponse.json([...builtIn, ...custom.filter(t => !builtIn.some(b => b.id === t.id))]);
    } catch { /* Built-in templates remain available during a database outage. */ }
  }
  return NextResponse.json(builtIn);
}
