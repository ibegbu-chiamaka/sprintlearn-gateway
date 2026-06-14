import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import About from "./pages/About";
import Pricing from "./pages/Pricing";
import Courses from "./pages/Courses";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import StudentDashboard from "./pages/dashboard/StudentDashboard";
import InstructorDashboard from "./pages/dashboard/InstructorDashboard";
import InstructorCourseDetails from "./pages/dashboard/InstructorCourseDetails";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
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
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/about" element={<About />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/cookies" element={<Cookies />} />
            
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
            <Route
              path="/dashboard/instructor/courses/:courseId"
              element={
                <ProtectedRoute allowedRoles={["instructor"]}>
                  <InstructorCourseDetails />
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
