import { MarketingPage } from "@/components/MarketingPage";
import { Zap, Target, Users, Award } from "lucide-react";

export default function About() {
  return (
    <MarketingPage
      title="About SkillSprint"
      lead="We help motivated learners sprint from curious to capable — with structured paths, real projects, and expert review."
    >
      <p>
        SkillSprint was built on a simple belief: most people don't fail at learning because they
        lack ability — they fail because courses are sprawling, unstructured, and never tell you
        when you're truly ready to move on. So we designed a platform where every step is
        intentional.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose my-10">
        <Value icon={<Target className="w-5 h-5" />} title="Sequential Mastery">
          Modules unlock only after you pass the previous one. No skipping ahead, no shaky foundations.
        </Value>
        <Value icon={<Users className="w-5 h-5" />} title="Expert-Verified Instructors">
          Every instructor is reviewed by our team before they can publish a paid course.
        </Value>
        <Value icon={<Award className="w-5 h-5" />} title="Hybrid Grading">
          Auto-graded quizzes plus human-reviewed practical submissions for the work that matters.
        </Value>
        <Value icon={<Zap className="w-5 h-5" />} title="Certificates That Count">
          Earn a verifiable certificate when you complete 100% of a course — no participation trophies.
        </Value>
      </div>

      <h2 className="text-2xl font-bold text-foreground mt-12 mb-3">Our story</h2>
      <p>
        SkillSprint started as a side project between two engineers tired of recommending the same
        scattered tutorials to junior developers. We built the platform we wished we had when we
        were learning — opinionated, focused, and honest about what mastery actually requires.
      </p>

      <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">What's next</h2>
      <p>
        We're growing our catalog of practical, project-based courses and adding tools that help
        instructors run their teaching business. If that resonates, we'd love to have you along.
      </p>
    </MarketingPage>
  );
}

function Value({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="w-10 h-10 rounded-lg bg-sprint/10 text-sprint flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
