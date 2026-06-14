import { Link } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Browse and try free courses. Perfect for getting started.",
    features: [
      "Access to all free courses",
      "Basic progress tracking",
      "Community support",
      "Course completion certificates",
    ],
    cta: "Get started",
    href: "/auth?mode=signup",
    highlighted: false,
  },
  {
    name: "Pro Learner",
    price: "$19",
    period: "per month",
    description: "Unlock paid courses and accelerate your learning.",
    features: [
      "Everything in Free",
      "Unlimited paid course enrollments",
      "Practical submission grading",
      "Priority support",
      "Verified completion certificates",
    ],
    cta: "Start Pro",
    href: "/auth?mode=signup",
    highlighted: true,
  },
  {
    name: "Instructor",
    price: "Free",
    period: "to join",
    description: "Teach on SkillSprint. We take 15% of paid course revenue.",
    features: [
      "Course builder with modules & quizzes",
      "Practical submission workflow",
      "Revenue dashboard & withdrawals",
      "Expert verification eligibility",
    ],
    cta: "Become an instructor",
    href: "/auth?mode=signup&role=instructor",
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Simple, honest pricing
            </h1>
            <p className="text-lg text-muted-foreground">
              Start free. Upgrade when you're ready to commit. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border p-6 flex flex-col ${
                  tier.highlighted
                    ? "border-sprint bg-card shadow-lg shadow-sprint/10"
                    : "border-border bg-card"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-sprint text-sprint-foreground text-xs font-semibold">
                    Most popular
                  </div>
                )}
                <h2 className="text-xl font-bold text-foreground">{tier.name}</h2>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                  <span className="text-sm text-muted-foreground">{tier.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2 mb-6">{tier.description}</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-sprint mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to={tier.href}>
                  <Button
                    variant={tier.highlighted ? "sprint" : "outline"}
                    className="w-full"
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-10">
            Need a team plan?{" "}
            <a href="mailto:hello@skillsprint.dev" className="text-sprint hover:underline">
              Get in touch
            </a>
            .
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
