import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Plus,
  Loader2,
  User,
  Mail,
  Shield,
  X,
  Save,
  Trash2,
  GraduationCap,
} from "lucide-react";
import { PageHeader, EmptyState, StatusBadge } from "@/components/portal-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { DataStore } from "@/lib/data-store";
import { ID } from "@/integrations/appwrite/client";

export const Route = createFileRoute("/_authenticated/admin/students")({
  component: AdminStudents,
});

// ─── Create Student Modal ─────────────────────────────────────────────────────

function CreateStudentModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Full name and email are required.");
      return;
    }
    setLoading(true);
    try {
      const newId = ID.unique();
      await DataStore.saveUserRecord({
        id: newId,
        email: email.trim(),
        displayName: name.trim(),
        role,
      });

      // Add to Students team when role is student
      if (role === "student") {
        await DataStore.addToTeam("Students", email.trim(), newId);
      }

      toast.success("Student created successfully.");
      setName("");
      setEmail("");
      setRole("student");
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create student.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <Label>Full Name <span className="text-destructive">*</span></Label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <Label>Email <span className="text-destructive">*</span></Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
            />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="website_manager">Website Manager</SelectItem>
                <SelectItem value="recruitment">Recruitment</SelectItem>
                <SelectItem value="tutor">Tutor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
                : "Create Student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── View / Edit Student Modal ────────────────────────────────────────────────

function StudentModal({
  student,
  onClose,
  onSaved,
}: {
  student: Record<string, unknown>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState((student.displayName || student.name || "") as string);
  const [email] = useState((student.email || "") as string);
  const [role, setRole] = useState((student.role || "student") as string);
  const [saving, setSaving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const id = (student.$id || student.id) as string;
  const displayName = (student.displayName || student.name || "Student") as string;

  const handleSave = async () => {
    setSaving(true);
    try {
      await DataStore.saveUserRecord({
        id,
        email: email as string,
        displayName: name.trim(),
        role,
      });
      toast.success("Student updated");
      onSaved();
      onClose();
    } catch {
      toast.error("Failed to update student");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    await DataStore.archiveStudent(id);
    toast.success("Student archived");
    onSaved();
    onClose();
  };

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" /> {displayName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Avatar / initials */}
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-lg">
                {displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{displayName}</p>
                <p className="text-sm text-muted-foreground">{email}</p>
                <Badge variant="secondary" className="mt-1 capitalize text-xs">
                  {role}
                </Badge>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div>
                <Label>Display Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Email</Label>
                <div className="flex items-center gap-2 mt-1 px-3 py-2 bg-muted/50 rounded-md border text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" /> {email}
                </div>
              </div>
              <div>
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="tutor">Tutor</SelectItem>
                    <SelectItem value="recruitment">Recruitment</SelectItem>
                    <SelectItem value="website_manager">Website Manager</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 gap-1.5 sm:mr-auto"
              onClick={() => setConfirmArchive(true)}
            >
              <Trash2 className="h-4 w-4" /> Archive
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                : <><Save className="h-4 w-4" /> Save Changes</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {displayName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the student's account. You can re-activate them later
              by editing their record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleArchive}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function AdminStudents() {
  const [students, setStudents] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState<Record<string, unknown> | null>(null);
  const [search, setSearch] = useState("");

  const loadStudents = async () => {
    setLoading(true);
    const data = await DataStore.getAllStudents();
    setStudents(data);
    setLoading(false);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const filtered = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(s.name || s.displayName || "").toLowerCase().includes(q) ||
      String(s.email || "").toLowerCase().includes(q)
    );
  });

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
        title="Students"
        description="Manage all registered students on the platform."
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" /> Add Student
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Students"
          description={
            search ? "No students match your search." : "No students have registered yet."
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filtered.map((s) => {
                const id = (s.$id || s.id) as string;
                const name = (s.displayName || s.name || "Unknown") as string;
                const email = (s.email || "") as string;

                return (
                  <div
                    key={id}
                    className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-sm shrink-0">
                        {name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{name}</p>
                        <p className="text-xs text-muted-foreground">{email}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setViewing(s)}
                    >
                      <User className="h-4 w-4" /> View
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <CreateStudentModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={loadStudents}
      />

      {viewing && (
        <StudentModal
          student={viewing}
          onClose={() => setViewing(null)}
          onSaved={() => {
            setViewing(null);
            loadStudents();
          }}
        />
      )}
    </div>
  );
}
