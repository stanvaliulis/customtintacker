import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { isDatabaseConfigured } from '@/lib/env';
import { readJsonFile, writeJsonFile } from '@/lib/json-store';
import { sendEmailTo } from '@/lib/email';
import { distributorApprovalEmail, distributorRejectionEmail } from '@/lib/email-templates';
import { upsertDistributor } from '@/lib/distributors';
import crypto from 'crypto';

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

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(crypto.randomInt(chars.length));
  }
  password += '!' + crypto.randomInt(10);
  return password;
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

  const { id } = await params;
  const { status } = await req.json();

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  if (isDatabaseConfigured()) {
    try {
      const { prisma } = await import('@/lib/db');
      const a = await prisma.distributorApplication.update({ where: { id }, data: { status } });

      if (status === 'approved') {
        const tempPassword = generateTempPassword();

        // Save credentials to data/distributors.json so they can log in
        upsertDistributor({
          email: a.email,
          password: tempPassword,
          companyName: a.companyName,
          contactName: a.contactName,
          asiNumber: a.asiNumber || '',
          sageNumber: a.sageNumber || '',
          ppaiNumber: a.ppaiNumber || '',
          discountTier: 0.40,
          status: 'approved',
          createdAt: new Date().toISOString(),
        });

        // Update DB notes to reflect approval
        await prisma.distributorApplication.update({
          where: { id },
          data: { notes: `Approved. Login credentials generated.` },
        });

        // Send approval email with temp password and login URL
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
    if (status === 'approved') {
      const tempPassword = generateTempPassword();

      // Save login credentials to the distributor credential store
      upsertDistributor({
        email: app.email,
        password: tempPassword,
        companyName: app.companyName,
        contactName: app.contactName,
        asiNumber: app.asiNumber || '',
        sageNumber: app.sageNumber || '',
        ppaiNumber: app.ppaiNumber || '',
        discountTier: 0.40,
        status: 'approved',
        createdAt: new Date().toISOString(),
      });

      await sendEmailTo(
        app.email,
        distributorApprovalEmail({
          contactName: app.contactName,
          companyName: app.companyName,
          email: app.email,
          tempPassword,
        })
      );
    }
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
