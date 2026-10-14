// alvey-whatsapp-webhook — Firebase Cloud Function
//
// Handles the Meta WhatsApp Cloud API webhook lifecycle:
//   GET  — hub verification (green checkmark in Meta App Dashboard)
//   POST — inbound message processing with AI replies and conversation memory
//
// Architecture:
//   WhatsApp User → Meta Servers → this function → alvey-ai-brain → WhatsApp reply
//
// Conversation memory is stored in the Firestore collection "whatsapp_sessions":
//   - phoneNumber  (string, document ID = phone number for easy lookup)
//   - messages     (string, JSON-stringified array of {role, content} objects)
//   - updatedAt    (string, ISO timestamp)
// Sessions expire (are reset) if updatedAt is older than 24 hours.
// Message history is capped at 20 messages (10 user + 10 assistant turns).

const { onRequest }              = require('firebase-functions/v2/https');
const { defineSecret }           = require('firebase-functions/params');
const logger                     = require('firebase-functions/logger');
const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore }           = require('firebase-admin/firestore');

if (!getApps().length) {
  initializeApp();
}
const adminDb = getFirestore();

// ---------------------------------------------------------------------------
// Environment variables
// ---------------------------------------------------------------------------
const VERIFY_TOKEN       = process.env.WHATSAPP_VERIFY_TOKEN    || '';
const WA_ACCESS_TOKEN    = process.env.WHATSAPP_ACCESS_TOKEN    || '';
const WA_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const AI_BRAIN_URL       = process.env.ALVEY_AI_BRAIN_URL       || '';

const COLLECTION_SESSIONS = 'whatsapp_sessions';

// Session config
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_MESSAGES       = 20;                    // cap at 20 messages total

// ---------------------------------------------------------------------------
// WhatsApp Cloud API helper — send a text message
// ---------------------------------------------------------------------------
async function sendWhatsAppMessage(to, text) {
  if (!WA_ACCESS_TOKEN || !WA_PHONE_NUMBER_ID) {
    throw new Error('WhatsApp credentials not configured (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID)');
  }

  const url = `https://graph.facebook.com/v18.0/${WA_PHONE_NUMBER_ID}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${WA_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`WhatsApp send failed: ${JSON.stringify(err)}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

/** Load an existing session or return an empty one. Resets if older than 24 h. */
async function loadSession(phoneNumber) {
  try {
    const doc = await adminDb.collection(COLLECTION_SESSIONS).doc(phoneNumber).get();

    if (!doc.exists) {
      return { messages: [], exists: false };
    }

    const data      = doc.data();
    const updatedAt = new Date(data.updatedAt).getTime();
    const expired   = Date.now() - updatedAt > SESSION_MAX_AGE_MS;
    if (expired) {
      return { messages: [], exists: true };
    }

    const messages = JSON.parse(data.messages || '[]');
    return { messages, exists: true };
  } catch {
    // Document not found or parse error — fresh session
    return { messages: [], exists: false };
  }
}

/** Persist a session back to Firestore (upsert via set+merge). */
async function saveSession(phoneNumber, messages, exists) {
  const payload = {
    phoneNumber,
    messages:  JSON.stringify(messages),
    updatedAt: new Date().toISOString(),
  };

  await adminDb.collection(COLLECTION_SESSIONS).doc(phoneNumber).set(payload, { merge: true });
}

/** Cap the history at MAX_MESSAGES, always trimming the oldest pairs first. */
function capMessages(messages) {
  if (messages.length <= MAX_MESSAGES) return messages;
  // Trim from the front, keeping pairs (user + assistant)
  const excess = messages.length - MAX_MESSAGES;
  return messages.slice(excess);
}

// ---------------------------------------------------------------------------
// Call alvey-ai-brain
// ---------------------------------------------------------------------------
async function callAIBrain(messages) {
  if (!AI_BRAIN_URL) {
    throw new Error('ALVEY_AI_BRAIN_URL is not configured');
  }

  logger.info(`Calling alvey-ai-brain with ${messages.length} message(s)...`);
  const res = await fetch(AI_BRAIN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ messages, channel: 'whatsapp' }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`AI brain error: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  return data.text || "I'm here to help! Please ask me anything about Alvey.";
}

// ---------------------------------------------------------------------------
// Check if the WhatsApp bot is enabled via ai_config
// ---------------------------------------------------------------------------
async function isBotEnabled() {
  try {
    const doc = await adminDb.collection('platform_settings').doc('ai_config').get();
    if (!doc.exists) return { enabled: true };
    const raw   = doc.data();
    const value = raw?.value ? JSON.parse(raw.value) : raw;
    // Disabled if either the global enabled flag or whatsapp_bot_enabled is false
    if (value?.enabled === false)              return { enabled: false, reason: 'disabled' };
    if (value?.whatsapp_bot_enabled === false) return { enabled: false, reason: 'whatsapp_disabled' };
    return { enabled: true };
  } catch {
    // If we can't read the config, default to enabled
    return { enabled: true };
  }
}

// ---------------------------------------------------------------------------
// Main Firebase Cloud Function handler
// ---------------------------------------------------------------------------
exports.alveyWhatsappWebhook = onRequest(
  { region: 'us-central1', invoker: 'public' },
  async (req, res) => {

    // =========================================================================
    // GET — Meta webhook verification
    // =========================================================================
    if (req.method === 'GET') {
      const params    = req.query || {};
      const mode      = params['hub.mode'];
      const token     = params['hub.verify_token'];
      const challenge = params['hub.challenge'];

      logger.info(`Webhook verification request — mode: ${mode}, token match: ${token === VERIFY_TOKEN}`);

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        logger.info('Webhook verified successfully.');
        res.set('Content-Type', 'text/plain');
        return res.status(200).send(challenge);
      }

      logger.error('Webhook verification failed — token mismatch or wrong mode.');
      res.set('Content-Type', 'text/plain');
      return res.status(403).send('Forbidden');
    }

    // =========================================================================
    // POST — inbound WhatsApp message
    // =========================================================================
    if (req.method === 'POST') {
      // Always respond 200 to Meta immediately so they don't retry.
      // We do our async processing before returning, but within the 30s timeout.

      let body = {};
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      } catch {
        logger.error('Failed to parse POST body');
        return res.status(200).json({ status: 'ok' }); // still return 200
      }

      logger.info('Received webhook payload: ' + JSON.stringify(body).slice(0, 300));

      // -----------------------------------------------------------------------
      // Extract message from Meta's payload structure
      // -----------------------------------------------------------------------
      let inboundMessage;
      try {
        inboundMessage = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      } catch {
        logger.info('Could not extract message from payload — ignoring.');
        return res.status(200).json({ status: 'ok' });
      }

      // Ignore non-message events (status updates, etc.)
      if (!inboundMessage) {
        logger.info('No message in payload — possibly a status update. Ignoring.');
        return res.status(200).json({ status: 'ok' });
      }

      const from      = inboundMessage.from;       // sender's phone number (E.164)
      const messageId = inboundMessage.id;
      const msgType   = inboundMessage.type;
      const textBody  = inboundMessage?.text?.body;

      logger.info(`Message from: ${from}, type: ${msgType}, id: ${messageId}`);

      // -----------------------------------------------------------------------
      // Only handle text messages
      // -----------------------------------------------------------------------
      if (msgType !== 'text' || !textBody) {
        logger.info('Non-text message received — sending polite reply.');
        try {
          await sendWhatsAppMessage(from, "I can only handle text messages for now. Please type your question and I'll be happy to help!");
        } catch (sendErr) {
          logger.error('Failed to send non-text reply:', sendErr.message);
        }
        return res.status(200).json({ status: 'ok' });
      }

      // -----------------------------------------------------------------------
      // Check if the WhatsApp bot is enabled
      // -----------------------------------------------------------------------
      const botStatus = await isBotEnabled();
      if (!botStatus.enabled) {
        logger.info(`Bot disabled (reason: ${botStatus.reason}) — sending fallback message.`);
        try {
          await sendWhatsAppMessage(
            from,
            'Our assistant is temporarily unavailable. Please contact us at support@alvey.study',
          );
        } catch (sendErr) {
          logger.error('Failed to send disabled reply:', sendErr.message);
        }
        return res.status(200).json({ status: 'ok' });
      }

      // -----------------------------------------------------------------------
      // Load conversation session
      // -----------------------------------------------------------------------
      logger.info(`Loading session for ${from}...`);
      const session = await loadSession(from);
      logger.info(`Session loaded — ${session.messages.length} existing message(s).`);

      // -----------------------------------------------------------------------
      // Append new user message to history
      // -----------------------------------------------------------------------
      const updatedMessages = [
        ...session.messages,
        { role: 'user', content: textBody },
      ];

      // -----------------------------------------------------------------------
      // Call alvey-ai-brain with full history
      // -----------------------------------------------------------------------
      let aiReply;
      try {
        aiReply = await callAIBrain(updatedMessages);
      } catch (aiErr) {
        logger.error('AI brain call failed:', aiErr.message);
        try {
          await sendWhatsAppMessage(from, "Sorry, I'm having trouble responding right now. Please try again in a moment or contact us at support@alvey.study");
        } catch { /* ignore send errors in error path */ }
        return res.status(200).json({ status: 'ok' });
      }

      logger.info(`AI reply (${aiReply.length} chars): ${aiReply.slice(0, 120)}...`);

      // -----------------------------------------------------------------------
      // Append AI reply, cap history, save session
      // -----------------------------------------------------------------------
      const finalMessages = capMessages([
        ...updatedMessages,
        { role: 'assistant', content: aiReply },
      ]);

      try {
        await saveSession(from, finalMessages, session.exists);
        logger.info('Session saved.');
      } catch (saveErr) {
        logger.error('Failed to save session:', saveErr.message);
        // Non-fatal — continue and still send the reply
      }

      // -----------------------------------------------------------------------
      // Send reply via WhatsApp Cloud API
      // -----------------------------------------------------------------------
      try {
        await sendWhatsAppMessage(from, aiReply);
        logger.info('WhatsApp reply sent successfully.');
      } catch (sendErr) {
        logger.error('Failed to send WhatsApp reply:', sendErr.message);
      }

      return res.status(200).json({ status: 'ok' });
    }

    // =========================================================================
    // Fallback — method not handled
    // =========================================================================
    return res.status(405).json({ error: 'Method not allowed' });
  },
);
