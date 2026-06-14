import { MarketingPage } from "@/components/MarketingPage";

export default function Cookies() {
  return (
    <MarketingPage title="Cookie Policy" lead="Last updated: June 14, 2026">
      <p>
        SkillSprint uses cookies and similar technologies to keep you signed in, remember your
        preferences, and understand how the product is used.
      </p>

      <h2 className="text-2xl font-bold text-foreground mt-8 mb-3">Types of cookies we use</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Essential:</strong> required for authentication, security, and core functionality.
        </li>
        <li>
          <strong>Preferences:</strong> remember choices like theme and language.
        </li>
        <li>
          <strong>Analytics:</strong> aggregated usage data to improve the platform.
        </li>
      </ul>

      <h2 className="text-2xl font-bold text-foreground mt-8 mb-3">Managing cookies</h2>
      <p>
        You can clear or block cookies in your browser settings. Disabling essential cookies will
        prevent you from signing in or completing purchases.
      </p>

      <h2 className="text-2xl font-bold text-foreground mt-8 mb-3">Contact</h2>
      <p>
        For cookie-related questions, email{" "}
        <a href="mailto:privacy@skillsprint.dev" className="text-sprint hover:underline">
          privacy@skillsprint.dev
        </a>
        .
      </p>
    </MarketingPage>
  );
}
