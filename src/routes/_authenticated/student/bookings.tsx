import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Calendar, Upload, Clock, CheckCircle, X, AlertCircle, CreditCard,
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

export const Route = createFileRoute("/_authenticated/student/bookings")({
  head: () => ({
    meta: [
      { title: "My Bookings · Alvey" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: StudentBookings,
});

function StudentBookings() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingBookingId, setUploadingBookingId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const loadBookings = async (uid: string) => {
    const result = await DataStore.getBookingsForStudent(uid);
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

  const handleFileUpload = async (booking: Booking, file: File) => {
    if (!file) return;
    setUploading(true);
    setUploadingBookingId(booking.id);
    try {
      await DataStore.uploadReceipt(booking.id, file);
      if (userId) await loadBookings(userId);
      toast.success("Receipt uploaded — awaiting admin verification.");
    } catch {
      toast.error("Failed to upload receipt. Please try again.");
    } finally {
      setUploading(false);
      setUploadingBookingId(null);
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
        title="My Demo Bookings"
        description="Track your demo session requests and complete payment when accepted."
      />

      {bookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No bookings yet"
          description="Browse tutors and request a demo session to get started."
          action={<Link to="/find-a-tutor"><Button>Find a Tutor</Button></Link>}
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
                      Demo with {b.tutorName}
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
                      <span className="font-medium text-foreground">Cover note: </span>
                      {b.coverNote.length > 120 ? `${b.coverNote.slice(0, 120)}…` : b.coverNote}
                    </p>
                  </CardContent>
                </>
              )}

              {/* Status-specific UI */}
              {b.status === "pending_tutor" && (
                <CardContent className="pt-0">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300">
                    <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Waiting for {b.tutorName} to accept your request.</span>
                  </div>
                </CardContent>
              )}

              {b.status === "awaiting_payment" && (
                <CardContent className="pt-0 space-y-4">
                  {/* Payment instructions */}
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-violet-600" />
                      <h4 className="font-semibold text-sm">Payment Instructions</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Please transfer the session fee to the following STC Bank account, then upload your receipt below.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Bank</span>
                      <span className="font-medium">STC Bank</span>
                      <span className="text-muted-foreground">Account Name</span>
                      <span className="font-medium">Alvey Education</span>
                      <span className="text-muted-foreground">Account Number</span>
                      <span className="font-mono font-medium">1234567890</span>
                    </div>
                  </div>

                  {/* File upload */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Upload Payment Receipt</p>
                    <p className="text-xs text-muted-foreground">
                      Accepted formats: JPG, PNG, PDF. Max size: 10 MB.
                    </p>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        ref={(el) => { fileInputRefs.current[b.id] = el; }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(b, file);
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={uploading && uploadingBookingId === b.id}
                        onClick={() => fileInputRefs.current[b.id]?.click()}
                      >
                        <Upload className="h-4 w-4" />
                        {uploading && uploadingBookingId === b.id ? "Uploading…" : "Choose File"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}

              {b.status === "verifying_receipt" && (
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300">
                    <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Receipt submitted — awaiting admin verification.</span>
                  </div>
                  {b.receiptUrl && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Submitted receipt:</p>
                      <a
                        href={b.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View receipt
                      </a>
                    </div>
                  )}
                  {b.adminNote && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{b.adminNote}</span>
                    </div>
                  )}
                </CardContent>
              )}

              {b.status === "confirmed" && (
                <CardContent className="pt-0">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-800 dark:text-emerald-300">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      Booking confirmed!{b.confirmedAt ? ` Confirmed on ${fmt(b.confirmedAt)}.` : ""}
                    </span>
                  </div>
                </CardContent>
              )}

              {b.status === "declined" && (
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-300">
                    <X className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Your demo request with {b.tutorName} was declined.</span>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/find-a-tutor">Find another tutor</Link>
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
