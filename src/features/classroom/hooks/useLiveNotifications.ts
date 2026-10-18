/**
 * src/features/classroom/hooks/useLiveNotifications.ts
 *
 * Real-time listener for sessions/{sessionId}/live_notifications.
 * Shows sonner toasts for safety events pushed by the Pipecat agent:
 *
 *   payment_warning       → toast.warning (both screens, 12 s)
 *   abuse_warning_offender → toast.error  (offender only, 15 s)
 *   abuse_warning_observer → toast.info   (other participant, 10 s)
 *
 * Firestore rules block client writes to live_notifications, so we do NOT
 * attempt to mark docs as dismissed — safety messages intentionally persist
 * for the duration of the session.
 *
 * Zero @daily-co/daily-js imports.
 */

import { useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { toast } from "sonner";

interface UseLiveNotificationsProps {
  sessionId: string | null;
  currentUserId: string | null;
}

export function useLiveNotifications({
  sessionId,
  currentUserId,
}: UseLiveNotificationsProps): void {
  useEffect(() => {
    if (!sessionId || !currentUserId) return;

    const q = query(
      collection(db, "sessions", sessionId, "live_notifications"),
      where("dismissed", "==", false),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type !== "added") return;

        const data = change.doc.data();
        const target = (data.for ?? "all") as string;
        const message = data.message as string;
        const notifType = data.type as string;

        // Show if addressed to everyone, the "other" slot, or this specific user
        const shouldShow =
          target === "all" ||
          target === "other" ||
          target === currentUserId;

        if (!shouldShow || !message) return;

        switch (notifType) {
          case "payment_warning":
            toast.warning(message, {
              duration: 12000,
              description: "This reminder is shown on both screens.",
            });
            break;
          case "abuse_warning_offender":
            toast.error(message, { duration: 15000 });
            break;
          case "abuse_warning_observer":
            toast.info(message, { duration: 10000 });
            break;
          default:
            toast(message, { duration: 8000 });
        }
      });
    });

    return unsubscribe;
  }, [sessionId, currentUserId]);
}
