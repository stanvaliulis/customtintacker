/**
 * Email notification utility.
 *
 * - When SMTP env vars are configured, sends via nodemailer.
 * - Otherwise, logs the email contents to the server console (graceful
 *   fallback so the app never breaks if SMTP is not set up).
 *
 * Required env vars for SMTP delivery:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NOTIFICATION_EMAIL
 */

import nodemailer from 'nodemailer';
import { env, isEmailConfigured } from './env';

export interface EmailPayload {
  subject: string;
  html: string;
  text: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send a notification email. Safe to call fire-and-forget.
 *
 * - If SMTP is configured, sends the email via nodemailer.
 * - If SMTP is NOT configured, logs subject + text to the console.
 * - Never throws -- all errors are caught and logged.
 */
export async function sendNotificationEmail(payload: EmailPayload): Promise<void> {
  try {
    if (!isEmailConfigured()) {
      // Graceful fallback: log to console
      console.log('-----------------------------------------------------------');
      console.log('[Email Notification - SMTP not configured, logging instead]');
      console.log(`To: (NOTIFICATION_EMAIL not set)`);
      console.log(`Subject: ${payload.subject}`);
      console.log('');
      console.log(payload.text);
      console.log('-----------------------------------------------------------');
      return;
    }

    const { smtpHost, smtpPort, smtpUser, smtpPass, notificationEmail } = env.email;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: `"Custom Tin Tackers" <${smtpUser}>`,
      to: notificationEmail,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });

    console.log(`[Email] Sent notification: ${payload.subject}`);
  } catch (error) {
    // Never let email failures propagate -- just log the error.
    console.error('[Email] Failed to send notification:', error);
  }
}
