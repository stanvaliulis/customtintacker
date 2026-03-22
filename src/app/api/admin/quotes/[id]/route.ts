import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { isDatabaseConfigured } from '@/lib/env';

const VALID_STATUSES = ['new', 'reviewed', 'quoted', 'accepted', 'declined'];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { id } = await params;
  try {
    const { prisma } = await import('@/lib/db');
    await prisma.quote.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  }
}
