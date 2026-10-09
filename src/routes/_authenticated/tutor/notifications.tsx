import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/portal-shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataStore } from "@/lib/data-store";
import { firebase, getCurrentUser } from "@/integrations/firebase/client";

export const Route = createFileRoute("/_authenticated/tutor/notifications")({
  component: TutorNotifications,
});

function TutorNotifications() {
  const [notifications, setNotifications] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userData } = await firebase.auth.getUser();
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Stay updated on your tutoring activity."
        action={
          <Button variant="outline" size="sm" className="gap-2" onClick={handleMarkAllRead}>
            <CheckCheck className="h-4 w-4" /> Mark All Read
          </Button>
        }
      />

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No Notifications" description="You're all caught up." />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={n.is_read ? "" : "border-blue-300 bg-blue-50/30 dark:bg-blue-950/10"}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <button
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                  className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.is_read ? "bg-muted" : "bg-blue-500 cursor-pointer"}`}
                  title={n.is_read ? "Read" : "Click to mark as read"}
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-sm">{n.title}</p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{n.body}</p>
                  {n.link && (
                    <a
                      href={n.link}
                      className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                    >
                      View details →
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
