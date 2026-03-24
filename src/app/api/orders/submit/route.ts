import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/env';
import { sendNotificationEmail } from '@/lib/email';
import { readJsonFile, writeJsonFile } from '@/lib/json-store';

interface OrderItem {
  productId: string;
  productName: string;
  shape: string;
  size: string;
  quantity: number;
  unitPrice: number;
  backing: string;
  priceTier: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name, email, phone, company,
      shippingAddress, city, state, zip,
      notes, isDistributor, distributorCompany,
      items, subtotal, setupFees, total,
    } = body;

    if (!name || !email || !items?.length) {
      return NextResponse.json({ error: 'Name, email, and at least one item are required.' }, { status: 400 });
    }

    const orderNumber = `CTT-${Date.now().toString(36).toUpperCase()}`;

    let savedToDb = false;

    // Save to database if configured
    if (isDatabaseConfigured()) {
      try {
        const { prisma } = await import('@/lib/db');
        await prisma.order.create({
          data: {
            orderNumber,
            customerName: name,
            customerEmail: email,
            customerPhone: phone || '',
            shippingAddress1: shippingAddress || '',
            shippingCity: city || '',
            shippingState: state || '',
            shippingZip: zip || '',
            items: JSON.parse(JSON.stringify(items)),
            subtotal: Math.round(subtotal),
            shipping: 0,
            tax: 0,
            total: Math.round(total),
            status: 'pending',
            notes: [
              notes ? `Customer notes: ${notes}` : '',
              isDistributor ? `Distributor: ${distributorCompany}` : '',
            ].filter(Boolean).join('\n'),
          },
        });
        savedToDb = true;
      } catch (dbErr) {
        console.error('Order DB save failed (continuing with JSON + email):', dbErr);
      }
    }

    // Save to JSON file as fallback
    if (!savedToDb) {
      try {
        const orders = readJsonFile<Record<string, unknown>[]>('orders.json', []);
        orders.unshift({
          id: `local-${Date.now()}`,
          orderNumber,
          customerName: name,
          customerEmail: email,
          customerPhone: phone || '',
          company: company || '',
          shippingAddress: shippingAddress || '',
          shippingCity: city || '',
          shippingState: state || '',
          shippingZip: zip || '',
          items,
          subtotal: Math.round(subtotal),
          setupFees: Math.round(setupFees || 0),
          total: Math.round(total),
          status: 'pending',
          notes: notes || '',
          isDistributor: !!isDistributor,
          distributorCompany: distributorCompany || '',
          submittedAt: new Date().toISOString(),
        });
        writeJsonFile('orders.json', orders);
      } catch (jsonErr) {
        console.error('Order JSON save failed:', jsonErr);
      }
    }

    // Format items for email
    const itemRows = (items as OrderItem[]).map((item) =>
      `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;">
          ${item.productName}<br>
          <span style="color:#6b7280;font-size:12px;">${item.shape} • ${item.size} • ${item.backing || 'Standard'}</span>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;text-align:right;">$${(item.unitPrice / 100).toFixed(2)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;text-align:right;font-weight:600;">$${((item.unitPrice * item.quantity) / 100).toFixed(2)}</td>
      </tr>`
    ).join('');

    const distributorBadge = isDistributor
      ? `<div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:6px;padding:8px 12px;margin-bottom:16px;font-size:13px;color:#047857;font-weight:600;">
          Distributor Order — ${distributorCompany}
        </div>`
      : '';

    const shippingBlock = shippingAddress
      ? `<p style="margin:0;font-size:14px;color:#374151;">${shippingAddress}<br>${city}, ${state} ${zip}</p>`
      : '<p style="margin:0;font-size:14px;color:#9ca3af;">Not provided</p>';

    const subject = `New Order ${orderNumber}: ${name}${isDistributor ? ' (Distributor)' : ''}`;

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;">
<tr><td align="center" style="padding:24px 16px;">

<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:8px;background:#ffffff;overflow:hidden;">
<tr><td style="background:#111827;padding:20px 24px;">
  <h1 style="margin:0;color:#ffffff;font-size:18px;">New Order — ${orderNumber}</h1>
</td></tr>

<tr><td style="padding:24px;">
  ${distributorBadge}

  <h2 style="margin:0 0 12px;font-size:15px;color:#111827;">Customer</h2>
  <table style="margin-bottom:20px;font-size:14px;color:#374151;">
    <tr><td style="padding:2px 12px 2px 0;color:#6b7280;">Name:</td><td>${name}</td></tr>
    <tr><td style="padding:2px 12px 2px 0;color:#6b7280;">Email:</td><td><a href="mailto:${email}">${email}</a></td></tr>
    ${phone ? `<tr><td style="padding:2px 12px 2px 0;color:#6b7280;">Phone:</td><td>${phone}</td></tr>` : ''}
    ${company ? `<tr><td style="padding:2px 12px 2px 0;color:#6b7280;">Company:</td><td>${company}</td></tr>` : ''}
  </table>

  <h2 style="margin:0 0 12px;font-size:15px;color:#111827;">Items</h2>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
    <tr style="background:#f9fafb;">
      <th style="padding:8px 12px;font-size:12px;color:#6b7280;text-align:left;font-weight:600;">Product</th>
      <th style="padding:8px 12px;font-size:12px;color:#6b7280;text-align:center;font-weight:600;">Qty</th>
      <th style="padding:8px 12px;font-size:12px;color:#6b7280;text-align:right;font-weight:600;">Unit</th>
      <th style="padding:8px 12px;font-size:12px;color:#6b7280;text-align:right;font-weight:600;">Total</th>
    </tr>
    ${itemRows}
    <tr style="background:#f9fafb;">
      <td colspan="3" style="padding:8px 12px;font-size:14px;font-weight:600;text-align:right;">Subtotal</td>
      <td style="padding:8px 12px;font-size:14px;font-weight:600;text-align:right;">$${(subtotal / 100).toFixed(2)}</td>
    </tr>
    ${setupFees > 0 ? `<tr style="background:#f9fafb;">
      <td colspan="3" style="padding:8px 12px;font-size:14px;text-align:right;color:#6b7280;">Setup Fees</td>
      <td style="padding:8px 12px;font-size:14px;text-align:right;">$${(setupFees / 100).toFixed(2)}</td>
    </tr>` : ''}
    <tr style="background:#111827;">
      <td colspan="3" style="padding:10px 12px;font-size:15px;font-weight:700;text-align:right;color:#ffffff;">Total</td>
      <td style="padding:10px 12px;font-size:15px;font-weight:700;text-align:right;color:#d97706;">$${(total / 100).toFixed(2)}</td>
    </tr>
  </table>

  <h2 style="margin:0 0 8px;font-size:15px;color:#111827;">Shipping Address</h2>
  ${shippingBlock}

  ${notes ? `<h2 style="margin:16px 0 8px;font-size:15px;color:#111827;">Customer Notes</h2>
  <p style="margin:0;padding:12px;background:#f9fafb;border-radius:6px;font-size:14px;color:#374151;white-space:pre-wrap;">${notes}</p>` : ''}
</td></tr>

<tr><td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">
  <p style="margin:0;font-size:12px;color:#9ca3af;">This order was placed on customtintackers.com. Reply to the customer or send a payment link to complete the sale.</p>
</td></tr>
</table>

</td></tr></table>
</body></html>`;

    const text = `New Order ${orderNumber}
${isDistributor ? `Distributor: ${distributorCompany}\n` : ''}
Customer: ${name}
Email: ${email}
Phone: ${phone || 'N/A'}
Company: ${company || 'N/A'}

Items:
${(items as OrderItem[]).map((i) => `- ${i.productName} (${i.size}) x${i.quantity} @ $${(i.unitPrice / 100).toFixed(2)} = $${((i.unitPrice * i.quantity) / 100).toFixed(2)}`).join('\n')}

Subtotal: $${(subtotal / 100).toFixed(2)}
${setupFees > 0 ? `Setup Fees: $${(setupFees / 100).toFixed(2)}\n` : ''}Total: $${(total / 100).toFixed(2)}

Shipping: ${shippingAddress ? `${shippingAddress}, ${city}, ${state} ${zip}` : 'Not provided'}
${notes ? `\nNotes: ${notes}` : ''}`;

    await sendNotificationEmail({ subject, html, text });

    return NextResponse.json({ ok: true, orderNumber }, { status: 201 });
  } catch (err) {
    console.error('Order submission error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}
