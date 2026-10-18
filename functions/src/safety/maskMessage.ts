/**
 * functions/src/safety/maskMessage.ts
 *
 * Firestore trigger: fires on every new document in chat_messages/{messageId}.
 * Applies the same masking rules as src/lib/safety-mask.ts as the server-side
 * authoritative layer.
 *
 * NOTE: The functions/ directory is a separate TypeScript project and cannot
 * import from src/lib/. The regex patterns are duplicated here intentionally.
 * Keep them in sync with src/lib/safety-mask.ts SAFETY_PATTERNS.
 *
 * If masking is applied:
 *   - body is overwritten with the masked version
 *   - maskedBySafety: true is set on the document
 *   - originalBody stores the original text for admin review
 */

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

if (!admin.apps.length) {
  admin.initializeApp();
}

const MASK = "[Hidden by Alvey Safety]";

// Keep in sync with src/lib/safety-mask.ts SAFETY_PATTERNS
const SAFETY_PATTERNS: RegExp[] = [
  // Saudi / Gulf mobile: 05XXXXXXXX or 5XXXXXXXX
  /\b0?5\d[\s\-.]{0,1}\d{3}[\s\-.]{0,1}\d{4}\b/g,
  // International phone: +966..., +971..., +44..., +1...
  /\+\d{1,3}[\s\-.]{0,1}\(?\d{1,4}\)?[\s\-.]{0,1}\d{3,4}[\s\-.]{0,1}\d{3,4}/g,
  // Email addresses
  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
  // Off-platform payment services
  /\b(stc\s*pay|stcpay|iban|zain\s*cash|apple\s*pay|paypal|binance\s*pay|western\s*union|bank\s*transfer|direct\s*transfer|transfer\s*me)\b/gi,
  // "add me on / message me on WhatsApp / Telegram / etc."
  /\b(add\s*me\s*on|message\s*me\s*on|contact\s*me\s*(on|via|at|through)|find\s*me\s*on|reach\s*me\s*(on|via|at)|dm\s*me\s*on)\s+(whatsapp|telegram|snapchat|signal|instagram|twitter|tiktok|discord)\b/gi,
  // "my WhatsApp is" / "my Telegram number"
  /\bmy\s+(whatsapp|telegram|snapchat|signal)\s+(is|number|id|handle)\b/gi,
  // "WhatsApp me" / "Telegram me"
  /\b(whatsapp|telegram|snapchat|signal)\s*me\b/gi,
];

function maskContent(text: string): string {
  let result = text;
  for (const pattern of SAFETY_PATTERNS) {
    pattern.lastIndex = 0;
    result = result.replace(pattern, MASK);
  }
  return result;
}

export const maskChatMessage = onDocumentCreated(
  "chat_messages/{messageId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const data = snap.data();
    const body = typeof data.body === "string" ? data.body : "";

    if (!body) return; // No text body — nothing to mask

    const masked = maskContent(body);

    if (masked === body) return; // Nothing was masked — skip the write

    logger.info(
      `Safety mask applied to message ${snap.id} ` +
      `(conversation: ${data.conversationId ?? "unknown"})`,
    );

    await snap.ref.update({
      body: masked,
      maskedBySafety: true,
      originalBody: body,   // Stored for admin review; security rules should restrict this
      maskedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  },
);
