import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { appwrite } from "@/integrations/appwrite/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/verify-email")({
  head: () => ({
    meta: [
      { title: "Verify email · Alvey" },
      {
        name: "description",
        content: "Verify your Alvey account email address.",
      },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const navigate = useNavigate();

  const [status, setStatus] = useState<
    "verifying" | "success" | "error"
  >("verifying");

  const [message, setMessage] = useState(
    "Verifying your email address..."
  );

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const params = new URLSearchParams(window.location.search);

        const userId = params.get("userId");
        const secret = params.get("secret");

        if (!userId || !secret) {
          throw new Error(
            "This verification link is missing the required information."
          );
        }

        const { error } = await appwrite.auth.updateVerification(
          userId,
          secret
        );

        if (error) throw error;

        setStatus("success");
        setMessage(
          "Your email has been successfully verified!"
        );

        toast.success("Email verified!");
      } catch (err: any) {
        console.error(err);

        setStatus("error");
        setMessage(
          err?.message ||
            "We couldn't verify your email. The link may have expired or already been used."
        );

        toast.error("Email verification failed.");
      }
    };

    verifyEmail();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
            {status === "verifying" && (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            )}

            {status === "success" && (
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            )}

            {status === "error" && (
              <XCircle className="h-10 w-10 text-red-600" />
            )}
          </div>

          <CardTitle className="text-xl">
            {status === "verifying" && "Verifying your email..."}
            {status === "success" && "Email verified!"}
            {status === "error" && "Verification failed"}
          </CardTitle>

          <CardDescription className="mt-2">
            {message}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {status === "success" && (
            <Button
              className="w-full"
              onClick={() => navigate({ to: "/auth" })}
            >
              Continue to sign in
            </Button>
          )}

          {status === "error" && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate({ to: "/auth" })}
            >
              Back to sign in
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}