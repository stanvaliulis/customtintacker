import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { isDatabaseConfigured } from '@/lib/env';

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
    return NextResponse.json({
      id: a.id, companyName: a.companyName, contactName: a.contactName, email: a.email,
      phone: a.phone, website: a.website, asiNumber: a.asiNumber, sageNumber: a.sageNumber,
      ppaiNumber: a.ppaiNumber, estimatedVolume: a.monthlyVolume, primaryIndustry: a.primaryIndustry,
      referralSource: a.hearAboutUs, additionalNotes: a.additionalNotes, agreeTerms: a.agreeTerms,
      status: a.status, submittedAt: a.createdAt.toISOString(),
    });
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
    return NextResponse.json({
      id: a.id, companyName: a.companyName, contactName: a.contactName, email: a.email,
      phone: a.phone, website: a.website, asiNumber: a.asiNumber, sageNumber: a.sageNumber,
      ppaiNumber: a.ppaiNumber, estimatedVolume: a.monthlyVolume, primaryIndustry: a.primaryIndustry,
      referralSource: a.hearAboutUs, additionalNotes: a.additionalNotes, agreeTerms: a.agreeTerms,
      status: a.status, submittedAt: a.createdAt.toISOString(),
    });
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
