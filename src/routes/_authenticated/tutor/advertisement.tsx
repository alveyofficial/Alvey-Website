import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Megaphone, Save, Star, CheckCircle } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/portal-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { DataStore } from "@/lib/data-store";
import { firebase, getCurrentUser } from "@/integrations/firebase/client";

export const Route = createFileRoute("/_authenticated/tutor/advertisement")({
  component: TutorAdvertisement,
});

function TutorAdvertisement() {
  const [ad, setAd] = useState({
    title: "",
    description: "",
    subjects: [] as string[],
    levels: [] as string[],
    teaching_format: "online",
    monthly_price: "",
    featured_strengths: "",
  });
  const [status, setStatus] = useState("pending");
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tutorId, setTutorId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userData } = await firebase.auth.getUser();
      const uid = userData.user?.id || null;
      setTutorId(uid);
      if (uid) {
        const ads = await DataStore.getTutorAdvertisements(uid);
        if (ads.length > 0) {
          const existing = ads[0];
          setAd({
            title: existing.title || "",
            description: existing.description || "",
            subjects: existing.subjects || [],
            levels: existing.levels || [],
            teaching_format: existing.teaching_format || "online",
            monthly_price: existing.monthly_price?.toString() || "",
            featured_strengths: existing.featured_strengths || "",
          });
          setStatus(existing.advertisement_status || "pending");
          setIsPublished(existing.is_active);
        }
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (!tutorId) return;
    await DataStore.saveAdvertisement({
      tutor_id: tutorId,
      title: ad.title,
      description: ad.description,
      monthly_price: ad.monthly_price ? Number(ad.monthly_price) : undefined,
      teaching_format: ad.teaching_format,
      is_active: isPublished,
      advertisement_status: status,
    });
    toast.success("Advertisement saved");
  };

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
        title="Advertisement"
        description="Manage your tutoring advertisement that appears in search results."
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            {isPublished && (
              <Badge variant="default" className="bg-emerald-600">
                Published
              </Badge>
            )}
          </div>
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-blue-600" /> Advertisement Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Advertisement Title</Label>
            <Input
              value={ad.title}
              onChange={(e) => setAd({ ...ad, title: e.target.value })}
              placeholder="e.g. Expert Mathematics Tutoring for A-Level & University"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={ad.description}
              onChange={(e) => setAd({ ...ad, description: e.target.value })}
              rows={5}
              placeholder="Describe your teaching approach, what makes you unique, and what students can expect..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Teaching Format</Label>
              <Select
                value={ad.teaching_format}
                onValueChange={(v) => setAd({ ...ad, teaching_format: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="in_person">In-Person</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Monthly Price ($)</Label>
              <Input
                type="number"
                value={ad.monthly_price}
                onChange={(e) => setAd({ ...ad, monthly_price: e.target.value })}
                placeholder="e.g. 240"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Featured Strengths</Label>
            <Input
              value={ad.featured_strengths}
              onChange={(e) => setAd({ ...ad, featured_strengths: e.target.value })}
              placeholder="e.g. 12+ years experience, Oxford PhD, Exam specialist"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" /> Save Advertisement
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setIsPublished(!isPublished);
            toast.success(isPublished ? "Advertisement unpublished" : "Advertisement published");
          }}
          className="gap-2"
        >
          {isPublished ? "Unpublish" : "Publish"}
        </Button>
      </div>
    </div>
  );
}
