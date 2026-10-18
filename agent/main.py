"""
agent/main.py

Entrypoint for the Alvey classroom AI agent.

Environment variables (set by the Cloud Function that spawns this process,
or via .env for local development):
  PROVIDER             - "daily" or "livekit"
  DAILY_ROOM_URL       - Full Daily room URL
  DAILY_BOT_TOKEN      - Scoped Daily meeting token for the bot
  SESSION_ID           - Firestore session document ID
  FIREBASE_PROJECT_ID  - Firebase project ID
  GEMINI_API_KEY       - Google Gemini API key
  WEBHOOK_URL          - URL of the ingestSessionEnd Cloud Function
  WEBHOOK_SECRET       - HMAC secret for webhook verification
"""

import asyncio
import os
import time
from dotenv import load_dotenv
from loguru import logger

load_dotenv()

from transport_factory import create_transport
from ai_brain import AlveyAiBrain
from firestore_bridge import FirestoreBridge
from session_end_handler import post_session_end


def validate_env():
    required = [
        "DAILY_ROOM_URL", "DAILY_BOT_TOKEN", "SESSION_ID",
        "FIREBASE_PROJECT_ID", "GEMINI_API_KEY",
        "WEBHOOK_URL", "WEBHOOK_SECRET",
    ]
    missing = [k for k in required if not os.getenv(k)]
    if missing:
        raise EnvironmentError(f"Missing required env vars: {', '.join(missing)}")


async def main():
    validate_env()

    room_url        = os.environ["DAILY_ROOM_URL"]
    bot_token       = os.environ["DAILY_BOT_TOKEN"]
    session_id      = os.environ["SESSION_ID"]
    project_id      = os.environ["FIREBASE_PROJECT_ID"]
    gemini_key      = os.environ["GEMINI_API_KEY"]
    webhook_url     = os.environ["WEBHOOK_URL"]
    webhook_secret  = os.environ["WEBHOOK_SECRET"]

    session_start   = time.time()
    participant_uids: list[str] = []  # populated from Daily participant metadata

    # -- 1. Create transport (the only provider-specific step) ---------------
    transport = create_transport(room_url=room_url, token=bot_token)

    # -- 2. Initialise AI brain ----------------------------------------------
    brain = AlveyAiBrain(gemini_api_key=gemini_key, session_id=session_id)

    # -- 3. Start Firestore Q&A bridge ---------------------------------------
    fb_bridge = FirestoreBridge(
        project_id=project_id,
        session_id=session_id,
        ai_brain=brain,
    )
    await fb_bridge.start()

    # -- 4. Build and run the pipeline ---------------------------------------
    _, task = brain.build_pipeline(transport)

    # Collect participant UIDs from Daily events
    @transport.event_handler("on_participant_joined")
    async def on_joined(transport_ref, participant):
        uid = participant.get("info", {}).get("userId", "")
        if uid and uid not in participant_uids:
            participant_uids.append(uid)
            logger.info(f"Participant joined: {uid}")

    @transport.event_handler("on_participant_left")
    async def on_left(transport_ref, participant, reason):
        logger.info(f"Participant left: {participant.get('id', '?')} reason={reason}")

    logger.info(f"Bot joining room: {room_url}")

    runner = PipelineRunner()
    await runner.run(task)

    # -- 5. Pipeline ended -- send session-end webhook -----------------------
    duration = time.time() - session_start
    logger.info(f"Session ended. Duration: {duration:.0f}s  Transcript: {len(brain.transcript)} turns")

    await post_session_end(
        webhook_url=webhook_url,
        webhook_secret=webhook_secret,
        session_id=session_id,
        transcript=brain.get_transcript(),
        duration_seconds=duration,
        participant_uids=participant_uids,
    )

    await fb_bridge.stop()
    logger.info("Agent shutdown complete.")


if __name__ == "__main__":
    asyncio.run(main())
