import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, Plus, X, Globe, Calendar, Trash2 } from "lucide-react";
import { PageHeader, EmptyState, LoadingSpinner } from "@/components/portal-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { DataStore } from "@/lib/data-store";
import { appwrite } from "@/integrations/appwrite/client";

export const Route = createFileRoute("/_authenticated/tutor/availability")({
  component: TutorAvailability,
});

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIMEZONES = [
  "UTC", "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Amsterdam",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo",
  "Australia/Sydney", "Pacific/Auckland",
];

interface TimeBlock {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

function TutorAvailability() {
  const [loading, setLoading] = useState(true);
  const [tutorId, setTutorId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [saving, setSaving] = useState(false);

  // Holiday exceptions
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [addingException, setAddingException] = useState(false);
  const [exceptionDate, setExceptionDate] = useState("");
  const [exceptionReason, setExceptionReason] = useState("");
  const [savingException, setSavingException] = useState(false);

  const loadExceptions = async (uid: string) => {
    const data = await DataStore.getScheduleExceptions(uid);
    setExceptions(data);
  };

  useEffect(() => {
    (async () => {
      const { data: userData } = await appwrite.auth.getUser();
      const uid = userData.user?.id;
      setTutorId(uid || null);
      if (uid) {
        const [schedules] = await Promise.all([
          DataStore.getTutorAvailability(uid),
          loadExceptions(uid),
        ]);
        setBlocks(
          schedules.map((s: any) => ({
            day_of_week: s.dayOfWeek ?? s.day_of_week,
            start_time: s.startTime ?? s.start_time,
            end_time: s.endTime ?? s.end_time,
          }))
        );
        if (schedules[0]?.timezone) setTimezone(schedules[0].timezone);
      }
      setLoading(false);
    })();
  }, []);

  const addBlock = (dayOfWeek: number) =>
    setBlocks([...blocks, { day_of_week: dayOfWeek, start_time: "09:00", end_time: "17:00" }]);

  const removeBlock = (index: number) =>
    setBlocks(blocks.filter((_, i) => i !== index));

  const updateBlock = (index: number, field: keyof TimeBlock, value: string | number) =>
    setBlocks(blocks.map((b, i) => (i === index ? { ...b, [field]: value } : b)));

  const handleSave = async () => {
    if (!tutorId) return;
    setSaving(true);
    try {
      await DataStore.saveTutorAvailability(
        tutorId,
        blocks.map((b) => ({ ...b, timezone }))
      );
      toast.success("Availability saved.");
    } catch {
      toast.error("Failed to save availability.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddException = async () => {
    if (!tutorId || !exceptionDate) { toast.error("Please select a date."); return; }
    // Don't allow duplicates
    if (exceptions.some((e) => e.date === exceptionDate)) {
      toast.error("That date is already marked as unavailable."); return;
    }
    setSavingException(true);
    try {
      await DataStore.addScheduleException(tutorId, exceptionDate, exceptionReason.trim());
      toast.success("Date marked as unavailable.");
      setAddingException(false);
      setExceptionDate("");
      setExceptionReason("");
      await loadExceptions(tutorId);
    } catch {
      toast.error("Failed to save exception.");
    } finally {
      setSavingException(false);
    }
  };

  const handleRemoveException = async (id: string) => {
    if (!tutorId) return;
    await DataStore.removeScheduleException(id);
    setExceptions((prev) => prev.filter((e) => e.id !== id));
    toast.success("Date removed.");
  };

  const formatExceptionDate = (dateStr: string) => {
    try {
      return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
        weekday: "long", month: "long", day: "numeric", year: "numeric",
      });
    } catch { return dateStr; }
  };

  // Today's date string for min attribute on date picker
  const todayStr = new Date().toISOString().split("T")[0];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Availability"
        description="Set your weekly recurring availability and mark any dates you're unavailable."
        action={
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving
              ? <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              : <Clock className="h-4 w-4" />}
            Save Availability
          </Button>
        }
      />

      {/* Timezone */}
      <Card className="mb-6">
        <CardContent className="p-4 flex items-center gap-3">
          <Globe className="h-5 w-5 text-blue-600 shrink-0" />
          <div className="flex-1">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your Timezone
            </Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-full sm:w-[280px] mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Weekly schedule grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {DAYS.map((day, dayIdx) => {
          const dayBlocks = blocks.filter((b) => b.day_of_week === dayIdx);
          return (
            <Card key={day}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  {day}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => addBlock(dayIdx)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {dayBlocks.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Unavailable</p>
                ) : (
                  dayBlocks.map((block) => {
                    const globalIdx = blocks.indexOf(block);
                    return (
                      <div key={globalIdx} className="flex items-center gap-1.5 p-2 border rounded-lg">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <Input
                          type="time"
                          value={block.start_time}
                          onChange={(e) => updateBlock(globalIdx, "start_time", e.target.value)}
                          className="h-7 text-xs px-1.5 flex-1"
                        />
                        <span className="text-xs text-muted-foreground">–</span>
                        <Input
                          type="time"
                          value={block.end_time}
                          onChange={(e) => updateBlock(globalIdx, "end_time", e.target.value)}
                          className="h-7 text-xs px-1.5 flex-1"
                        />
                        <Button
                          variant="ghost" size="icon" className="h-6 w-6 shrink-0"
                          onClick={() => removeBlock(globalIdx)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Holiday / unavailable exceptions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" /> Unavailable Dates
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Mark specific dates when you're unavailable despite your regular schedule.
            </p>
          </div>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setAddingException(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Date
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {exceptions.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No unavailable dates"
              description="Add dates when you won't be available — holidays, travel, personal days."
            />
          ) : (
            <div className="space-y-2">
              {exceptions.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/20"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{formatExceptionDate(ex.date)}</p>
                    {ex.reason && (
                      <p className="text-xs text-muted-foreground mt-0.5">{ex.reason}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveException(ex.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add exception dialog */}
      <Dialog open={addingException} onOpenChange={setAddingException}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark Date as Unavailable</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Date <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                min={todayStr}
                value={exceptionDate}
                onChange={(e) => setExceptionDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Reason <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                placeholder="e.g. Public holiday, travelling"
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddingException(false)}>Cancel</Button>
            <Button onClick={handleAddException} disabled={savingException || !exceptionDate}>
              {savingException ? "Saving…" : "Mark Unavailable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
