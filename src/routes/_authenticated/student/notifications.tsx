import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { PageHeader, EmptyState, LoadingSpinner } from "@/components/portal-shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataStore } from "@/lib/data-store";
import { appwrite } from "@/integrations/appwrite/client";

export const Route = createFileRoute("/_authenticated/student/notifications")({
  component: StudentNotifications,
});

const TYPE_ICONS: Record<string, string> = {
  homework: "📝",
  chat: "💬",
  recording: "🎥",
  lesson: "📅",
  info: "ℹ️",
};

function StudentNotifications() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userData } = await appwrite.auth.getUser();
      const uid = userData.user?.id || null;
      setUserId(uid);
      if (uid) {
        const data = await DataStore.getNotifications(uid);
        setNotifications(data);
      }
      setLoading(false);
    })();
  }, []);

  const handleMarkRead = async (id: string) => {
    await DataStore.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    await DataStore.markAllNotificationsRead(userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Stay updated on your lessons, homework, and messages."
        action={
          unreadCount > 0 ? (
            <Button variant="outline" size="sm" className="gap-2" onClick={handleMarkAllRead}>
              <CheckCheck className="h-4 w-4" /> Mark All Read
            </Button>
          ) : undefined
        }
      />

      {unreadCount > 0 && (
        <p className="text-sm text-muted-foreground mb-4">
          {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
        </p>
      )}

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={!n.is_read ? "border-blue-300 bg-blue-50/30 dark:bg-blue-950/10" : ""}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <span className="text-lg shrink-0 mt-0.5">{TYPE_ICONS[n.type] || "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm">{n.title}</p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(n.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  {n.body && <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>}
                  <div className="flex items-center gap-3 mt-1.5">
                    {n.link && (
                      <a href={n.link} className="text-xs text-blue-600 hover:underline">
                        View →
                      </a>
                    )}
                    {!n.is_read && (
                      <button
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => handleMarkRead(n.id)}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
                {!n.is_read && (
                  <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
