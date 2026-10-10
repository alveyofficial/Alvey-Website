/**
 * PushNotificationPrompt — a small banner prompting users to enable push notifications.
 *
 * - Only renders when permission is 'default' (not yet decided) and FCM is supported.
 * - Respects a localStorage flag so users who dismiss it aren't shown it again.
 * - Uses the usePushNotifications hook to request permission and save the token.
 */

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";

export function PushNotificationPrompt() {
  const { permission, requestPermission, isSupported } = usePushNotifications();
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("push_prompt_dismissed") === "1",
  );
  const [requesting, setRequesting] = useState(false);

  // Don't render if: dismissed, not supported, permission already decided, or still loading
  if (dismissed) return null;
  if (!isSupported) return null;
  if (permission === "loading") return null;
  if (permission !== "default") return null;

  const handleEnable = async () => {
    setRequesting(true);
    try {
      await requestPermission();
    } finally {
      setRequesting(false);
    }
  };

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("push_prompt_dismissed", "1");
    }
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-slate-800 border rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 max-w-sm w-full">
      <Bell className="h-5 w-5 text-blue-600 shrink-0" aria-hidden="true" />
      <p className="flex-1 text-sm text-foreground">
        Stay updated with lesson reminders and announcements
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          onClick={handleEnable}
          disabled={requesting}
          className="text-xs"
        >
          {requesting ? "Enabling…" : "Enable notifications"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDismiss}
          className="text-xs"
          aria-label="Dismiss notification prompt"
        >
          Not now
        </Button>
      </div>
    </div>
  );
}
