import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_public/contact")({
  component: Contact,
});

function Contact() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-24">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Have a question? We're here to help. Send us a message and our support team will get
            back to you shortly.
          </p>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Email</h3>
              <a href="mailto:support@alvey.study" className="text-primary hover:underline">
                support@alvey.study
              </a>
            </div>
            <div>
              <h3 className="font-semibold">Working Hours</h3>
              <p className="text-muted-foreground">Monday - Friday, 9am - 5pm EST</p>
            </div>
          </div>
        </div>
        <Card>
          <CardContent className="py-12">
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input placeholder="Your full name" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" placeholder="your@email.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <textarea
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="How can we help you?"
                />
              </div>
              <Button className="w-full">Send Message</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
