"""
agent/safety_monitor.py

Handles trust & safety violations detected by Gemini during live sessions.
Two violation categories:
  - payment_dodging / contact_sharing → warning toast on both screens
  - abuse / harassment / inappropriate → mute offender + notify both screens

All enforcement is done by writing to two Firestore subcollections under sessions/{sessionId}:
  - safety_events/        → admin audit log (written every time)
  - live_notifications/   → real-time toasts read by the frontend via onSnapshot
"""

import asyncio
import time
from dataclasses import dataclass
from loguru import logger
from google.cloud import firestore

PAYMENT_DODGING_TYPES = {"payment_dodging", "contact_sharing", "off_platform"}
ABUSE_TYPES = {"abuse", "harassment", "inappropriate"}

PAYMENT_WARNING_MSG = (
    "⚠️ Reminder: Keeping bookings and payments on Alvey protects your "
    "money-back guarantee and keeps your account active. "
    "Payments are only to be sent through Alvey."
)


@dataclass
class Violation:
    violation_type: str
    severity: str
    quote: str
    offender_uid: str
    timestamp: float


class SafetyMonitor:
    def __init__(self, project_id: str, session_id: str, on_mute_user=None):
        self.project_id = project_id
        self.session_id = session_id
        self._on_mute_user = on_mute_user
        self._db = None

    async def start(self):
        self._db = firestore.AsyncClient(project=self.project_id)
        logger.info("SafetyMonitor started.")

    async def handle_violation(self, violation_type: str, severity: str, quote: str, offender_uid: str = ""):
        v = Violation(
            violation_type=violation_type,
            severity=severity,
            quote=quote,
            offender_uid=offender_uid,
            timestamp=time.time(),
        )
        logger.warning(f"Safety violation [{violation_type}/{severity}]: {quote[:80]}")
        await asyncio.gather(
            self._record_to_firestore(v),
            self._take_action(v),
        )

    async def _record_to_firestore(self, v: Violation):
        if not self._db:
            return
        try:
            ref = (
                self._db
                .collection("sessions").document(self.session_id)
                .collection("safety_events").document()
            )
            await ref.set({
                "violationType": v.violation_type,
                "severity": v.severity,
                "quote": v.quote,
                "offenderUid": v.offender_uid,
                "timestamp": firestore.SERVER_TIMESTAMP,
                "sessionId": self.session_id,
            })
        except Exception as e:
            logger.error(f"Failed to record safety event: {e}")

    async def _take_action(self, v: Violation):
        vtype = v.violation_type.lower()
        if vtype in PAYMENT_DODGING_TYPES:
            await self._push_payment_warning()
        elif vtype in ABUSE_TYPES:
            await self._handle_abuse(v)
        else:
            logger.info(f"Unknown violation type '{v.violation_type}' — logged only.")

    async def _push_payment_warning(self):
        await self._write_notification("all", "payment_warning", PAYMENT_WARNING_MSG)

    async def _handle_abuse(self, v: Violation):
        if v.offender_uid and self._on_mute_user:
            try:
                await self._on_mute_user(v.offender_uid)
            except Exception as e:
                logger.error(f"Mute failed for {v.offender_uid}: {e}")

        if v.offender_uid:
            await self._write_notification(
                v.offender_uid,
                "abuse_warning_offender",
                "⚠️ You have been automatically muted due to a violation of Alvey's community guidelines. Continued violations may result in account suspension.",
            )

        await self._write_notification(
            "other",
            "abuse_warning_observer",
            "The other participant was automatically muted by Alvey AI for abusive behavior.",
        )

    async def _write_notification(self, target_uid: str, notif_type: str, message: str):
        if not self._db:
            return
        try:
            ref = (
                self._db
                .collection("sessions").document(self.session_id)
                .collection("live_notifications").document()
            )
            await ref.set({
                "type": notif_type,
                "for": target_uid,
                "message": message,
                "createdAt": firestore.SERVER_TIMESTAMP,
                "dismissed": False,
            })
        except Exception as e:
            logger.error(f"Failed to push notification: {e}")

    async def stop(self):
        if self._db:
            self._db.close()
        logger.info("SafetyMonitor stopped.")
