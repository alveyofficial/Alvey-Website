import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Star,
  Check,
  X,
  Flag,
  Pencil,
  Trash2,
  RotateCcw,
  Plus,
} from "lucide-react";
import {
  PageHeader,
  StatusBadge,
  EmptyState,
} from "@/components/portal-shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DataStore } from "@/lib/data-store";
import { appwrite } from "@/integrations/appwrite/client";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  component: AdminReviews,
});

type ReviewSection = "tutor" | "platform";
type ReviewFilter = "all" | "pending" | "approved" | "rejected";

function AdminReviews() {
  const [section, setSection] = useState<ReviewSection>("platform");
  const [filter, setFilter] = useState<ReviewFilter>("all");

  const [tutorReviews, setTutorReviews] = useState<Record<string, unknown>[]>(
    [],
  );
  const [platformReviews, setPlatformReviews] = useState<
    Record<string, unknown>[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [showAddPlatformReview, setShowAddPlatformReview] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);

    try {
      const [tutors, platforms] = await Promise.all([
        DataStore.getAllReviews(),
        DataStore.getAllPlatformReviews(),
      ]);

      setTutorReviews(tutors);
      setPlatformReviews(platforms);
    } catch (error) {
      console.error("Failed to load reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleTutorModerate = async (
    id: string,
    status: "approved" | "rejected",
  ) => {
    try {
      await DataStore.moderateReview(id, status);
      toast.success(`Tutor review ${status}`);
      await loadReviews();
    } catch (error) {
      console.error("Failed to moderate tutor review:", error);
      toast.error("Failed to moderate review");
    }
  };

  const handlePlatformModerate = async (
    id: string,
    status: "pending" | "approved" | "rejected",
  ) => {
    try {
      await DataStore.moderatePlatformReview(id, status);
      toast.success(`Platform review ${status}`);
      await loadReviews();
    } catch (error) {
      console.error("Failed to moderate platform review:", error);
      toast.error("Failed to moderate platform review");
    }
  };

  const filteredTutorReviews =
    filter === "all"
      ? tutorReviews
      : tutorReviews.filter((review) => review.status === filter);

  const filteredPlatformReviews =
    filter === "all"
      ? platformReviews
      : platformReviews.filter((review) => review.status === filter);

  return (
    <div>
      <PageHeader
        title="Reviews"
        description="Moderate and manage platform and tutor reviews."
      />

      <div className="flex gap-2 mb-6">
        <Button
          variant={section === "platform" ? "default" : "outline"}
          onClick={() => {
            setSection("platform");
            setFilter("all");
          }}
        >
          Platform Reviews
        </Button>

        <Button
          variant={section === "tutor" ? "default" : "outline"}
          onClick={() => {
            setSection("tutor");
            setFilter("all");
          }}
        >
          Tutor Reviews
        </Button>
      </div>

      {section === "platform" && (
        <div className="mb-6">
          <Button
            onClick={() => setShowAddPlatformReview((value) => !value)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {showAddPlatformReview
              ? "Cancel Add Review"
              : "Add Platform Review"}
          </Button>
        </div>
      )}

      {section === "platform" && showAddPlatformReview && (
        <AddPlatformReviewForm
          onCreated={async () => {
            setShowAddPlatformReview(false);
            await loadReviews();
          }}
          onCancel={() => setShowAddPlatformReview(false)}
        />
      )}

      <div className="flex gap-2 mb-4">
        {["all", "pending", "approved", "rejected"].map((value) => {
          const f = value as ReviewFilter;

          return (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
      ) : section === "platform" ? (
        filteredPlatformReviews.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No Platform Reviews"
            description="No platform reviews match this filter."
          />
        ) : (
          <div className="space-y-3">
            {filteredPlatformReviews.map((review) => (
              <PlatformReviewCard
                key={String(review.id)}
                review={review}
                onModerate={handlePlatformModerate}
                onUpdated={loadReviews}
              />
            ))}
          </div>
        )
      ) : filteredTutorReviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No Tutor Reviews"
          description="No tutor reviews match this filter."
        />
      ) : (
        <div className="space-y-3">
          {filteredTutorReviews.map((review) => (
            <TutorReviewCard
              key={String(review.id)}
              review={review}
              onModerate={handleTutorModerate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AddPlatformReviewForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => Promise<void>;
  onCancel: () => void;
}) {
  const [authorName, setAuthorName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(5);
  const [publishImmediately, setPublishImmediately] = useState(false);
  const [saving, setSaving] = useState(false);

  const createReview = async () => {
    if (!authorName.trim()) {
      toast.error("Author name is required");
      return;
    }

    if (rating < 1 || rating > 5) {
      toast.error("Rating must be between 1 and 5");
      return;
    }

    setSaving(true);

    try {
      const { data: userData } = await appwrite.auth.getUser();

      if (!userData.user?.id) {
        throw new Error("Unable to identify the current admin");
      }

      await DataStore.createPlatformReview({
        authorid: userData.user.id,
        authorName: authorName.trim(),
        title: title.trim(),
        body: body.trim(),
        rating,
        isPublic: publishImmediately,
      });

      toast.success(
        publishImmediately
          ? "Platform review created and published"
          : "Platform review created as pending",
      );

      setAuthorName("");
      setTitle("");
      setBody("");
      setRating(5);
      setPublishImmediately(false);

      await onCreated();
    } catch (error) {
      console.error("Failed to create platform review:", error);
      toast.error("Failed to create platform review");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Add Platform Review</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create a platform review manually. This is useful for reviews
            submitted outside the normal user flow.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Author name</label>
            <Input
              className="mt-1"
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              placeholder="e.g. Huraim Kamran"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Title / role</label>
            <Input
              className="mt-1"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. IGCSE Accounting Tutor"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Rating</label>

            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  aria-label={`Set rating to ${star}`}
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= rating ? "fill-current" : ""
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Review</label>
            <Textarea
              className="mt-1"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Write the platform review..."
              rows={4}
            />
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={publishImmediately}
              onChange={(event) =>
                setPublishImmediately(event.target.checked)
              }
            />
            Publish immediately
          </label>

          <div className="flex gap-2 pt-2">
            <Button disabled={saving} onClick={createReview}>
              {saving ? "Creating..." : "Create Review"}
            </Button>

            <Button
              variant="outline"
              disabled={saving}
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PlatformReviewCard({
  review,
  onModerate,
  onUpdated,
}: {
  review: Record<string, unknown>;
  onModerate: (
    id: string,
    status: "pending" | "approved" | "rejected",
  ) => Promise<void>;
  onUpdated: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [authorName, setAuthorName] = useState(String(review.authorName ?? ""));
  const [title, setTitle] = useState(String(review.title ?? ""));
  const [body, setBody] = useState(String(review.body ?? ""));
  const [rating, setRating] = useState(Number(review.rating ?? 5));
  const [saving, setSaving] = useState(false);

  const id = String(review.id);
  const status = String(review.status);

  const saveEdit = async () => {
    if (rating < 1 || rating > 5) {
      toast.error("Rating must be between 1 and 5");
      return;
    }

    if (!authorName.trim()) {
      toast.error("Author name is required");
      return;
    }

    setSaving(true);

    try {
      await DataStore.updatePlatformReview(id, {
        authorName: authorName.trim(),
        title: title.trim(),
        body: body.trim(),
        rating,
      });

      toast.success("Platform review updated");
      setEditing(false);
      await onUpdated();
    } catch (error) {
      console.error("Failed to update platform review:", error);
      toast.error("Failed to update platform review");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Author name</label>
                  <Input
                    className="mt-1"
                    value={authorName}
                    onChange={(event) => setAuthorName(event.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Title / role
                  </label>
                  <Input
                    className="mt-1"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g. IGCSE Accounting Tutor"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Rating</label>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        aria-label={`Set rating to ${star}`}
                      >
                        <Star
                          className={`h-5 w-5 ${
                            star <= rating ? "fill-current" : ""
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Review</label>
                  <Textarea
                    className="mt-1"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={saving}
                    onClick={saveEdit}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={saving}
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-sm">
                      {String(review.authorName || "Anonymous")}
                    </p>

                    {review.title ? (
                      <p className="text-xs text-muted-foreground">
                        {String(review.title)}
                      </p>
                    ) : null}
                  </div>

                  <Badge variant="outline" className="capitalize">
                    {status}
                  </Badge>
                </div>

                <div className="flex items-center gap-1 text-amber-500 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3.5 w-3.5 ${
                        star <= Number(review.rating ?? 0)
                          ? "fill-current"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}

                  <span className="text-xs text-muted-foreground ml-1">
                    {review.createdAt
                      ? new Date(String(review.createdAt)).toLocaleDateString()
                      : ""}
                  </span>
                </div>

                {review.body ? (
                  <p className="text-sm text-muted-foreground mt-3">
                    "{String(review.body)}"
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic mt-3">
                    No written review.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {!editing && (
          <div className="flex gap-2 mt-4 pt-3 border-t">
            {status === "pending" && (
              <>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                  onClick={() => onModerate(id, "approved")}
                >
                  <Check className="h-4 w-4" />
                  Approve
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 gap-1.5"
                  onClick={() => onModerate(id, "rejected")}
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </>
            )}

            {status === "approved" && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 gap-1.5"
                onClick={() => onModerate(id, "rejected")}
              >
                <X className="h-4 w-4" />
                Unpublish
              </Button>
            )}

            {status === "rejected" && (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                onClick={() => onModerate(id, "approved")}
              >
                <RotateCcw className="h-4 w-4" />
                Restore
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 ml-auto"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => onModerate(id, "rejected")}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>

            <Button variant="ghost" size="sm" className="gap-1.5">
              <Flag className="h-4 w-4" />
              Flag
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TutorReviewCard({
  review,
  onModerate,
}: {
  review: Record<string, unknown>;
  onModerate: (
    id: string,
    status: "approved" | "rejected",
  ) => Promise<void>;
}) {
  const status = String(review.status);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-semibold text-sm">
              {String(
                (review.student as Record<string, unknown> | undefined)
                  ?.display_name || "Student",
              )}{" "}
              →{" "}
              {String(
                (review.tutor as Record<string, unknown> | undefined)
                  ?.display_name || "Tutor",
              )}
            </p>

            <div className="flex items-center gap-1 text-amber-500 mt-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < Number(review.rating ?? 0)
                      ? "fill-amber-500"
                      : "text-muted-foreground"
                  }`}
                />
              ))}

              <span className="text-xs text-muted-foreground ml-1">
                {review.created_at
                  ? new Date(String(review.created_at)).toLocaleDateString()
                  : ""}
              </span>
            </div>
          </div>

          <StatusBadge status={status} />
        </div>

        <p className="text-sm text-muted-foreground italic mt-2">
          "{String(review.comment || "")}"
        </p>

        {review.tutor_response ? (
          <div className="mt-3 p-3 bg-muted/30 rounded-lg border-l-2 border-blue-500">
            <p className="text-xs font-semibold text-muted-foreground mb-1">
              Tutor Response:
            </p>
            <p className="text-sm text-muted-foreground">
              {String(review.tutor_response)}
            </p>
          </div>
        ) : null}

        <div className="flex gap-2 mt-3 pt-3 border-t">
          {status === "pending" && (
            <>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                onClick={() => onModerate(String(review.id), "approved")}
              >
                <Check className="h-4 w-4" />
                Approve
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="text-red-600 gap-1.5"
                onClick={() => onModerate(String(review.id), "rejected")}
              >
                <X className="h-4 w-4" />
                Reject
              </Button>
            </>
          )}

          {status === "approved" && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 gap-1.5"
              onClick={() => onModerate(String(review.id), "rejected")}
            >
              <X className="h-4 w-4" />
              Unpublish
            </Button>
          )}

          {status === "rejected" && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
              onClick={() => onModerate(String(review.id), "approved")}
            >
              <Check className="h-4 w-4" />
              Restore
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 ml-auto"
          >
            <Flag className="h-4 w-4" />
            Flag
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}