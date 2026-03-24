import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { isDatabaseConfigured } from '@/lib/env';
import { readJsonFile } from '@/lib/json-store';

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

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (isDatabaseConfigured()) {
    try {
      const { prisma } = await import('@/lib/db');
      const applications = await prisma.distributorApplication.findMany({ orderBy: { createdAt: 'desc' } });
      const mapped = applications.map((a) => ({
        id: a.id,
        companyName: a.companyName,
        contactName: a.contactName,
        email: a.email,
        phone: a.phone,
        website: a.website,
        asiNumber: a.asiNumber,
        sageNumber: a.sageNumber,
        ppaiNumber: a.ppaiNumber,
        estimatedVolume: a.monthlyVolume,
        primaryIndustry: a.primaryIndustry,
        referralSource: a.hearAboutUs,
        additionalNotes: a.additionalNotes,
        agreeTerms: a.agreeTerms,
        status: a.status,
        submittedAt: a.createdAt.toISOString(),
      }));
      return NextResponse.json(mapped);
    } catch (err) {
      console.error('Distributors API error:', err);
    }
  }

  // JSON file fallback
  const distributors = readJsonFile<DistributorRecord[]>('distributors.json', []);
  return NextResponse.json(distributors);
}
