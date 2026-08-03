import { createFileRoute, Link } from "@tanstack/react-router";
import { seoMeta, seoLinks } from "@/lib/seo";

export const Route = createFileRoute("/_public/terms-of-service")({
  head: () => ({
    meta: seoMeta({
      title: "Terms of Service",
      description:
        "Terms that govern tutors, students, payments, refunds, and platform use on Alvey.",
      path: "/terms-of-service",
    }),
    links: seoLinks("/terms-of-service"),
  }),
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
  return (
    <div className="bg-background">
      <div className="max-w-4xl mx-auto px-4 py-20 sm:py-24">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#3D7F8F]">
            Legal
          </p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#164E5E]">
            Terms of Service
          </h1>
          <p className="text-lg text-muted-foreground leading-8">
            These Terms of Service govern the use of Alvey by students, tutors, and visitors.
            By using the platform, you agree to follow the rules below and any additional policies
            that apply to your role.
          </p>
        </div>

        <div className="mt-12 space-y-8">
          <section className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-foreground">For tutors</h2>
            <ol className="space-y-3 text-muted-foreground leading-7 list-decimal pl-5">
              <li>Tutors must hide their identity as a tutor in the community.</li>
              <li>Tutors must not reveal contact information or usernames before payment is confirmed.</li>
              <li>Tutors must accept Alvey&apos;s commission terms. Alvey takes 40% of the first month&apos;s fees for each student acquired through the platform.</li>
              <li>Tutors must be at least 13 years old to teach through Alvey.</li>
            </ol>
          </section>

          <section className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-foreground">For students</h2>
            <ol className="space-y-3 text-muted-foreground leading-7 list-decimal pl-5">
              <li>All payments must be made 100% beforehand, and students are connected to the tutor after payment is confirmed.</li>
              <li>Students must not reveal contact information or usernames before payment is confirmed.</li>
              <li>Alvey holds the first month&apos;s fees and releases them to the tutor at the end of that month to help prevent scams and support refunds. From the second month onward, fees are paid directly to tutors.</li>
              <li>Prices per class are fixed and decided by the tutor, although the number of classes can change.</li>
            </ol>
          </section>

          <section className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-foreground">General</h2>
            <ol className="space-y-3 text-muted-foreground leading-7 list-decimal pl-5">
              <li>Alvey is a platform that connects students with tutors.</li>
              <li>We take full responsibility for issues that occur on either side during the first month.</li>
              <li>Alvey is not responsible for problems that occur after the first month, including tutor price increases or other tutor-side issues.</li>
              <li>Violating these policies may result in removal from the platform.</li>
            </ol>
          </section>

          <section className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-foreground">Refunds</h2>
            <p className="text-muted-foreground leading-7">
              Refunds are available only during the first month and are handled case by case.
            </p>
            <div className="space-y-4 text-muted-foreground leading-7">
              <div>
                <h3 className="font-semibold text-foreground">Post-demo class cancellation</h3>
                <p>
                  If either party decides not to proceed after the demo class, the student receives
                  a 100% refund, provided both parties followed platform policies and did not share
                  contact details.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">First-week cancellation</h3>
                <p>
                  The student receives a refund for unattended classes and problematic classes when
                  there is a valid reason and supporting proof, such as missed sessions or
                  disrespectful behavior. The tutor is paid only for sessions that were successfully
                  and properly conducted.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8 shadow-sm space-y-3">
            <h2 className="text-xl font-bold text-foreground">Contact</h2>
            <p className="text-muted-foreground leading-7">
              Questions about these terms can be sent to{" "}
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
