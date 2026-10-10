# Alvey AI — Setup & Deployment Guide

This covers everything you need to deploy the `alvey-ai-brain` Cloud Function and wire it to
the website chatbot and WhatsApp bot.

---

## How it all fits together

```
Website chatbot (AIChatbot.tsx)
  └─► POST /api/chatbot          ← TanStack server route (thin proxy)
        └─► alvey-ai-brain       ← Firebase Cloud Function
              ├─► Firestore      ← reads tutors, CMS, lessons, etc.
              └─► Gemini API     ← generates the reply

WhatsApp message
  └─► Meta servers
        └─► alvey-whatsapp-webhook  ← Firebase Cloud Function
              ├─► Firestore          ← reads/writes whatsapp_sessions
              └─► alvey-ai-brain     ← calls the brain above
```

One `ai_config` document in the `platform_settings` Firestore collection controls
both the website chatbot and the WhatsApp bot.

---

## Step 1 — Get a Gemini API key

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).
2. Click **Create API key** → choose your Firebase project (`alvey-website`).
3. Copy the key — you'll need it in Step 3.

---

## Step 2 — Deploy the function

From the repo root run:

```powershell
firebase deploy --only functions:alveyAiBrain
```

After deployment, Firebase prints the function URL. It looks like:
`https://us-central1-alvey-website.cloudfunctions.net/alveyAiBrain`

Copy this URL — you'll need it in Step 3.

> First deploy? Make sure you've run `npm install` inside `functions/alvey-ai-brain/` first.

---

## Step 3 — Set environment variables

### For the Cloud Function

In [Firebase Console](https://console.firebase.google.com) → **Functions** → find
`alveyAiBrain` → **Details** → **Environment variables**, add:

| Key | Value |
|-----|-------|
| `GEMINI_API_KEY` | the key from Step 1 |

Click **Save**, then redeploy (`firebase deploy --only functions:alveyAiBrain`) for the
variable to take effect.

### For the web server

Add this to your `.env` file (or App Hosting environment variables in the Firebase Console):

```env
AI_FUNCTION_URL=https://us-central1-alvey-website.cloudfunctions.net/alveyAiBrain
```

---

## Step 4 — Test it

```powershell
# Health check — should return: {"ok":true,"text":"pong"}
Invoke-WebRequest -Uri "https://us-central1-alvey-website.cloudfunctions.net/alveyAiBrain" -Method GET | Select-Object -Expand Content

# Chat test — should return an AI reply
$body = '{"messages":[{"role":"user","content":"Hello, what is Alvey?"}]}'
Invoke-WebRequest -Uri "https://us-central1-alvey-website.cloudfunctions.net/alveyAiBrain" -Method POST -ContentType "application/json" -Body $body | Select-Object -Expand Content
```

---

## Local emulator setup

To test locally before deploying:

1. Create `functions/alvey-ai-brain/.env` (this file is gitignored):
   ```env
   GEMINI_API_KEY=your_key_here
   ```
2. Run the emulator from the repo root:
   ```powershell
   firebase emulators:start --only functions
   ```
3. The local URL will be printed in the terminal (usually `http://127.0.0.1:5001/...`).

---

## WhatsApp bot (optional)

See `functions/alvey-whatsapp-webhook/` — deploy the same way:

```powershell
firebase deploy --only functions:alveyWhatsappWebhook
```

Environment variables for the webhook function:

| Key | Value |
|-----|-------|
| `WHATSAPP_VERIFY_TOKEN` | any secret string you choose |
| `WHATSAPP_ACCESS_TOKEN` | from Meta App Dashboard |
| `WHATSAPP_PHONE_NUMBER_ID` | from Meta App Dashboard |
| `ALVEY_AI_BRAIN_URL` | the brain function URL from Step 2 |

Then in [Meta App Dashboard](https://developers.facebook.com/apps):
- **WhatsApp → Configuration → Webhook**
- Callback URL: your webhook function URL
- Verify token: the value you set for `WHATSAPP_VERIFY_TOKEN`
- Subscribe to the **messages** field

---

## Admin toggle — controlling both bots at once

The `ai_config` document in the `platform_settings` Firestore collection controls everything.
The CMS page at `/cms` already manages it.

The `value` field is a JSON object:

```json
{
  "enabled": true,
  "whatsapp_bot_enabled": true,
  "welcome_message": "Hi! I am the Alvey Assistant.",
  "lead_capture": true,
  "disabled_message": "The AI Assistant is currently disabled. Please contact us at support@alvey.study"
}
```

| `enabled` | `whatsapp_bot_enabled` | Website chatbot | WhatsApp bot |
|-----------|------------------------|-----------------|--------------|
| `true`    | `true`                 | Active          | Active       |
| `false`   | anything               | Disabled        | Disabled     |
| `true`    | `false`                | Active          | Disabled     |

---

## Firestore collections used

| Collection | Purpose |
|------------|---------|
| `tutor_profiles` | Active tutors injected into the AI context |
| `subjects` | Active subjects listed in the AI context |
| `homepage_content` | CMS data (headline, stats, mission, FAQs) |
| `platform_settings` | `ai_config` document — master toggle |
| `lessons` | Personal context for authenticated users |
| `student_tutor_assignments` | Personal context for authenticated students |
| `notifications` | Unread notification count for authenticated users |
| `whatsapp_sessions` | Conversation history for the WhatsApp bot |
| `aichats` | Chat sessions managed by the Firebase AI Logic extension |

---

## Environment variables at a glance

### `.env` (web server / App Hosting)

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=alvey-website.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=alvey-website
VITE_FIREBASE_STORAGE_BUCKET=alvey-website.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
AI_FUNCTION_URL=https://us-central1-alvey-website.cloudfunctions.net/alveyAiBrain
VITE_NOTIFICATIONS_FUNCTION_URL=https://us-central1-alvey-website.cloudfunctions.net/websiteNotifications
```

### `alvey-ai-brain` function env vars (set in Firebase Console)

```
GEMINI_API_KEY = your_gemini_api_key
```

### `alvey-whatsapp-webhook` function env vars (set in Firebase Console)

```
WHATSAPP_VERIFY_TOKEN    = your_chosen_secret
WHATSAPP_ACCESS_TOKEN    = from Meta App Dashboard
WHATSAPP_PHONE_NUMBER_ID = from Meta App Dashboard
ALVEY_AI_BRAIN_URL       = https://us-central1-alvey-website.cloudfunctions.net/alveyAiBrain
```

---

## Security notes

- `GEMINI_API_KEY` lives **only** on the Cloud Function — the web server and browser never touch it.
- The AI brain never returns raw Firestore documents — only the AI text reply reaches the browser.
- The system instruction explicitly tells Gemini not to reveal internal details, credentials, or schemas.
