import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, CheckCheck, ShieldAlert } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/portal-shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataStore } from "@/lib/data-store";
import type { AppNotification } from "@/lib/data-store";
import { firebase } from "@/integrations/firebase/client";
import { getIdToken, getAdminStatus } from "@/hooks/use-admin";

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  component: AdminNotifications,
});

type Audience = "students" | "tutors" | "staff" | "newsletter";

function AdminNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  // Broadcast state
  const [broadcastAudience, setBroadcastAudience] = useState<Audience | "">("");
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastHtml, setBroadcastHtml] = useState("");
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{
    sent: number;
    failed: number;
  } | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userData } = await firebase.auth.getUser();
      const uid = userData.user?.id || null;
      setUserId(uid);
      if (uid) {
        // Use the custom claim token — faster than a Firestore read and
        // cannot be spoofed by the client.
        const isAdmin = await getAdminStatus();
        setAuthorized(isAdmin);
        if (isAdmin) {
          const data = await DataStore.getNotifications(uid);
          setNotifications(data);
        }
      } else {
        setAuthorized(false);
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

  const handleSendBroadcast = async () => {
    if (!broadcastAudience || !broadcastSubject || !broadcastHtml) return;

    setBroadcastLoading(true);
    setBroadcastResult(null);
    setBroadcastError(null);

    try {
      const idToken = await getIdToken();
      if (!idToken) {
        setBroadcastError("Not authenticated. Please sign in again.");
        return;
      }

      const res = await fetch("/api/admin/send-broadcast", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audience: broadcastAudience,
          subject: broadcastSubject,
          html: broadcastHtml,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBroadcastError(data.error ?? "Failed to send broadcast.");
        return;
      }

      setBroadcastResult({ sent: data.sent ?? 0, failed: data.failed ?? 0 });
    } catch (err) {
      setBroadcastError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setBroadcastLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div>
        <PageHeader
          title="Notifications"
          description="Platform-wide notifications and alerts."
        />
        <EmptyState
          icon={ShieldAlert}
          title="Access Restricted"
          description="The notifications page is only available to Website Managers and Owners."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Platform-wide notifications and alerts."
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

      {/* ── Broadcast Email ──────────────────────────────────────────────── */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-1">Send Broadcast Email</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Send an email to a group of users. Emails are sent via Resend from noreply@alvey.study.
        </p>

        <div className="space-y-3 max-w-xl">
          <Select
            value={broadcastAudience}
            onValueChange={(v) => setBroadcastAudience(v as Audience)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select audience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="students">Students</SelectItem>
              <SelectItem value="tutors">Tutors</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="newsletter">Newsletter subscribers</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Subject"
            value={broadcastSubject}
            onChange={(e) => setBroadcastSubject(e.target.value)}
          />

          <Textarea
            placeholder="Email body (HTML supported)"
            rows={6}
            value={broadcastHtml}
            onChange={(e) => setBroadcastHtml(e.target.value)}
          />

          <Button
            onClick={handleSendBroadcast}
            disabled={
              broadcastLoading ||
              !broadcastAudience ||
              !broadcastSubject ||
              !broadcastHtml
            }
          >
            {broadcastLoading ? "Sending…" : "Send Broadcast"}
          </Button>

          {broadcastError && (
            <p className="text-sm text-red-600">{broadcastError}</p>
          )}

          {broadcastResult && (
            <p className="text-sm text-muted-foreground">
              Sent: {broadcastResult.sent} · Failed: {broadcastResult.failed}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
