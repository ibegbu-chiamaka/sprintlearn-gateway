import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Courses from "./pages/Courses";
import Settings from "./pages/Settings";
import StudentDashboard from "./pages/dashboard/StudentDashboard";
import InstructorDashboard from "./pages/dashboard/InstructorDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import CoursePlayer from "./components/course/CoursePlayer";
import CourseBuilderWizard from "./components/course/CourseBuilderWizard";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/courses" element={<Courses />} />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute allowedRoles={["student", "instructor"]}>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            
            {/* Course Player */}
            <Route 
              path="/course/:courseId" 
              element={
                <ProtectedRoute allowedRoles={["student", "instructor"]}>
                  <CoursePlayer />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected Student Routes */}
            <Route 
              path="/dashboard/student/*" 
              element={
                <ProtectedRoute allowedRoles={["student", "instructor"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected Instructor Routes */}
            <Route 
              path="/dashboard/instructor" 
              element={
                <ProtectedRoute allowedRoles={["instructor"]}>
                  <InstructorDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Course Builder */}
            <Route 
              path="/dashboard/instructor/create" 
              element={
                <ProtectedRoute allowedRoles={["instructor"]}>
                  <CourseBuilderWizard />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected Admin Routes */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
