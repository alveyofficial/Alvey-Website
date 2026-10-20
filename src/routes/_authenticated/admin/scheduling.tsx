import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Clock, Plus, X, AlertCircle, CheckCircle, Users, Receipt, Loader2 } from "lucide-react";
import { PageHeader, StatusBadge, EmptyState } from "@/components/portal-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { DataStore } from "@/lib/data-store";
import type { UserRecord, Tutor, Booking } from "@/lib/data-store";
import { firebase, getCurrentUser, functions } from "@/integrations/firebase/client";
import { httpsCallable } from "firebase/functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/scheduling")({
  component: AdminScheduling,
});

interface Lesson {
  id: string;
  tutor_id: string;
  student_id: string;
  subject?: string;
  academic_level?: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes?: string;
  student?: { display_name: string };
  tutor?: { display_name: string };
}

// ---------------------------------------------------------------------------
// GeminiVerificationBadge component
// ---------------------------------------------------------------------------

interface GeminiVerificationBadgeProps {
  geminiVerification: Booking["geminiVerification"];
  totalAmountSAR: number | null;
}

function GeminiVerificationBadge({ geminiVerification, totalAmountSAR }: GeminiVerificationBadgeProps) {
  if (!geminiVerification) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>AI analysis in progress…</span>
      </div>
    );
  }

  const { confidenceStatus, extractedAmount, referenceNumber } = geminiVerification;

  if (confidenceStatus === "100% Match") {
    return (
      <div className={cn("flex flex-col gap-1 p-2 rounded-md text-xs", "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800")}>
        <div className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
          <CheckCircle className="h-3.5 w-3.5" />
          AI: 100% Match
        </div>
        <span className="text-emerald-600 dark:text-emerald-500">
          Extracted: SAR {extractedAmount.toFixed(2)} · Ref: {referenceNumber || "—"}
        </span>
      </div>
    );
  }

  if (confidenceStatus === "Partial Match") {
    return (
      <div className={cn("flex flex-col gap-1 p-2 rounded-md text-xs", "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800")}>
        <div className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
          <AlertCircle className="h-3.5 w-3.5" />
          AI: Partial Match
        </div>
        <span className="text-amber-600 dark:text-amber-500">
          Extracted: SAR {extractedAmount.toFixed(2)} · Expected: SAR {totalAmountSAR?.toFixed(2) ?? "—"}
        </span>
      </div>
    );
  }

  if (confidenceStatus === "No Match") {
    return (
      <div className={cn("flex flex-col gap-1 p-2 rounded-md text-xs", "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800")}>
        <div className="flex items-center gap-1.5 font-medium text-red-700 dark:text-red-400">
          <X className="h-3.5 w-3.5" />
          AI: No Match
        </div>
        <span className="text-red-600 dark:text-red-500">
          Extracted: SAR {extractedAmount.toFixed(2)} · Expected: SAR {totalAmountSAR?.toFixed(2) ?? "—"}
        </span>
      </div>
    );
  }

  // Unable to Extract
  return (
    <div className="flex items-center gap-1.5 p-2 rounded-md text-xs bg-muted border text-muted-foreground">
      <AlertCircle className="h-3.5 w-3.5" />
      AI: Unable to extract receipt data
    </div>
  );
}

// ---------------------------------------------------------------------------
// AdminScheduling component
// ---------------------------------------------------------------------------

function AdminScheduling() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [students, setStudents] = useState<UserRecord[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [conflict, setConflict] = useState<string | null>(null);

  // Pending receipts
  const [receipts, setReceipts] = useState<Booking[]>([]);
  const [moderating, setModerating] = useState<string | null>(null);
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");

  // Awaiting payment terms
  const [awaitingBookings, setAwaitingBookings] = useState<Booking[]>([]);
  const [termsDialogId, setTermsDialogId] = useState<string | null>(null);
  const [termsForm, setTermsForm] = useState({
    classQty: "",
    classRateSAR: "",
    discountSAR: "0",
    tenant: "main" as "main" | "effat",
  });

  // Approve dialog
  const [approveDialogId, setApproveDialogId] = useState<string | null>(null);
  const [extraAmountSAR, setExtraAmountSAR] = useState("");
  const [extraAmountDescription, setExtraAmountDescription] = useState("");

  const [form, setForm] = useState({
    student_id: "",
    tutor_id: "",
    date: "",
    start_time: "",
    end_time: "",
    subject: "",
    academic_level: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [allLessons, allStudents, allTutors, subjs, lvls, pendingReceipts, awaitingPmt] = await Promise.all([
      DataStore.getAllLessons(),
      DataStore.getAllStudents(),
      DataStore.getAllTutors(),
      DataStore.getSubjects(),
      DataStore.getLevels(),
      DataStore.getAllPendingReceipts(),
      DataStore.getAllAwaitingPaymentBookings(),
    ]);
    setLessons(allLessons);
    setStudents(allStudents);
    setTutors(allTutors);
    setSubjects(subjs);
    setLevels(lvls);
    setReceipts(pendingReceipts);
    setAwaitingBookings(awaitingPmt);
    setLoading(false);
  };

  const checkConflicts = (
    tutorId: string,
    startsAt: string,
    endsAt: string,
    excludeId?: string,
  ) => {
    const start = new Date(startsAt).getTime();
    const end = new Date(endsAt).getTime();
    return lessons.filter((l) => {
      if (l.id === excludeId) return false;
      if (l.tutor_id !== tutorId) return false;
      if (l.status === "cancelled") return false;
      const lStart = new Date(l.starts_at).getTime();
      const lEnd = new Date(l.ends_at).getTime();
      return start < lEnd && end > lStart;
    });
  };

  const handleCreateTime = async () => {
    if (!form.student_id || !form.tutor_id || !form.date || !form.start_time || !form.end_time) {
      toast.error("Please fill in all required fields");
      return;
    }

    const startsAt = new Date(`${form.date}T${form.start_time}`).toISOString();
    const endsAt = new Date(`${form.date}T${form.end_time}`).toISOString();

    if (new Date(startsAt) >= new Date(endsAt)) {
      toast.error("End time must be after start time");
      return;
    }

    const conflicts = checkConflicts(form.tutor_id, startsAt, endsAt);
    if (conflicts.length > 0) {
      setConflict(`This tutor has a scheduling conflict with another lesson at this time.`);
      return;
    }

    const { data: userData } = await firebase.auth.getUser();
    const result = await DataStore.createLesson({
      tutor_id: form.tutor_id,
      student_id: form.student_id,
      starts_at: startsAt,
      ends_at: endsAt,
      subject: form.subject,
      academic_level: form.academic_level,
      notes: form.notes,
      created_by: userData.user?.id,
    });

    if (result) {
      toast.success("Lesson created and notifications sent");
      setShowCreate(false);
      setForm({
        student_id: "",
        tutor_id: "",
        date: "",
        start_time: "",
        end_time: "",
        subject: "",
        academic_level: "",
        notes: "",
      });
      setConflict(null);
      loadData();
    } else {
      toast.error("Failed to create lesson");
    }
  };

  const handleCancel = async (id: string) => {
    await DataStore.cancelLesson(id);
    toast.success("Lesson cancelled");
    loadData();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await DataStore.updateLessonStatus(id, status);
    toast.success(`Lesson marked as ${status}`);
    loadData();
  };

  const formatDateTime = (iso: string) => {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSetTerms = async () => {
    if (!termsDialogId) return;
    const qty = Number(termsForm.classQty);
    const rate = Number(termsForm.classRateSAR);
    const discount = Number(termsForm.discountSAR);
    if (!qty || !rate) {
      toast.error("Class quantity and rate are required.");
      return;
    }
    try {
      await DataStore.setPaymentTerms(termsDialogId, {
        classQty: qty,
        classRateSAR: rate,
        discountSAR: discount,
        tenant: termsForm.tenant,
      });
      toast.success("Payment terms set — student can now view the amount.");
      setTermsDialogId(null);
      setTermsForm({ classQty: "", classRateSAR: "", discountSAR: "0", tenant: "main" });
      await loadData();
    } catch {
      toast.error("Failed to set payment terms.");
    }
  };

  const handleConfirmApprove = async () => {
    if (!approveDialogId) return;
    setModerating(approveDialogId);
    try {
      const approvePaymentFn = httpsCallable(functions, "approvePayment");
      const result = await approvePaymentFn({
        bookingId: approveDialogId,
        extraAmountSAR: extraAmountSAR ? Number(extraAmountSAR) : undefined,
        extraAmountDescription: extraAmountDescription || undefined,
      });
      const data = result.data as { success: boolean; zohoError?: string };
      if (data.zohoError) {
        toast.warning("Receipt approved — but Zoho sync failed. Check payments queue.");
      } else {
        toast.success("Receipt approved ✓ Zoho invoice created");
      }
      setReceipts((prev) => prev.filter((r) => r.id !== approveDialogId));
      setApproveDialogId(null);
      setExtraAmountSAR("");
      setExtraAmountDescription("");
    } catch {
      toast.error("Failed to approve receipt.");
    } finally {
      setModerating(null);
    }
  };

  const handleRejectReceipt = async () => {
    if (!rejectDialogId) return;
    setModerating(rejectDialogId);
    try {
      await DataStore.moderateReceipt(rejectDialogId, "reject", adminNote || undefined);
      setReceipts((prev) => prev.filter((r) => r.id !== rejectDialogId));
      toast.success("Receipt rejected — student notified to re-upload.");
    } catch {
      toast.error("Failed to reject receipt.");
    } finally {
      setModerating(null);
      setRejectDialogId(null);
      setAdminNote("");
    }
  };

  // Derived: computed total for terms dialog
  const termsTotal =
    termsForm.classQty && termsForm.classRateSAR
      ? Number(termsForm.classQty) * Number(termsForm.classRateSAR) - Number(termsForm.discountSAR || 0) + 5
      : null;

  // Booking being approved (for label in approve dialog)
  const approvingBooking = approveDialogId ? receipts.find((r) => r.id === approveDialogId) : null;

  return (
    <div>
      <PageHeader
        title="Scheduling"
        description="View, create, and manage all scheduled lessons across the platform."
        action={
          <Button className="gap-2" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> Schedule Lesson
          </Button>
        }
      />

      <Tabs defaultValue="lessons" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="receipts" className="gap-2">
            Pending Receipts
            {(receipts.length + awaitingBookings.length) > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                {receipts.length + awaitingBookings.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Lessons tab ── */}
        <TabsContent value="lessons">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
            </div>
          ) : lessons.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No Lessons"
              description="No lessons have been scheduled yet."
              action={
                <Button className="gap-2" onClick={() => setShowCreate(true)}>
                  <Plus className="h-4 w-4" /> Schedule Lesson
                </Button>
              }
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {lessons.map((l) => (
                    <div
                      key={l.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{l.subject || "Untitled Lesson"}</p>
                          <p className="text-xs text-muted-foreground">
                            {l.student?.display_name || "Student"} with{" "}
                            {l.tutor?.display_name || "Tutor"}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" /> {formatDateTime(l.starts_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={l.status} />
                        {l.status === "scheduled" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(l.id, "completed")}
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Complete
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600"
                              onClick={() => handleCancel(l.id)}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Pending Receipts tab ── */}
        <TabsContent value="receipts">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">

              {/* Awaiting Terms sub-section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">Awaiting Pricing Terms</h3>
                  {awaitingBookings.length > 0 && (
                    <Badge variant="secondary" className="text-xs">{awaitingBookings.length}</Badge>
                  )}
                </div>
                {awaitingBookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No bookings awaiting pricing terms.</p>
                ) : (
                  awaitingBookings.map((b) => (
                    <Card key={b.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="font-mono text-xs shrink-0">
                                {b.referenceCode}
                              </Badge>
                              <StatusBadge status={b.status} />
                            </div>
                            <p className="text-sm font-medium mt-1">
                              {b.studentName} → {b.tutorName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {b.preferredDate} at {b.preferredTime}
                            </p>
                            {b.totalAmountSAR !== null && (
                              <p className="text-xs text-muted-foreground">
                                Terms already set: SAR {b.totalAmountSAR.toFixed(2)}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setTermsDialogId(b.id);
                              setTermsForm({
                                classQty: b.classQty?.toString() ?? "",
                                classRateSAR: b.classRateSAR?.toString() ?? "",
                                discountSAR: b.discountSAR?.toString() ?? "0",
                                tenant: b.tenant ?? "main",
                              });
                            }}
                          >
                            {b.totalAmountSAR !== null ? "Update Terms" : "Set Pricing Terms"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Pending Receipts sub-section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">Pending Receipt Verification</h3>
                  {receipts.length > 0 && (
                    <Badge variant="destructive" className="text-xs">{receipts.length}</Badge>
                  )}
                </div>
                {receipts.length === 0 ? (
                  <EmptyState
                    icon={Receipt}
                    title="No Pending Receipts"
                    description="Payment receipts awaiting verification will appear here."
                  />
                ) : (
                  receipts.map((r) => (
                    <Card key={r.id}>
                      <CardContent className="p-4">
                        {/* Gemini badge at top */}
                        <div className="mb-3">
                          <GeminiVerificationBadge
                            geminiVerification={r.geminiVerification}
                            totalAmountSAR={r.totalAmountSAR}
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex gap-3 min-w-0">
                            {/* Receipt thumbnail */}
                            {r.receiptUrl && (
                              <a href={r.receiptUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                <img
                                  src={r.receiptUrl}
                                  className="w-16 h-16 object-cover rounded border"
                                  alt="Receipt"
                                />
                              </a>
                            )}
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="font-mono text-xs shrink-0">
                                  {r.referenceCode}
                                </Badge>
                                <StatusBadge status={r.status} />
                              </div>
                              <p className="text-sm font-medium mt-1">
                                {r.studentName} → {r.tutorName}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {r.preferredDate} at {r.preferredTime}
                              </p>
                              {r.totalAmountSAR !== null && (
                                <p className="text-xs font-medium">
                                  Expected: SAR {r.totalAmountSAR.toFixed(2)}
                                </p>
                              )}
                              {r.receiptUploadedAt && (
                                <p className="text-xs text-muted-foreground">
                                  Uploaded: {new Date(r.receiptUploadedAt as string).toLocaleString?.() ?? r.receiptUploadedAt}
                                </p>
                              )}
                              {r.receiptUrl && (
                                <a
                                  href={r.receiptUrl ?? ""}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
                                >
                                  <Receipt className="h-3 w-3" /> View Receipt
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              disabled={moderating === r.id}
                              onClick={() => {
                                setApproveDialogId(r.id);
                                setExtraAmountSAR("");
                                setExtraAmountDescription("");
                              }}
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              {moderating === r.id ? "Approving…" : "Approve"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={moderating === r.id}
                              onClick={() => { setRejectDialogId(r.id); setAdminNote(""); }}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Set Payment Terms dialog ── */}
      <Dialog
        open={!!termsDialogId}
        onOpenChange={(open) => {
          if (!open) {
            setTermsDialogId(null);
            setTermsForm({ classQty: "", classRateSAR: "", discountSAR: "0", tenant: "main" });
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Set Payment Terms</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Class Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 4"
                  value={termsForm.classQty}
                  onChange={(e) => setTermsForm({ ...termsForm, classQty: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Rate per Class (SAR)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g. 150"
                  value={termsForm.classRateSAR}
                  onChange={(e) => setTermsForm({ ...termsForm, classRateSAR: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Discount (SAR)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={termsForm.discountSAR}
                  onChange={(e) => setTermsForm({ ...termsForm, discountSAR: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tenant / Portal</Label>
                <Select
                  value={termsForm.tenant}
                  onValueChange={(v) => setTermsForm({ ...termsForm, tenant: v as "main" | "effat" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main (alvey.study)</SelectItem>
                    <SelectItem value="effat">Effat (effat.alvey.study)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {termsTotal !== null && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
                <span className="text-muted-foreground">Total (incl. SAR 5 platform fee)</span>
                <span className="font-bold">SAR {termsTotal.toFixed(2)}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTermsDialogId(null)}>Cancel</Button>
            <Button onClick={handleSetTerms}>Set Terms</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Approve confirmation dialog ── */}
      <Dialog
        open={!!approveDialogId}
        onOpenChange={(open) => {
          if (!open) {
            setApproveDialogId(null);
            setExtraAmountSAR("");
            setExtraAmountDescription("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Confirm Approval</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {approvingBooking && (
              <p className="text-sm text-muted-foreground">
                Approving receipt for <strong>{approvingBooking.studentName}</strong>{" "}
                ({approvingBooking.referenceCode}). This will confirm the booking and create a Zoho invoice.
              </p>
            )}
            <div className="space-y-1.5">
              <Label>Extra Amount (SAR) — optional</Label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 10 (if student sent extra)"
                value={extraAmountSAR}
                onChange={(e) => setExtraAmountSAR(e.target.value)}
              />
            </div>
            {extraAmountSAR && Number(extraAmountSAR) > 0 && (
              <div className="space-y-1.5">
                <Label>Extra Amount Description</Label>
                <Input
                  placeholder="e.g. Tips / Additional payment"
                  value={extraAmountDescription}
                  onChange={(e) => setExtraAmountDescription(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogId(null)}>Cancel</Button>
            <Button onClick={handleConfirmApprove} disabled={!!moderating}>
              {moderating ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />Approving…</> : "Confirm Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject dialog ── */}
      <Dialog open={!!rejectDialogId} onOpenChange={(open) => { if (!open) { setRejectDialogId(null); setAdminNote(""); } }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Reject Receipt</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              The student will be notified and asked to re-upload their payment receipt.
            </p>
            <div className="space-y-1.5">
              <Label>Rejection reason (optional)</Label>
              <Textarea
                placeholder="e.g. Image is unclear, wrong amount shown…"
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialogId(null); setAdminNote(""); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectReceipt} disabled={!!moderating}>
              {moderating ? "Rejecting…" : "Reject Receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showCreate}
        onOpenChange={(open) => {
          setShowCreate(open);
          if (!open) setConflict(null);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule New Lesson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select
                value={form.student_id}
                onValueChange={(v) => setForm({ ...form, student_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id as string} value={s.id as string}>
                      {(s.name || s.email) as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tutor</Label>
              <Select
                value={form.tutor_id}
                onValueChange={(v) => setForm({ ...form, tutor_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tutor" />
                </SelectTrigger>
                <SelectContent>
                  {tutors.map((t) => (
                    <SelectItem key={t.id as string} value={t.id as string}>
                      {t.name as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select
                  value={form.subject}
                  onValueChange={(v) => setForm({ ...form, subject: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Academic Level</Label>
              <Select
                value={form.academic_level}
                onValueChange={(v) => setForm({ ...form, academic_level: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Internal notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>
            {conflict && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">{conflict}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTime}>Create Lesson</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
