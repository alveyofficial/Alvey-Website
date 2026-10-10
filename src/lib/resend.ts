/**
 * resend.ts — Server-side email utility using the Resend REST API.
 *
 * ⚠️  This module is SSR-only. Never import it in client-side code.
 *     RESEND_API_KEY must NOT be prefixed with VITE_ (would expose it to the browser).
 *
 * Usage:
 *   import { sendEmail, contactConfirmationEmail } from "@/lib/resend";
 *   await sendEmail({ from: "noreply@alvey.study", to: "user@example.com", ...contactConfirmationEmail("Ali") });
 */

export interface SendEmailOptions {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
}

export type SendEmailResult = { id: string } | { error: string };

/**
 * Sends an email via the Resend REST API.
 * Returns the parsed JSON response on success, or { error: message } on failure.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("sendEmail: RESEND_API_KEY is not set");
    return { error: "RESEND_API_KEY is not configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    });

    const json = await res.json();

    if (!res.ok) {
      const message = (json as { message?: string }).message ?? `HTTP ${res.status}`;
      console.error("sendEmail: Resend API error:", message);
      return { error: message };
    }

    return json as { id: string };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("sendEmail: fetch error:", message);
    return { error: message };
  }
}

// ── Email templates ───────────────────────────────────────────────────────────

/**
 * Confirmation email for contact form submissions.
 */
export function contactConfirmationEmail(name: string): { subject: string; html: string } {
  return {
    subject: "We received your message — Alvey",
    html: `<p>Hi ${name},</p><p>Thanks for reaching out! We received your message and will get back to you within 1–2 business days.</p><p>— The Alvey Team</p>`,
  };
}

/**
 * Confirmation email for tutor or recruitment applications.
 */
export function applicationReceivedEmail(
  name: string,
  type: "tutor" | "recruitment",
): { subject: string; html: string } {
  const typeLabel = type === "tutor" ? "tutor" : "staff";
  return {
    subject: "Application received — Alvey",
    html: `<p>Hi ${name},</p><p>Thank you for applying${type === "tutor" ? " to become an Alvey tutor" : " to join the Alvey team"}! We'll review your ${typeLabel} application and get back to you soon.</p><p>— The Alvey Team</p>`,
  };
}

/**
 * Broadcast email template for admin-initiated announcements.
 */
export function broadcastEmail(
  subject: string,
  body: string,
  unsubscribeUrl: string,
): { subject: string; html: string } {
  return {
    subject,
    html: `${body}<br/><br/><hr/><p style="font-size:12px;color:#888;">You received this email because you are subscribed to Alvey updates. <a href="${unsubscribeUrl}">Unsubscribe</a></p>`,
  };
}
