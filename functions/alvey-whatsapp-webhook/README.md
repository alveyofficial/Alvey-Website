# alvey-whatsapp-webhook

Firebase Cloud Function (Node 22, CJS) that handles the Meta WhatsApp Cloud API webhook for the Alvey bot. Inbound messages are routed through `alvey-ai-brain` for AI-generated replies, and conversation history is stored in Firestore.

## Endpoints

### GET — Hub Verification

Meta calls this endpoint when you register or update the webhook in the Meta App Dashboard. The function checks `hub.mode` and `hub.verify_token` against `WHATSAPP_VERIFY_TOKEN` and echoes back `hub.challenge` as plain text with HTTP 200 on success, or 403 on mismatch.

### POST — Inbound Messages

Meta posts inbound WhatsApp messages here. The function:

1. Extracts the sender's phone number and message text from the Meta payload.
2. Checks whether the bot is enabled via the `ai_config` document in the `platform_settings` Firestore collection.
3. Loads (or creates) a session document from the `whatsapp_sessions` Firestore collection.
4. Appends the user's message to the conversation history.
5. Calls `alvey-ai-brain` (HTTP POST) with the full history and `channel: 'whatsapp'`.
6. Caps the history at 20 messages and saves the updated session back to Firestore.
7. Sends the AI reply to the user via the WhatsApp Cloud API.

Non-text messages (images, audio, etc.) receive a polite fallback reply asking the user to send text instead.

## Session Storage

Collection: `whatsapp_sessions`  
Document ID: sender phone number in E.164 format (e.g. `+15551234567`)

Fields:

| Field         | Type   | Description                                     |
|---------------|--------|-------------------------------------------------|
| `phoneNumber` | string | Phone number (mirrors the document ID)          |
| `messages`    | string | JSON-stringified `[{role, content}]` array      |
| `updatedAt`   | string | ISO 8601 timestamp of last save                 |

Sessions expire (are reset) after **24 hours** of inactivity. History is capped at **20 messages** total (oldest pairs trimmed first).

## Environment Variables

Set these as Firebase secrets (production) or in a local `.env` file (emulator):

| Variable                    | Description                                               |
|-----------------------------|-----------------------------------------------------------|
| `WHATSAPP_VERIFY_TOKEN`     | Secret token for Meta webhook hub verification            |
| `WHATSAPP_ACCESS_TOKEN`     | Permanent access token for the WhatsApp Business account  |
| `WHATSAPP_PHONE_NUMBER_ID`  | WhatsApp phone number ID from the Meta App Dashboard      |
| `ALVEY_AI_BRAIN_URL`        | Full HTTPS URL of the deployed `alvey-ai-brain` function  |

## Deploying

```bash
firebase deploy --only functions:alveyWhatsappWebhook
```
