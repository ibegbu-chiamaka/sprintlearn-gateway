import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Lock, 
  CheckCircle, 
  ChevronRight, 
  ChevronDown,
  Zap,
  BookOpen,
  HelpCircle
} from "lucide-react";

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

interface Course {
  id: string;
  title: string;
  modules: Module[];
}

interface UserProgress {
  id: string;
  user_id: string;
  session_id: string;
  completed: boolean;
}

interface QuizAttempt {
  id: string;
  quiz_id: string;
  passed: boolean;
}

interface ModuleSidebarProps {
  course: Course;
  currentSession: Session | null;
  currentModule: Module | null;
  userProgress: UserProgress[];
  quizAttempts: QuizAttempt[];
  onSessionSelect: (session: Session, module: Module) => void;
  isSessionAccessible: (session: Session, module: Module) => boolean;
  isModuleAccessible: (module: Module) => boolean;
  isSessionCompleted: (sessionId: string) => boolean;
  progress: number;
}

export default function ModuleSidebar({
  course,
  currentSession,
  currentModule,
  userProgress,
  quizAttempts,
  onSessionSelect,
  isSessionAccessible,
  isModuleAccessible,
  isSessionCompleted,
  progress
}: ModuleSidebarProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set([currentModule?.id || course.modules[0]?.id])
  );

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const isQuizPassed = (quizId: string): boolean => {
    return quizAttempts.some(a => a.quiz_id === quizId && a.passed);
  };

  const getModuleProgress = (module: Module): number => {
    const completed = module.sessions.filter(s => isSessionCompleted(s.id)).length;
    return module.sessions.length > 0 
      ? Math.round((completed / module.sessions.length) * 100) 
      : 0;
  };

  return (
    <aside className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-sprint flex items-center justify-center">
            <Zap className="w-5 h-5 text-sprint-foreground" />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground">
            Skill<span className="text-sprint">Sprint</span>
          </span>
        </Link>
      </div>

      {/* Course Progress */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-sidebar-foreground">Course Progress</span>
          <span className="text-sm font-medium text-sprint">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Modules List */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {course.modules.map((module, moduleIndex) => {
          const isExpanded = expandedModules.has(module.id);
          const isAccessible = isModuleAccessible(module);
          const moduleProgress = getModuleProgress(module);
          const isComplete = moduleProgress === 100;

          return (
            <div key={module.id} className="space-y-1">
              {/* Module Header */}
              <button
                onClick={() => isAccessible && toggleModule(module.id)}
                disabled={!isAccessible}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  isAccessible
                    ? "hover:bg-sidebar-accent cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                } ${
                  currentModule?.id === module.id
                    ? "bg-sidebar-accent"
                    : ""
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isComplete
                    ? "bg-success text-success-foreground"
                    : isAccessible
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "bg-sidebar-border text-sidebar-foreground/50"
                }`}>
                  {!isAccessible ? (
                    <Lock className="w-4 h-4" />
                  ) : isComplete ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-medium">{moduleIndex + 1}</span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-medium line-clamp-1 ${
                    isAccessible ? "text-sidebar-foreground" : "text-sidebar-foreground/50"
                  }`}>
                    {module.title}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60">
                    {module.sessions.length} sessions
                    {module.quiz && " • Quiz"}
                  </p>
                </div>
                {isAccessible && (
                  <ChevronRight 
                    className={`w-4 h-4 text-sidebar-foreground/50 transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                )}
              </button>

              {/* Sessions List */}
              <AnimatePresence>
                {isExpanded && isAccessible && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pl-4 space-y-1">
                      {module.sessions.map((session) => {
                        const isActive = currentSession?.id === session.id;
                        const isCompleted = isSessionCompleted(session.id);
                        const isLocked = !isSessionAccessible(session, module);

                        return (
                          <button
                            key={session.id}
                            onClick={() => onSessionSelect(session, module)}
                            disabled={isLocked}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                              isActive
                                ? "bg-sprint/20 text-sprint"
                                : isLocked
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-sidebar-accent/50"
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isCompleted
                                ? "bg-success text-success-foreground"
                                : isActive
                                ? "bg-sprint text-sprint-foreground"
                                : isLocked
                                ? "bg-sidebar-border"
                                : "bg-sidebar-accent"
                            }`}>
                              {isLocked ? (
                                <Lock className="w-3 h-3" />
                              ) : isCompleted ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <Play className="w-3 h-3" />
                              )}
                            </div>
                            <span className={`text-sm flex-1 text-left line-clamp-1 ${
                              isActive
                                ? "text-sprint font-medium"
                                : isLocked
                                ? "text-sidebar-foreground/50"
                                : "text-sidebar-foreground"
                            }`}>
                              {session.title}
                            </span>
                            {session.duration_minutes && (
                              <span className="text-xs text-sidebar-foreground/50">
                                {session.duration_minutes}m
                              </span>
                            )}
                          </button>
                        );
                      })}

                      {/* Quiz indicator */}
                      {module.quiz && (
                        <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                          isQuizPassed(module.quiz.id)
                            ? "bg-success/10"
                            : "bg-sidebar-accent/30"
                        }`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isQuizPassed(module.quiz.id)
                              ? "bg-success text-success-foreground"
                              : "bg-warning text-warning-foreground"
                          }`}>
                            {isQuizPassed(module.quiz.id) ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <HelpCircle className="w-3 h-3" />
                            )}
                          </div>
                          <span className={`text-sm ${
                            isQuizPassed(module.quiz.id)
                              ? "text-success"
                              : "text-sidebar-foreground"
                          }`}>
                            Module Quiz
                          </span>
                          {isQuizPassed(module.quiz.id) && (
                            <span className="text-xs text-success ml-auto">Passed</span>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
