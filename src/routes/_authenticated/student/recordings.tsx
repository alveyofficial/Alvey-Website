import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Video, Play } from "lucide-react";
import { PageHeader, EmptyState, LoadingSpinner } from "@/components/portal-shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataStore } from "@/lib/data-store";
import { appwrite } from "@/integrations/appwrite/client";

export const Route = createFileRoute("/_authenticated/student/recordings")({
  component: StudentRecordings,
});

const BUCKET = "6a161d75000df19d01fb";

function getPlaybackUrl(rec: any): string {
  if (rec.externalUrl) return rec.externalUrl;
  if (rec.fileId) return DataStore.getFileDownloadUrl(BUCKET, rec.fileId);
  return "";
}

function isInlineVideo(rec: any): boolean {
  return !rec.externalUrl && !!rec.fileId;
}

function StudentRecordings() {
  const [loading, setLoading] = useState(true);
  const [recordings, setRecordings] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: userData } = await appwrite.auth.getUser();
      const uid = userData.user?.id;
      if (uid) {
        const data = await DataStore.getRecordingsForStudent(uid);
        setRecordings(data);
      }
      setLoading(false);
    })();
  }, []);

  const formatDuration = (secs?: number) => {
    if (!secs) return null;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Class Recordings"
        description="Recordings of your lessons shared by your tutors."
      />

      {recordings.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No recordings yet"
          description="When your tutor shares a class recording with you, it will appear here."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recordings.map((rec: any) => {
            const viewUrl = getPlaybackUrl(rec);
            const inline = isInlineVideo(rec);

            return (
              <Card key={rec.id} className="overflow-hidden">
                {/* Video area */}
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {inline && viewUrl ? (
                    // Appwrite-hosted file — play inline
                    <video
                      src={viewUrl}
                      controls
                      preload="metadata"
                      className="w-full h-full object-contain bg-black"
                      aria-label={`Recording: ${rec.title}`}
                    />
                  ) : viewUrl ? (
                    // External URL — thumbnail with click-to-open
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="h-10 w-10 text-muted-foreground" />
                      <a
                        href={viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
                        aria-label={`Watch ${rec.title}`}
                      >
                        <Play className="h-10 w-10 text-white fill-white" />
                      </a>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  <p className="font-semibold text-sm line-clamp-1">{rec.title}</p>
                  {rec.subject && (
                    <p className="text-xs text-muted-foreground mt-0.5">{rec.subject}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {rec.recordedAt
                      ? new Date(rec.recordedAt).toLocaleDateString(undefined, {
                          month: "long", day: "numeric", year: "numeric",
                        })
                      : "Date unknown"}
                    {formatDuration(rec.durationSeconds) && ` · ${formatDuration(rec.durationSeconds)}`}
                  </p>
                  {rec.description && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{rec.description}</p>
                  )}

                  {/* Only show button for external URLs — inline videos have native controls */}
                  {viewUrl && !inline && (
                    <Button size="sm" variant="outline" className="w-full mt-3 gap-2" asChild>
                      <a href={viewUrl} target="_blank" rel="noopener noreferrer">
                        <Play className="h-3.5 w-3.5" /> Watch Recording
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
