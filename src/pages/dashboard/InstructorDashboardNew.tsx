import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Zap,
  LogOut,
  LayoutDashboard,
  BookOpen,
  DollarSign,
  Users,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  FileCheck,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  BadgeCheck
} from "lucide-react";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number;
  is_published: boolean;
  is_practical: boolean;
  created_at: string;
  _count?: {
    enrollments: number;
  };
}

interface Submission {
  id: string;
  file_url: string;
  file_name: string | null;
  status: "pending" | "pass" | "fail";
  submitted_at: string;
  feedback: string | null;
  student: {
    full_name: string | null;
    email: string;
  };
  course: {
    title: string;
  };
}

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("courses");
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [feedback, setFeedback] = useState("");

  // Fetch instructor's courses
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["instructor-courses", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("instructor_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get enrollment counts
      const coursesWithCounts = await Promise.all(
        data.map(async (course) => {
          const { count } = await supabase
            .from("enrollments")
            .select("*", { count: "exact", head: true })
            .eq("course_id", course.id);

          return {
            ...course,
            _count: { enrollments: count || 0 }
          };
        })
      );

      return coursesWithCounts as Course[];
    },
    enabled: !!profile?.id
  });

  // Fetch practical submissions
  const { data: submissions } = useQuery({
    queryKey: ["practical-submissions", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      // First get instructor's practical courses
      const { data: courseIds } = await supabase
        .from("courses")
        .select("id")
        .eq("instructor_id", profile.id)
        .eq("is_practical", true);

      if (!courseIds || courseIds.length === 0) return [];

      const ids = courseIds.map(c => c.id);

      const { data, error } = await supabase
        .from("practical_submissions")
        .select(`
          *,
          student:profiles!practical_submissions_student_id_fkey(full_name, email),
          course:courses!practical_submissions_course_id_fkey(title)
        `)
        .in("course_id", ids)
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      return data as Submission[];
    },
    enabled: !!profile?.id
  });

  // Fetch revenue data
  const { data: revenueData } = useQuery({
    queryKey: ["instructor-revenue", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return { total: 0, pending: 0 };

      const { data, error } = await supabase
        .from("instructor_revenue")
        .select("amount")
        .eq("instructor_id", profile.id);

      if (error) throw error;

      const total = data.reduce((sum, r) => sum + Number(r.amount), 0);

      // Get pending withdrawals
      const { data: withdrawals } = await supabase
        .from("withdrawal_requests")
        .select("amount")
        .eq("instructor_id", profile.id)
        .eq("status", "pending");

      const pending = withdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;

      return { total, pending };
    },
    enabled: !!profile?.id
  });

  // Publish/unpublish course
  const togglePublishMutation = useMutation({
    mutationFn: async ({ courseId, isPublished }: { courseId: string; isPublished: boolean }) => {
      const { error } = await supabase
        .from("courses")
        .update({ is_published: !isPublished })
        .eq("id", courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      toast.success("Course updated");
    }
  });

  // Grade submission
  const gradeSubmissionMutation = useMutation({
    mutationFn: async ({ submissionId, status, feedback }: { 
      submissionId: string; 
      status: "pass" | "fail";
      feedback: string;
    }) => {
      const { error } = await supabase
        .from("practical_submissions")
        .update({ 
          status, 
          feedback,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", submissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["practical-submissions"] });
      setSelectedSubmission(null);
      setFeedback("");
      toast.success("Submission graded");
    }
  });

  const pendingSubmissions = submissions?.filter(s => s.status === "pending") || [];
  const totalStudents = courses?.reduce((sum, c) => sum + (c._count?.enrollments || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border hidden lg:flex flex-col">
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

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab("courses")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "courses"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            My Courses
          </button>
          <button
            onClick={() => setActiveTab("submissions")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "submissions"
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
            Revenue Hub
          </button>
        </nav>

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
                  <BadgeCheck className="w-4 h-4 text-sprint" />
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
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Instructor Dashboard</h1>
              <p className="text-muted-foreground">Manage your courses and students</p>
            </div>
            <Button variant="sprint" onClick={() => navigate("/dashboard/instructor/create")}>
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
          >
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-sprint/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-sprint" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{courses?.length || 0}</p>
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
                  <p className="text-2xl font-bold text-foreground">{totalStudents}</p>
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
                  <p className="text-2xl font-bold text-foreground">${revenueData?.total.toFixed(2) || "0.00"}</p>
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

          {/* Courses Tab */}
          {activeTab === "courses" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className="text-xl font-bold text-foreground mb-4">My Courses</h2>
              
              {coursesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sprint" />
                </div>
              ) : courses && courses.length > 0 ? (
                <div className="grid gap-4">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
                    >
                      <img
                        src={course.thumbnail_url || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=100&h=60&fit=crop"}
                        alt={course.title}
                        className="w-24 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-card-foreground">{course.title}</h3>
                          <Badge variant={course.is_published ? "default" : "secondary"}>
                            {course.is_published ? "Published" : "Draft"}
                          </Badge>
                          {course.is_practical && (
                            <Badge variant="outline">Practical</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {course._count?.enrollments || 0} students • ${course.price || "Free"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePublishMutation.mutate({ 
                            courseId: course.id, 
                            isPublished: course.is_published 
                          })}
                        >
                          {course.is_published ? "Unpublish" : "Publish"}
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted rounded-xl">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No courses yet</p>
                  <Button variant="sprint" onClick={() => navigate("/dashboard/instructor/create")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Course
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Submissions Tab */}
          {activeTab === "submissions" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className="text-xl font-bold text-foreground mb-4">Grading Queue</h2>
              
              {submissions && submissions.length > 0 ? (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        submission.status === "pending"
                          ? "bg-warning/10"
                          : submission.status === "pass"
                          ? "bg-success/10"
                          : "bg-destructive/10"
                      }`}>
                        {submission.status === "pending" ? (
                          <Clock className="w-5 h-5 text-warning" />
                        ) : submission.status === "pass" ? (
                          <CheckCircle className="w-5 h-5 text-success" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-card-foreground">
                          {submission.student?.full_name || submission.student?.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {submission.course?.title} • {submission.file_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={submission.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sprint hover:underline"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        {submission.status === "pending" && (
                          <Button
                            variant="sprint"
                            size="sm"
                            onClick={() => setSelectedSubmission(submission)}
                          >
                            Grade
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted rounded-xl">
                  <FileCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No submissions to review</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Revenue Tab */}
          {activeTab === "revenue" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-bold text-foreground mb-4">Revenue Hub</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">Balance</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Earnings</span>
                      <span className="font-bold text-foreground">${revenueData?.total.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pending Withdrawal</span>
                      <span className="font-medium text-warning">${revenueData?.pending.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between pt-4 border-t border-border">
                      <span className="text-muted-foreground">Available</span>
                      <span className="font-bold text-success">
                        ${((revenueData?.total || 0) - (revenueData?.pending || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <Button variant="sprint" className="w-full mt-6">
                    Request Withdrawal
                  </Button>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">Quick Stats</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">This Month</span>
                      <span className="font-bold text-foreground">$0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Month</span>
                      <span className="font-medium text-foreground">$0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average per Course</span>
                      <span className="font-medium text-foreground">
                        ${courses && courses.length > 0 
                          ? ((revenueData?.total || 0) / courses.length).toFixed(2) 
                          : "0.00"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Grading Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogDescription>
              Review the student's work and provide feedback
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Student</p>
                <p className="font-medium">{selectedSubmission.student?.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Course</p>
                <p className="font-medium">{selectedSubmission.course?.title}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Feedback</p>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide constructive feedback..."
                  rows={4}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => gradeSubmissionMutation.mutate({
                    submissionId: selectedSubmission.id,
                    status: "fail",
                    feedback
                  })}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Fail
                </Button>
                <Button
                  variant="sprint"
                  className="flex-1"
                  onClick={() => gradeSubmissionMutation.mutate({
                    submissionId: selectedSubmission.id,
                    status: "pass",
                    feedback
                  })}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Pass
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
