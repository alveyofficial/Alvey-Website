import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { appwrite } from "@/integrations/appwrite/client";
import { DataStore } from "@/lib/data-store";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = [
  "Help me find a mathematics tutor",
  "How does Alvey work?",
  "How do I apply as a tutor?",
  "What subjects are available?",
  "Can you recommend a tutor?",
  "Is Alvey Legit?",
];

// Extra prompts shown only when the user is authenticated
const AUTH_PROMPTS = [
  "When is my next lesson?",
  "Who are my tutors?",
  "How many classes do I have left?",
];

const CONTEXT_PROMPTS: Record<string, string[]> = {
  "/find-a-tutor": ["Find a math tutor", "Show me English tutors", "Who teaches computer science?"],
  "/apply": ["How do I apply?", "What documents do I need?", "What's the approval process?" , "is applying easy?"],
  "/work-with-us": [
    "What positions are open?",
    "How do I join the team?",
    "Tell me about recruitment",
    "What are the benefits of working with Alvey?",
  ],
  "/about": ["What is Alvey?", "Tell me about your mission", "How are tutors vetted?"],
  "/contact": ["How do I contact support?", "What are your response times?"],
};

function getContextualPrompts(pathname: string, isAuthenticated: boolean): string[] {
  const base = CONTEXT_PROMPTS[pathname] || SUGGESTED_PROMPTS;
  if (!isAuthenticated) return base;
  // For authenticated users, merge in personal prompts (no duplicates)
  const personal = AUTH_PROMPTS.filter(p => !base.includes(p));
  return [...base, ...personal];
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm the Alvey Assistant. Im a little smart, but go easy on me.. How can I help you find the right tutor today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Identity — resolved once on mount from the active Appwrite session
  const [userId, setUserId]     = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";

  // Resolve user identity from the active session
  useEffect(() => {
    (async () => {
      try {
        const { data } = await appwrite.auth.getUser();
        const uid = (data.user as { id?: string; $id?: string } | null)?.id
                 || (data.user as { $id?: string } | null)?.$id
                 || null;
        if (!uid) return;
        setUserId(uid);

        const roles = await DataStore.getUserRoles(uid);
        // roles is an array; pick the most specific one (tutor > student)
        const role = (roles.includes("tutor") || roles.includes("tutors"))
          ? "tutor"
          : roles.includes("admin")
            ? "admin"
            : "student";
        setUserRole(role);
      } catch {
        // Not logged in — identity stays null, chatbot works anonymously
      }
    })();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = useCallback(
    async (text?: string) => {
      const content = (text || input).trim();
      if (!content || isLoading) return;

      setMessages((prev) => [...prev, { role: "user", content }]);
      setInput("");
      setIsLoading(true);
      setShowSuggestions(false);

      try {
        const response = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, { role: "user", content }].map((m) => ({
              role: m.role === "assistant" ? "assistant" : "user",
              content: m.content,
            })),
            currentUrl: currentPath,
            // Identity — null when the user is not logged in (anonymous mode)
            ...(userId ? { userId, userRole } : {}),
          }),
        });

        if (!response.ok) throw new Error("Request failed");

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.text || "I'm here to help! What would you like to know?",
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Ouch! I'm having trouble connecting right now :( Please try again or contact support if the issue persists.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, currentPath, userId, userRole],
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: Math.max(-200, Math.min(200, e.clientX - dragStart.current.x)),
        y: Math.max(-300, Math.min(100, e.clientY - dragStart.current.y)),
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const suggestions = getContextualPrompts(currentPath, !!userId);

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
          aria-label="Open AI Assistant"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <Card
          className="fixed bottom-6 right-6 w-[calc(100vw-3rem)] sm:w-[380px] shadow-2xl flex flex-col z-50 max-h-[600px]"
          style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        >
          <CardHeader
            className="p-4 border-b flex flex-row items-center justify-between bg-primary text-primary-foreground rounded-t-xl cursor-move"
            onMouseDown={handleMouseDown}
          >
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Alvey AI
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-primary-foreground hover:bg-primary/90"
            >
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>

          <CardContent className="p-4 flex-1 overflow-hidden">
            <div ref={scrollRef} className="h-[350px] overflow-y-auto flex flex-col gap-3 pr-1">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-lg rounded-tl-none flex items-center gap-2">
                    <Sparkles className="h-4 w-4 animate-pulse text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {showSuggestions && messages.length <= 1 && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  Suggested questions:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-3 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex w-full gap-2"
            >
              <Input
                placeholder="Ask me anything... Just dont bully me..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
