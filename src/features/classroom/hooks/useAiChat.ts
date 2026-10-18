/**
 * src/features/classroom/hooks/useAiChat.ts
 *
 * Real-time Firestore listener for the in-class AI Q&A channel.
 *
 * Writes new student questions to  sessions/{sessionId}/ai_chat
 * and listens for answers written back by the Pipecat agent (Phase 2).
 */

import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { maskSensitiveContent } from "@/lib/safety-mask";
import type { AiMessage } from "../components/AiChatSidebar";

export interface UseAiChatReturn {
  messages: AiMessage[];
  askQuestion: (question: string) => Promise<void>;
}

export function useAiChat(sessionId: string | null): UseAiChatReturn {
  const [messages, setMessages] = useState<AiMessage[]>([]);

  useEffect(() => {
    if (!sessionId) return;

    const q = query(
      collection(db, "sessions", sessionId, "ai_chat"),
      orderBy("askedAt", "asc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: AiMessage[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          question: d.question as string,
          answer: d.answer as string | undefined,
          status: d.status as "pending" | "answered",
          askedAt: d.askedAt?.toDate?.() ?? new Date(),
        };
      });
      setMessages(msgs);
    });

    return unsubscribe;
  }, [sessionId]);

  const askQuestion = async (question: string): Promise<void> => {
    if (!sessionId) return;
    await addDoc(collection(db, "sessions", sessionId, "ai_chat"), {
      question: maskSensitiveContent(question),
      status: "pending",
      askedAt: serverTimestamp(),
    });
  };

  return { messages, askQuestion };
}
