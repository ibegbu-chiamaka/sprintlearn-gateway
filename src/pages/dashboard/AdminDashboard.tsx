import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  Users,
  DollarSign,
  BookOpen,
  BadgeCheck,
  TrendingUp,
  ChevronRight,
  Zap,
  LogOut,
  User,
  LayoutDashboard,
  Shield,
  Settings,
  CheckCircle,
  XCircle,
  Eye
} from "lucide-react";

// Mock data for demo
const verificationQueue = [
  {
    id: "1",
    name: "Dr. Sarah Mitchell",
    email: "sarah.mitchell@example.com",
    specialization: "Machine Learning",
    coursesCreated: 3,
    requestedAt: "2 days ago"
  },
  {
    id: "2",
    name: "Prof. James Chen",
    email: "james.chen@example.com",
    specialization: "Cloud Architecture",
    coursesCreated: 5,
    requestedAt: "3 days ago"
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    email: "emily.r@example.com",
    specialization: "UX Design",
    coursesCreated: 2,
    requestedAt: "1 week ago"
  }
];

const recentUsers = [
  { id: "1", name: "Alice Johnson", role: "student", joined: "1 hour ago" },
  { id: "2", name: "Bob Williams", role: "instructor", joined: "3 hours ago" },
  { id: "3", name: "Carol Davis", role: "student", joined: "5 hours ago" },
  { id: "4", name: "David Lee", role: "student", joined: "1 day ago" },
  { id: "5", name: "Eva Martinez", role: "instructor", joined: "2 days ago" }
];

export default function AdminDashboard() {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

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

        {/* Admin Badge */}
        <div className="px-6 py-3 bg-destructive/10 border-b border-sidebar-border">
          <div className="flex items-center gap-2 text-destructive">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Admin Panel</span>
          </div>
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
            onClick={() => setActiveTab("verification")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "verification"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <BadgeCheck className="w-5 h-5" />
            Verification Queue
            {verificationQueue.length > 0 && (
              <span className="ml-auto px-2 py-0.5 rounded-full bg-sprint text-sprint-foreground text-xs">
                {verificationQueue.length}
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
            onClick={() => setActiveTab("revenue")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "revenue"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <DollarSign className="w-5 h-5" />
            Platform Revenue
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "settings"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </nav>

        {/* User section */}
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
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">Platform governance and management</p>
            </div>
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
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">12,456</p>
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
                  <p className="text-2xl font-bold text-foreground">543</p>
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
                  <p className="text-2xl font-bold text-foreground">$1.2M</p>
                  <p className="text-sm text-muted-foreground">Platform Revenue</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <BadgeCheck className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{verificationQueue.length}</p>
                  <p className="text-sm text-muted-foreground">Pending Verifications</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Verification Queue */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Verification Queue</h2>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="divide-y divide-border">
                {verificationQueue.map((instructor) => (
                  <div key={instructor.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">{instructor.name}</p>
                        <p className="text-sm text-muted-foreground">{instructor.specialization}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {instructor.coursesCreated} courses created • Requested {instructor.requestedAt}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                      <Button variant="sprint" size="sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button variant="destructive" size="sm">
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Recent Users */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Recent Users</h2>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">User</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Role</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Joined</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <span className="font-medium text-card-foreground">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === "instructor" 
                            ? "bg-sprint/10 text-sprint" 
                            : "bg-primary/10 text-primary"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.joined}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
}
