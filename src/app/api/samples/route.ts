import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendNotificationEmail } from '@/lib/email';
import { sampleOrderEmail } from '@/lib/email-templates';

const sampleOrderSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().min(1, 'Email is required.').email('Please enter a valid email address.'),
  phone: z.string().optional().default(''),
  company: z.string().optional().default(''),
  samplePack: z.enum(['basic', 'variety', 'custom'], {
    error: 'Please choose a sample pack.',
  }),
  shippingAddress: z.string().min(1, 'Shipping address is required.'),
  city: z.string().min(1, 'City is required.'),
  state: z.string().min(1, 'State is required.'),
  zip: z.string().min(1, 'ZIP code is required.'),
  notes: z.string().optional().default(''),
});

const SAMPLE_LABELS: Record<string, string> = {
  basic: 'Basic Sample ($15)',
  variety: 'Variety Pack ($35)',
  custom: 'Custom Sample ($25)',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = sampleOrderSchema.safeParse(body);

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

    const orderId = `SAMPLE-${Date.now()}`;

    // Send email notification
    const emailData = {
      id: orderId,
      ...result.data,
      samplePackLabel: SAMPLE_LABELS[result.data.samplePack] || result.data.samplePack,
      submittedAt: new Date().toISOString(),
    };
    await sendNotificationEmail(sampleOrderEmail(emailData));

    return NextResponse.json(
      { message: 'Sample order submitted successfully.', id: orderId },
      { status: 201 },
    );
  } catch (err) {
    console.error('Sample order error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 },
    );
  }
}
