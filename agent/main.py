"""
agent/main.py

Alvey classroom AI agent.

HTTP server (Cloud Run requirement):
  GET  /health  → 200 OK (health check, always works)
  POST /start   → lazily imports pipecat, runs the agent, blocks until session ends

All heavy imports (pipecat, google, firestore) are deferred until /start
is called so the server boots instantly even if deps have issues.
"""

import json
import os
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from loguru import logger

# Load .env if present (no error if missing on Cloud Run)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


# ---------------------------------------------------------------------------
# Session runner — imports are lazy so /health works without pipecat installed
# ---------------------------------------------------------------------------

async def run_session(room_url: str, bot_token: str, session_id: str):
    import asyncio
    import time

    project_id     = os.environ["FIREBASE_PROJECT_ID"]
    gemini_key     = os.environ["GEMINI_API_KEY"]
    webhook_url    = os.environ["WEBHOOK_URL"]
    webhook_secret = os.environ["WEBHOOK_SECRET"]

    # Lazy imports — only loaded when a session starts
    from transport_factory import create_transport
    from ai_brain import AlveyAiBrain
    from firestore_bridge import FirestoreBridge
    from safety_monitor import SafetyMonitor
    from session_end_handler import post_session_end

    session_start = time.time()
    participant_uids: list[str] = []
    participant_daily_id_map: dict[str, str] = {}

    transport = create_transport(room_url=room_url, token=bot_token)
    brain = AlveyAiBrain(gemini_api_key=gemini_key, session_id=session_id)

    async def mute_user(firebase_uid: str):
        daily_sid = next(
            (dsid for dsid, uid in participant_daily_id_map.items() if uid == firebase_uid),
            None,
        )
        if not daily_sid:
            return
        try:
            await transport.update_participant_permissions(
                daily_sid, permissions={"hasPresence": True, "canSend": False},
            )
        except Exception as e:
            logger.error(f"Mute failed: {e}")

    safety_monitor = SafetyMonitor(
        project_id=project_id, session_id=session_id, on_mute_user=mute_user,
    )
    await safety_monitor.start()
    brain.set_safety_monitor(safety_monitor)

    fb_bridge = FirestoreBridge(project_id=project_id, session_id=session_id, ai_brain=brain)
    await fb_bridge.start()

    _, task = brain.build_pipeline(transport)

    @transport.event_handler("on_participant_joined")
    async def on_joined(transport_ref, participant):
        uid = participant.get("info", {}).get("userId", "")
        daily_sid = participant.get("id", "")
        if uid:
            if uid not in participant_uids:
                participant_uids.append(uid)
            if daily_sid:
                participant_daily_id_map[daily_sid] = uid
            brain.register_participant(daily_sid, uid, participant.get("info", {}).get("userName", ""))

    @transport.event_handler("on_participant_left")
    async def on_left(transport_ref, participant, reason):
        logger.info(f"Left: {participant.get('id', '?')} {reason}")

    logger.info(f"Bot joining: {room_url}")
    from pipecat.pipeline.runner import PipelineRunner
    await PipelineRunner().run(task)

    duration = time.time() - session_start
    logger.info(f"Session ended: {duration:.0f}s, {len(brain.transcript)} turns")

    await post_session_end(
        webhook_url=webhook_url, webhook_secret=webhook_secret,
        session_id=session_id, transcript=brain.get_transcript(),
        duration_seconds=duration, participant_uids=participant_uids,
    )
    await fb_bridge.stop()
    await safety_monitor.stop()


# ---------------------------------------------------------------------------
# HTTP server
# ---------------------------------------------------------------------------

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"ok")
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path != "/start":
            self.send_response(404)
            self.end_headers()
            return

        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length)) if length else {}
        except Exception:
            self.send_response(400)
            self.end_headers()
            return

        room_url  = body.get("roomUrl", "")
        token     = body.get("token", "")
        session_id = body.get("sessionId", "")

        if not all([room_url, token, session_id]):
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"error":"roomUrl, token, sessionId required"}')
            return

        logger.info(f"START session {session_id}")

        # Start the session in a background thread so we can return 200
        # immediately. The thread keeps the container alive.
        import threading
        import asyncio

        def run_bg():
            try:
                asyncio.run(run_session(room_url, token, session_id))
            except Exception as e:
                logger.error(f"Background session failed: {e}")

        t = threading.Thread(target=run_bg, daemon=False)
        t.start()

        # Give the bot 3 seconds to start joining, then return 200
        import time
        time.sleep(3)

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"ok":true}')


def main():
    port = int(os.environ.get("PORT", 8080))
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    logger.info(f"Listening on :{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
