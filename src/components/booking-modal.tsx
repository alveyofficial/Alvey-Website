import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Calendar, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DataStore, Tutor } from "@/lib/data-store";
import { getCurrentUser } from "@/integrations/firebase/client";

interface BookingModalProps {
  tutor: Tutor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingModal({ tutor, open, onOpenChange }: BookingModalProps) {
  const navigate = useNavigate();

  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ ref: string } | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const user = await getCurrentUser();
    if (!user) {
      onOpenChange(false);
      navigate({ to: "/auth" });
      return;
    }

    setSubmitting(true);
    try {
      const userRecord = await DataStore.getUserRecord(user.id);
      const studentName =
        userRecord?.name ?? userRecord?.displayName ?? user.email ?? "Student";

      const booking = await DataStore.createBooking({
        tutorId: tutor.id,
        tutorAuthUserId: tutor.id,
        tutorName: tutor.name,
        studentId: user.id,
        studentName,
        preferredDate,
        preferredTime,
        coverNote,
      });

      setSuccess({ ref: booking.referenceCode });
    } catch (err) {
      console.error("BookingModal: createBooking failed", err);
      toast.error("Failed to submit booking request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    // Reset form when closing
    if (!nextOpen) {
      setPreferredDate("");
      setPreferredTime("");
      setCoverNote("");
      setSuccess(null);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        {success ? (
          /* ── Success state ── */
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Booking Submitted!</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your reference code is{" "}
                <span className="font-mono font-semibold text-foreground">
                  {success.ref}
                </span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                The tutor will review your request and respond shortly.
              </p>
            </div>
            <Button
              className="mt-2 rounded-xl bg-[#164E5E] hover:bg-[#3D7F8F] text-white"
              onClick={() => handleOpenChange(false)}
            >
              Done
            </Button>
          </div>
        ) : (
          /* ── Booking form ── */
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                <Calendar className="h-5 w-5 text-emerald-600" />
                Book a Demo with {tutor.name.split(" ")[0]}
              </DialogTitle>
            </DialogHeader>

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bm-date">Preferred Date</Label>
                  <Input
                    id="bm-date"
                    type="date"
                    min={today}
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bm-time">Preferred Time</Label>
                  <Input
                    id="bm-time"
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bm-note">What do you want to cover?</Label>
                <Textarea
                  id="bm-note"
                  rows={4}
                  placeholder="Tell the tutor what topics you want to focus on..."
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => handleOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-[#164E5E] hover:bg-[#3D7F8F] text-white"
                disabled={submitting || !preferredDate || !preferredTime}
              >
                {submitting ? "Submitting…" : "Request Demo Booking"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
