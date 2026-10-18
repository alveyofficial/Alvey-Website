"""
agent/transport_factory.py

THE single file to edit when migrating from Daily.co to LiveKit.

Migration steps:
  1. pip install pipecat-ai[livekit]
  2. Change PROVIDER env var to "livekit"
  3. Uncomment the LiveKitTransport block below
  4. Delete or archive the DailyTransport block
"""

import os
from loguru import logger

def create_transport(room_url: str, token: str, bot_name: str = "Alvey AI"):
    """
    Returns the appropriate Pipecat transport based on the PROVIDER env var.
    All callers receive the same interface regardless of provider.
    """
    provider = os.getenv("PROVIDER", "daily").lower()

    if provider == "daily":
        from pipecat.transports.services.daily import DailyParams, DailyTransport
        logger.info(f"Using DailyTransport for room: {room_url}")
        return DailyTransport(
            room_url=room_url,
            token=token,
            bot_name=bot_name,
            params=DailyParams(
                audio_in_enabled=True,   # listen to room audio
                audio_out_enabled=True,  # speak responses back
                camera_out_enabled=False,
                vad_enabled=True,
                vad_analyzer=None,       # Gemini handles VAD natively
                transcription_enabled=False,  # Gemini handles STT
            ),
        )

    elif provider == "livekit":
        # Future: uncomment when pipecat-ai[livekit] is installed
        # from pipecat.transports.services.livekit import LiveKitParams, LiveKitTransport
        # logger.info(f"Using LiveKitTransport for room: {room_url}")
        # return LiveKitTransport(
        #     url=room_url,
        #     token=token,
        #     room_name=bot_name,
        #     params=LiveKitParams(audio_in_enabled=True, audio_out_enabled=True),
        # )
        raise NotImplementedError(
            "LiveKit transport is not yet configured. "
            "See the migration guide in transport_factory.py."
        )

    else:
        raise ValueError(f"Unknown PROVIDER: {provider!r}. Must be 'daily' or 'livekit'.")
