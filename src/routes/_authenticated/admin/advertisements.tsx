import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Megaphone,
  Eye,
  Power,
  X,
  Save,
  DollarSign,
  Globe,
  User,
  FileText,
} from "lucide-react";
import { PageHeader, StatusBadge, EmptyState } from "@/components/portal-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { DataStore } from "@/lib/data-store";

export const Route = createFileRoute("/_authenticated/admin/advertisements")({
  component: AdminAdvertisements,
});

// ─── Ad Detail / Edit Modal ───────────────────────────────────────────────────

function AdModal({
  ad,
  onClose,
  onSaved,
}: {
  ad: Record<string, unknown>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState((ad.title || "") as string);
  const [description, setDescription] = useState(
    (ad.description || ad.body || "") as string,
  );
  const [monthlyPrice, setMonthlyPrice] = useState(
    String(ad.monthly_price ?? ad.monthlyPrice ?? ad.price ?? ""),
  );
  const [teachingFormat, setTeachingFormat] = useState(
    (ad.teaching_format || ad.teachingFormat || "online") as string,
  );
  const [status, setStatus] = useState(
    (ad.advertisement_status || ad.status || "pending") as string,
  );
  const [saving, setSaving] = useState(false);

  const id = (ad.$id || ad.id) as string;
  const tutorName =
    ((ad.tutor as Record<string, unknown>)?.display_name as string) ||
    (ad.tutorId as string) ||
    "Unknown Tutor";

  const handleSave = async () => {
    setSaving(true);
    try {
      await DataStore.saveAdvertisement({
        id,
        tutor_id: (ad.tutorId || ad.tutor_id || ad.createdBy || id) as string,
        title,
        description,
        monthly_price: monthlyPrice ? Number(monthlyPrice) : undefined,
        teaching_format: teachingFormat,
        advertisement_status: status,
        is_active: status === "active",
      });
      toast.success("Advertisement saved");
      onSaved();
      onClose();
    } catch {
      toast.error("Failed to save advertisement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-blue-600" /> Advertisement Details
          </DialogTitle>
        </DialogHeader>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Left – editable fields ─── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monthly Price (USD)</Label>
                <Input
                  type="number"
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(e.target.value)}
                  placeholder="e.g. 240"
                />
              </div>
              <div className="space-y-2">
                <Label>Teaching Format</Label>
                <Select value={teachingFormat} onValueChange={setTeachingFormat}>
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
            </div>

            {/* Meta info (read-only) */}
            <Card className="bg-muted/30">
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4 shrink-0" />
                  <span>
                    Tutor: <span className="font-medium text-foreground">{tutorName}</span>
                  </span>
                </div>
                {(ad.subject || ad.level) && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4 shrink-0" />
                    <span>
                      {[ad.subject, ad.level].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4 shrink-0" />
                  <span className="capitalize">{teachingFormat.replace("_", "-")}</span>
                </div>
                {monthlyPrice && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4 shrink-0" />
                    <span>${monthlyPrice}/month</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Right – status & actions ─── */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <StatusBadge status={status} />
                <div className="space-y-1.5">
                  <Label className="text-xs">Change Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full gap-2"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Changes"}
            </Button>
            <Button variant="outline" className="w-full" onClick={onClose}>
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function AdminAdvertisements() {
  const [ads, setAds] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Record<string, unknown> | null>(null);

  const loadAds = async () => {
    const data = await DataStore.getAdvertisements();
    setAds(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAds();
  }, []);

  const handleToggleActive = async (ad: Record<string, unknown>) => {
    const id = (ad.$id || ad.id) as string;
    const isActive = ad.is_active as boolean;
    await DataStore.updateAdvertisementStatus(id, !isActive);
    toast.success(isActive ? "Advertisement deactivated" : "Advertisement activated");
    loadAds();
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
        title="Advertisements"
        description="Manage tutor advertisements and listings."
      />

      {ads.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No Advertisements"
          description="No tutor advertisements have been created yet."
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {ads.map((ad) => {
            const isActive = ad.is_active as boolean;
            const adStatus = (ad.advertisement_status ||
              (isActive ? "active" : "paused")) as string;

            return (
              <Card key={(ad.$id || ad.id) as string}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 pr-3">
                      <p className="font-semibold text-sm truncate">
                        {(ad.title as string) || "Untitled"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by{" "}
                        {((ad.tutor as Record<string, unknown>)
                          ?.display_name as string) ||
                          (ad.tutorId as string) ||
                          "Tutor"}
                      </p>
                      {(ad.monthly_price || ad.price) && (
                        <p className="text-sm font-bold mt-1">
                          ${ad.monthly_price || ad.price}
                          {ad.monthly_price ? "/mo" : "/hr"}
                        </p>
                      )}
                      {ad.teaching_format && (
                        <p className="text-xs text-muted-foreground capitalize">
                          {(ad.teaching_format as string).replace("_", "-")}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={adStatus} />
                  </div>

                  {ad.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {ad.description as string}
                    </p>
                  )}

                  {/* subject / level badges */}
                  {(ad.subject || ad.level) && (
                    <div className="flex flex-wrap gap-1.5">
                      {[ad.subject, ad.level]
                        .filter(Boolean)
                        .map((v, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {v as string}
                          </Badge>
                        ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 flex-1"
                      onClick={() => setViewing(ad)}
                    >
                      <Eye className="h-4 w-4" /> View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`gap-1.5 flex-1 ${isActive ? "text-amber-600 hover:text-amber-700" : "text-emerald-600 hover:text-emerald-700"}`}
                      onClick={() => handleToggleActive(ad)}
                    >
                      <Power className="h-4 w-4" />
                      {isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {viewing && (
        <AdModal
          ad={viewing}
          onClose={() => setViewing(null)}
          onSaved={() => {
            setViewing(null);
            loadAds();
          }}
        />
      )}
    </div>
  );
}
