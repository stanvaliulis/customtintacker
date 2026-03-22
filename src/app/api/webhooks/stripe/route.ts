import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { env } from '@/lib/env';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured.' },
      { status: 503 },
    );
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.stripe.webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('Order completed:', session.id, session.customer_email);

    // Generate a sequential-style order number
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    try {
      await prisma.order.create({
        data: {
          orderNumber,
          stripeSessionId: session.id,
          stripePaymentIntentId: (session as unknown as { payment_intent?: string }).payment_intent ?? null,
          customerEmail: session.customer_email ?? '',
          customerName: '',
          total: session.amount_total ?? 0,
          subtotal: session.amount_subtotal ?? 0,
          status: 'processing',
          items: JSON.stringify([]),
        },
      });
    } catch (err) {
      console.error('Failed to create order from webhook:', err);
    }
  }

  return NextResponse.json({ received: true });
}
