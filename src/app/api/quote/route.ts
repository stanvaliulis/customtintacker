import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isDatabaseConfigured } from '@/lib/env';
import { sendNotificationEmail } from '@/lib/email';
import { quoteRequestEmail } from '@/lib/email-templates';

const quoteRequestSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().min(1, 'Email is required.').email('Please enter a valid email address.'),
  phone: z.string().optional().default(''),
  company: z.string().min(1, 'Company name is required.'),
  size: z.string().min(1, 'Please select a size or shape.'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
  backing: z.string().optional().default(''),
  colors: z.string().optional().default(''),
  notes: z.string().optional().default(''),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = quoteRequestSchema.safeParse(body);

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

    let quoteId = `local-${Date.now()}`;

    if (isDatabaseConfigured()) {
      try {
        const { prisma } = await import('@/lib/db');
        const quote = await prisma.quote.create({
          data: {
            name: result.data.name,
            email: result.data.email,
            phone: result.data.phone,
            company: result.data.company,
            size: result.data.size,
            quantity: result.data.quantity,
            backing: result.data.backing,
            colors: result.data.colors,
            message: result.data.notes,
            status: 'new',
          },
        });
        quoteId = quote.id;
      } catch (dbErr) {
        console.error('Quote DB save failed (continuing with email):', dbErr);
      }
    }

    const emailData = {
      id: quoteId,
      ...result.data,
      status: 'new' as const,
      submittedAt: new Date().toISOString(),
    };
    await sendNotificationEmail(quoteRequestEmail(emailData));

    return NextResponse.json({ message: 'Quote request submitted successfully.', id: quoteId }, { status: 201 });
  } catch (err) {
    console.error('Quote request error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again later.' }, { status: 500 });
  }
}
