import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { sendNotificationEmail } from '@/lib/email';
import { contactFormEmail } from '@/lib/email-templates';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z
    .string()
    .min(1, 'Email is required.')
    .email('Please enter a valid email address.'),
  phone: z.string().optional().default(''),
  company: z.string().optional().default(''),
  message: z.string().min(1, 'Message is required.'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = contactSchema.safeParse(body);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (field && !fieldErrors[String(field)]) {
          fieldErrors[String(field)] = issue.message;
        }
      }
      return NextResponse.json(
        { error: 'Validation failed', fieldErrors },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.create({
      data: {
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone,
        company: result.data.company,
        message: result.data.message,
        status: 'new',
      },
    });

    // Build the object the email template expects (same shape as before)
    const emailData = {
      id: contact.id,
      ...result.data,
      submittedAt: contact.createdAt.toISOString(),
    };

    // Fire-and-forget: send email notification (never blocks or breaks the response)
    void sendNotificationEmail(contactFormEmail(emailData));

    return NextResponse.json(
      { message: 'Message sent successfully.', id: contact.id },
      { status: 201 }
    );
  } catch (err) {
    console.error('Contact form error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
