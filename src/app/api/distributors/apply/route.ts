import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isDatabaseConfigured } from '@/lib/env';
import { sendNotificationEmail } from '@/lib/email';
import { distributorApplicationEmail } from '@/lib/email-templates';

const distributorApplicationSchema = z.object({
  companyName: z.string().min(1, 'Company name is required.'),
  contactName: z.string().min(1, 'Contact name is required.'),
  email: z.string().min(1, 'Email is required.').email('Please enter a valid email address.'),
  phone: z.string().min(1, 'Phone number is required.'),
  website: z.string().optional().default(''),
  asiNumber: z.string().optional().default(''),
  sageNumber: z.string().optional().default(''),
  ppaiNumber: z.string().optional().default(''),
  monthlyVolume: z.string().optional().default(''),
  primaryIndustry: z.string().optional().default(''),
  hearAboutUs: z.string().optional().default(''),
  additionalNotes: z.string().optional().default(''),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions.',
  }),
}).refine(
  (data) => data.asiNumber?.trim() || data.sageNumber?.trim() || data.ppaiNumber?.trim(),
  { message: 'At least one membership number (ASI, SAGE, or PPAI) is required.', path: ['asiNumber'] }
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = distributorApplicationSchema.safeParse(body);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (field && !fieldErrors[String(field)]) {
          fieldErrors[String(field)] = issue.message;
        }
      }
      return NextResponse.json({ error: 'Validation failed', fieldErrors }, { status: 400 });
    }

    let applicationId = `local-${Date.now()}`;

    if (isDatabaseConfigured()) {
      try {
        const { prisma } = await import('@/lib/db');
        const application = await prisma.distributorApplication.create({
          data: {
            companyName: result.data.companyName,
            contactName: result.data.contactName,
            email: result.data.email,
            phone: result.data.phone,
            website: result.data.website,
            asiNumber: result.data.asiNumber,
            sageNumber: result.data.sageNumber,
            ppaiNumber: result.data.ppaiNumber,
            monthlyVolume: result.data.monthlyVolume,
            primaryIndustry: result.data.primaryIndustry,
            hearAboutUs: result.data.hearAboutUs,
            additionalNotes: result.data.additionalNotes,
            agreeTerms: result.data.agreeTerms,
            status: 'pending',
          },
        });
        applicationId = application.id;
      } catch (dbErr) {
        console.error('Distributor DB save failed (continuing with email):', dbErr);
      }
    }

    const emailData = {
      id: applicationId,
      ...result.data,
      status: 'pending' as const,
      submittedAt: new Date().toISOString(),
    };
    await sendNotificationEmail(distributorApplicationEmail(emailData));

    return NextResponse.json({ message: 'Application submitted successfully.', id: applicationId }, { status: 201 });
  } catch (err) {
    console.error('Distributor application error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again later.' }, { status: 500 });
  }
}
