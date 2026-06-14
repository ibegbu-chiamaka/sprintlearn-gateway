import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Users,
  DollarSign,
  BookOpen,
  Edit,
  Eye,
  Save,
  Send,
  CheckCircle2,
  Circle,
  X,
} from "lucide-react";

type Course = {
  id: string;
  title: string;
  students: number;
  revenue: number;
  status: "published" | "draft";
  thumbnail: string;
  description: string;
};

const initialCourses: Course[] = [
  {
    id: "1",
    title: "Complete React Developer Course",
    students: 1234,
    revenue: 4520.5,
    status: "published",
    thumbnail:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=400&fit=crop",
    description:
      "Master React from fundamentals to advanced patterns with real-world projects.",
  },
  {
    id: "2",
    title: "TypeScript Masterclass",
    students: 856,
    revenue: 2890,
    status: "published",
    thumbnail:
      "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=1200&h=400&fit=crop",
    description:
      "Become a TypeScript expert and write safer, more maintainable code.",
  },
  {
    id: "3",
    title: "Advanced Node.js Patterns",
    students: 0,
    revenue: 0,
    status: "draft",
    thumbnail:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=400&fit=crop",
    description:
      "Deep dive into scalable Node.js architecture patterns and best practices.",
  },
];

const courseModules: Record<string, { id: string; title: string }[]> = {
  "1": [
    { id: "m1", title: "React Fundamentals" },
    { id: "m2", title: "Hooks Deep Dive" },
    { id: "m3", title: "State Management" },
    { id: "m4", title: "Performance & Patterns" },
    { id: "m5", title: "Capstone Project" },
  ],
  "2": [
    { id: "m1", title: "TypeScript Basics" },
    { id: "m2", title: "Generics & Utility Types" },
    { id: "m3", title: "Advanced Type System" },
    { id: "m4", title: "Real-world Patterns" },
  ],
  "3": [
    { id: "m1", title: "Event Loop & Concurrency" },
    { id: "m2", title: "Streams & Buffers" },
    { id: "m3", title: "Scalable Architecture" },
  ],
};

const courseStudents: Record<
  string,
  { id: string; name: string; email: string; completedModules: number; lastActive: string }[]
> = {
  "1": [
    { id: "s1", name: "Alice Johnson", email: "alice@example.com", completedModules: 5, lastActive: "2h ago" },
    { id: "s2", name: "Bob Williams", email: "bob@example.com", completedModules: 3, lastActive: "1d ago" },
    { id: "s3", name: "Carol Davis", email: "carol@example.com", completedModules: 4, lastActive: "3h ago" },
    { id: "s4", name: "Daniel Lee", email: "daniel@example.com", completedModules: 1, lastActive: "5d ago" },
    { id: "s5", name: "Eva Martinez", email: "eva@example.com", completedModules: 2, lastActive: "12h ago" },
  ],
  "2": [
    { id: "s1", name: "Frank Chen", email: "frank@example.com", completedModules: 4, lastActive: "1h ago" },
    { id: "s2", name: "Grace Kim", email: "grace@example.com", completedModules: 2, lastActive: "2d ago" },
    { id: "s3", name: "Henry Patel", email: "henry@example.com", completedModules: 3, lastActive: "6h ago" },
  ],
  "3": [],
};

export default function InstructorCourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [courses, setCourses] = useState(initialCourses);
  const course = courses.find((c) => c.id === courseId);

  const [editing, setEditing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState(course?.title ?? "");
  const [draftDescription, setDraftDescription] = useState(course?.description ?? "");

  const modules = useMemo(() => (courseId ? courseModules[courseId] ?? [] : []), [courseId]);
  const students = useMemo(() => (courseId ? courseStudents[courseId] ?? [] : []), [courseId]);

  const moduleCompletion = useMemo(() => {
    if (!modules.length) return [];
    return modules.map((mod, idx) => {
      const completed = students.filter((s) => s.completedModules > idx).length;
      const pct = students.length ? Math.round((completed / students.length) * 100) : 0;
      return { ...mod, completed, total: students.length, pct };
    });
  }, [modules, students]);

  const avgProgress = useMemo(() => {
    if (!students.length || !modules.length) return 0;
    const total = students.reduce((sum, s) => sum + s.completedModules, 0);
    return Math.round((total / (students.length * modules.length)) * 100);
  }, [students, modules]);

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Course not found</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't find the course you're looking for.
          </p>
          <Button onClick={() => navigate("/dashboard/instructor")}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  const startEdit = () => {
    setDraftTitle(course.title);
    setDraftDescription(course.description);
    setEditing(true);
  };

  const handleSave = () => {
    if (!draftTitle.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    setCourses((prev) =>
      prev.map((c) =>
        c.id === course.id
          ? { ...c, title: draftTitle.trim(), description: draftDescription.trim() }
          : c,
      ),
    );
    setEditing(false);
    toast({ title: "Changes saved", description: "Your course details were updated." });
  };

  const togglePublish = () => {
    const next = course.status === "published" ? "draft" : "published";
    setCourses((prev) =>
      prev.map((c) => (c.id === course.id ? { ...c, status: next } : c)),
    );
    toast({
      title: next === "published" ? "Course published" : "Course unpublished",
      description:
        next === "published"
          ? "Students can now discover and enroll in this course."
          : "This course is now hidden from the marketplace.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6">
        <Link
          to="/dashboard/instructor"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="relative aspect-[3/1]">
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover"
            />
            <div
              className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${
                course.status === "published"
                  ? "bg-success text-success-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {course.status === "published" ? "Published" : "Draft"}
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-[260px]">
                {editing ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={draftDescription}
                        onChange={(e) => setDraftDescription(e.target.value)}
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                      {course.title}
                    </h1>
                    <p className="text-muted-foreground max-w-2xl">
                      {course.description}
                    </p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {editing ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                    <Button variant="sprint" size="sm" onClick={handleSave}>
                      <Save className="w-4 h-4 mr-2" /> Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                      <Eye className="w-4 h-4 mr-2" /> Preview
                    </Button>
                    <Button variant="outline" size="sm" onClick={startEdit}>
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button variant="sprint" size="sm" onClick={togglePublish}>
                      <Send className="w-4 h-4 mr-2" />
                      {course.status === "published" ? "Unpublish" : "Publish"}
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <Stat icon={<Users className="w-5 h-5 text-primary" />} label="Students" value={course.students.toLocaleString()} tint="bg-primary/10" />
              <Stat icon={<DollarSign className="w-5 h-5 text-success" />} label="Revenue" value={`$${course.revenue.toLocaleString()}`} tint="bg-success/10" />
              <Stat icon={<BookOpen className="w-5 h-5 text-sprint" />} label="Modules" value={String(modules.length)} tint="bg-sprint/10" />
              <Stat icon={<CheckCircle2 className="w-5 h-5 text-warning" />} label="Avg. Progress" value={`${avgProgress}%`} tint="bg-warning/10" />
            </div>
          </div>
        </div>

        {/* Module Completion */}
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-4">Module Completion</h2>
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {moduleCompletion.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                No modules yet. Add modules from the course builder.
              </div>
            ) : (
              moduleCompletion.map((m, idx) => (
                <div key={m.id} className="p-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="font-medium truncate">{m.title}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {m.completed}/{m.total} completed
                      </span>
                    </div>
                    <Progress value={m.pct} className="h-2" />
                  </div>
                  <div className="text-sm font-semibold w-10 text-right">{m.pct}%</div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Student Progress */}
        <section className="mt-8 mb-8">
          <h2 className="text-xl font-bold mb-4">Student Progress</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {students.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                No students enrolled yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {students.map((s) => {
                  const pct = modules.length
                    ? Math.round((s.completedModules / modules.length) * 100)
                    : 0;
                  return (
                    <div key={s.id} className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                        {s.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{s.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {s.email} · Last active {s.lastActive}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {s.completedModules}/{modules.length} modules
                          </span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                      <div className="text-sm font-semibold w-10 text-right">{pct}%</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <p className="text-sm font-medium text-muted-foreground">Student preview</p>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img src={course.thumbnail} alt={course.title} className="w-full aspect-video object-cover" />
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">{course.title}</h2>
              <p className="text-muted-foreground mb-6">{course.description}</p>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                What you'll learn
              </h3>
              <ul className="space-y-2">
                {modules.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 text-sm">
                    <Circle className="w-4 h-4 text-sprint" />
                    {m.title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <div className="bg-muted/40 rounded-lg p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tint}`}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
