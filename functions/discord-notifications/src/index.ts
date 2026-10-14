// SETUP: Before deploying, set the secret:
//   firebase functions:secrets:set DISCORD_WEBHOOK_URL
// Paste the value when prompted.
// To verify: firebase functions:secrets:access DISCORD_WEBHOOK_URL

/**
 * discord-notifications — Firebase Cloud Function (v2 HTTPS)
 *
 * Receives POST requests from the Alvey website when someone:
 *   - submits the contact form
 *   - applies as a tutor
 *   - applies to work with Alvey (recruitment)
 *
 * Sends a formatted Discord embed to DISCORD_WEBHOOK_URL.
 */

import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";

// For cost control, limit the number of containers running at the same time.
setGlobalOptions({ maxInstances: 10 });

// Declare secrets — Firebase will inject them at runtime
const discordWebhookUrl = defineSecret("DISCORD_WEBHOOK_URL");

// Allowed origins
const ALLOWED_ORIGINS = [
  "https://alvey.study",
  "https://www.alvey.study",
  "http://localhost:3000",
  "http://localhost:5173",
];

// Human-readable titles per notification type
const NOTIFICATION_TITLES: Record<string, string> = {
  tutor_application: "🎓 New Tutor Application",
  recruitment_application: "👥 New Recruitment Application",
  contact_message: "📩 New Contact Message",
};

export const discordNotifications = onRequest(
  {
    region: "us-central1",
    invoker: "public",
    secrets: [discordWebhookUrl],
  },
  async (req, res) => {
    // ── CORS ─────────────────────────────────────────────────────────────────
    const origin = req.headers.origin ?? "";
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

    // ── Health check ──────────────────────────────────────────────────────────
    if (req.method === "GET") {
      res.status(200).json({ ok: true });
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      // ── Parse body ─────────────────────────────────────────────────────────
      const data: Record<string, unknown> = (req.body as Record<string, unknown>) ?? {};

      const type = typeof data["type"] === "string" ? data["type"] : "unknown";
      logger.info("Received notification", { type });

      // ── Discord webhook ────────────────────────────────────────────────────
      const webhookUrl = discordWebhookUrl.value();

      if (!webhookUrl) {
        logger.error("DISCORD_WEBHOOK_URL is not set");
        // Return 200 so the website form doesn't show an error to the user.
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

      const title = NOTIFICATION_TITLES[type] ?? "🌐 New Website Notification";

      const discordPayload = {
        username: "Alvey Website",
        avatar_url: "https://alvey.study/logo.png",
        embeds: [
          {
            title,
            color: 0x164e5e, // Alvey brand teal
            fields,
            footer: { text: "Alvey Discord Notifications" },
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
      } catch (webhookErr) {
        const msg = webhookErr instanceof Error ? webhookErr.message : String(webhookErr);
        logger.error("Unexpected error sending Discord notification", { message: msg });
      }

      // ── Respond ────────────────────────────────────────────────────────────
      res.status(200).json({ success: discordOk });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error("Unhandled error in discordNotifications", { message: msg });
      res.status(200).json({ success: false, reason: "internal_error" });
    }
  }
);
