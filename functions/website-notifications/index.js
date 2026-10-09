/**
 * website-notifications — Firebase Cloud Function (v2 HTTPS)
 *
 * Receives POST requests from the Alvey website when someone:
 *   - submits the contact form
 *   - applies as a tutor
 *   - applies to work with Alvey (recruitment)
 *
 * Sends a formatted Discord embed to DISCORD_WEBHOOK_URL.
 *
 * Environment variables (set via Firebase Console → Functions → websiteNotifications → Edit):
 *   DISCORD_WEBHOOK_URL  — your Discord server webhook URL
 */

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

// Declare the secret — Firebase will inject it at runtime
const discordWebhookUrl = defineSecret("DISCORD_WEBHOOK_URL");

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
    secrets: [discordWebhookUrl], // grant the function access to this secret
  },
  async (req, res) => {
    // ── CORS ────────────────────────────────────────────────────────────────
    const origin = req.headers.origin || "";
    const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    res.set("Access-Control-Allow-Origin", corsOrigin);
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

    try {
      const discordRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordPayload),
      });

      if (!discordRes.ok) {
        const text = await discordRes.text();
        logger.error("Discord webhook failed", { status: discordRes.status, body: text });
        res.status(200).json({ success: false, reason: "discord_error" });
        return;
      }

      logger.info("Discord notification sent", { type });
      res.status(200).json({ success: true });
    } catch (err) {
      logger.error("Unexpected error sending Discord notification", { message: err.message });
      res.status(200).json({ success: false, reason: "internal_error" });
    }
  }
);
