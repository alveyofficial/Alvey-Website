"""
agent/session_end_handler.py

Called when the Pipecat pipeline ends (Daily fires "left-meeting").
Builds the provider-agnostic session-end payload and POSTs it to the
ingestSessionEnd Cloud Function webhook.

The payload shape is completely decoupled from the video provider --
it contains only Firebase UIDs, transcript entries, and duration.
"""

import hashlib
import hmac
import json
import time
from loguru import logger
import httpx


async def post_session_end(
    webhook_url: str,
    webhook_secret: str,
    session_id: str,
    transcript: list[dict],
    duration_seconds: float,
    participant_uids: list[str],
):
    """
    Signs and POSTs the session-end payload to the Cloud Function webhook.
    """
    payload = {
        "sessionId": session_id,
        "rawTranscript": transcript,
        "duration": int(duration_seconds),
        "participants": participant_uids,
    }

    body = json.dumps(payload, separators=(",", ":"))
    signature = hmac.new(
        webhook_secret.encode(),
        body.encode(),
        hashlib.sha256,
    ).hexdigest()

    headers = {
        "Content-Type": "application/json",
        "X-Alvey-Signature": signature,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(webhook_url, content=body, headers=headers)
            resp.raise_for_status()
            logger.info(f"Session-end webhook delivered. Status: {resp.status_code}")
    except httpx.HTTPStatusError as e:
        logger.error(f"Webhook HTTP error {e.response.status_code}: {e.response.text}")
        raise
    except Exception as e:
        logger.error(f"Webhook delivery failed: {e}")
        raise
