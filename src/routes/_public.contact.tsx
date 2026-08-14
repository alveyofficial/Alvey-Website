import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { seoMeta, seoLinks } from "@/lib/seo";
import { Functions } from "appwrite";
import { useState } from "react";
import { appwrite } from "@/integrations/appwrite/client";

export const Route = createFileRoute("/_public/contact")({
  head: () => ({
    meta: seoMeta({
      title: "Contact Us",
      description:
        "Have a question about tutoring on Alvey? Send us a message and our support team will get back to you shortly.",
      path: "/contact",
    }),
    links: seoLinks("/contact"),
  }),
  component: Contact,
});

function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus("Please fill in all fields.");
      return;
    }

    setSending(true);
    setStatus("");

    try {
      await appwrite.functions.createExecution(
        "website-notifications",
        JSON.stringify({
          type: "contact_message",
          name,
          email,
          message,
        }),
        false,
        "/",
        "POST",
        {
          "Content-Type": "application/json",
        },
      );

      setName("");
      setEmail("");
      setMessage("");

      setStatus("Message sent successfully! We'll get back to you soon.");
    } catch (error) {
      console.error("Contact form error:", error);
      setStatus("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-24">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-4xl font-bold mb-6">Contact Us</h1>

          <p className="text-xl text-muted-foreground mb-8">
            Have a question? We're here to help. Send us a message and our
            support team will get back to you shortly.
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Email</h3>

              <a
                href="mailto:support@alvey.study"
                className="text-primary hover:underline"
              >
                support@alvey.study
              </a>
            </div>

            <div>
              <h3 className="font-semibold">Working Hours</h3>

              <p className="text-muted-foreground">
                Monday - Friday, 9am - 5pm EST
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="py-12">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>

                <Input
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={sending}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>

                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={sending}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>

                <textarea
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="How can we help you?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={sending}
                />
              </div>

              {status && (
                <p className="text-sm text-muted-foreground">
                  {status}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={sending}
              >
                {sending ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
