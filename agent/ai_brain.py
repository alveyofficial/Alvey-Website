"""
agent/ai_brain.py

Gemini Multimodal Live pipeline — tutor assistant + real-time safety monitor.
"""

import asyncio
import time
from dataclasses import dataclass, field
from typing import Callable, Optional
from loguru import logger

from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.task import PipelineTask, PipelineParams
from pipecat.services.google import GoogleLLMService
from pipecat.processors.aggregators.llm_response import (
    LLMAssistantResponseAggregator,
    LLMUserResponseAggregator,
)
from pipecat.frames.frames import TranscriptionFrame

# ---------------------------------------------------------------------------
# Gemini function-calling tool: flag_violation
# ---------------------------------------------------------------------------

FLAG_VIOLATION_TOOL = {
    "function_declarations": [
        {
            "name": "flag_violation",
            "description": (
                "Call this immediately when you detect a trust or safety violation "
                "in the audio. Do not wait for the sentence to finish."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "type": {
                        "type": "string",
                        "enum": ["payment_dodging", "contact_sharing", "abuse", "inappropriate"],
                        "description": "Violation category.",
                    },
                    "severity": {
                        "type": "string",
                        "enum": ["low", "medium", "high"],
                        "description": "Severity level.",
                    },
                    "quote": {
                        "type": "string",
                        "description": "Exact words spoken that triggered this (max 200 chars).",
                    },
                },
                "required": ["type", "severity", "quote"],
            },
        }
    ]
}

# ---------------------------------------------------------------------------
# Transcript
# ---------------------------------------------------------------------------

@dataclass
class TranscriptEntry:
    speaker: str
    text: str
    timestamp: float = field(default_factory=time.time)

    def to_dict(self) -> dict:
        return {"speaker": self.speaker, "text": self.text, "timestamp": self.timestamp}

# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are Alvey AI — an expert tutor assistant AND real-time trust & safety monitor embedded in a live 1-on-1 tutoring session.

ROLE 1 — SILENT TUTOR ASSISTANT
- Listen to the full conversation. Stay silent unless a student submits a question via the chat interface.
- When asked a question, answer concisely using the session context.
- Be encouraging and supportive.
- Never interrupt the live lesson unprompted.

ROLE 2 — REAL-TIME TRUST & SAFETY MONITOR (ALWAYS ACTIVE)
You MUST call flag_violation() immediately when you detect ANY of the following:

PAYMENT / CONTACT DODGING (type: "payment_dodging" or "contact_sharing"):
- Arranging payments outside Alvey: "send me via STC Pay", "transfer to my account", "I'll give you a discount off-site", mentioning IBAN, Zain Cash, Apple Pay, PayPal, Western Union
- Sharing personal contact details: phone numbers starting with 05 or +966, WhatsApp numbers, Telegram handles, Instagram/Snapchat usernames, personal email addresses
- Phrases like "add me on WhatsApp", "message me on Telegram", "my number is...", "find me on Instagram"

ABUSE / HARASSMENT (type: "abuse" or "inappropriate"):
- Verbal insults, degrading language, or personal attacks directed at either party
- Sexual harassment or inappropriate comments
- Threats or intimidation

SEVERITY: low = borderline/accidental, medium = clear intent, high = explicit/repeated/severe

IMPORTANT: Call flag_violation() AS SOON as you detect the violation, mid-sentence if needed. Include the triggering quote.

ROLE 3 — POST-CLASS
When the session ends, generate comprehensive structured notes.
"""

# ---------------------------------------------------------------------------
# AlveyAiBrain
# ---------------------------------------------------------------------------

class AlveyAiBrain:
    def __init__(self, gemini_api_key: str, session_id: str):
        self.gemini_api_key = gemini_api_key
        self.session_id = session_id
        self.transcript: list[TranscriptEntry] = []
        self._on_transcript_cb: Optional[Callable[[TranscriptEntry], None]] = None
        self._llm_service: Optional[GoogleLLMService] = None
        self._task: Optional[PipelineTask] = None
        self._safety_monitor = None
        self._participant_uid_map: dict[str, str] = {}

    def set_safety_monitor(self, monitor):
        self._safety_monitor = monitor
        logger.info("Safety monitor wired into AI brain.")

    def register_participant(self, daily_sid: str, uid: str, role: str):
        self._participant_uid_map[daily_sid] = uid
        logger.debug(f"Registered participant: {daily_sid} → {uid} ({role})")

    def on_transcript_update(self, callback: Callable[[TranscriptEntry], None]):
        self._on_transcript_cb = callback

    def _record(self, speaker: str, text: str):
        entry = TranscriptEntry(speaker=speaker, text=text)
        self.transcript.append(entry)
        logger.debug(f"[{speaker}] {text[:80]}")
        if self._on_transcript_cb:
            self._on_transcript_cb(entry)

    async def _handle_function_call(self, function_name: str, args: dict):
        if function_name != "flag_violation":
            return
        vtype    = args.get("type", "unknown")
        severity = args.get("severity", "medium")
        quote    = args.get("quote", "")
        logger.warning(f"Gemini flagged: {vtype}/{severity} — '{quote[:80]}'")
        if self._safety_monitor:
            asyncio.create_task(
                self._safety_monitor.handle_violation(
                    violation_type=vtype,
                    severity=severity,
                    quote=quote,
                    offender_uid="",
                )
            )

    def build_pipeline(self, transport) -> tuple[Pipeline, PipelineTask]:
        self._llm_service = GoogleLLMService(
            api_key=self.gemini_api_key,
            model="gemini-2.0-flash-exp",
            system_instruction=SYSTEM_PROMPT,
            tools=[FLAG_VIOLATION_TOOL],
        )

        user_aggregator = LLMUserResponseAggregator()
        assistant_aggregator = LLMAssistantResponseAggregator()

        @user_aggregator.event_handler("on_user_turn_completion")
        async def on_user(frame: TranscriptionFrame):
            self._record("student", frame.text)

        @assistant_aggregator.event_handler("on_assistant_turn_completion")
        async def on_ai(frame):
            if hasattr(frame, "text") and frame.text:
                self._record("ai", frame.text)

        @self._llm_service.event_handler("on_function_call")
        async def on_function_call(service, function_name, tool_call_id, args):
            await self._handle_function_call(function_name, args)
            return {}

        pipeline = Pipeline([
            transport.input(),
            user_aggregator,
            self._llm_service,
            assistant_aggregator,
            transport.output(),
        ])

        self._task = PipelineTask(
            pipeline,
            params=PipelineParams(allow_interruptions=True),
        )
        return pipeline, self._task

    async def ask_question(self, question: str) -> str:
        if not self._llm_service:
            return "Session not ready."

        recent_context = "\n".join(
            f"[{e.speaker}]: {e.text}" for e in self.transcript[-20:]
        ) or "(No conversation yet)"

        prompt = (
            f"A student asked this question during the live session:\n\n"
            f"QUESTION: {question}\n\n"
            f"RECENT CONVERSATION CONTEXT:\n{recent_context}\n\n"
            f"Please answer the question concisely, using the session context."
        )

        try:
            import google.generativeai as genai
            genai.configure(api_key=self.gemini_api_key)
            model = genai.GenerativeModel(
                model_name="gemini-2.0-flash-exp",
                system_instruction=SYSTEM_PROMPT,
            )
            resp = model.generate_content(prompt)
            answer = resp.text.strip()
            self._record("ai", answer)
            return answer
        except Exception as e:
            logger.error(f"Gemini Q&A error: {e}")
            return "I encountered an error answering your question. Please try again."

    def get_transcript(self) -> list[dict]:
        return [e.to_dict() for e in self.transcript]
