import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Calendar, Clock, CheckCircle, X, AlertCircle,
} from "lucide-react";
import {
  PageHeader, EmptyState, LoadingSpinner, StatusBadge,
} from "@/components/portal-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { DataStore, type Booking } from "@/lib/data-store";
import { firebase } from "@/integrations/firebase/client";

export const Route = createFileRoute("/_authenticated/tutor/bookings")({
  head: () => ({
    meta: [
      { title: "Demo Requests · Alvey" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: TutorBookings,
});

function TutorBookings() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [responding, setResponding] = useState<string | null>(null);

  const loadBookings = async (uid: string) => {
    const result = await DataStore.getBookingsForTutor(uid);
    setBookings(result);
  };

  useEffect(() => {
    (async () => {
      const { data: userData } = await firebase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) { setLoading(false); return; }
      setUserId(uid);
      await loadBookings(uid);
      setLoading(false);
    })();
  }, []);

  const handleRespond = async (bookingId: string, response: "accept" | "decline") => {
    setResponding(bookingId);
    try {
      await DataStore.respondToBooking(bookingId, response);
      if (userId) await loadBookings(userId);
      if (response === "accept") {
        toast.success("Demo accepted — the student will be notified to complete payment.");
      } else {
        toast.success("Demo declined.");
      }
    } catch {
      toast.error("Failed to update booking. Please try again.");
    } finally {
      setResponding(null);
    }
  };

  const fmt = (iso: string | null | undefined) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demo Requests"
        description="Review and respond to student demo session requests."
      />

      {bookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No demo requests"
          description="When students request a demo session with you, it will appear here."
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <Card key={b.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-semibold text-muted-foreground">
                      {b.referenceCode}
                    </p>
                    <CardTitle className="text-base mt-0.5">
                      Demo request from {b.studentName}
                    </CardTitle>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {b.preferredDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {b.preferredTime}
                  </span>
                </div>
              </CardHeader>

              {b.coverNote && (
                <>
                  <Separator />
                  <CardContent className="pt-3 pb-3">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">What they want to cover: </span>
                      {b.coverNote}
                    </p>
                  </CardContent>
                </>
              )}

              {/* Status-specific UI */}
              {b.status === "pending_tutor" && (
                <CardContent className="pt-0">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      size="sm"
                      className="gap-2"
                      disabled={responding === b.id}
                      onClick={() => handleRespond(b.id, "accept")}
                    >
                      <CheckCircle className="h-4 w-4" />
                      {responding === b.id ? "Processing…" : "Accept"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={responding === b.id}
                      onClick={() => handleRespond(b.id, "decline")}
                    >
                      <X className="h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                </CardContent>
              )}

              {b.status === "awaiting_payment" && (
                <CardContent className="pt-0">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300">
                    <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Waiting for {b.studentName} to upload their payment receipt.</span>
                  </div>
                </CardContent>
              )}

              {b.status === "verifying_receipt" && (
                <CardContent className="pt-0">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Receipt submitted by {b.studentName} — under admin review.</span>
                  </div>
                </CardContent>
              )}

              {b.status === "confirmed" && (
                <CardContent className="pt-0">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-800 dark:text-emerald-300">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      Demo confirmed!{b.confirmedAt ? ` Confirmed on ${fmt(b.confirmedAt)}.` : ""}
                    </span>
                  </div>
                </CardContent>
              )}

              {b.status === "declined" && (
                <CardContent className="pt-0">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
                    <X className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>You declined this request.</span>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
