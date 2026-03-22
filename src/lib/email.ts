/**
 * Email notification utility.
 *
 * - When RESEND_API_KEY is set, sends via Resend (recommended).
 * - Otherwise falls back to SMTP via nodemailer if configured.
 * - Otherwise logs to console (graceful fallback).
 */

import { env } from './env';

export interface EmailPayload {
  subject: string;
  html: string;
  text: string;
}

function isResendConfigured(): boolean {
  return !!env.email.resendApiKey;
}

function isSmtpConfigured(): boolean {
  return !!(env.email.smtpHost && env.email.smtpPort && env.email.smtpUser && env.email.smtpPass);
}

/**
 * Send a notification email. Safe to call fire-and-forget.
 * Never throws -- all errors are caught and logged.
 */
export async function sendNotificationEmail(payload: EmailPayload): Promise<void> {
  const to = env.email.notificationEmail || 'web@igiprint.com';

  try {
    // ── Option 1: Resend (preferred) ──────────────────────────────
    if (isResendConfigured()) {
      const { Resend } = await import('resend');
      const resend = new Resend(env.email.resendApiKey);

      await resend.emails.send({
        from: env.email.resendFrom || 'Custom Tin Tackers <notifications@customtintackers.com>',
        to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });

      console.log(`[Email/Resend] Sent: ${payload.subject}`);
      return;
    }

    // ── Option 2: SMTP via nodemailer ─────────────────────────────
    if (isSmtpConfigured()) {
      const nodemailer = await import('nodemailer');
      const { smtpHost, smtpPort, smtpUser, smtpPass } = env.email;

      const transporter = nodemailer.default.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: Number(smtpPort) === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({
        from: `"Custom Tin Tackers" <${smtpUser}>`,
        to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      });

      console.log(`[Email/SMTP] Sent: ${payload.subject}`);
      return;
    }

    // ── Fallback: log to console ──────────────────────────────────
    console.log('-----------------------------------------------------------');
    console.log('[Email] No email provider configured, logging instead');
    console.log(`To: ${to}`);
    console.log(`Subject: ${payload.subject}`);
    console.log(payload.text);
    console.log('-----------------------------------------------------------');
  } catch (error) {
    console.error('[Email] Failed to send:', error);
  }
}
