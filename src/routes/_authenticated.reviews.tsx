import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DataStore } from "@/lib/data-store";
import { getCurrentUser } from "@/integrations/appwrite/client";

export const Route = createFileRoute("/_authenticated/reviews")({
  component: Page,
});

function Page() {
  const [isStudent, setIsStudent] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [platformRating, setPlatformRating] = useState(0);
  const [platformComment, setPlatformComment] = useState("");
  const [platformSubmitting, setPlatformSubmitting] = useState(false);
  const [platformSubmitted, setPlatformSubmitted] = useState(false);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const user = await getCurrentUser();

        if (!user?.id) {
          setAssignments([]);
          return;
        }

        const roles = await DataStore.getUserRoles(user.id);
        const student = roles.includes("Students");

        setIsStudent(student);

        if (!student) {
          return;
        }

        const data = await DataStore.getStudentAssignments(user.id);
        setAssignments(data);
      } catch (error) {
        console.error("Failed to load student assignments:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, []);

  const submitReview = async (tutorId: string, tutorName: string) => {
    const rating = ratings[tutorId] ?? 0;
    const comment = comments[tutorId] ?? "";

    if (rating < 1 || rating > 5) {
      return;
    }

    try {
      const user = await getCurrentUser();

      if (!user?.id) {
        return;
      }

      setSubmitting(tutorId);

      await DataStore.submitReview({
        student_id: user.id,
        student_name: user.name || user.displayName || "Student",
        tutor_id: tutorId,
        rating,
        comment,
      });

      setSubmitted((prev) => ({
        ...prev,
        [tutorId]: true,
      }));
    } catch (error) {
      console.error(`Failed to submit review for ${tutorName}:`, error);
    } finally {
      setSubmitting(null);
    }
  };

  const submitPlatformReview = async () => {
    if (platformRating < 1 || platformRating > 5) {
      return;
    }

    try {
      const user = await getCurrentUser();

      if (!user?.id) {
        return;
      }

      setPlatformSubmitting(true);

      await DataStore.submitPlatformReview({
        authorid: user.id,
        authorName: user.name || user.displayName || "User",
        rating: platformRating,
        body: platformComment,
      });

      setPlatformSubmitted(true);
    } catch (error) {
      console.error("Failed to submit platform review:", error);
    } finally {
      setPlatformSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reviews</h1>
          <p className="text-muted-foreground mt-1">
            Share your experience with Alvey and the tutors you've studied with.
          </p>
        </div>

        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Loading reviews...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reviews</h1>
        <p className="text-muted-foreground mt-1">
          Share your experience with Alvey and the tutors you've studied with.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Review Alvey</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tell us what you think about the Alvey platform and your experience using
            it.
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          {platformSubmitted ? (
            <div className="rounded-lg border p-4">
              <p className="font-medium">Review submitted! 🎉</p>
              <p className="text-sm text-muted-foreground mt-1">
                Thanks for your feedback. Your review is pending approval before it
                becomes public.
              </p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-sm font-medium mb-2">Your rating</p>

                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setPlatformRating(star)}
                      className="p-1"
                      aria-label={`Rate Alvey ${star} out of 5`}
                    >
                      <Star
                        className={`h-7 w-7 ${star <= platformRating ? "fill-current" : ""
                          }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="platform-review"
                  className="text-sm font-medium"
                >
                  Your review{" "}
                  <span className="text-muted-foreground">
                    (optional)
                  </span>
                </label>

                <Textarea
                  id="platform-review"
                  className="mt-2"
                  placeholder="Tell us about your experience with Alvey..."
                  value={platformComment}
                  onChange={(event) =>
                    setPlatformComment(event.target.value)
                  }
                />
              </div>

              <Button
                disabled={platformRating === 0 || platformSubmitting}
                onClick={submitPlatformReview}
              >
                {platformSubmitting ? "Submitting..." : "Submit Review"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
      {isStudent && (
        <>
          {assignments.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="font-medium">No assigned tutors yet.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Once you're assigned a tutor, you'll be able to leave a review
                  here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {assignments.map((assignment) => {
                const tutor = assignment.tutor;
                const tutorId = tutor?.id || assignment.tutorId || assignment.tutor_id;

                if (!tutorId) return null;

                return (
                  <Card key={assignment.id || tutorId}>
                    <CardHeader>
                      <CardTitle>
                        Review {tutor?.name || "your tutor"}
                      </CardTitle>

                      {tutor?.headline && (
                        <p className="text-sm text-muted-foreground">
                          {tutor.headline}
                        </p>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-5">
                      {submitted[tutorId] ? (
                        <div className="rounded-lg border p-4">
                          <p className="font-medium">Review submitted! 🎉</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Your review is pending approval before it becomes
                            public.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div>
                            <p className="text-sm font-medium mb-2">
                              Your rating
                            </p>

                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() =>
                                    setRatings((prev) => ({
                                      ...prev,
                                      [tutorId]: star,
                                    }))
                                  }
                                  className="p-1"
                                  aria-label={`Rate ${star} out of 5`}
                                >
                                  <Star
                                    className={`h-7 w-7 ${star <= (ratings[tutorId] ?? 0)
                                      ? "fill-current"
                                      : ""
                                      }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor={`review-${tutorId}`}
                              className="text-sm font-medium"
                            >
                              Comment{" "}
                              <span className="text-muted-foreground">
                                (optional)
                              </span>
                            </label>

                            <Textarea
                              id={`review-${tutorId}`}
                              className="mt-2"
                              placeholder="Tell us about your experience..."
                              value={comments[tutorId] ?? ""}
                              onChange={(event) =>
                                setComments((prev) => ({
                                  ...prev,
                                  [tutorId]: event.target.value,
                                }))
                              }
                            />
                          </div>

                          <Button
                            disabled={
                              (ratings[tutorId] ?? 0) === 0 ||
                              submitting === tutorId
                            }
                            onClick={() =>
                              submitReview(
                                tutorId,
                                tutor?.name || "your tutor",
                              )
                            }
                          >
                            {submitting === tutorId
                              ? "Submitting..."
                              : "Submit Review"}
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
