import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const getDashboardLink = () => {
    if (!profile) return "/dashboard/student";
    if (profile.role === "instructor") return "/dashboard/instructor";
    return "/dashboard/student";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-sprint flex items-center justify-center">
              <Zap className="w-5 h-5 text-sprint-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Skill<span className="text-sprint">Sprint</span>
            </span>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/courses" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Browse Courses
            </Link>
            <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to={getDashboardLink()}>
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => signOut()}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth?mode=login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button variant="sprint" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
