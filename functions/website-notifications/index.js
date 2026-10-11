// SETUP: Before deploying, set the secrets:
//   firebase functions:secrets:set DISCORD_WEBHOOK_URL
//   firebase functions:secrets:set RESEND_API_KEY
// Paste the values when prompted.
// To verify: firebase functions:secrets:access DISCORD_WEBHOOK_URL
// To verify: firebase functions:secrets:access RESEND_API_KEY

/**
 * website-notifications — Firebase Cloud Function (v2 HTTPS)
 *
 * Receives POST requests from the Alvey website when someone:
 *   - submits the contact form
 *   - applies as a tutor
 *   - applies to work with Alvey (recruitment)
 *
 * Sends a formatted Discord embed to DISCORD_WEBHOOK_URL.
 * Sends a confirmation email to the submitter via Resend.
 */

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

// Declare secrets — Firebase will inject them at runtime
const discordWebhookUrl = defineSecret("DISCORD_WEBHOOK_URL");
const resendApiKey = defineSecret("RESEND_API_KEY");

// Allowed origins — add your production domain here
const ALLOWED_ORIGINS = [
  "https://alvey.study",
  "https://www.alvey.study",
  "http://localhost:3000",
  "http://localhost:5173",
];

// Human-readable titles per notification type
const NOTIFICATION_TITLES = {
  tutor_application:       "🎓 New Tutor Application",
  recruitment_application: "👥 New Recruitment Application",
  contact_message:         "📩 New Contact Message",
};

exports.websiteNotifications = onRequest(
  {
    region: "us-central1",
    invoker: "public",
    secrets: [discordWebhookUrl, resendApiKey], // grant the function access to these secrets
  },
  async (req, res) => {
    // ── CORS ────────────────────────────────────────────────────────────────
    const origin = req.headers.origin || "";
    // Only reflect the origin header for known-good origins.
    // Unknown origins get no ACAO header so browsers block them.
    if (ALLOWED_ORIGINS.includes(origin)) {
      res.set("Access-Control-Allow-Origin", origin);
    }
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    // ── Health check ─────────────────────────────────────────────────────────
    if (req.method === "GET") {
      res.status(200).json({ ok: true });
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    // ── Parse body ───────────────────────────────────────────────────────────
    let data = {};
    try {
      data = req.body || {};
    } catch {
      data = {};
    }

    const type = data.type || "unknown";
    logger.info("Received notification", { type });

    // ── Discord webhook ───────────────────────────────────────────────────────
    const webhookUrl = discordWebhookUrl.value();

    if (!webhookUrl) {
      logger.error("DISCORD_WEBHOOK_URL is not set");
      // Return 200 so the website form doesn't show an error to the user —
      // the submission was saved to Firestore already, this is best-effort.
      res.status(200).json({ success: false, reason: "webhook_not_configured" });
      return;
    }

    // Build embed fields from the request payload (skip the "type" key)
    const fields = Object.entries(data)
      .filter(([key]) => key !== "type")
      .slice(0, 15) // Discord max embed fields is 25, keep it readable
      .map(([key, value]) => ({
        name: key
          .replace(/_/g, " ")
          .replace(/([A-Z])/g, " $1")
          .trim()
          .replace(/^\w/, (c) => c.toUpperCase()),
        value: String(value ?? "N/A").slice(0, 1024),
        inline: false,
      }));

    const title = NOTIFICATION_TITLES[type] || "🌐 New Website Notification";

    const discordPayload = {
      username: "Alvey Website",
      avatar_url: "https://alvey.study/logo.png",
      embeds: [
        {
          title,
          color: 0x164e5e, // Alvey brand teal
          fields,
          footer: { text: "Alvey Website Notifications" },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    let discordOk = false;
    try {
      const discordRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordPayload),
      });

      if (!discordRes.ok) {
        const text = await discordRes.text();
        logger.error("Discord webhook failed", { status: discordRes.status, body: text });
      } else {
        discordOk = true;
        logger.info("Discord notification sent", { type });
      }
    } catch (err) {
      logger.error("Unexpected error sending Discord notification", { message: err.message });
    }

    // ── Resend confirmation email ─────────────────────────────────────────────
    const apiKey = resendApiKey.value();

    if (apiKey) {
      // Determine recipient from the submission data
      let recipientEmail = null;
      let recipientName = "there";

      if (type === "contact_message") {
        recipientEmail = data.email || null;
        recipientName = data.name || data.fullName || "there";
      } else if (type === "tutor_application") {
        recipientEmail = data.email || data.Email_address || null;
        recipientName = data.full_name || data.fullName || data.name || "there";
      } else if (type === "recruitment_application") {
        recipientEmail = data.email || data.Email_address || null;
        recipientName = data.full_name || data.fullName || data.name || "there";
      }

      if (recipientEmail) {
        let emailSubject = "";
        let emailHtml = "";

        if (type === "contact_message") {
          emailSubject = "We received your message — Alvey";
          emailHtml = `<p>Hi ${recipientName},</p><p>Thanks for reaching out! We received your message and will get back to you within 1–2 business days.</p><p>— The Alvey Team</p>`;
        } else if (type === "tutor_application") {
          emailSubject = "Application received — Alvey";
          emailHtml = `<p>Hi ${recipientName},</p><p>Thank you for applying to become an Alvey tutor! We'll review your application and get back to you soon.</p><p>— The Alvey Team</p>`;
        } else if (type === "recruitment_application") {
          emailSubject = "Application received — Alvey";
          emailHtml = `<p>Hi ${recipientName},</p><p>Thank you for applying to join the Alvey team! We'll review your application and get back to you soon.</p><p>— The Alvey Team</p>`;
        }

        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "noreply@alvey.study",
              to: recipientEmail,
              subject: emailSubject,
              html: emailHtml,
            }),
          });

          if (!emailRes.ok) {
            const errText = await emailRes.text();
            logger.error("Resend email failed", { status: emailRes.status, body: errText });
          } else {
            logger.info("Confirmation email sent", { type, to: recipientEmail });
          }
        } catch (emailErr) {
          logger.error("Unexpected error sending confirmation email", { message: emailErr.message });
        }
      } else {
        logger.warn("No recipient email found in submission data", { type });
      }
    } else {
      logger.warn("RESEND_API_KEY is not set, skipping confirmation email");
    }

    // ── Respond ───────────────────────────────────────────────────────────────
    res.status(200).json({ success: discordOk });
  }
);
