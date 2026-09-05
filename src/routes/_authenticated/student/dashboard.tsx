import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { appwrite } from "@/integrations/appwrite/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Calendar, Clock, Bell, Star } from "lucide-react";
import { DataStore } from "@/lib/data-store";
import { EmptyState } from "@/components/portal-shared";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Role = "Students" | "tutor" | "recruitment" | "website" | "admin";
export const Route = createFileRoute("/_authenticated/student/dashboard")({
  head: () => ({
    meta: [
      { title: "Student Dashboard · Alvey" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<any | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submittedReview, setSubmittedReview] = useState<{
    id: string;
    rating: number;
    comment: string;
  } | null>(null);

  const [editingReview, setEditingReview] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [profile, setProfile] = useState<{
    display_name: string | null;
    email: string | null;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userData } = await appwrite.auth.getUser();

      console.log("CURRENT AUTH USER:", userData.user);

      const memberships = await DataStore.getStudentTeamMembers();

      console.log(
        "STUDENTS TEAM MEMBERS:",
        memberships.map((member: any) => ({
          userId: member.userId,
          userName: member.userName,
          userEmail: member.userEmail,
        }))
      );

      const uid = userData.user?.id;

      console.log("UID USED FOR ASSIGNMENT QUERY:", uid);

      if (!uid) return;

      const [roles, record, assignments] = await Promise.all([
        DataStore.getUserRoles(uid),
        DataStore.getUserRecord(uid),
        DataStore.getStudentAssignments(uid),
      ]);

      console.log("FINAL ASSIGNMENTS:", assignments);

      setRoles((roles ?? []).map((x) => x as Role));
      setProfile({
        display_name: record?.displayName || userData.user?.name || null,
        email: record?.email || userData.user?.email || null,
      });
      setAssignments(assignments ?? []);

      console.log("Student assignments:", assignments);
      console.log("Assignment count:", assignments?.length);
    })();
  }, []);
  
  const submitReview = async () => {
    if (!selectedTutor || rating < 1 || rating > 5) {
      return;
    }

    const tutor = selectedTutor.tutor;

    const tutorId =
      tutor?.id ||
      selectedTutor.tutorId ||
      selectedTutor.tutor_id;

    if (!tutorId) {
      return;
    }

    try {
      const { data: userData } = await appwrite.auth.getUser();
      const user = userData.user;

      if (!user?.id) {
        return;
      }

      setSubmittingReview(true);

      let reviewId: string;

      if (editingReview && submittedReview) {
        await DataStore.updateReview(submittedReview.id, {
          rating,
          comment,
        });

        reviewId = submittedReview.id;
      } else {
        const review = await DataStore.submitReview({
          student_id: user.id,
          student_name: user.name || "Student",
          tutor_id: tutorId,
          rating,
          comment,
        });

        reviewId = review.id;
      }

      setSubmittedReview({
        id: reviewId,
        rating,
        comment,
      });

      setEditingReview(false);

      // Automatically close the dialog after 2 seconds
      setTimeout(() => {
        setReviewOpen(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to submit review:", error);
    } finally {
      setSubmittingReview(false);
    }
  };
  const openReview = (assignment: any) => {
    setSelectedTutor(assignment);
    setRating(0);
    setComment("");
    setEditingReview(false);
    setReviewOpen(true);
  };

  // Is student if they don't have other elevated roles or if they explicitly have student
  const isStudent = roles.includes("Students") || roles.length === 0;
  console.log("Current roles state:", roles);
  if (roles.includes("tutor")) {
    return <div>Tutor Dashboard Coming Soon</div>;
  }

  if (roles.includes("admin")) {
    return <div>Owner Dashboard Coming Soon</div>;
  }

  if (roles.includes("website")) {
    return <div>Website Manager Dashboard Coming Soon</div>;
  }

  if (roles.includes("recruitment")) {
    return <div>Recruitment Dashboard Coming Soon</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}. Here's your
          learning overview.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-primary/10 text-primary rounded-full">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Assigned Tutors</p>
              <h3 className="text-2xl font-bold">—</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-primary/10 text-primary rounded-full">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Upcoming Lessons</p>
              <h3 className="text-2xl font-bold">—</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-primary/10 text-primary rounded-full">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Remaining Classes</p>
              <h3 className="text-2xl font-bold">—</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-primary/10 text-primary rounded-full">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Notifications</p>
              <h3 className="text-2xl font-bold">—</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {isStudent && assignments.length > 0 && (
        <Card>
          <CardContent className="p-6">
            {submittedReview && !editingReview ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    Your review for{" "}
                    {assignments[0]?.tutor?.name || "your tutor"}
                  </h2>

                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${star <= submittedReview.rating
                          ? "fill-current"
                          : ""
                          }`}
                      />
                    ))}
                  </div>

                  {submittedReview.comment && (
                    <p className="text-sm text-muted-foreground mt-2">
                      "{submittedReview.comment}"
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground mt-2">
                    Your review is pending approval.
                  </p>
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    setRating(submittedReview.rating);
                    setComment(submittedReview.comment);
                    setEditingReview(true);
                    setReviewOpen(true);
                  }}
                >
                  Edit Review
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    How's learning with{" "}
                    {assignments[0]?.tutor?.name || "your tutor"}?
                  </h2>

                  <p className="text-sm text-muted-foreground mt-1">
                    We'd love to hear about your experience. Your feedback
                    helps us improve our tutoring experience.
                  </p>
                </div>

                <Button
                  onClick={() => openReview(assignments[0])}
                  className="shrink-0"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Submit a Review
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl">Upcoming Lessons</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Calendar}
                title="Coming Soon"
                description="Your upcoming lessons will appear here once scheduling is live."
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Latest Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Bell}
                title="Coming Soon"
                description="Activity and updates will show here once your account is active."
              />
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingReview ? "Edit Your Review" : "Submit a Review"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium">Tutor</p>
              <p className="text-sm text-muted-foreground">
                {selectedTutor?.tutor?.name || "Your tutor"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">
                Your rating
              </p>

              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1"
                    aria-label={`Rate ${star} out of 5`}
                  >
                    <Star
                      className={`h-7 w-7 ${star <= rating ? "fill-current" : ""
                        }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="dashboard-review"
                className="text-sm font-medium"
              >
                Comment{" "}
                <span className="text-muted-foreground">
                  (optional)
                </span>
              </label>

              <Textarea
                id="dashboard-review"
                className="mt-2"
                placeholder="Tell us about your experience..."
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
            </div>

            <Button
              disabled={rating === 0 || submittingReview}
              onClick={submitReview}
              className="w-full"
            >
              {submittingReview
                ? "Submitting..."
                : editingReview
                  ? "Update Review"
                  : "Submit Review"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
