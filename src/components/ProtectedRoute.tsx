import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ("student" | "instructor")[];
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles, 
  requireAdmin = false 
}: ProtectedRouteProps) {
  const { user, profile, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-sprint" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/auth?mode=login" replace />;
  }

  // Require admin role
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard/student" replace />;
  }

  // Check role access
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    const redirectPath = profile.role === "instructor" 
      ? "/dashboard/instructor" 
      : "/dashboard/student";
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
