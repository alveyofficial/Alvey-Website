import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy · Alvey" },
      {
        name: "description",
        content: "How Alvey collects, uses, protects, and shares personal information.",
      },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <div className="bg-background">
      <div className="max-w-4xl mx-auto px-4 py-20 sm:py-24">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#3D7F8F]">
            Legal
          </p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#164E5E]">
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground leading-8">
            This Privacy Policy explains how Alvey collects, uses, stores, and protects your
            information. It is written in plain language so students, tutors, and visitors can
            understand how their data is handled on the platform.
          </p>
        </div>

        <div className="mt-12 space-y-8">
          <section className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8 shadow-sm space-y-3">
            <h2 className="text-xl font-bold text-foreground">Information we collect</h2>
            <p className="text-muted-foreground leading-7">
              We collect information you provide directly, such as your name, email address,
              profile details, subjects, messages, lesson requests, and any content you submit to
              us. We also collect technical information like device type, browser data, and basic
              usage analytics to keep the service reliable and secure.
            </p>
          </section>

          <section className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8 shadow-sm space-y-3">
            <h2 className="text-xl font-bold text-foreground">How we use information</h2>
            <p className="text-muted-foreground leading-7">
              We use personal information to create accounts, connect students with tutors,
              process lessons and refunds, support communication, protect the platform from abuse,
              improve our services, and meet legal or regulatory obligations.
            </p>
          </section>

          <section className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8 shadow-sm space-y-3">
            <h2 className="text-xl font-bold text-foreground">How information is shared</h2>
            <p className="text-muted-foreground leading-7">
              We only share personal information when necessary to operate the platform. That may
              include sharing data between matched students and tutors after payment is confirmed,
              sharing data with service providers that help us run Alvey, or disclosing information
              when required by law or to protect our users and platform.
            </p>
          </section>

          <section className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8 shadow-sm space-y-3">
            <h2 className="text-xl font-bold text-foreground">Payments and retention</h2>
            <p className="text-muted-foreground leading-7">
              Payment processing and holding periods are handled according to our platform rules.
              We keep records that are needed for billing, refunds, dispute handling, fraud
              prevention, and accounting. We retain information only as long as needed for those
              purposes or as required by law.
            </p>
          </section>

          <section className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8 shadow-sm space-y-3">
            <h2 className="text-xl font-bold text-foreground">Security</h2>
            <p className="text-muted-foreground leading-7">
              We use reasonable administrative, technical, and organizational safeguards to protect
              your information. No online service can guarantee perfect security, so we encourage
              users to keep their login details private and report any suspicious activity quickly.
            </p>
          </section>

          <section className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8 shadow-sm space-y-3">
            <h2 className="text-xl font-bold text-foreground">Your choices</h2>
            <p className="text-muted-foreground leading-7">
              You may request access, correction, or deletion of certain personal information, or
              ask us to limit some uses of your data where applicable. If you want help with a
              privacy request, contact us and we will review it as quickly as possible.
            </p>
          </section>

          <section className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8 shadow-sm space-y-3">
            <h2 className="text-xl font-bold text-foreground">Contact</h2>
            <p className="text-muted-foreground leading-7">
              If you have any privacy questions, email us at{" "}
              <a className="text-[#3D7F8F] font-medium hover:underline" href="mailto:support@alvey.study">
                support@alvey.study
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-10">
          <Link to="/" className="text-sm font-semibold text-[#164E5E] hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
