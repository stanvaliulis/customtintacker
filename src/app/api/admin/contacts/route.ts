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
      const contacts = await prisma.contact.findMany({ orderBy: { createdAt: 'desc' } });
      const mapped = contacts.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        company: c.company,
        message: c.message,
        status: c.status,
        submittedAt: c.createdAt.toISOString(),
      }));
      return NextResponse.json(mapped);
    } catch (err) {
      console.error('Contacts API error:', err);
    }
  }

  return NextResponse.json([]);
}
