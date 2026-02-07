import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Lock, 
  CheckCircle, 
  ChevronRight, 
  ChevronDown,
  ArrowLeft,
  BookOpen,
  Award
} from "lucide-react";
import ModuleSidebar from "./ModuleSidebar";
import VideoPlayer from "./VideoPlayer";
import QuizModal from "./QuizModal";
import PracticalUpload from "./PracticalUpload";
import CertificateGenerator from "./CertificateGenerator";

interface Session {
  id: string;
  title: string;
  video_url: string | null;
  order_index: number;
  duration_minutes: number | null;
  module_id: string;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  course_id: string;
  sessions: Session[];
  quiz?: {
    id: string;
    title: string;
    passing_score: number;
  };
}

interface CourseWithDetails {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  instructor_id: string;
  is_practical: boolean;
  modules: Module[];
  instructor: {
    full_name: string | null;
  };
}

export default function CoursePlayer() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  // Fetch course with all details
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select(`
          *,
          instructor:profiles!courses_instructor_id_fkey(full_name)
        `)
        .eq("id", courseId)
        .single();

      if (courseError) throw courseError;

      // Fetch modules
      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index");

      if (modulesError) throw modulesError;

      // Fetch sessions for all modules
      const moduleIds = modulesData.map(m => m.id);
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessions")
        .select("*")
        .in("module_id", moduleIds)
        .order("order_index");

      if (sessionsError) throw sessionsError;

      // Fetch quizzes for all modules
      const { data: quizzesData, error: quizzesError } = await supabase
        .from("quizzes")
        .select("*")
        .in("module_id", moduleIds);

      if (quizzesError) throw quizzesError;

      // Combine data
      const modules = modulesData.map(module => ({
        ...module,
        sessions: sessionsData.filter(s => s.module_id === module.id),
        quiz: quizzesData.find(q => q.module_id === module.id)
      }));

      return {
        ...courseData,
        modules
      } as CourseWithDetails;
    },
    enabled: !!courseId
  });

  // Fetch user progress
  const { data: userProgress } = useQuery({
    queryKey: ["user-progress", courseId, profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", profile.id);

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id && !!courseId
  });

  // Fetch quiz attempts
  const { data: quizAttempts } = useQuery({
    queryKey: ["quiz-attempts", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("user_id", profile.id);

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  // Mark session complete mutation
  const markCompleteMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      if (!profile?.id) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("user_progress")
        .upsert({
          user_id: profile.id,
          session_id: sessionId,
          completed: true,
          completed_at: new Date().toISOString()
        }, {
          onConflict: "user_id,session_id"
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-progress"] });
    }
  });

  // Check if session is accessible (previous sessions completed)
  const isSessionAccessible = (session: Session, module: Module): boolean => {
    if (!course || !userProgress) return false;

    // First session of first module is always accessible
    const moduleIndex = course.modules.findIndex(m => m.id === module.id);
    const sessionIndex = module.sessions.findIndex(s => s.id === session.id);

    if (moduleIndex === 0 && sessionIndex === 0) return true;

    // Check if previous session in same module is completed
    if (sessionIndex > 0) {
      const prevSession = module.sessions[sessionIndex - 1];
      const prevCompleted = userProgress.some(
        p => p.session_id === prevSession.id && p.completed
      );
      return prevCompleted;
    }

    // First session of a new module - check if previous module quiz passed
    if (moduleIndex > 0) {
      const prevModule = course.modules[moduleIndex - 1];
      
      // Check all sessions in previous module completed
      const allPrevSessionsCompleted = prevModule.sessions.every(s =>
        userProgress.some(p => p.session_id === s.id && p.completed)
      );

      if (!allPrevSessionsCompleted) return false;

      // Check if quiz passed (if exists)
      if (prevModule.quiz) {
        const quizPassed = quizAttempts?.some(
          a => a.quiz_id === prevModule.quiz!.id && a.passed
        );
        return !!quizPassed;
      }

      return true;
    }

    return false;
  };

  // Check if module is accessible
  const isModuleAccessible = (module: Module): boolean => {
    if (!course) return false;
    const moduleIndex = course.modules.findIndex(m => m.id === module.id);
    if (moduleIndex === 0) return true;

    const prevModule = course.modules[moduleIndex - 1];
    
    // All sessions must be completed
    const allSessionsCompleted = prevModule.sessions.every(s =>
      userProgress?.some(p => p.session_id === s.id && p.completed)
    );

    if (!allSessionsCompleted) return false;

    // Quiz must be passed (if exists)
    if (prevModule.quiz) {
      return !!quizAttempts?.some(a => a.quiz_id === prevModule.quiz!.id && a.passed);
    }

    return true;
  };

  // Check if session is completed
  const isSessionCompleted = (sessionId: string): boolean => {
    return userProgress?.some(p => p.session_id === sessionId && p.completed) ?? false;
  };

  // Calculate overall progress
  const calculateProgress = (): number => {
    if (!course || !userProgress) return 0;
    
    const totalSessions = course.modules.reduce(
      (acc, m) => acc + m.sessions.length, 0
    );
    
    const completedSessions = userProgress.filter(p => p.completed).length;
    
    return totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
  };

  // Check if course is fully completed
  const isCourseCompleted = (): boolean => {
    if (!course || !userProgress) return false;

    // All sessions completed
    const allSessionsCompleted = course.modules.every(m =>
      m.sessions.every(s => isSessionCompleted(s.id))
    );

    // All quizzes passed
    const allQuizzesPassed = course.modules.every(m => {
      if (!m.quiz) return true;
      return quizAttempts?.some(a => a.quiz_id === m.quiz!.id && a.passed);
    });

    return allSessionsCompleted && allQuizzesPassed;
  };

  // Set initial session
  useEffect(() => {
    if (course && course.modules.length > 0 && !currentSession) {
      const firstModule = course.modules[0];
      if (firstModule.sessions.length > 0) {
        setCurrentModule(firstModule);
        setCurrentSession(firstModule.sessions[0]);
      }
    }
  }, [course]);

  const handleSessionSelect = (session: Session, module: Module) => {
    if (isSessionAccessible(session, module)) {
      setCurrentSession(session);
      setCurrentModule(module);
    }
  };

  const handleSessionComplete = () => {
    if (!currentSession || !currentModule || !course) return;

    markCompleteMutation.mutate(currentSession.id);

    // Check if this was the last session of the module
    const sessionIndex = currentModule.sessions.findIndex(
      s => s.id === currentSession.id
    );

    if (sessionIndex === currentModule.sessions.length - 1) {
      // Last session - show quiz if exists
      if (currentModule.quiz) {
        setShowQuiz(true);
      } else {
        // Move to next module
        const moduleIndex = course.modules.findIndex(
          m => m.id === currentModule.id
        );
        if (moduleIndex < course.modules.length - 1) {
          const nextModule = course.modules[moduleIndex + 1];
          setCurrentModule(nextModule);
          setCurrentSession(nextModule.sessions[0]);
        }
      }
    } else {
      // Move to next session
      const nextSession = currentModule.sessions[sessionIndex + 1];
      setCurrentSession(nextSession);
    }
  };

  const handleQuizComplete = (passed: boolean) => {
    setShowQuiz(false);
    
    if (passed && course && currentModule) {
      const moduleIndex = course.modules.findIndex(m => m.id === currentModule.id);
      
      if (moduleIndex < course.modules.length - 1) {
        // Move to next module
        const nextModule = course.modules[moduleIndex + 1];
        setCurrentModule(nextModule);
        setCurrentSession(nextModule.sessions[0]);
      } else if (isCourseCompleted()) {
        // Course complete - show certificate
        setShowCertificate(true);
      }
    }
  };

  if (courseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sprint" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <ModuleSidebar
        course={course}
        currentSession={currentSession}
        currentModule={currentModule}
        userProgress={userProgress || []}
        quizAttempts={quizAttempts || []}
        onSessionSelect={handleSessionSelect}
        isSessionAccessible={isSessionAccessible}
        isModuleAccessible={isModuleAccessible}
        isSessionCompleted={isSessionCompleted}
        progress={progress}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard/student")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground line-clamp-1">
                  {course.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {currentModule?.title} - {currentSession?.title}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{progress}% Complete</p>
                <Progress value={progress} className="w-32 h-2" />
              </div>
              {isCourseCompleted() && (
                <Button
                  variant="sprint"
                  size="sm"
                  onClick={() => setShowCertificate(true)}
                >
                  <Award className="w-4 h-4 mr-2" />
                  Get Certificate
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Video Player */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSession?.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentSession && (
                <VideoPlayer
                  session={currentSession}
                  isCompleted={isSessionCompleted(currentSession.id)}
                  onComplete={handleSessionComplete}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Practical Upload (for last module of practical courses) */}
          {course.is_practical && 
           currentModule?.id === course.modules[course.modules.length - 1]?.id &&
           isCourseCompleted() && (
            <PracticalUpload courseId={course.id} />
          )}
        </div>
      </main>

      {/* Quiz Modal */}
      {showQuiz && currentModule?.quiz && (
        <QuizModal
          quiz={currentModule.quiz}
          onComplete={handleQuizComplete}
          onClose={() => setShowQuiz(false)}
        />
      )}

      {/* Certificate Modal */}
      {showCertificate && (
        <CertificateGenerator
          course={course}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  );
}
