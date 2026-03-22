/**
 * Email notification templates for Custom Tin Tackers.
 *
 * Each template function returns { subject, html, text } so the same data
 * can be used for both SMTP delivery and console-based fallback logging.
 */

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const BRAND_COLOR = '#d97706'; // amber-600
const BRAND_BG = '#fffbeb'; // amber-50
const BRAND_NAME = 'Custom Tin Tackers';
const COMPANY = 'Interstate Graphics';

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f3f4f6;">
<tr><td align="center" style="padding:24px 16px;">

<!-- Header -->
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;border-radius:8px 8px 0 0;background:${BRAND_COLOR};">
<tr><td style="padding:20px 24px;">
  <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">${BRAND_NAME}</h1>
  <p style="margin:4px 0 0;color:#fef3c7;font-size:13px;">Powered by ${COMPANY}</p>
</td></tr>
</table>

<!-- Body -->
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;">
<tr><td style="padding:24px;">
  <h2 style="margin:0 0 16px;color:#111827;font-size:18px;font-weight:600;">${title}</h2>
  ${body}
</td></tr>
</table>

<!-- Footer -->
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;border-radius:0 0 8px 8px;background:${BRAND_BG};">
<tr><td style="padding:16px 24px;text-align:center;">
  <p style="margin:0;color:#92400e;font-size:12px;">This is an automated notification from ${BRAND_NAME}.</p>
</td></tr>
</table>

</td></tr>
</table>
</body></html>`;
}

function row(label: string, value: string | number | undefined | null): string {
  if (value === undefined || value === null || String(value).trim() === '') return '';
  return `<tr>
    <td style="padding:6px 12px;color:#6b7280;font-size:14px;white-space:nowrap;vertical-align:top;">${label}</td>
    <td style="padding:6px 12px;color:#111827;font-size:14px;">${String(value)}</td>
  </tr>`;
}

function table(rows: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
    style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
    ${rows}
  </table>`;
}

// ---------------------------------------------------------------------------
// Distributor Application
// ---------------------------------------------------------------------------

export interface DistributorApplicationData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website?: string;
  asiNumber?: string;
  sageNumber?: string;
  ppaiNumber?: string;
  monthlyVolume?: string;
  primaryIndustry?: string;
  hearAboutUs?: string;
  additionalNotes?: string;
  id?: string;
  submittedAt?: string;
}

export function distributorApplicationEmail(data: DistributorApplicationData) {
  const subject = `New Distributor Application: ${data.companyName}`;

  const rows = [
    row('Company', data.companyName),
    row('Contact', data.contactName),
    row('Email', data.email),
    row('Phone', data.phone),
    row('Website', data.website),
    row('ASI #', data.asiNumber),
    row('SAGE #', data.sageNumber),
    row('PPAI #', data.ppaiNumber),
    row('Monthly Volume', data.monthlyVolume),
    row('Industry', data.primaryIndustry),
    row('How they heard about us', data.hearAboutUs),
    row('Notes', data.additionalNotes),
    row('Application ID', data.id),
    row('Submitted', data.submittedAt),
  ].filter(Boolean).join('');

  const html = layout('New Distributor Application', table(rows));

  const text = `New Distributor Application
Company: ${data.companyName}
Contact: ${data.contactName}
Email: ${data.email}
Phone: ${data.phone}
Website: ${data.website || 'N/A'}
ASI #: ${data.asiNumber || 'N/A'}
SAGE #: ${data.sageNumber || 'N/A'}
PPAI #: ${data.ppaiNumber || 'N/A'}
Monthly Volume: ${data.monthlyVolume || 'N/A'}
Industry: ${data.primaryIndustry || 'N/A'}
How they heard about us: ${data.hearAboutUs || 'N/A'}
Notes: ${data.additionalNotes || 'N/A'}
Application ID: ${data.id || 'N/A'}
Submitted: ${data.submittedAt || 'N/A'}`;

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Quote Request
// ---------------------------------------------------------------------------

export interface QuoteRequestData {
  name: string;
  email: string;
  phone?: string;
  company: string;
  size: string;
  quantity: number;
  backing?: string;
  colors?: string;
  notes?: string;
  id?: string;
  submittedAt?: string;
}

export function quoteRequestEmail(data: QuoteRequestData) {
  const subject = `New Quote Request: ${data.name} - ${data.size}`;

  const rows = [
    row('Name', data.name),
    row('Email', data.email),
    row('Phone', data.phone),
    row('Company', data.company),
    row('Size / Shape', data.size),
    row('Quantity', data.quantity),
    row('Backing', data.backing),
    row('Colors', data.colors),
    row('Notes', data.notes),
    row('Quote ID', data.id),
    row('Submitted', data.submittedAt),
  ].filter(Boolean).join('');

  const html = layout('New Quote Request', table(rows));

  const text = `New Quote Request
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || 'N/A'}
Company: ${data.company}
Size / Shape: ${data.size}
Quantity: ${data.quantity}
Backing: ${data.backing || 'N/A'}
Colors: ${data.colors || 'N/A'}
Notes: ${data.notes || 'N/A'}
Quote ID: ${data.id || 'N/A'}
Submitted: ${data.submittedAt || 'N/A'}`;

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Contact Form
// ---------------------------------------------------------------------------

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  id?: string;
  submittedAt?: string;
}

export function contactFormEmail(data: ContactFormData) {
  const subject = `New Contact Form: ${data.name}`;

  const messageHtml = `<p style="margin:16px 0 0;color:#111827;font-size:14px;line-height:1.6;white-space:pre-wrap;">${data.message}</p>`;

  const rows = [
    row('Name', data.name),
    row('Email', data.email),
    row('Phone', data.phone),
    row('Company', data.company),
    row('Submission ID', data.id),
    row('Submitted', data.submittedAt),
  ].filter(Boolean).join('');

  const html = layout(
    'New Contact Form Submission',
    table(rows) +
      `<h3 style="margin:20px 0 8px;color:#111827;font-size:15px;font-weight:600;">Message</h3>
       <div style="padding:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;">
         ${messageHtml}
       </div>`
  );

  const text = `New Contact Form Submission
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || 'N/A'}
Company: ${data.company || 'N/A'}
Message:
${data.message}
Submission ID: ${data.id || 'N/A'}
Submitted: ${data.submittedAt || 'N/A'}`;

  return { subject, html, text };
}
