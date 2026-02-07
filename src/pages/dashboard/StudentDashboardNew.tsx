import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  Star
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number;
  instructor: {
    full_name: string | null;
  };
}

interface Enrollment {
  id: string;
  course_id: string;
  completed_at: string | null;
  course: Course & {
    modules: {
      id: string;
      sessions: { id: string }[];
    }[];
  };
}

export default function StudentDashboard() {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("my-courses");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch enrollments with course details
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["enrollments", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          *,
          course:courses(
            *,
            instructor:profiles!courses_instructor_id_fkey(full_name),
            modules(id, sessions(id))
          )
        `)
        .eq("user_id", profile.id);

      if (error) throw error;
      return data as Enrollment[];
    },
    enabled: !!profile?.id
  });

  // Fetch user progress
  const { data: userProgress } = useQuery({
    queryKey: ["user-progress", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", profile.id);

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  // Fetch available courses for marketplace
  const { data: availableCourses } = useQuery({
    queryKey: ["available-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          instructor:profiles!courses_instructor_id_fkey(full_name)
        `)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Course[];
    }
  });

  // Calculate progress for a course
  const getCourseProgress = (enrollment: Enrollment): number => {
    const totalSessions = enrollment.course.modules?.reduce(
      (acc, m) => acc + (m.sessions?.length || 0), 0
    ) || 0;

    if (totalSessions === 0) return 0;

    const sessionIds = enrollment.course.modules?.flatMap(
      m => m.sessions?.map(s => s.id) || []
    ) || [];

    const completedSessions = userProgress?.filter(
      p => sessionIds.includes(p.session_id) && p.completed
    ).length || 0;

    return Math.round((completedSessions / totalSessions) * 100);
  };

  // Get completed courses count
  const completedCoursesCount = enrollments?.filter(
    e => getCourseProgress(e) === 100
  ).length || 0;

  // Filter courses not enrolled
  const enrolledCourseIds = enrollments?.map(e => e.course_id) || [];
  const recommendedCourses = availableCourses?.filter(
    c => !enrolledCourseIds.includes(c.id)
  ).slice(0, 4);

  // Search filter
  const filteredCourses = recommendedCourses?.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                  <p className="text-2xl font-bold text-foreground">{enrollments?.length || 0}</p>
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
                  <p className="text-2xl font-bold text-foreground">
                    {userProgress?.filter(p => p.completed).length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Sessions Completed</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Award className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{completedCoursesCount}</p>
                  <p className="text-sm text-muted-foreground">Certificates Earned</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Enrolled Courses */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Continue Learning</h2>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {enrollmentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sprint" />
              </div>
            ) : enrollments && enrollments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollments.map((enrollment) => {
                  const progress = getCourseProgress(enrollment);
                  const totalSessions = enrollment.course.modules?.reduce(
                    (acc, m) => acc + (m.sessions?.length || 0), 0
                  ) || 0;
                  const completedSessions = Math.round((progress / 100) * totalSessions);

                  return (
                    <motion.div
                      key={enrollment.id}
                      className="bg-card border border-border rounded-xl overflow-hidden card-hover"
                      whileHover={{ y: -4 }}
                    >
                      <Link to={`/course/${enrollment.course_id}`}>
                        <div className="relative aspect-video">
                          <img
                            src={enrollment.course.thumbnail_url || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop"}
                            alt={enrollment.course.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <div className="w-14 h-14 rounded-full bg-sprint flex items-center justify-center glow-sprint">
                              <Play className="w-6 h-6 text-sprint-foreground ml-1" />
                            </div>
                          </div>
                          {progress === 100 && (
                            <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-success text-success-foreground text-xs font-medium">
                              Completed
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-card-foreground mb-1 line-clamp-1">
                            {enrollment.course.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            {enrollment.course.instructor?.full_name || "Instructor"}
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {completedSessions}/{totalSessions} sessions
                              </span>
                              <span className="font-medium text-sprint">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted rounded-xl">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No courses enrolled yet</p>
                <Button
                  variant="sprint"
                  size="sm"
                  className="mt-4"
                  onClick={() => setActiveTab("browse")}
                >
                  Browse Courses
                </Button>
              </div>
            )}
          </motion.section>

          {/* Recommended Courses */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Recommended for You</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground"
                onClick={() => setActiveTab("browse")}
              >
                Browse All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {filteredCourses && filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted rounded-xl">
                <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No recommendations available</p>
              </div>
            )}
          </motion.section>
        </div>
      </main>
    </div>
  );
}

// Course card component for marketplace
function CourseCard({ course }: { course: Course }) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("enrollments")
        .insert({
          course_id: course.id,
          user_id: profile.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["available-courses"] });
    }
  });

  return (
    <motion.div
      className="bg-card border border-border rounded-xl overflow-hidden card-hover flex"
      whileHover={{ y: -4 }}
    >
      <div className="w-48 flex-shrink-0">
        <img
          src={course.thumbnail_url || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop"}
          alt={course.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          <h3 className="font-semibold text-card-foreground mb-1">
            {course.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-2">
            {course.instructor?.full_name || "Instructor"}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </p>
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-lg font-bold text-sprint">
            {course.price > 0 ? `$${course.price}` : "Free"}
          </span>
          <Button
            variant="sprint"
            size="sm"
            onClick={() => enrollMutation.mutate()}
            disabled={enrollMutation.isPending}
          >
            {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
