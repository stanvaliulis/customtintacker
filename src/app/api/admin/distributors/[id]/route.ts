import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { isDatabaseConfigured } from '@/lib/env';
import { readJsonFile, writeJsonFile } from '@/lib/json-store';
import { sendEmailTo, canSendSensitiveEmail } from '@/lib/email';
import { distributorRejectionEmail } from '@/lib/email-templates';
import { approveDistributorSetup, durableDistributorAccountsEnabled } from '@/lib/distributor-accounts';
import { distributorRecoveryEnabled } from '@/lib/distributor-recovery';
import { isSameOriginAdminMutation } from '@/lib/admin-review';

interface DistributorRecord {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  asiNumber: string;
  sageNumber: string;
  ppaiNumber: string;
  estimatedVolume: string;
  primaryIndustry: string;
  referralSource: string;
  additionalNotes: string;
  agreeTerms: boolean;
  status: string;
  submittedAt: string;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  if (isDatabaseConfigured()) {
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

  // JSON file fallback
  const distributors = readJsonFile<DistributorRecord[]>('distributors.json', []);
  const app = distributors.find((d) => d.id === id);
  if (!app) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(app);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSameOriginAdminMutation(req)) return NextResponse.json({error: 'Forbidden'}, {status: 403});
  const { id } = await params;
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({error: 'Invalid request'}, {status: 400}); }
  const { status, confirmApproval } = body || {};
  if (!['pending', 'approved', 'rejected'].includes(status)) return NextResponse.json({error: 'Invalid status'}, {status: 400});
  if (status === 'approved') {
    if (confirmApproval !== true) return NextResponse.json({error: 'Explicit approval confirmation required'}, {status: 400});
    if (!durableDistributorAccountsEnabled() || !distributorRecoveryEnabled() || process.env.TIN_DISTRIBUTOR_RECOVERY_MAIL_ENABLED!=='1' || !isDatabaseConfigured()) {
      return NextResponse.json({error: 'Approval unavailable until durable accounts migration is completed'}, {status: 503});
    }
    if (!canSendSensitiveEmail()) return NextResponse.json({error: 'Approval unavailable: credential email provider is not configured'}, {status: 503});
    try {
      const a = await approveDistributorSetup(id);
      return NextResponse.json({id:a.id,status:a.status,notificationQueued:true,setupRequired:true});
    } catch {
      return NextResponse.json({error: 'Approval was not completed. Check pending status, existing account, and database readiness.'}, {status: 409});
    }
  }

  if (isDatabaseConfigured()) {
    try {
      const { prisma } = await import('@/lib/db');
      const a = await prisma.distributorApplication.update({ where: { id }, data: { status } });



      if (status === 'rejected') {
        await sendEmailTo(
          a.email,
          distributorRejectionEmail({
            contactName: a.contactName,
            companyName: a.companyName,
          })
        );
      }

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

  // JSON file fallback (no database)
  const distributors = readJsonFile<DistributorRecord[]>('distributors.json', []);
  const index = distributors.findIndex((d) => d.id === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  distributors[index] = { ...distributors[index], status };
  writeJsonFile('distributors.json', distributors);

  const app = distributors[index];
  try {

    if (status === 'rejected') {
      await sendEmailTo(
        app.email,
        distributorRejectionEmail({
          contactName: app.contactName,
          companyName: app.companyName,
        })
      );
    }
  } catch (emailErr) {
    console.error('Email send failed:', emailErr);
  }

  return NextResponse.json(app);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSameOriginAdminMutation(req)) return NextResponse.json({error: 'Forbidden'}, {status: 403});
  const { id } = await params;

  if (isDatabaseConfigured()) {
    try {
      const { prisma } = await import('@/lib/db');
      await prisma.distributorApplication.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  }

  // JSON file fallback
  const distributors = readJsonFile<DistributorRecord[]>('distributors.json', []);
  const index = distributors.findIndex((d) => d.id === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  distributors.splice(index, 1);
  writeJsonFile('distributors.json', distributors);
  return NextResponse.json({ ok: true });
}
