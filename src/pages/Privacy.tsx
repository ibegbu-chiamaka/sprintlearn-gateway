import { MarketingPage } from "@/components/MarketingPage";

export default function Privacy() {
  return (
    <MarketingPage title="Privacy Policy" lead="Last updated: June 14, 2026">
      <p>
        SkillSprint ("we", "our", "us") respects your privacy. This policy explains what we
        collect, why we collect it, and the choices you have.
      </p>

      <h2 className="text-2xl font-bold text-foreground mt-8 mb-3">Information we collect</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Account data: name, email, role, and profile details you provide.</li>
        <li>Learning activity: enrollments, progress, quiz attempts, and submissions.</li>
        <li>Payment metadata: amounts and status (card details are handled by our processor).</li>
        <li>Technical data: device, browser, IP, and basic usage analytics.</li>
      </ul>

      <h2 className="text-2xl font-bold text-foreground mt-8 mb-3">How we use it</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>To operate the platform: authentication, progress tracking, certificates.</li>
        <li>To improve courses and detect abuse.</li>
        <li>To send transactional emails (enrollments, grading, withdrawals).</li>
      </ul>

      <h2 className="text-2xl font-bold text-foreground mt-8 mb-3">Sharing</h2>
      <p>
        We never sell your data. We share only with vetted processors (hosting, payments, email)
        as needed to deliver the service.
      </p>

      <h2 className="text-2xl font-bold text-foreground mt-8 mb-3">Your rights</h2>
      <p>
        You can request access, correction, export, or deletion of your data at any time by
        emailing <a href="mailto:privacy@skillsprint.dev" className="text-sprint hover:underline">privacy@skillsprint.dev</a>.
      </p>
    </MarketingPage>
  );
}
