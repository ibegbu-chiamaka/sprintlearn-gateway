import { MarketingPage } from "@/components/MarketingPage";

export default function Terms() {
  return (
    <MarketingPage title="Terms of Service" lead="Last updated: June 14, 2026">
      <p>
        By using SkillSprint you agree to these terms. Please read them carefully — they describe
        what you can expect from us and what we expect from you.
      </p>

      <h2 className="text-2xl font-bold text-foreground mt-8 mb-3">Your account</h2>
      <p>
        You're responsible for keeping your credentials safe and for activity under your account.
        You must be at least 13 years old to use SkillSprint.
      </p>

      <h2 className="text-2xl font-bold text-foreground mt-8 mb-3">Courses & payments</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Free courses are available to all registered users.</li>
        <li>Paid course purchases grant lifetime access unless otherwise stated.</li>
        <li>Refunds are available within 14 days if you've completed less than 25% of a course.</li>
        <li>Instructors retain ownership of their content and receive 85% of net revenue.</li>
      </ul>

      <h2 className="text-2xl font-bold text-foreground mt-8 mb-3">Acceptable use</h2>
      <p>
        Don't share account access, scrape course content, harass other users, or upload anything
        illegal. We may suspend accounts that violate these rules.
      </p>

      <h2 className="text-2xl font-bold text-foreground mt-8 mb-3">Termination</h2>
      <p>
        You can close your account anytime from Settings. We may suspend or terminate accounts
        that violate these terms.
      </p>

      <h2 className="text-2xl font-bold text-foreground mt-8 mb-3">Contact</h2>
      <p>
        Questions? Reach us at{" "}
        <a href="mailto:legal@skillsprint.dev" className="text-sprint hover:underline">
          legal@skillsprint.dev
        </a>
        .
      </p>
    </MarketingPage>
  );
}
