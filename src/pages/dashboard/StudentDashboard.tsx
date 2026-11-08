import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Search, 
  Clock, 
  Award, 
  Play, 
  ChevronRight,
  Zap,
  LogOut,
  User,
  LayoutDashboard,
  GraduationCap,
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

type StudentCourse = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number | null;
  category: string | null;
  instructor: string;
  progress: number;
  totalSessions: number;
  completedSessions: number;
  is_practical: boolean | null;
};

export default function StudentDashboard() {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("my-courses");
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [marketplace, setMarketplace] = useState<StudentCourse[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const navigate = useNavigate();

  useEffect(() => { setFullName(profile?.full_name ?? ""); }, [profile?.full_name]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user || !profile) return;
      setLoading(true);
      const [{ data: enrollments, error: enrollmentError }, { data: catalog, error: catalogError }] = await Promise.all([
        supabase.from("enrollments").select("course_id, courses(id,title,description,thumbnail_url,price,category,is_practical,instructor_id,profiles(full_name))").eq("user_id", profile.id),
        supabase.from("courses").select("id,title,description,thumbnail_url,price,category,is_practical,instructor_id,profiles(full_name)").eq("is_published", true),
      ]);
      if (enrollmentError || catalogError) {
        if (active) toast({ title: "Courses unavailable", description: "We couldn't load your learning data. Please try again.", variant: "destructive" });
        if (active) setLoading(false);
        return;
      }
      const enrolled = (enrollments ?? []).flatMap((e) => e.courses ? [{ id: e.courses.id, title: e.courses.title, description: e.courses.description, thumbnail_url: e.courses.thumbnail_url, price: e.courses.price, category: e.courses.category, is_practical: e.courses.is_practical, instructor: Array.isArray(e.courses.profiles) ? e.courses.profiles[0]?.full_name ?? "Instructor" : e.courses.profiles?.full_name ?? "Instructor" }] : []);
      const courseIds = enrolled.map((c) => c.id);
      const [{ data: modules }, { data: progress }] = courseIds.length ? await Promise.all([
        supabase.from("modules").select("id,course_id,sessions(id)").in("course_id", courseIds),
        supabase.from("user_progress").select("session_id,completed").eq("user_id", profile.id).eq("completed", true),
      ]) : [{ data: [] }, { data: [] }];
      const progressSet = new Set((progress ?? []).map((p) => p.session_id));
      const counts = new Map<string, { total: number; completed: number }>();
      for (const mod of modules ?? []) {
        const current = counts.get(mod.course_id) ?? { total: 0, completed: 0 };
        for (const session of mod.sessions ?? []) {
          current.total += 1;
          if (progressSet.has(session.id)) current.completed += 1;
        }
        counts.set(mod.course_id, current);
      }
      const enrich = (item: typeof enrolled[number]): StudentCourse => {
        const count = counts.get(item.id) ?? { total: 0, completed: 0 };
        return { ...item, totalSessions: count.total, completedSessions: count.completed, progress: count.total ? Math.round((count.completed / count.total) * 100) : 0 };
      };
      const enrolledSet = new Set(courseIds);
      const discoverable = (catalog ?? []).filter((c) => !enrolledSet.has(c.id)).map((c) => enrich({ id: c.id, title: c.title, description: c.description, thumbnail_url: c.thumbnail_url, price: c.price, category: c.category, is_practical: c.is_practical, instructor: Array.isArray(c.profiles) ? c.profiles[0]?.full_name ?? "Instructor" : c.profiles?.full_name ?? "Instructor" }));
      if (active) { setCourses(enrolled.map(enrich)); setMarketplace(discoverable); setLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, [user, profile]);

  const filteredCourses = useMemo(() => courses.filter((course) => course.title.toLowerCase().includes(query.toLowerCase())), [courses, query]);
  const filteredMarketplace = useMemo(() => marketplace.filter((course) => course.title.toLowerCase().includes(query.toLowerCase())), [marketplace, query]);

  const enroll = async (course: StudentCourse) => {
    if (!profile) return;
    const { error } = await supabase.from("enrollments").insert({ course_id: course.id, user_id: profile.id });
    if (error && error.code !== "23505") { toast({ title: "Unable to enroll", description: error.message, variant: "destructive" }); return; }
    setMarketplace((items) => items.filter((item) => item.id !== course.id));
    setCourses((items) => [...items, { ...course, progress: 0, totalSessions: 0, completedSessions: 0 }]);
    toast({ title: "You're enrolled", description: course.title });
    navigate(`/dashboard/student/courses/${course.id}`);
  };

  const saveProfile = async () => {
    if (!profile || fullName.trim().length < 2) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName.trim() }).eq("id", profile.id);
    setSavingProfile(false);
    toast(error ? { title: "Profile not saved", description: error.message, variant: "destructive" } : { title: "Profile saved" });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border hidden lg:flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-sprint flex items-center justify-center">
              <Zap className="w-5 h-5 text-sprint-foreground" />
            </div>
            <span className="text-xl font-bold text-sidebar-foreground">
              Skill<span className="text-sprint">Sprint</span>
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab("my-courses")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "my-courses"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            My Courses
          </button>
          <button
            onClick={() => setActiveTab("browse")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "browse"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <Search className="w-5 h-5" />
            Browse Courses
          </button>
          <button
            onClick={() => setActiveTab("certificates")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "certificates"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <Award className="w-5 h-5" />
            Certificates
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "profile"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <User className="w-5 h-5" />
            Profile
          </button>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-sidebar-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.full_name || "Student"}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back, {profile?.full_name?.split(" ")[0] || "Student"}!
              </h1>
              <p className="text-muted-foreground">Continue your learning journey</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search courses..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-sm w-64 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Stats */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-sprint/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-sprint" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{enrolledCourses.length}</p>
                  <p className="text-sm text-muted-foreground">Enrolled Courses</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">24h</p>
                  <p className="text-sm text-muted-foreground">Learning Time</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Award className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">1</p>
                  <p className="text-sm text-muted-foreground">Certificates Earned</p>
                </div>
              </div>
            </div>
          </motion.div>

          {activeTab === "my-courses" && <>
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Continue Learning</h2>
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => { setActiveTab("my-courses"); setQuery(""); }}>
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? <p className="col-span-full py-12 text-center text-muted-foreground">Loading your courses…</p> : filteredCourses.length === 0 ? <p className="col-span-full py-12 text-center text-muted-foreground">No enrolled courses yet. Browse the catalog to get started.</p> : filteredCourses.map((course) => (
                <motion.div
                  key={course.id}
                  className="bg-card border border-border rounded-xl overflow-hidden card-hover cursor-pointer"
                  whileHover={{ y: -4 }}
                  onClick={() => navigate(`/dashboard/student/courses/${course.id}`)}
                >
                  <div className="relative aspect-video">
                    <img
                      src={course.thumbnail_url || "/placeholder.svg"}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <button aria-label={`Continue ${course.title}`} className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" onClick={() => navigate(`/dashboard/student/courses/${course.id}`)}>
                      <div className="w-14 h-14 rounded-full bg-sprint flex items-center justify-center glow-sprint">
                        <Play className="w-6 h-6 text-sprint-foreground ml-1" />
                      </div>
                    </button>
                    {course.progress === 100 && (
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-success text-success-foreground text-xs font-medium">
                        Completed
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-card-foreground mb-1 line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">{course.instructor}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {course.completedSessions}/{course.totalSessions} sessions
                        </span>
                        <span className="font-medium text-sprint">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Recommended Courses */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Recommended for You</h2>
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setActiveTab("browse")}>
                Browse All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {marketplace.slice(0, 2).map((course) => (
                <motion.div
                  key={course.id}
                  className="bg-card border border-border rounded-xl overflow-hidden card-hover flex"
                  whileHover={{ y: -4 }}
                >
                  <div className="w-48 flex-shrink-0">
                    <img
                      src={course.thumbnail_url || "/placeholder.svg"}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="font-semibold text-card-foreground mb-1">
                        {course.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">{course.instructor}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{course.category || "Course"}</span>
                        <span>{course.totalSessions} sessions</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-lg font-bold text-sprint">{course.price ? `$${course.price}` : "Free"}</span>
                      <Button variant="sprint" size="sm" onClick={() => void enroll(course)}>Enroll Now</Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
          </>}

          {activeTab === "browse" && <section>
            <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold">Browse Courses</h2><Link to="/courses"><Button variant="outline" size="sm">Open full catalog</Button></Link></div>
            {loading ? <p className="py-12 text-center text-muted-foreground">Loading courses…</p> : filteredMarketplace.length === 0 ? <p className="py-12 text-center text-muted-foreground">No courses match your search.</p> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{filteredMarketplace.map((course) => <article key={course.id} className="bg-card border border-border overflow-hidden"><img src={course.thumbnail_url || "/placeholder.svg"} alt={course.title} className="aspect-video w-full object-cover"/><div className="p-4"><p className="text-xs text-muted-foreground">{course.category || "Course"} · {course.instructor}</p><h3 className="mt-1 font-semibold">{course.title}</h3><div className="mt-4 flex items-center justify-between"><span className="font-semibold">{course.price ? `$${course.price}` : "Free"}</span><Button variant="sprint" size="sm" onClick={() => void enroll(course)}>Enroll</Button></div></div></article>)}</div>}
          </section>}

          {activeTab === "certificates" && <section><h2 className="text-xl font-bold mb-4">Certificates</h2><div className="divide-y divide-border border-y border-border">{courses.filter((course) => course.progress === 100).length ? courses.filter((course) => course.progress === 100).map((course) => <div key={course.id} className="py-4 flex items-center justify-between gap-4"><div><p className="font-medium">{course.title}</p><p className="text-sm text-muted-foreground">Course completion certificate</p></div><Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/student/courses/${course.id}`)}><Award className="w-4 h-4 mr-2"/>View certificate</Button></div>) : <p className="py-8 text-muted-foreground">Certificates appear after course completion and any required project approval.</p>}</div></section>}

          {activeTab === "profile" && <section className="max-w-xl"><h2 className="text-xl font-bold mb-4">Profile</h2><div className="space-y-4"><div><label htmlFor="student-name" className="text-sm font-medium">Full name</label><Input id="student-name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1"/></div><div><label className="text-sm font-medium">Email</label><Input value={user?.email ?? ""} disabled className="mt-1"/></div><Button variant="sprint" onClick={() => void saveProfile()} disabled={savingProfile}>{savingProfile ? "Saving…" : "Save profile"}</Button></div></section>}
        </div>
      </main>
    </div>
  );
}
