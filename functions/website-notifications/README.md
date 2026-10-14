# website-notifications

Firebase Cloud Function (v2 HTTPS) that receives form submissions from the
Alvey website and dispatches notifications.

## What it does

Accepts a `POST` request with a JSON body containing a `type` field. It:

1. Sends a formatted Discord embed to `DISCORD_WEBHOOK_URL`.
2. Optionally sends a confirmation email to the submitter via the Resend API
   (if `RESEND_API_KEY` is set and an email address is present in the payload).

A `GET` request returns `{ ok: true }` as a health check.

## Notification types

| `type` value              | Discord title                    | Trigger                        |
| ------------------------- | -------------------------------- | ------------------------------ |
| `tutor_application`       | 🎓 New Tutor Application         | Tutor application form         |
| `recruitment_application` | 👥 New Recruitment Application   | Recruitment application form   |
| `contact_message`         | 📩 New Contact Message           | Public contact form            |

All other `type` values fall back to "🌐 New Website Notification".

## Endpoint

After deploying, Firebase prints the URL. It follows this pattern:

```
https://us-central1-<project-id>.cloudfunctions.net/websiteNotifications
```

Set `VITE_NOTIFICATIONS_FUNCTION_URL` in `.env` (and in Firebase App Hosting
environment config) to this URL.

## Secrets

Two Firebase secrets are required. Set them before deploying:

```bash
firebase functions:secrets:set DISCORD_WEBHOOK_URL
firebase functions:secrets:set RESEND_API_KEY
```

To verify a secret was stored:

```bash
firebase functions:secrets:access DISCORD_WEBHOOK_URL
firebase functions:secrets:access RESEND_API_KEY
```

| Secret                | Required | Purpose                                      |
| --------------------- | -------- | -------------------------------------------- |
| `DISCORD_WEBHOOK_URL` | Yes      | Discord incoming webhook URL                 |
| `RESEND_API_KEY`      | No       | Resend API key for confirmation emails       |

If `RESEND_API_KEY` is not set the function still sends the Discord
notification — the email step is skipped with a warning log.

## Deploying

```bash
firebase deploy --only functions:websiteNotifications
```
