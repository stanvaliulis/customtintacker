import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { isDatabaseConfigured } from '@/lib/env';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (isDatabaseConfigured()) {
    try {
      const { prisma } = await import('@/lib/db');
      const quotes = await prisma.quote.findMany({ orderBy: { createdAt: 'desc' } });
      const mapped = quotes.map((q) => ({
        id: q.id,
        name: q.name,
        email: q.email,
        phone: q.phone,
        company: q.company,
        size: q.size,
        quantity: q.quantity,
        backing: q.backing,
        colors: q.colors,
        notes: q.message,
        status: q.status,
        submittedAt: q.createdAt.toISOString(),
      }));
      return NextResponse.json(mapped);
    } catch (err) {
      console.error('Quotes API error:', err);
    }
  }

  return NextResponse.json([]);
}
