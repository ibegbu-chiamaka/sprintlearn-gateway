# Complete SkillSprint learning and dashboard flows

## Build
- Reconcile registered pages and destinations, including the student course player and instructor course builder; correct role gating and broken links.
- Connect student learning, instructor course management and grading, and admin governance views to the existing course, enrollment, progress, quiz, submission, profile, and verification records.
- Implement sequential lessons and module quizzes with a 65% pass gate, practical project submission, and downloadable completion certificates.
- Finish end-to-end checks for public routes and available authenticated role workflows; report any actions blocked by missing service configuration or backend permissions.

## Technical approach
- Reuse existing Lovable Cloud tables, storage, authentication, and UI patterns; avoid new schema unless the audit proves it is required.
- Keep course content, quiz scoring, access checks, file ownership, and admin actions bounded by authenticated user permissions and existing row policies.
- Add or update focused tests for the 65% progression rule and verify changed routes in the preview.
