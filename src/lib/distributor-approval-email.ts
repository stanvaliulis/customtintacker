export interface ApprovalEmailData {
  contactName: string;
  companyName: string;
  email: string;
  tempPassword: string;
}

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Standalone email-safe layout. Every table row belongs to a table. */
export function renderDistributorApprovalEmail(data: ApprovalEmailData) {
  const subject = 'Welcome to Custom Tin Tackers - Your Distributor Account is Approved!';
  const site = 'https://www.customtintackers.com';
  const login = `${site}/wholesale/login`;
  const logo = `${site}/images/custom_tin_tackers_black_on_white_exact_flat.png`;
  const contact = escapeHtml(data.contactName);
  const company = escapeHtml(data.companyName);
  const email = escapeHtml(data.email);
  const password = escapeHtml(data.tempPassword);
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>Distributor Account Approved</title>
<!--[if mso]><style>table,td,p,a,h1,h2 {font-family:Arial,sans-serif!important;}</style><![endif]-->
<style>@media screen and (max-width:480px){.email-pad{padding-left:20px!important;padding-right:20px!important}.email-title{font-size:26px!important;line-height:32px!important}}</style></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;color:#17212b;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
<div style="display:none;font-size:1px;line-height:1px;color:#f3f4f6;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">Your distributor account is approved. Your sign-in details are inside.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#f3f4f6;border-collapse:collapse;"><tr><td align="center" style="padding:24px 12px;">
<!--[if mso]><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border-collapse:collapse;table-layout:fixed;">
<tr><td height="6" bgcolor="#b45309" style="height:6px;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td class="email-pad" align="center" style="padding:28px 32px 24px;border-bottom:1px solid #e5e7eb;">
<a href="${site}" style="text-decoration:none;"><img src="${logo}" width="300" height="70" alt="Custom Tin Tackers" border="0" style="display:block;width:100%;max-width:300px;height:auto;border:0;"></a>
<p style="margin:12px 0 0;color:#6b7280;font-size:12px;line-height:18px;">Made by Interstate Graphics</p></td></tr>
<tr><td class="email-pad" style="padding:28px 32px 20px;">
<p style="margin:0 0 10px;color:#92400e;font-size:12px;line-height:18px;font-weight:bold;letter-spacing:1.4px;">DISTRIBUTOR ACCOUNT APPROVED</p>
<h1 class="email-title" style="margin:0 0 18px;color:#17212b;font-size:30px;line-height:36px;font-weight:bold;">Welcome to the team.</h1>
<p style="margin:0 0 12px;font-size:16px;line-height:25px;">Hi ${contact},</p>
<p style="margin:0;font-size:16px;line-height:25px;">Your distributor application for <strong>${company}</strong> has been approved. Use the details below to sign in and view distributor pricing.</p>
</td></tr>
<tr><td class="email-pad" style="padding:0 32px 24px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#fffbeb;border:1px solid #f3d6a2;border-collapse:collapse;table-layout:fixed;">
<tr><td style="padding:20px 20px 12px;"><h2 style="margin:0;color:#17212b;font-size:18px;line-height:24px;">Your sign-in details</h2></td></tr>
<tr><td style="padding:0 20px 16px;"><p style="margin:0 0 4px;color:#6b7280;font-size:12px;line-height:18px;">EMAIL ADDRESS</p><p style="margin:0;font-size:16px;line-height:24px;word-break:break-all;overflow-wrap:anywhere;">${email}</p></td></tr>
<tr><td style="padding:0 20px 20px;"><p style="margin:0 0 4px;color:#6b7280;font-size:12px;line-height:18px;">TEMPORARY PASSWORD</p><p style="margin:0;font-family:Consolas,'Courier New',monospace;font-size:18px;line-height:26px;word-break:break-all;overflow-wrap:anywhere;">${password}</p></td></tr>
</table></td></tr>
<tr><td class="email-pad" style="padding:0 32px 12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;"><tr><td align="center" bgcolor="#b45309" style="background-color:#b45309;border-radius:4px;mso-padding-alt:16px 24px;">
<a href="${login}" style="display:block;padding:16px 24px;color:#ffffff;font-size:16px;line-height:22px;font-weight:bold;text-align:center;text-decoration:none;">Sign in to your distributor account</a>
</td></tr></table></td></tr>
<tr><td class="email-pad" style="padding:0 32px 24px;"><p style="margin:0;color:#6b7280;font-size:12px;line-height:19px;">Or visit <a href="${login}" style="color:#92400e;text-decoration:underline;word-break:break-all;">customtintackers.com/wholesale/login</a></p></td></tr>
<tr><td class="email-pad" style="padding:0 32px 28px;">
<p style="margin:0 0 12px;color:#4b5563;font-size:14px;line-height:22px;">Keep this email and your sign-in details private.</p>
<p style="margin:0;color:#4b5563;font-size:14px;line-height:22px;">Need help with your account, pricing, or payment arrangements? Contact <a href="mailto:web@igiprint.com" style="color:#92400e;text-decoration:underline;">web@igiprint.com</a>.</p>
</td></tr>
<tr><td class="email-pad" align="center" style="padding:20px 32px;background-color:#17212b;"><p style="margin:0;color:#ffffff;font-size:13px;line-height:20px;font-weight:bold;">Custom Tin Tackers</p><p style="margin:4px 0 0;color:#d1d5db;font-size:12px;line-height:18px;">Made by Interstate Graphics &bull; Machesney Park, IL</p></td></tr>
</table><!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
  const text = `DISTRIBUTOR ACCOUNT APPROVED

Hi ${data.contactName},

Your distributor application for ${data.companyName} has been approved. Use the details below to sign in and view distributor pricing.

YOUR SIGN-IN DETAILS
Email address: ${data.email}
Temporary password: ${data.tempPassword}
Sign in: ${login}

Keep this email and your sign-in details private.
Need help with your account, pricing, or payment arrangements? Contact web@igiprint.com.

Custom Tin Tackers
Made by Interstate Graphics - Machesney Park, IL`;
  return { subject, html, text };
}
