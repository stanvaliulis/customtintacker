import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { isDatabaseConfigured } from '@/lib/env';
import { readJsonFile, writeJsonFile } from '@/lib/json-store';

interface ContactRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  status: string;
  submittedAt: string;
}

const VALID_STATUSES = ['new', 'read', 'replied', 'archived'];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  if (isDatabaseConfigured()) {
    try {
      const { prisma } = await import('@/lib/db');
      const c = await prisma.contact.findUniqueOrThrow({ where: { id } });
      return NextResponse.json({
        id: c.id, name: c.name, email: c.email, phone: c.phone,
        company: c.company, message: c.message, status: c.status,
        submittedAt: c.createdAt.toISOString(),
      });
    } catch {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
  }

  // JSON file fallback
  const contacts = readJsonFile<ContactRecord[]>('contacts.json', []);
  const contact = contacts.find((c) => c.id === id);
  if (!contact) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }
  return NextResponse.json(contact);
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

  // JSON file fallback
  const contacts = readJsonFile<ContactRecord[]>('contacts.json', []);
  const index = contacts.findIndex((c) => c.id === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }
  contacts[index] = { ...contacts[index], status };
  writeJsonFile('contacts.json', contacts);
  return NextResponse.json(contacts[index]);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  if (isDatabaseConfigured()) {
    try {
      const { prisma } = await import('@/lib/db');
      await prisma.contact.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
  }

  // JSON file fallback
  const contacts = readJsonFile<ContactRecord[]>('contacts.json', []);
  const index = contacts.findIndex((c) => c.id === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }
  contacts.splice(index, 1);
  writeJsonFile('contacts.json', contacts);
  return NextResponse.json({ ok: true });
}
