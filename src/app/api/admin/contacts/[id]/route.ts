import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { isDatabaseConfigured } from '@/lib/env';

const VALID_STATUSES = ['new', 'read', 'replied', 'archived'];

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
    const contact = await prisma.contact.update({ where: { id }, data: { status } });
    return NextResponse.json({
      id: contact.id, name: contact.name, email: contact.email, phone: contact.phone,
      company: contact.company, message: contact.message, status: contact.status,
      submittedAt: contact.createdAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
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
    await prisma.contact.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }
}
