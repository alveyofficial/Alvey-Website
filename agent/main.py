"""
agent/main.py

Alvey classroom AI agent entrypoint.

Environment variables:
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
from safety_monitor import SafetyMonitor
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

    room_url       = os.environ["DAILY_ROOM_URL"]
    bot_token      = os.environ["DAILY_BOT_TOKEN"]
    session_id     = os.environ["SESSION_ID"]
    project_id     = os.environ["FIREBASE_PROJECT_ID"]
    gemini_key     = os.environ["GEMINI_API_KEY"]
    webhook_url    = os.environ["WEBHOOK_URL"]
    webhook_secret = os.environ["WEBHOOK_SECRET"]

    session_start = time.time()
    participant_uids: list[str] = []
    # Maps Daily session_id → Firebase UID, populated from on_participant_joined events
    participant_daily_id_map: dict[str, str] = {}

    # ── 1. Transport (only provider-specific line) ─────────────────────────
    transport = create_transport(room_url=room_url, token=bot_token)

    # ── 2. AI brain ────────────────────────────────────────────────────────
    brain = AlveyAiBrain(gemini_api_key=gemini_key, session_id=session_id)

    # ── 3. Safety monitor ──────────────────────────────────────────────────
    async def mute_user(firebase_uid: str):
        """
        Mute a participant by Firebase UID.
        Resolves their Daily session_id from the participant map,
        then revokes canSend via Daily's update_participant_permissions.
        """
        daily_sid = next(
            (dsid for dsid, uid in participant_daily_id_map.items() if uid == firebase_uid),
            None,
        )
        if not daily_sid:
            logger.warning(f"Cannot mute {firebase_uid}: Daily session_id not found in map.")
            return
        try:
            await transport.update_participant_permissions(
                daily_sid,
                permissions={"hasPresence": True, "canSend": False},
            )
            logger.info(f"Muted Daily participant {daily_sid} (UID: {firebase_uid})")
        except Exception as e:
            logger.error(f"Mute failed for {daily_sid}: {e}")

    safety_monitor = SafetyMonitor(
        project_id=project_id,
        session_id=session_id,
        on_mute_user=mute_user,
    )
    await safety_monitor.start()
    brain.set_safety_monitor(safety_monitor)

    # ── 4. Firestore Q&A bridge ────────────────────────────────────────────
    fb_bridge = FirestoreBridge(
        project_id=project_id,
        session_id=session_id,
        ai_brain=brain,
    )
    await fb_bridge.start()

    # ── 5. Build pipeline and run ──────────────────────────────────────────
    _, task = brain.build_pipeline(transport)

    @transport.event_handler("on_participant_joined")
    async def on_joined(transport_ref, participant):
        uid       = participant.get("info", {}).get("userId", "")
        daily_sid = participant.get("id", "")
        role      = participant.get("info", {}).get("userName", "")
        if uid:
            if uid not in participant_uids:
                participant_uids.append(uid)
            if daily_sid:
                participant_daily_id_map[daily_sid] = uid
            brain.register_participant(daily_sid, uid, role)
        logger.info(f"Participant joined: uid={uid} daily_sid={daily_sid}")

    @transport.event_handler("on_participant_left")
    async def on_left(transport_ref, participant, reason):
        logger.info(f"Participant left: {participant.get('id', '?')} reason={reason}")

    logger.info(f"Bot joining room: {room_url}")

    from pipecat.pipeline.runner import PipelineRunner
    runner = PipelineRunner()
    await runner.run(task)

    # ── 6. Session ended — post webhook ────────────────────────────────────
    duration = time.time() - session_start
    logger.info(
        f"Session ended. Duration: {duration:.0f}s  "
        f"Transcript: {len(brain.transcript)} turns"
    )

    await post_session_end(
        webhook_url=webhook_url,
        webhook_secret=webhook_secret,
        session_id=session_id,
        transcript=brain.get_transcript(),
        duration_seconds=duration,
        participant_uids=participant_uids,
    )

    await fb_bridge.stop()
    await safety_monitor.stop()
    logger.info("Agent shutdown complete.")


if __name__ == "__main__":
    asyncio.run(main())
