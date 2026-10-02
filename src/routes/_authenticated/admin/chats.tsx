import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageSquare, Download } from "lucide-react";
import { EmptyState, LoadingSpinner, Avatar } from "@/components/portal-shared";
import { DataStore } from "@/lib/data-store";

export const Route = createFileRoute("/_authenticated/admin/chats")({
  component: AdminChats,
});

const BUCKET = "homework-chat-files";

function AdminChats() {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    const data = await DataStore.getAllChatConversations();
    setConversations(data);
    setLoading(false);
  };

  const openConversation = async (conv: any) => {
    setActiveConv(conv);
    setMsgLoading(true);

    const msgs = await DataStore.getAdminChatMessages(conv.id);
    setMessages(msgs);

    setMsgLoading(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Chat Supervision</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review student and tutor conversations for security and service quality.
        </p>
      </div>

      <div className="flex h-[calc(100vh-13rem)] min-h-[500px] border rounded-xl overflow-hidden">
        {/* Conversation list */}
        <div className="w-80 shrink-0 border-r flex flex-col bg-card">
          <div className="px-4 py-3 border-b">
            <h2 className="font-bold text-base">Conversations</h2>
            <p className="text-xs text-muted-foreground">
              {conversations.length} conversation
              {conversations.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No conversations yet.
                </p>
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openConversation(c)}
                  className={`w-full text-left px-4 py-3 border-b hover:bg-muted/50 transition-colors ${
                    activeConv?.id === c.id
                      ? "bg-blue-50 dark:bg-blue-950/20"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={c.studentName}
                      src={c.studentAvatar}
                      size="sm"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm truncate">
                          {c.studentName}
                        </p>

                        {c.lastMessageAt && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {new Date(c.lastMessageAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground truncate">
                        with {c.tutorName}
                      </p>

                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {c.lastMessagePreview || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Read-only message viewer */}
        <div className="flex-1 flex flex-col bg-background min-w-0">
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={MessageSquare}
                title="Select a conversation"
                description="Choose a conversation to review its messages."
              />
            </div>
          ) : (
            <>
              <div className="h-16 border-b px-5 flex items-center gap-3 bg-card shrink-0">
                <Avatar
                  name={activeConv.studentName}
                  src={activeConv.studentAvatar}
                  size="sm"
                />

                <div>
                  <p className="font-semibold text-sm">
                    {activeConv.studentName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tutor: {activeConv.tutorName}
                  </p>
                </div>

                <span className="ml-auto text-xs rounded-full border px-2 py-1 text-muted-foreground">
                  Read-only
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {msgLoading ? (
                  <LoadingSpinner />
                ) : messages.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    No messages yet.
                  </div>
                ) : (
                  messages.map((m: any) => {
                    const isStudent = m.senderRole === "student";

                    return (
                      <div
                        key={m.id || m.$id}
                        className={`flex ${
                          isStudent ? "justify-start" : "justify-end"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm space-y-1 ${
                            isStudent
                              ? "bg-muted text-foreground rounded-bl-sm"
                              : "bg-blue-600 text-white rounded-br-sm"
                          }`}
                        >
                          <p
                            className={`text-[10px] font-semibold ${
                              isStudent
                                ? "text-muted-foreground"
                                : "text-blue-100"
                            }`}
                          >
                            {isStudent
                              ? activeConv.studentName
                              : activeConv.tutorName}
                          </p>

                          {m.body && (
                            <p className="leading-relaxed">{m.body}</p>
                          )}

                          {Array.isArray(m.fileIds) &&
                            m.fileIds.length > 0 &&
                            m.fileIds.map((fid: string, i: number) => (
                              <a
                                key={fid}
                                href={DataStore.getFileDownloadUrl(
                                  BUCKET,
                                  fid,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-1.5 text-xs underline ${
                                  isStudent
                                    ? "text-blue-600"
                                    : "text-blue-100"
                                }`}
                              >
                                <Download className="h-3 w-3" />
                                {m.fileNames?.[i] || "Attachment"}
                              </a>
                            ))}

                          <p
                            className={`text-xs ${
                              isStudent
                                ? "text-muted-foreground"
                                : "text-blue-200"
                            }`}
                          >
                            {new Date(m.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t p-3 bg-card shrink-0">
                <p className="text-center text-xs text-muted-foreground">
                  This view is read-only. Administrators cannot send messages
                  from supervision.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
