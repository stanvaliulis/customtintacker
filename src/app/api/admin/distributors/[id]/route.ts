import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { isDatabaseConfigured } from '@/lib/env';
import { sendEmailTo } from '@/lib/email';
import { distributorApprovalEmail, distributorRejectionEmail } from '@/lib/email-templates';
import crypto from 'crypto';

function generateTempPassword(): string {
  // 12-char password: mix of letters, numbers, and a symbol
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(crypto.randomInt(chars.length));
  }
  // Add a symbol and number to meet complexity requirements
  password += '!' + crypto.randomInt(10);
  return password;
}

function mapApplication(a: Record<string, unknown>) {
  return {
    id: a.id, companyName: a.companyName, contactName: a.contactName, email: a.email,
    phone: a.phone, website: a.website, asiNumber: a.asiNumber, sageNumber: a.sageNumber,
    ppaiNumber: a.ppaiNumber, estimatedVolume: a.monthlyVolume, primaryIndustry: a.primaryIndustry,
    referralSource: a.hearAboutUs, additionalNotes: a.additionalNotes, agreeTerms: a.agreeTerms,
    status: a.status, submittedAt: (a.createdAt as Date).toISOString(),
  };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { id } = await params;
  try {
    const { prisma } = await import('@/lib/db');
    const a = await prisma.distributorApplication.findUniqueOrThrow({ where: { id } });
    return NextResponse.json(mapApplication(a as unknown as Record<string, unknown>));
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { id } = await params;
  const { status } = await req.json();

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  try {
    const { prisma } = await import('@/lib/db');
    const a = await prisma.distributorApplication.update({ where: { id }, data: { status } });

    // Send approval email with login credentials
    if (status === 'approved') {
      const tempPassword = generateTempPassword();

      // Store the temp password hash in the notes field for reference
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      await prisma.distributorApplication.update({
        where: { id },
        data: { notes: `Temp password hash: ${hashedPassword}` },
      });

      await sendEmailTo(
        a.email,
        distributorApprovalEmail({
          contactName: a.contactName,
          companyName: a.companyName,
          email: a.email,
          tempPassword,
        })
      );
    }

    // Send rejection email
    if (status === 'rejected') {
      await sendEmailTo(
        a.email,
        distributorRejectionEmail({
          contactName: a.contactName,
          companyName: a.companyName,
        })
      );
    }

    return NextResponse.json(mapApplication(a as unknown as Record<string, unknown>));
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
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
    await prisma.distributorApplication.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
