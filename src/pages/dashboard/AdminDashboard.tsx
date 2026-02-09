import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users,
  DollarSign,
  BookOpen,
  BadgeCheck,
  Zap,
  LogOut,
  User,
  LayoutDashboard,
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  FileText,
  TrendingUp,
  BarChart3,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import AnalyticsCharts from "@/components/admin/AnalyticsCharts";
import {
  notifyVerificationApproved,
  notifyVerificationRejected,
  notifyWithdrawalApproved,
  notifyWithdrawalRejected,
} from "@/lib/notifications";

interface VerificationRequest {
  id: string;
  instructor_id: string;
  documents_url: string | null;
  status: string;
  requested_at: string;
  instructor: {
    id: string;
    full_name: string | null;
    email: string;
    bio: string | null;
  };
}

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: "student" | "instructor";
  is_verified_expert: boolean | null;
  created_at: string;
}

interface Course {
  id: string;
  title: string;
  price: number;
  is_published: boolean;
  created_at: string;
  instructor: {
    full_name: string | null;
    email: string;
  };
  _count?: {
    enrollments: number;
  };
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: string;
  requested_at: string;
  instructor: {
    full_name: string | null;
    email: string;
  };
}

export default function AdminDashboard() {
  const { user, profile, signOut } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "student" | "instructor">("all");
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);

  // Fetch platform stats
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [usersRes, coursesRes, enrollmentsRes, revenueRes] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("courses").select("*", { count: "exact", head: true }),
        supabase.from("enrollments").select("*", { count: "exact", head: true }),
        supabase.from("instructor_revenue").select("amount")
      ]);

      const totalRevenue = revenueRes.data?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

      return {
        totalUsers: usersRes.count || 0,
        totalCourses: coursesRes.count || 0,
        totalEnrollments: enrollmentsRes.count || 0,
        totalRevenue
      };
    }
  });

  // Fetch verification requests
  const { data: verificationRequests } = useQuery({
    queryKey: ["verification-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("verification_requests")
        .select(`
          *,
          instructor:profiles!verification_requests_instructor_id_fkey(id, full_name, email, bio)
        `)
        .order("requested_at", { ascending: false });

      if (error) throw error;
      return data as VerificationRequest[];
    }
  });

  // Fetch all users
  const { data: allUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["all-users", roleFilter],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (roleFilter !== "all") {
        query = query.eq("role", roleFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Profile[];
    }
  });

  // Fetch all courses
  const { data: allCourses } = useQuery({
    queryKey: ["all-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          instructor:profiles!courses_instructor_id_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get enrollment counts
      const coursesWithCounts = await Promise.all(
        (data || []).map(async (course) => {
          const { count } = await supabase
            .from("enrollments")
            .select("*", { count: "exact", head: true })
            .eq("course_id", course.id);

          return { ...course, _count: { enrollments: count || 0 } };
        })
      );

      return coursesWithCounts as Course[];
    }
  });

  // Fetch withdrawal requests
  const { data: withdrawalRequests } = useQuery({
    queryKey: ["withdrawal-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select(`
          *,
          instructor:profiles!withdrawal_requests_instructor_id_fkey(full_name, email)
        `)
        .order("requested_at", { ascending: false });

      if (error) throw error;
      return data as WithdrawalRequest[];
    }
  });

  // Approve verification mutation
  const approveVerificationMutation = useMutation({
    mutationFn: async (request: VerificationRequest) => {
      // Update verification request status
      const { error: requestError } = await supabase
        .from("verification_requests")
        .update({ 
          status: "approved",
          reviewed_at: new Date().toISOString()
        })
        .eq("id", request.id);

      if (requestError) throw requestError;

      // Update instructor profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ is_verified_expert: true })
        .eq("id", request.instructor_id);

      if (profileError) throw profileError;

      // Send email notification
      notifyVerificationApproved(
        request.instructor?.email,
        request.instructor?.full_name || undefined
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-requests"] });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      toast.success("Instructor verified successfully");
    },
    onError: () => {
      toast.error("Failed to verify instructor");
    }
  });

  // Reject verification mutation
  const rejectVerificationMutation = useMutation({
    mutationFn: async ({ requestId, email, name }: { requestId: string; email: string; name?: string }) => {
      const { error } = await supabase
        .from("verification_requests")
        .update({ 
          status: "rejected",
          reviewed_at: new Date().toISOString()
        })
        .eq("id", requestId);

      if (error) throw error;

      // Send email notification
      notifyVerificationRejected(email, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-requests"] });
      toast.success("Verification request rejected");
    }
  });

  // Process withdrawal mutation
  const processWithdrawalMutation = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      email, 
      name, 
      amount 
    }: { 
      id: string; 
      status: "approved" | "rejected"; 
      email: string; 
      name?: string; 
      amount: number;
    }) => {
      const { error } = await supabase
        .from("withdrawal_requests")
        .update({ 
          status,
          processed_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      // Send email notification
      if (status === "approved") {
        notifyWithdrawalApproved(email, name, amount);
      } else {
        notifyWithdrawalRejected(email, name, amount);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawal-requests"] });
      toast.success("Withdrawal request processed");
    }
  });

  const pendingVerifications = verificationRequests?.filter(r => r.status === "pending") || [];
  const pendingWithdrawals = withdrawalRequests?.filter(w => w.status === "pending") || [];

  // Filter users by search
  const filteredUsers = allUsers?.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

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

        <div className="px-6 py-3 bg-destructive/10 border-b border-sidebar-border">
          <div className="flex items-center gap-2 text-destructive">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Admin Panel</span>
          </div>
        </div>

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
            onClick={() => setActiveTab("verification")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "verification"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <BadgeCheck className="w-5 h-5" />
            Verification Queue
            {pendingVerifications.length > 0 && (
              <span className="ml-auto px-2 py-0.5 rounded-full bg-sprint text-sprint-foreground text-xs">
                {pendingVerifications.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "users"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <Users className="w-5 h-5" />
            Manage Users
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
            All Courses
          </button>
          <button
            onClick={() => setActiveTab("withdrawals")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "withdrawals"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <DollarSign className="w-5 h-5" />
            Withdrawals
            {pendingWithdrawals.length > 0 && (
              <span className="ml-auto px-2 py-0.5 rounded-full bg-warning text-warning-foreground text-xs">
                {pendingWithdrawals.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "analytics"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Analytics
          </button>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.full_name || "Admin"}
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
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">Platform governance and management</p>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <>
              {/* Stats */}
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stats?.totalUsers || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sprint/10 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-sprint" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stats?.totalCourses || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Courses</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        ${stats?.totalRevenue.toFixed(2) || "0.00"}
                      </p>
                      <p className="text-sm text-muted-foreground">Platform Revenue</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stats?.totalEnrollments || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Enrollments</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div 
                className="grid md:grid-cols-2 gap-6 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {/* Pending Verifications */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-card-foreground">Pending Verifications</h3>
                    <Badge variant={pendingVerifications.length > 0 ? "destructive" : "secondary"}>
                      {pendingVerifications.length}
                    </Badge>
                  </div>
                  {pendingVerifications.length > 0 ? (
                    <div className="space-y-3">
                      {pendingVerifications.slice(0, 3).map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium text-card-foreground">
                              {request.instructor?.full_name || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(request.requested_at)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="sprint"
                            onClick={() => setActiveTab("verification")}
                          >
                            Review
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No pending verifications</p>
                  )}
                </div>

                {/* Pending Withdrawals */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-card-foreground">Pending Withdrawals</h3>
                    <Badge variant={pendingWithdrawals.length > 0 ? "destructive" : "secondary"}>
                      {pendingWithdrawals.length}
                    </Badge>
                  </div>
                  {pendingWithdrawals.length > 0 ? (
                    <div className="space-y-3">
                      {pendingWithdrawals.slice(0, 3).map((withdrawal) => (
                        <div key={withdrawal.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium text-card-foreground">
                              ${Number(withdrawal.amount).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {withdrawal.instructor?.full_name}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="sprint"
                            onClick={() => setActiveTab("withdrawals")}
                          >
                            Process
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No pending withdrawals</p>
                  )}
                </div>
              </motion.div>

              {/* Recent Activity */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-xl font-bold text-foreground mb-4">Recent Users</h2>
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">User</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Role</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Joined</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {allUsers?.slice(0, 5).map((u) => (
                        <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div>
                                <span className="font-medium text-card-foreground block">
                                  {u.full_name || "No name"}
                                </span>
                                <span className="text-xs text-muted-foreground">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={u.role === "instructor" ? "default" : "secondary"}>
                              {u.role}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {formatDate(u.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            {u.is_verified_expert && (
                              <Badge className="bg-sprint/10 text-sprint">
                                <BadgeCheck className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.section>
            </>
          )}

          {/* Verification Tab */}
          {activeTab === "verification" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className="text-xl font-bold text-foreground mb-4">Verification Queue</h2>
              
              {verificationRequests && verificationRequests.length > 0 ? (
                <div className="space-y-4">
                  {verificationRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-card border border-border rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-card-foreground">
                                {request.instructor?.full_name || "Unknown"}
                              </p>
                              <Badge variant={
                                request.status === "pending" ? "secondary" :
                                request.status === "approved" ? "default" : "destructive"
                              }>
                                {request.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{request.instructor?.email}</p>
                            {request.instructor?.bio && (
                              <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                                {request.instructor.bio}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Requested: {formatDate(request.requested_at)}
                            </p>
                          </div>
                        </div>
                        
                        {request.status === "pending" && (
                          <div className="flex items-center gap-2">
                            {request.documents_url && (
                              <a
                                href={request.documents_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="outline" size="sm">
                                  <FileText className="w-4 h-4 mr-1" />
                                  Documents
                                </Button>
                              </a>
                            )}
                            <Button
                              variant="sprint"
                              size="sm"
                              onClick={() => approveVerificationMutation.mutate(request)}
                              disabled={approveVerificationMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => rejectVerificationMutation.mutate({
                                requestId: request.id,
                                email: request.instructor?.email,
                                name: request.instructor?.full_name || undefined
                              })}
                              disabled={rejectVerificationMutation.isPending}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted rounded-xl">
                  <BadgeCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No verification requests</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Manage Users</h2>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as "all" | "student" | "instructor")}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="student">Students</SelectItem>
                      <SelectItem value="instructor">Instructors</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sprint" />
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">User</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Role</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Joined</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredUsers?.map((u) => (
                        <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div>
                                <span className="font-medium text-card-foreground block">
                                  {u.full_name || "No name"}
                                </span>
                                <span className="text-xs text-muted-foreground">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={u.role === "instructor" ? "default" : "secondary"}>
                              {u.role}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {formatDate(u.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            {u.is_verified_expert && (
                              <Badge className="bg-sprint/10 text-sprint">
                                <BadgeCheck className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="icon">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* Courses Tab */}
          {activeTab === "courses" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className="text-xl font-bold text-foreground mb-4">All Courses</h2>
              
              {allCourses && allCourses.length > 0 ? (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Course</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Instructor</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Price</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Students</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {allCourses.map((course) => (
                        <tr key={course.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-medium text-card-foreground">{course.title}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {course.instructor?.full_name || course.instructor?.email}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-sprint">
                              {course.price > 0 ? `$${course.price}` : "Free"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {course._count?.enrollments || 0}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={course.is_published ? "default" : "secondary"}>
                              {course.is_published ? "Published" : "Draft"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {formatDate(course.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-muted rounded-xl">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No courses yet</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Withdrawals Tab */}
          {activeTab === "withdrawals" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className="text-xl font-bold text-foreground mb-4">Withdrawal Requests</h2>
              
              {withdrawalRequests && withdrawalRequests.length > 0 ? (
                <div className="space-y-4">
                  {withdrawalRequests.map((withdrawal) => (
                    <div
                      key={withdrawal.id}
                      className="bg-card border border-border rounded-xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          withdrawal.status === "pending"
                            ? "bg-warning/10"
                            : withdrawal.status === "approved"
                            ? "bg-success/10"
                            : "bg-destructive/10"
                        }`}>
                          {withdrawal.status === "pending" ? (
                            <Clock className="w-5 h-5 text-warning" />
                          ) : withdrawal.status === "approved" ? (
                            <CheckCircle className="w-5 h-5 text-success" />
                          ) : (
                            <XCircle className="w-5 h-5 text-destructive" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-card-foreground">
                            ${Number(withdrawal.amount).toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {withdrawal.instructor?.full_name} • {withdrawal.instructor?.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Requested: {formatDate(withdrawal.requested_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          withdrawal.status === "pending" ? "secondary" :
                          withdrawal.status === "approved" ? "default" : "destructive"
                        }>
                          {withdrawal.status}
                        </Badge>
                        
                        {withdrawal.status === "pending" && (
                          <>
                            <Button
                              variant="sprint"
                              size="sm"
                              onClick={() => processWithdrawalMutation.mutate({ 
                                id: withdrawal.id, 
                                status: "approved",
                                email: withdrawal.instructor?.email,
                                name: withdrawal.instructor?.full_name || undefined,
                                amount: Number(withdrawal.amount)
                              })}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => processWithdrawalMutation.mutate({ 
                                id: withdrawal.id, 
                                status: "rejected",
                                email: withdrawal.instructor?.email,
                                name: withdrawal.instructor?.full_name || undefined,
                                amount: Number(withdrawal.amount)
                              })}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted rounded-xl">
                  <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No withdrawal requests</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && <AnalyticsCharts />}
        </div>
      </main>
    </div>
  );
}