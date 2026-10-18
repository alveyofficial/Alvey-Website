/**
 * src/features/classroom/components/AiChatSidebar.tsx
 *
 * In-class AI Q&A panel.
 * Questions are written to Firestore by useAiChat; answers are streamed back
 * by the Pipecat agent (Phase 2). This component is purely presentational.
 */

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

// ---------------------------------------------------------------------------
// Types (exported so useAiChat and ClassroomLayout can share them)
// ---------------------------------------------------------------------------

export interface AiMessage {
  id: string;
  question: string;
  answer?: string;
  status: "pending" | "answered";
  askedAt: Date;
}

interface AiChatSidebarProps {
  sessionId: string | null;
  messages: AiMessage[];
  onAskQuestion: (question: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AiChatSidebar({
  sessionId,
  messages,
  onAskQuestion,
}: AiChatSidebarProps) {
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || !sessionId) return;

    setInput("");
    setSubmitting(true);
    try {
      await onAskQuestion(q);
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = !sessionId;

  return (
    <div className="flex flex-col h-full border-l border-zinc-800 bg-zinc-950">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2 shrink-0">
        <MessageSquare className="h-4 w-4 text-blue-400" aria-hidden="true" />
        <span className="font-semibold text-sm text-zinc-100">Ask AI</span>
        <div className="ml-auto flex items-center gap-1 text-xs text-zinc-500">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          Gemini
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        {messages.length === 0 ? (
          <div
            className="text-center text-zinc-500 text-xs mt-8 space-y-1.5"
            aria-label="No messages yet"
          >
            <p className="font-medium text-zinc-400">Ask anything about the lesson</p>
            <p>The AI is listening in and has full context.</p>
          </div>
        ) : (
          <div className="space-y-4" role="log" aria-live="polite" aria-label="AI chat messages">
            {messages.map((m) => (
              <div key={m.id} className="space-y-1.5">
                {/* Student question bubble */}
                <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl px-3 py-2 text-sm">
                  <p className="font-medium text-blue-400 text-xs mb-0.5">You</p>
                  <p className="text-zinc-200">{m.question}</p>
                </div>

                {/* AI answer or loading */}
                {m.status === "pending" ? (
                  <div
                    className="bg-zinc-800/60 rounded-xl px-3 py-2 text-sm text-zinc-400 flex items-center gap-2"
                    aria-label="AI is thinking"
                    aria-live="polite"
                  >
                    <div className="flex gap-0.5" aria-hidden="true">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:300ms]" />
                    </div>
                    Thinking…
                  </div>
                ) : (
                  <div className="bg-zinc-800/60 rounded-xl px-3 py-2 text-sm">
                    <p className="font-medium text-zinc-400 text-xs mb-0.5">Alvey AI</p>
                    <p className="text-zinc-200">{m.answer}</p>
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} aria-hidden="true" />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="px-4 py-3 border-t border-zinc-800 flex gap-2 shrink-0"
        aria-label="Ask AI a question"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isDisabled ? "Session not started" : "Ask a question…"}
          disabled={isDisabled || submitting}
          className="flex-1 text-sm bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-blue-500"
          aria-label="Question input"
          maxLength={500}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isDisabled || submitting}
          className="shrink-0"
          aria-label="Submit question"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}
