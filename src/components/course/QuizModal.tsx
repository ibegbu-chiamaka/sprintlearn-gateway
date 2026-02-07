import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  X, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ChevronRight,
  RotateCcw,
  Trophy
} from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  passing_score: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  order_index: number;
}

interface QuizModalProps {
  quiz: Quiz;
  onComplete: (passed: boolean) => void;
  onClose: () => void;
}

export default function QuizModal({ quiz, onComplete, onClose }: QuizModalProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  // Fetch quiz questions
  const { data: questions, isLoading } = useQuery({
    queryKey: ["quiz-questions", quiz.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quiz.id)
        .order("order_index");

      if (error) throw error;
      return data.map(q => ({
        ...q,
        options: q.options as string[]
      })) as QuizQuestion[];
    }
  });

  // Submit quiz attempt mutation
  const submitAttemptMutation = useMutation({
    mutationFn: async ({ score, passed }: { score: number; passed: boolean }) => {
      if (!profile?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("quiz_attempts")
        .insert({
          quiz_id: quiz.id,
          user_id: profile.id,
          score,
          passed,
          answers
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-attempts"] });
    }
  });

  const handleAnswer = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleNext = () => {
    if (questions && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleSubmit = () => {
    if (!questions) return;

    // Calculate score
    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct_answer) {
        correct++;
      }
    });

    const calculatedScore = Math.round((correct / questions.length) * 100);
    const passed = calculatedScore >= quiz.passing_score;

    setScore(calculatedScore);
    setShowResults(true);

    // Save attempt
    submitAttemptMutation.mutate({ score: calculatedScore, passed });
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setScore(0);
  };

  const handleContinue = () => {
    onComplete(score >= quiz.passing_score);
  };

  if (isLoading || !questions) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/80 backdrop-blur-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sprint" />
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;
  const passed = score >= quiz.passing_score;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card rounded-2xl shadow-elegant w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {!showResults ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-card-foreground">{quiz.title}</h2>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <Progress value={progressPercent} className="flex-1 h-2" />
                <span className="text-sm text-muted-foreground">
                  {currentQuestionIndex + 1} / {questions.length}
                </span>
              </div>
            </div>

            {/* Question */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-lg font-medium text-card-foreground mb-6">
                    {currentQuestion.question}
                  </p>

                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswer(currentQuestion.id, index)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          answers[currentQuestion.id] === index
                            ? "border-sprint bg-sprint/10 text-foreground"
                            : "border-border hover:border-muted-foreground/50 text-card-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            answers[currentQuestion.id] === index
                              ? "bg-sprint text-sprint-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span>{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border flex justify-between">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Passing score: {quiz.passing_score}%
              </p>
              
              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  variant="sprint"
                  onClick={handleNext}
                  disabled={answers[currentQuestion.id] === undefined}
                >
                  Next Question
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  variant="sprint"
                  onClick={handleSubmit}
                  disabled={Object.keys(answers).length !== questions.length}
                >
                  Submit Quiz
                </Button>
              )}
            </div>
          </>
        ) : (
          /* Results */
          <div className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
                passed ? "bg-success" : "bg-destructive"
              }`}
            >
              {passed ? (
                <Trophy className="w-12 h-12 text-success-foreground" />
              ) : (
                <XCircle className="w-12 h-12 text-destructive-foreground" />
              )}
            </motion.div>

            <h3 className="text-2xl font-bold text-card-foreground mb-2">
              {passed ? "Congratulations!" : "Not quite there..."}
            </h3>
            
            <p className="text-muted-foreground mb-6">
              {passed
                ? "You've passed the quiz and unlocked the next module!"
                : `You need ${quiz.passing_score}% to pass. Keep learning!`}
            </p>

            <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-bold mb-8 ${
              passed
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            }`}>
              Score: {score}%
            </div>

            <div className="flex justify-center gap-4">
              {!passed && (
                <Button variant="outline" onClick={handleRetry}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
              <Button variant="sprint" onClick={handleContinue}>
                {passed ? "Continue Learning" : "Review Material"}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
