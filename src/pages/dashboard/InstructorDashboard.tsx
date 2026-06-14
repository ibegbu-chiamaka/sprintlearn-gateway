import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  Plus,
  DollarSign,
  Users,
  FileCheck,
  ChevronRight,
  Zap,
  LogOut,
  User,
  LayoutDashboard,
  BadgeCheck,
  Download,
  CheckCircle,
  XCircle
} from "lucide-react";

// Mock data for demo
const initialCourses = [
  {
    id: "1",
    title: "Complete React Developer Course",
    students: 1234,
    revenue: 4520.50,
    status: "published",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop"
  },
  {
    id: "2", 
    title: "TypeScript Masterclass",
    students: 856,
    revenue: 2890.00,
    status: "published",
    thumbnail: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=225&fit=crop"
  },
  {
    id: "3",
    title: "Advanced Node.js Patterns",
    students: 0,
    revenue: 0,
    status: "draft",
    thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=225&fit=crop"
  }
];

const initialSubmissions = [
  {
    id: "1",
    studentName: "Alice Johnson",
    courseName: "Complete React Developer Course",
    submittedAt: "2 hours ago",
    fileName: "final-project.zip"
  },
  {
    id: "2",
    studentName: "Bob Williams",
    courseName: "Complete React Developer Course",
    submittedAt: "5 hours ago",
    fileName: "react-portfolio.zip"
  },
  {
    id: "3",
    studentName: "Carol Davis",
    courseName: "TypeScript Masterclass",
    submittedAt: "1 day ago",
    fileName: "typescript-app.zip"
  }
];

export default function InstructorDashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [myCourses] = useState(initialCourses);
  const [pendingSubmissions, setPendingSubmissions] = useState(initialSubmissions);

  const totalRevenue = myCourses.reduce((sum, c) => sum + c.revenue, 0);
  const totalStudents = myCourses.reduce((sum, c) => sum + c.students, 0);

  const handleDownload = (submission: typeof initialSubmissions[number]) => {
    // Simulate a file download
    const blob = new Blob(
      [`Submission from ${submission.studentName}\nCourse: ${submission.courseName}\nFile: ${submission.fileName}`],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = submission.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Download started", description: submission.fileName });
  };

  const handleGrade = (id: string, result: "pass" | "fail") => {
    const sub = pendingSubmissions.find((s) => s.id === id);
    setPendingSubmissions((prev) => prev.filter((s) => s.id !== id));
    toast({
      title: result === "pass" ? "Submission passed" : "Submission failed",
      description: sub ? `${sub.studentName} — ${sub.courseName}` : undefined,
    });
  };

  const visibleCourses = activeTab === "courses" ? myCourses : myCourses.slice(0, 3);
  const visibleSubmissions = activeTab === "grading" ? pendingSubmissions : pendingSubmissions.slice(0, 3);
  const showCourses = activeTab === "overview" || activeTab === "courses";
  const showGrading = activeTab === "overview" || activeTab === "grading";

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
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "overview"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab("courses")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "courses"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <BookOpen className="w-5 h-5" />
            My Courses
          </button>
          <button
            onClick={() => setActiveTab("grading")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "grading"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <FileCheck className="w-5 h-5" />
            Grading Queue
            {pendingSubmissions.length > 0 && (
              <span className="ml-auto px-2 py-0.5 rounded-full bg-sprint text-sprint-foreground text-xs">
                {pendingSubmissions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("revenue")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "revenue"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <DollarSign className="w-5 h-5" />
            Revenue
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
              <BookOpen className="w-5 h-5 text-sidebar-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {profile?.full_name || "Instructor"}
                </p>
                {profile?.is_verified_expert && (
                  <BadgeCheck className="w-4 h-4 text-sprint flex-shrink-0" />
                )}
              </div>
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
                Instructor Dashboard
              </h1>
              <p className="text-muted-foreground">Manage your courses and track your success</p>
            </div>
            <Button
              variant="sprint"
              onClick={() => navigate("/dashboard/instructor/courses/new")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Button>
          </div>
        </header>

        <div className="p-6">
          {/* Stats */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
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
                  <p className="text-2xl font-bold text-foreground">{myCourses.length}</p>
                  <p className="text-sm text-muted-foreground">Total Courses</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalStudents.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">${totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <FileCheck className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{pendingSubmissions.length}</p>
                  <p className="text-sm text-muted-foreground">Pending Reviews</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* My Courses */}
          {showCourses && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">My Courses</h2>
                {activeTab !== "courses" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => setActiveTab("courses")}
                  >
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleCourses.map((course) => (
                  <motion.div key={course.id} whileHover={{ y: -4 }}>
                    <Link
                      to={`/dashboard/instructor/courses/${course.id}`}
                      className="block bg-card border border-border rounded-xl overflow-hidden card-hover focus:outline-none focus:ring-2 focus:ring-sprint"
                    >
                      <div className="relative aspect-video">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
                          course.status === "published" 
                            ? "bg-success text-success-foreground" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {course.status === "published" ? "Published" : "Draft"}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-card-foreground mb-3 line-clamp-1">
                          {course.title}
                        </h3>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            {course.students.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1 text-success font-medium">
                            <DollarSign className="w-4 h-4" />
                            {course.revenue.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Grading Queue */}
          {showGrading && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Grading Queue</h2>
                {activeTab !== "grading" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => setActiveTab("grading")}
                  >
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>

              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {visibleSubmissions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No pending submissions. You're all caught up! 🎉
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {visibleSubmissions.map((submission) => (
                      <div key={submission.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-card-foreground">{submission.studentName}</p>
                            <p className="text-sm text-muted-foreground">{submission.courseName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">{submission.submittedAt}</p>
                            <p className="text-xs text-muted-foreground">{submission.fileName}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(submission)}
                              aria-label="Download submission"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="sprint"
                              size="sm"
                              onClick={() => handleGrade(submission.id, "pass")}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Pass
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleGrade(submission.id, "fail")}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Fail
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.section>
          )}

          {activeTab === "revenue" && (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
              Revenue breakdown coming soon.
            </div>
          )}

          {activeTab === "profile" && (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
              Profile settings coming soon.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
