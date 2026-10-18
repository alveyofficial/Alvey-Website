"""
agent/firestore_bridge.py

Listens to sessions/{sessionId}/ai_chat for new "pending" questions
and writes answers back using the Gemini session context from AlveyAiBrain.

This decouples the AI Q&A channel entirely from the video transport --
students ask via Firestore, answers come back via Firestore.
"""

import asyncio
from loguru import logger
from google.cloud import firestore
from google.cloud.firestore_v1.watch import DocumentChange


class FirestoreBridge:
    def __init__(self, project_id: str, session_id: str, ai_brain):
        self.project_id = project_id
        self.session_id = session_id
        self.ai_brain = ai_brain
        self._db: firestore.AsyncClient | None = None
        self._watch = None
        self._processing: set[str] = set()  # doc IDs currently being answered

    async def start(self):
        """Start listening for new pending Q&A messages."""
        self._db = firestore.AsyncClient(project=self.project_id)
        ai_chat_ref = (
            self._db
            .collection("sessions")
            .document(self.session_id)
            .collection("ai_chat")
        )

        def on_snapshot(doc_snapshots, changes: list[DocumentChange], read_time):
            for change in changes:
                if change.type.name == "ADDED":
                    doc = change.document
                    data = doc.to_dict()
                    if data.get("status") == "pending" and doc.id not in self._processing:
                        asyncio.create_task(self._answer(doc.id, data["question"]))

        self._watch = ai_chat_ref.on_snapshot(on_snapshot)
        logger.info(f"FirestoreBridge listening on sessions/{self.session_id}/ai_chat")

    async def _answer(self, doc_id: str, question: str):
        """Answer a single question and write the result back to Firestore."""
        self._processing.add(doc_id)
        logger.info(f"Answering Q&A [{doc_id}]: {question[:60]}")
        try:
            answer = await self.ai_brain.ask_question(question)
            doc_ref = (
                self._db
                .collection("sessions")
                .document(self.session_id)
                .collection("ai_chat")
                .document(doc_id)
            )
            await doc_ref.update({
                "answer": answer,
                "status": "answered",
                "answeredAt": firestore.SERVER_TIMESTAMP,
            })
            logger.info(f"Answered Q&A [{doc_id}] successfully.")
        except Exception as e:
            logger.error(f"Failed to answer Q&A [{doc_id}]: {e}")
        finally:
            self._processing.discard(doc_id)

    async def stop(self):
        """Stop the Firestore listener."""
        if self._watch:
            self._watch.unsubscribe()
            logger.info("FirestoreBridge stopped.")
        if self._db:
            self._db.close()
