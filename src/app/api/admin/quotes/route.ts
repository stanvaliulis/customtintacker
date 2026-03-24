import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { isDatabaseConfigured } from '@/lib/env';
import { readJsonFile } from '@/lib/json-store';

interface QuoteRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  size: string;
  quantity: number;
  backing?: string;
  colors?: string;
  notes?: string;
  status: string;
  submittedAt: string;
}

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

  // JSON file fallback
  const quotes = readJsonFile<QuoteRecord[]>('quotes.json', []);
  return NextResponse.json(quotes);
}
