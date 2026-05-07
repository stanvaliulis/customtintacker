import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { env, isDatabaseConfigured } from '@/lib/env';
import { sendNotificationEmail } from '@/lib/email';
import { readJsonFile, writeJsonFile } from '@/lib/json-store';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature.' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.stripe.webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const meta = session.metadata || {};
    const orderNumber = `CTT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    // Parse items from metadata
    let items: Array<{
      productId: string;
      productName: string;
      shape: string;
      size: string;
      quantity: number;
      backing: string;
      priceTier: string;
      isRush: boolean;
    }> = [];
    try {
      items = JSON.parse(meta.items || '[]');
    } catch {
      console.error('Failed to parse items from Stripe metadata');
    }

    const customerEmail = session.customer_email || session.customer_details?.email || '';
    const customerName = meta.customerName || session.customer_details?.name || '';
    const sessionAny = session as unknown as Record<string, unknown>;
    const shippingDetails = sessionAny.shipping_details as { address?: { line1?: string; line2?: string; city?: string; state?: string; postal_code?: string; country?: string } } | undefined;
    const shipping = shippingDetails?.address;

    const orderData = {
      orderNumber,
      stripeSessionId: session.id,
      stripePaymentIntentId: (session as unknown as { payment_intent?: string }).payment_intent ?? null,
      customerName,
      customerEmail,
      customerPhone: meta.customerPhone || '',
      company: meta.company || '',
      shippingAddress1: shipping?.line1 || meta.shippingAddress || '',
      shippingAddress2: shipping?.line2 || '',
      shippingCity: shipping?.city || meta.city || '',
      shippingState: shipping?.state || meta.state || '',
      shippingZip: shipping?.postal_code || meta.zip || '',
      shippingCountry: shipping?.country || 'US',
      items,
      subtotal: session.amount_subtotal ?? 0,
      shipping: 0,
      tax: 0,
      total: session.amount_total ?? 0,
      status: 'processing' as const,
      notes: [
        meta.notes || '',
        meta.isDistributor === 'true' ? `Distributor: ${meta.company}` : '',
      ].filter(Boolean).join('\n'),
    };

    // Save to database
    let savedToDb = false;
    if (isDatabaseConfigured()) {
      try {
        const { prisma } = await import('@/lib/db');
        await prisma.order.create({
          data: {
            ...orderData,
            items: JSON.parse(JSON.stringify(orderData.items)),
          },
        });
        savedToDb = true;
      } catch (dbErr) {
        console.error('Order DB save failed (continuing with JSON + email):', dbErr);
      }
    }

    // JSON fallback
    if (!savedToDb) {
      try {
        const orders = readJsonFile<Record<string, unknown>[]>('orders.json', []);
        orders.unshift({
          ...orderData,
          id: `stripe-${Date.now()}`,
          paidViaStripe: true,
          submittedAt: new Date().toISOString(),
        });
        writeJsonFile('orders.json', orders);
      } catch (jsonErr) {
        console.error('Order JSON save failed:', jsonErr);
      }
    }

    // Send notification email
    try {
      const itemRows = items.map((item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;">
            ${item.productName}<br>
            <span style="color:#6b7280;font-size:12px;">${item.shape} &bull; ${item.size} &bull; ${item.backing || 'Standard'}${item.isRush ? ' &bull; <strong style="color:#d97706;">RUSH</strong>' : ''}</span>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;text-align:center;">${item.quantity}</td>
        </tr>`
      ).join('');

      const shippingBlock = orderData.shippingAddress1
        ? `<p style="margin:0;font-size:14px;color:#374151;">${orderData.shippingAddress1}${orderData.shippingAddress2 ? `<br>${orderData.shippingAddress2}` : ''}<br>${orderData.shippingCity}, ${orderData.shippingState} ${orderData.shippingZip}</p>`
        : '<p style="margin:0;font-size:14px;color:#9ca3af;">See Stripe dashboard</p>';

      const subject = `Paid Order ${orderNumber}: ${customerName || customerEmail}`;

      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;">
<tr><td align="center" style="padding:24px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:8px;background:#ffffff;overflow:hidden;">
<tr><td style="background:#059669;padding:20px 24px;">
  <h1 style="margin:0;color:#ffffff;font-size:18px;">Payment Received — ${orderNumber}</h1>
</td></tr>
<tr><td style="padding:24px;">
  <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:6px;padding:12px 16px;margin-bottom:16px;font-size:14px;color:#047857;font-weight:600;">
    Paid via Stripe — $${((orderData.total) / 100).toFixed(2)}
  </div>

  <h2 style="margin:0 0 12px;font-size:15px;color:#111827;">Customer</h2>
  <table style="margin-bottom:20px;font-size:14px;color:#374151;">
    <tr><td style="padding:2px 12px 2px 0;color:#6b7280;">Name:</td><td>${customerName || 'N/A'}</td></tr>
    <tr><td style="padding:2px 12px 2px 0;color:#6b7280;">Email:</td><td><a href="mailto:${customerEmail}">${customerEmail}</a></td></tr>
    ${orderData.customerPhone ? `<tr><td style="padding:2px 12px 2px 0;color:#6b7280;">Phone:</td><td>${orderData.customerPhone}</td></tr>` : ''}
    ${orderData.company ? `<tr><td style="padding:2px 12px 2px 0;color:#6b7280;">Company:</td><td>${orderData.company}</td></tr>` : ''}
  </table>

  <h2 style="margin:0 0 12px;font-size:15px;color:#111827;">Items</h2>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
    <tr style="background:#f9fafb;">
      <th style="padding:8px 12px;font-size:12px;color:#6b7280;text-align:left;font-weight:600;">Product</th>
      <th style="padding:8px 12px;font-size:12px;color:#6b7280;text-align:center;font-weight:600;">Qty</th>
    </tr>
    ${itemRows}
    <tr style="background:#059669;">
      <td style="padding:10px 12px;font-size:15px;font-weight:700;text-align:right;color:#ffffff;">Total Paid</td>
      <td style="padding:10px 12px;font-size:15px;font-weight:700;text-align:center;color:#ffffff;">$${(orderData.total / 100).toFixed(2)}</td>
    </tr>
  </table>

  <h2 style="margin:0 0 8px;font-size:15px;color:#111827;">Shipping Address</h2>
  ${shippingBlock}

  ${meta.notes ? `<h2 style="margin:16px 0 8px;font-size:15px;color:#111827;">Customer Notes</h2>
  <p style="margin:0;padding:12px;background:#f9fafb;border-radius:6px;font-size:14px;color:#374151;white-space:pre-wrap;">${meta.notes}</p>` : ''}
</td></tr>
<tr><td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">
  <p style="margin:0;font-size:12px;color:#9ca3af;">This order was paid on customtintackers.com via Stripe Checkout. View the payment in your <a href="https://dashboard.stripe.com" style="color:#6b7280;">Stripe Dashboard</a>.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

      const text = `Paid Order ${orderNumber}
Customer: ${customerName || 'N/A'}
Email: ${customerEmail}
Phone: ${orderData.customerPhone || 'N/A'}
Company: ${orderData.company || 'N/A'}

Items:
${items.map((i) => `- ${i.productName} (${i.size}) x${i.quantity}${i.isRush ? ' [RUSH]' : ''}`).join('\n')}

Total Paid: $${(orderData.total / 100).toFixed(2)}

Shipping: ${orderData.shippingAddress1 ? `${orderData.shippingAddress1}, ${orderData.shippingCity}, ${orderData.shippingState} ${orderData.shippingZip}` : 'See Stripe dashboard'}
${meta.notes ? `\nNotes: ${meta.notes}` : ''}`;

      await sendNotificationEmail({ subject, html, text });
    } catch (emailErr) {
      console.error('Order notification email failed:', emailErr);
    }
  }

  return NextResponse.json({ received: true });
}
