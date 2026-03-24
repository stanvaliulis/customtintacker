import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { isDatabaseConfigured } from '@/lib/env';
import { readJsonFile, writeJsonFile } from '@/lib/json-store';

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

const VALID_STATUSES = ['new', 'reviewed', 'quoted', 'accepted', 'declined'];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  if (isDatabaseConfigured()) {
    try {
      const { prisma } = await import('@/lib/db');
      const q = await prisma.quote.findUniqueOrThrow({ where: { id } });
      return NextResponse.json({
        id: q.id, name: q.name, email: q.email, phone: q.phone,
        company: q.company, size: q.size, quantity: q.quantity,
        backing: q.backing, colors: q.colors, notes: q.message,
        status: q.status, submittedAt: q.createdAt.toISOString(),
      });
    } catch {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }
  }

  // JSON file fallback
  const quotes = readJsonFile<QuoteRecord[]>('quotes.json', []);
  const quote = quotes.find((q) => q.id === id);
  if (!quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  }
  return NextResponse.json(quote);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  if (isDatabaseConfigured()) {
    try {
      const { prisma } = await import('@/lib/db');
      const quote = await prisma.quote.update({ where: { id }, data: { status } });
      return NextResponse.json({
        id: quote.id, name: quote.name, email: quote.email, phone: quote.phone,
        company: quote.company, size: quote.size, quantity: quote.quantity,
        backing: quote.backing, colors: quote.colors, notes: quote.message,
        status: quote.status, submittedAt: quote.createdAt.toISOString(),
      });
    } catch {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }
  }

  // JSON file fallback
  const quotes = readJsonFile<QuoteRecord[]>('quotes.json', []);
  const index = quotes.findIndex((q) => q.id === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  }
  quotes[index] = { ...quotes[index], status };
  writeJsonFile('quotes.json', quotes);
  return NextResponse.json(quotes[index]);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  if (isDatabaseConfigured()) {
    try {
      const { prisma } = await import('@/lib/db');
      await prisma.quote.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }
  }

  // JSON file fallback
  const quotes = readJsonFile<QuoteRecord[]>('quotes.json', []);
  const index = quotes.findIndex((q) => q.id === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  }
  quotes.splice(index, 1);
  writeJsonFile('quotes.json', quotes);
  return NextResponse.json({ ok: true });
}
