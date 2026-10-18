/**
 * src/lib/safety-mask.ts
 *
 * Shared regex masking for trust & safety.
 *
 * Applied client-side before send (chat routes + AI chat sidebar) and
 * server-side by the maskChatMessage Cloud Function as the authoritative layer.
 *
 * Keep SAFETY_PATTERNS in sync with functions/src/safety/maskMessage.ts.
 *
 * Patterns cover:
 *   - Saudi/Gulf mobile numbers (05XXXXXXXX, +966XXXXXXXXX)
 *   - International phone numbers (+44..., +1..., etc.)
 *   - Email addresses
 *   - Off-platform payment keywords (STC Pay, IBAN, PayPal, etc.)
 *   - Off-platform contact/chat app mentions (WhatsApp, Telegram, etc.)
 */

export const MASK = "[Hidden by Alvey Safety]";

/**
 * All patterns use the `g` or `gi` flag.
 * IMPORTANT: Always reset lastIndex to 0 before testing — these are reused
 * across calls. Both maskSensitiveContent() and containsSensitiveContent()
 * do this automatically.
 */
export const SAFETY_PATTERNS: RegExp[] = [
  // Saudi / Gulf mobile: 05XXXXXXXX or 5XXXXXXXX (with optional separators)
  /\b0?5\d[\s\-.]{0,1}\d{3}[\s\-.]{0,1}\d{4}\b/g,

  // International phone: +966..., +971..., +44..., +1... (common formats)
  /\+\d{1,3}[\s\-.]{0,1}\(?\d{1,4}\)?[\s\-.]{0,1}\d{3,4}[\s\-.]{0,1}\d{3,4}/g,

  // Email addresses
  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,

  // Off-platform payment services (case-insensitive)
  /\b(stc\s*pay|stcpay|iban|zain\s*cash|apple\s*pay|paypal|binance\s*pay|western\s*union|bank\s*transfer|direct\s*transfer|transfer\s*me)\b/gi,

  // "add me on / message me on / contact me via WhatsApp / Telegram / etc."
  /\b(add\s*me\s*on|message\s*me\s*on|contact\s*me\s*(on|via|at|through)|find\s*me\s*on|reach\s*me\s*(on|via|at)|dm\s*me\s*on)\s+(whatsapp|telegram|snapchat|signal|instagram|twitter|tiktok|discord)\b/gi,

  // "my WhatsApp is" / "my Telegram number"
  /\bmy\s+(whatsapp|telegram|snapchat|signal)\s+(is|number|id|handle)\b/gi,

  // "WhatsApp me" / "Telegram me"
  /\b(whatsapp|telegram|snapchat|signal)\s*me\b/gi,
];

/**
 * Apply all safety masks to a string.
 * Safe to call multiple times — lastIndex is reset before each pattern.
 * Returns the original string unchanged if nothing matched.
 */
export function maskSensitiveContent(text: string): string {
  if (!text) return text;
  let result = text;
  for (const pattern of SAFETY_PATTERNS) {
    pattern.lastIndex = 0;
    result = result.replace(pattern, MASK);
  }
  return result;
}

/**
 * Returns true if the text contains content that would be masked.
 * Useful for showing a UI warning without blocking send.
 */
export function containsSensitiveContent(text: string): boolean {
  if (!text) return false;
  return SAFETY_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  });
}
