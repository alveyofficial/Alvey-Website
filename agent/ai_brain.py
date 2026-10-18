"""
agent/ai_brain.py

Builds the Pipecat pipeline that:
  1. Receives audio from the transport (tutor + student voices)
  2. Pipes it directly into Gemini Multimodal Live API (no separate STT step)
  3. Accumulates a timestamped transcript with speaker attribution
  4. Returns Gemini text responses as audio back into the room

Gemini acts as a silent AI tutor that has full audio context of the session.
"""

import asyncio
import time
from dataclasses import dataclass, field
from typing import Callable
from loguru import logger

from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineTask, PipelineParams
from pipecat.services.google import GoogleLLMService
from pipecat.processors.aggregators.llm_response import (
    LLMAssistantResponseAggregator,
    LLMUserResponseAggregator,
)
from pipecat.frames.frames import (
    TranscriptionFrame,
)


@dataclass
class TranscriptEntry:
    speaker: str   # "tutor", "student", or "ai"
    text: str
    timestamp: float = field(default_factory=time.time)

    def to_dict(self) -> dict:
        return {
            "speaker": self.speaker,
            "text": self.text,
            "timestamp": self.timestamp,
        }


SYSTEM_PROMPT = """You are Alvey AI, an expert AI tutor assistant embedded in a live 1-on-1 tutoring session.

You are listening to the conversation between the tutor and student. You have full context of everything said.

Your roles:
1. SILENT OBSERVER: You listen continuously but stay silent unless directly asked a question.
2. IN-CLASS Q&A: When a student submits a question through the chat interface, you answer it with full context of what has been discussed.
3. POST-CLASS: When the session ends, you will generate comprehensive structured notes.

Guidelines:
- Keep answers concise and directly relevant to what's been discussed in the session.
- Use the tutor's teaching style and level as context for your answers.
- Never interrupt the live conversation unprompted.
- Be encouraging and supportive in your tone.
"""


class AlveyAiBrain:
    """
    Manages the Gemini Multimodal Live pipeline for a classroom session.
    """

    def __init__(self, gemini_api_key: str, session_id: str):
        self.gemini_api_key = gemini_api_key
        self.session_id = session_id
        self.transcript: list[TranscriptEntry] = []
        self._on_transcript_cb: Callable[[TranscriptEntry], None] | None = None
        self._llm_service: GoogleLLMService | None = None
        self._task: PipelineTask | None = None

    def on_transcript_update(self, callback: Callable[[TranscriptEntry], None]):
        """Register a callback that fires whenever a new transcript entry is added."""
        self._on_transcript_cb = callback

    def _record(self, speaker: str, text: str):
        entry = TranscriptEntry(speaker=speaker, text=text)
        self.transcript.append(entry)
        logger.debug(f"[{speaker}] {text[:80]}")
        if self._on_transcript_cb:
            self._on_transcript_cb(entry)

    def build_pipeline(self, transport) -> tuple[Pipeline, PipelineTask]:
        """
        Build the Pipecat pipeline.

        Audio flow:
          transport.input() -> Gemini LLM -> transport.output()

        Gemini receives raw audio frames directly - no STT middleware needed.
        It handles transcription, understanding, and response generation natively.
        """
        self._llm_service = GoogleLLMService(
            api_key=self.gemini_api_key,
            model="gemini-2.0-flash-exp",  # Multimodal Live model
            system_instruction=SYSTEM_PROMPT,
        )

        user_aggregator = LLMUserResponseAggregator()
        assistant_aggregator = LLMAssistantResponseAggregator()

        # Wire transcript recording to the aggregators
        @user_aggregator.event_handler("on_user_turn_completion")
        async def on_user(frame: TranscriptionFrame):
            self._record("student", frame.text)

        @assistant_aggregator.event_handler("on_assistant_turn_completion")
        async def on_ai(frame):
            if hasattr(frame, "text") and frame.text:
                self._record("ai", frame.text)

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
        """
        Inject a student question into the active Gemini session context.
        Returns the answer text.
        Used by FirestoreBridge to answer in-class Q&A prompts.
        """
        if not self._llm_service:
            return "Session not ready."

        # Build context-aware messages: include recent transcript for grounding
        recent_context = "\n".join(
            f"[{e.speaker}]: {e.text}"
            for e in self.transcript[-20:]  # last 20 turns for context window
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
