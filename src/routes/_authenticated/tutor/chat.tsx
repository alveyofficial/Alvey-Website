import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import { MessageSquare, Send, Paperclip, X, Download } from "lucide-react";
import { EmptyState, LoadingSpinner, Avatar } from "@/components/portal-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DataStore } from "@/lib/data-store";
import { appwrite } from "@/integrations/appwrite/client";

export const Route = createFileRoute("/_authenticated/tutor/chat")({
  component: TutorChat,
});

const BUCKET = "homework-chat-files";

function TutorChat() {
  const [tutorId, setTutorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [text, setText] = useState("");
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const activeConvRef = useRef<any>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userData } = await appwrite.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) { setLoading(false); return; }
      setTutorId(uid);
      const convs = await DataStore.getConversationsForTutor(uid);
      setConversations(convs);
      setLoading(false);
    })();

    // Cleanup realtime on unmount
    return () => { unsubRef.current?.(); };
  }, []);

  // Subscribe to realtime updates for the active conversation
  const subscribeToConversation = useCallback((convId: string) => {
    // Unsubscribe from previous
    unsubRef.current?.();
    try {
      const channel = `databases.Database.collections.chat_messages.documents`;
      const unsub = appwrite.client.subscribe(channel, (response: any) => {
        const events: string[] = response.events || [];
        const isCreate = events.some((e) => e.includes(".create"));
        if (!isCreate) return;

        const doc = response.payload;
        if (!doc || doc.conversationId !== activeConvRef.current?.id) return;

        // Only add messages we didn't send ourselves (sender's messages are added optimistically)
        setMessages((prev) => {
          const exists = prev.some((m) => m.$id === doc.$id || m.id === doc.$id);
          if (exists) return prev;
          return [...prev, { ...doc, id: doc.$id }];
        });

        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      });
      unsubRef.current = unsub;
    } catch (e) {
      console.warn("Realtime subscribe failed:", e);
    }
  }, []);

  const openConversation = useCallback(async (conv: any) => {
    activeConvRef.current = conv;
    setActiveConv(conv);
    setMsgLoading(true);
    const msgs = await DataStore.getMessages(conv.id);
    setMessages(msgs);
    setMsgLoading(false);
    subscribeToConversation(conv.id);
    // Mark read
    const uid = (await appwrite.auth.getUser()).data.user?.id;
    if (uid) {
      await DataStore.markMessagesRead(conv.id, "tutor");
      setConversations((prev) =>
        prev.map((c) => c.id === conv.id ? { ...c, tutorUnreadCount: 0 } : c)
      );
    }
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [subscribeToConversation]);

  const send = async () => {
    if (!tutorId || !activeConv || (!text.trim() && !attachFile)) return;
    setSending(true);
    const body = text.trim();
    try {
      let fileIds: string[] = [];
      let fileNames: string[] = [];
      if (attachFile) {
        const { fileId, fileName } = await DataStore.uploadFile(attachFile, BUCKET, tutorId);
        fileIds = [fileId]; fileNames = [fileName];
      }
      const msg = await DataStore.sendMessage({
        conversationId: activeConv.id,
        senderId: tutorId,
        senderRole: "tutor",
        body,
        fileIds, fileNames,
        otherUserId: activeConv.studentId,
      });
      // Optimistically add message
      setMessages((prev) => [...prev, msg]);
      setText("");
      setAttachFile(null);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConv.id
            ? { ...c, lastMessagePreview: body || fileNames[0] || "New message", lastMessageAt: new Date().toISOString() }
            : c
        )
      );
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch {
      toast.error("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 border rounded-xl overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 shrink-0 border-r flex flex-col bg-card">
        <div className="px-4 py-3 border-b">
          <h1 className="font-bold text-base">Messages</h1>
          <p className="text-xs text-muted-foreground">
            {conversations.length} student conversation{conversations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No conversations yet.</div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b hover:bg-muted/50 transition-colors ${activeConv?.id === c.id ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}
                onClick={() => openConversation(c)}
              >
                <Avatar name={c.studentName} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{c.studentName}</p>
                    {c.tutorUnreadCount > 0 && (
                      <span className="ml-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shrink-0">
                        {c.tutorUnreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.lastMessagePreview || "No messages yet"}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message pane */}
      <div className="flex-1 flex flex-col bg-background min-w-0">
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={MessageSquare}
              title="Select a conversation"
              description="Choose a student from the list to start chatting."
            />
          </div>
        ) : (
          <>
            <div className="h-14 border-b px-4 flex items-center gap-3 bg-card shrink-0">
              <Avatar name={activeConv.studentName} size="sm" />
              <span className="font-semibold text-sm">{activeConv.studentName}</span>
              <span className="ml-auto text-xs text-emerald-600 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                Live
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgLoading ? (
                <LoadingSpinner />
              ) : messages.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">No messages yet. Say hello!</div>
              ) : (
                messages.map((m: any) => {
                  const isMe = m.senderRole === "tutor";
                  return (
                    <div key={m.id || m.$id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm space-y-1 ${isMe ? "bg-blue-600 text-white rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
                        {m.body && <p className="leading-relaxed">{m.body}</p>}
                        {Array.isArray(m.fileIds) && m.fileIds.length > 0 && m.fileIds.map((fid: string, i: number) => (
                          <a key={fid} href={DataStore.getFileDownloadUrl(BUCKET, fid)} target="_blank" rel="noopener noreferrer"
                            className={`flex items-center gap-1.5 text-xs underline ${isMe ? "text-blue-100" : "text-blue-600"}`}>
                            <Download className="h-3 w-3" />{m.fileNames?.[i] || "Attachment"}
                          </a>
                        ))}
                        <p className={`text-xs ${isMe ? "text-blue-200" : "text-muted-foreground"}`}>
                          {new Date(m.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <div className="border-t p-3 bg-card shrink-0">
              {attachFile && (
                <div className="flex items-center gap-2 mb-2 p-2 border rounded-lg text-xs">
                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex-1 truncate">{attachFile.name}</span>
                  <button onClick={() => setAttachFile(null)}><X className="h-3.5 w-3.5" /></button>
                </div>
              )}
              <div className="flex gap-2">
                <input ref={fileRef} type="file" className="hidden" onChange={(e) => setAttachFile(e.target.files?.[0] || null)} />
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => fileRef.current?.click()} title="Attach file">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Type a message…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  className="flex-1"
                />
                <Button size="icon" onClick={send} disabled={sending || (!text.trim() && !attachFile)} className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
