/**
 * usePushNotifications — hook to manage FCM push notification permission and token.
 *
 * On mount, checks browser support and current permission state.
 * requestPermission() prompts the user, gets an FCM token, and saves it to
 * the current user's Firestore document (users/{uid}.fcmTokens).
 *
 * Usage:
 *   const { permission, requestPermission, isSupported } = usePushNotifications();
 */

import { useEffect, useState } from "react";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db, auth } from "@/integrations/firebase/client";

interface UsePushNotificationsResult {
  /** Current browser notification permission, or 'loading' while checking */
  permission: NotificationPermission | "loading";
  /** Call this to prompt the user and save their FCM token */
  requestPermission: () => Promise<void>;
  /** Whether this browser supports FCM push notifications */
  isSupported: boolean;
}

export function usePushNotifications(): UsePushNotificationsResult {
  const [permission, setPermission] = useState<NotificationPermission | "loading">("loading");
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check FCM support (requires HTTPS, service workers, etc.)
    isSupported()
      .then((yes) => {
        setSupported(yes);
        if (yes) {
          setPermission(Notification.permission);
        } else {
          setPermission("denied");
        }
      })
      .catch(() => {
        setSupported(false);
        setPermission("denied");
      });
  }, []);

  const requestPermission = async (): Promise<void> => {
    if (typeof window === "undefined" || !supported) return;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") return;

      // Register the service worker and get the FCM token
      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
      );

      const vapidKey = (import.meta as ImportMeta & { env?: Record<string, string | undefined> })
        .env?.VITE_FIREBASE_VAPID_KEY;

      if (!vapidKey) {
        console.error(
          "usePushNotifications: VITE_FIREBASE_VAPID_KEY is not configured — FCM token registration skipped",
        );
        return;
      }

      const messaging = getMessaging();
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        console.warn("usePushNotifications: no FCM token received");
        return;
      }

      // Save token to Firestore for this user
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          fcmTokens: arrayUnion(token),
        });
      }
    } catch (err) {
      console.error("usePushNotifications: requestPermission failed", err);
    }
  };

  return {
    permission,
    requestPermission,
    isSupported: supported,
  };
}
