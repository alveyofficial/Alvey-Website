/**
 * src/features/classroom/components/PostClassSummary.tsx
 *
 * Displays AI-generated post-class notes for a completed tutoring session.
 * Reads post_class_notes/summary from Firestore in real-time.
 *
 * Status states:
 *   "generating" — Gemini is still processing; show skeleton
 *   "ready"      — Notes are available; render full summary
 *   "error"      — Generation failed; show error message
 *   null         — Document not found (session too old or notes not triggered)
 *
 * NO @daily-co/daily-js imports anywhere in this file.
 */

import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, TrendingUp, Lightbulb, ClipboardList, ArrowRight, FileText } from "lucide-react";
import { LoadingSpinner } from "@/components/portal-shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PostClassNotesData {
  status: "generating" | "ready" | "error";
  sessionId?: string;
  keyTopics?: string[];
  studentProgress?: string;
  areasForImprovement?: string[];
  homeworkSuggestions?: string[];
  nextSessionRecommendations?: string;
  overallSummary?: string;
  errorMessage?: string;
}

interface PostClassSummaryProps {
  sessionId: string;
  /** Optional subject label shown in the card header */
  subject?: string;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SummarySkeleton() {
  return (
    <div className="space-y-3 animate-pulse" aria-label="Loading post-class notes">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-4 bg-muted rounded w-full" style={{ width: `${75 + (i % 3) * 10}%` }} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section helper
// ---------------------------------------------------------------------------

function NoteSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-blue-600" aria-hidden="true" />
        {title}
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PostClassSummary({ sessionId, subject }: PostClassSummaryProps) {
  const [notes, setNotes] = useState<PostClassNotesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, "sessions", sessionId, "post_class_notes", "summary");
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        setLoading(false);
        if (snap.exists()) {
          setNotes(snap.data() as PostClassNotesData);
        } else {
          setNotes(null);
        }
      },
      (err) => {
        console.error("PostClassSummary onSnapshot error:", err);
        setLoading(false);
        setNotes(null);
      },
    );
    return unsubscribe;
  }, [sessionId]);

  const header = (
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between gap-2">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" aria-hidden="true" />
          {subject ? `${subject} — Post-Class Notes` : "Post-Class Notes"}
        </CardTitle>
        {notes?.status === "generating" && (
          <Badge variant="secondary" className="text-xs">Generating…</Badge>
        )}
        {notes?.status === "ready" && (
          <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Ready</Badge>
        )}
        {notes?.status === "error" && (
          <Badge variant="destructive" className="text-xs">Failed</Badge>
        )}
      </div>
    </CardHeader>
  );

  if (loading) {
    return (
      <Card>
        {header}
        <CardContent><SummarySkeleton /></CardContent>
      </Card>
    );
  }

  if (!notes) {
    return null; // Notes not available yet — caller decides whether to show placeholder
  }

  if (notes.status === "generating") {
    return (
      <Card>
        {header}
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Alvey AI is generating your post-class notes. This takes about 30 seconds.
          </p>
          <SummarySkeleton />
        </CardContent>
      </Card>
    );
  }

  if (notes.status === "error") {
    return (
      <Card>
        {header}
        <CardContent>
          <p className="text-sm text-destructive">
            Post-class notes could not be generated. {notes.errorMessage ?? "Please contact support if this persists."}
          </p>
        </CardContent>
      </Card>
    );
  }

  // status === "ready"
  return (
    <Card>
      {header}
      <CardContent className="space-y-5">
        {/* Overall summary */}
        {notes.overallSummary && (
          <p className="text-sm text-muted-foreground leading-relaxed">{notes.overallSummary}</p>
        )}

        <Separator />

        {/* Key topics */}
        {notes.keyTopics && notes.keyTopics.length > 0 && (
          <NoteSection icon={BookOpen} title="Key Topics Covered">
            <div className="flex flex-wrap gap-2">
              {notes.keyTopics.map((topic, i) => (
                <Badge key={i} variant="secondary" className="text-xs font-normal">{topic}</Badge>
              ))}
            </div>
          </NoteSection>
        )}

        {/* Student progress */}
        {notes.studentProgress && (
          <NoteSection icon={TrendingUp} title="Student Progress">
            <p className="text-sm text-muted-foreground leading-relaxed">{notes.studentProgress}</p>
          </NoteSection>
        )}

        {/* Areas for improvement */}
        {notes.areasForImprovement && notes.areasForImprovement.length > 0 && (
          <NoteSection icon={Lightbulb} title="Areas for Improvement">
            <ul className="space-y-1">
              {notes.areasForImprovement.map((area, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
                  {area}
                </li>
              ))}
            </ul>
          </NoteSection>
        )}

        {/* Homework suggestions */}
        {notes.homeworkSuggestions && notes.homeworkSuggestions.length > 0 && (
          <NoteSection icon={ClipboardList} title="Homework Suggestions">
            <ul className="space-y-1">
              {notes.homeworkSuggestions.map((hw, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" aria-hidden="true" />
                  {hw}
                </li>
              ))}
            </ul>
          </NoteSection>
        )}

        {/* Next session recommendations */}
        {notes.nextSessionRecommendations && (
          <NoteSection icon={ArrowRight} title="Next Session">
            <p className="text-sm text-muted-foreground leading-relaxed">{notes.nextSessionRecommendations}</p>
          </NoteSection>
        )}
      </CardContent>
    </Card>
  );
}
