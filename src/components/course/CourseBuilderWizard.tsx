import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  ArrowRight, 
  BookOpen,
  Upload,
  Plus,
  Trash2,
  GripVertical,
  Video,
  HelpCircle,
  Check,
  Loader2,
  X
} from "lucide-react";
import { toast } from "sonner";

interface Module {
  id: string;
  title: string;
  description: string;
  sessions: Session[];
  quiz: QuizQuestion[];
}

interface Session {
  id: string;
  title: string;
  videoUrl: string;
  duration: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

const STEPS = [
  { id: 1, title: "Course Details", description: "Basic information" },
  { id: 2, title: "Modules & Sessions", description: "Content structure" },
  { id: 3, title: "Quizzes", description: "Module assessments" },
  { id: 4, title: "Review & Publish", description: "Final check" }
];

export default function CourseBuilderWizard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Course details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [isPractical, setIsPractical] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  // Step 2: Modules & Sessions
  const [modules, setModules] = useState<Module[]>([
    {
      id: crypto.randomUUID(),
      title: "Module 1",
      description: "",
      sessions: [{ id: crypto.randomUUID(), title: "Session 1", videoUrl: "", duration: 10 }],
      quiz: []
    }
  ]);

  // Currently selected module for quiz
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("Not authenticated");

      setSaving(true);

      // 1. Create course
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .insert({
          title,
          description,
          price: parseFloat(price) || 0,
          is_practical: isPractical,
          thumbnail_url: thumbnailUrl || null,
          instructor_id: profile.id,
          is_published: false
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // 2. Create modules
      for (let i = 0; i < modules.length; i++) {
        const module = modules[i];

        const { data: moduleData, error: moduleError } = await supabase
          .from("modules")
          .insert({
            course_id: courseData.id,
            title: module.title,
            description: module.description || null,
            order_index: i
          })
          .select()
          .single();

        if (moduleError) throw moduleError;

        // 3. Create sessions
        for (let j = 0; j < module.sessions.length; j++) {
          const session = module.sessions[j];

          const { error: sessionError } = await supabase
            .from("sessions")
            .insert({
              module_id: moduleData.id,
              title: session.title,
              video_url: session.videoUrl || null,
              duration_minutes: session.duration || null,
              order_index: j
            });

          if (sessionError) throw sessionError;
        }

        // 4. Create quiz if exists
        if (module.quiz.length > 0) {
          const { data: quizData, error: quizError } = await supabase
            .from("quizzes")
            .insert({
              module_id: moduleData.id,
              title: `${module.title} Quiz`,
              passing_score: 65
            })
            .select()
            .single();

          if (quizError) throw quizError;

          // 5. Create quiz questions
          for (let k = 0; k < module.quiz.length; k++) {
            const question = module.quiz[k];

            const { error: questionError } = await supabase
              .from("quiz_questions")
              .insert({
                quiz_id: quizData.id,
                question: question.question,
                options: question.options,
                correct_answer: question.correctAnswer,
                order_index: k
              });

            if (questionError) throw questionError;
          }
        }
      }

      return courseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      toast.success("Course created successfully!");
      navigate("/dashboard/instructor");
    },
    onError: (error) => {
      toast.error("Failed to create course");
      console.error(error);
    },
    onSettled: () => {
      setSaving(false);
    }
  });

  // Module handlers
  const addModule = () => {
    setModules([
      ...modules,
      {
        id: crypto.randomUUID(),
        title: `Module ${modules.length + 1}`,
        description: "",
        sessions: [{ id: crypto.randomUUID(), title: "Session 1", videoUrl: "", duration: 10 }],
        quiz: []
      }
    ]);
  };

  const removeModule = (index: number) => {
    if (modules.length > 1) {
      setModules(modules.filter((_, i) => i !== index));
      if (selectedModuleIndex >= modules.length - 1) {
        setSelectedModuleIndex(Math.max(0, modules.length - 2));
      }
    }
  };

  const updateModule = (index: number, field: keyof Module, value: string) => {
    const updated = [...modules];
    updated[index] = { ...updated[index], [field]: value };
    setModules(updated);
  };

  // Session handlers
  const addSession = (moduleIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex].sessions.push({
      id: crypto.randomUUID(),
      title: `Session ${updated[moduleIndex].sessions.length + 1}`,
      videoUrl: "",
      duration: 10
    });
    setModules(updated);
  };

  const removeSession = (moduleIndex: number, sessionIndex: number) => {
    const updated = [...modules];
    if (updated[moduleIndex].sessions.length > 1) {
      updated[moduleIndex].sessions = updated[moduleIndex].sessions.filter(
        (_, i) => i !== sessionIndex
      );
      setModules(updated);
    }
  };

  const updateSession = (
    moduleIndex: number, 
    sessionIndex: number, 
    field: keyof Session, 
    value: string | number
  ) => {
    const updated = [...modules];
    updated[moduleIndex].sessions[sessionIndex] = {
      ...updated[moduleIndex].sessions[sessionIndex],
      [field]: value
    };
    setModules(updated);
  };

  // Quiz handlers
  const addQuestion = (moduleIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex].quiz.push({
      id: crypto.randomUUID(),
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0
    });
    setModules(updated);
  };

  const removeQuestion = (moduleIndex: number, questionIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex].quiz = updated[moduleIndex].quiz.filter(
      (_, i) => i !== questionIndex
    );
    setModules(updated);
  };

  const updateQuestion = (
    moduleIndex: number,
    questionIndex: number,
    field: string,
    value: string | number | string[]
  ) => {
    const updated = [...modules];
    updated[moduleIndex].quiz[questionIndex] = {
      ...updated[moduleIndex].quiz[questionIndex],
      [field]: value
    };
    setModules(updated);
  };

  const updateQuestionOption = (
    moduleIndex: number,
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const updated = [...modules];
    const options = [...updated[moduleIndex].quiz[questionIndex].options];
    options[optionIndex] = value;
    updated[moduleIndex].quiz[questionIndex].options = options;
    setModules(updated);
  };

  // Navigation
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return title.trim() !== "";
      case 2:
        return modules.every(m => 
          m.title.trim() !== "" && 
          m.sessions.every(s => s.title.trim() !== "")
        );
      case 3:
        return true; // Quizzes are optional
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4 && canProceed()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handlePublish = () => {
    createCourseMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard/instructor")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">Create New Course</h1>
                <p className="text-sm text-muted-foreground">
                  Step {currentStep} of {STEPS.length}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="hidden md:flex items-center gap-2">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      currentStep > step.id
                        ? "bg-success text-success-foreground"
                        : currentStep === step.id
                        ? "bg-sprint text-sprint-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-12 h-0.5 mx-1 ${
                      currentStep > step.id ? "bg-success" : "bg-muted"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Course Details */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Course Details</h2>
                <p className="text-muted-foreground">
                  Start with the basic information about your course
                </p>
              </div>

              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Complete React Developer Course"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What will students learn in this course?"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="49.99"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thumbnail">Thumbnail URL</Label>
                    <Input
                      id="thumbnail"
                      placeholder="https://..."
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <Label htmlFor="practical">Practical Course</Label>
                    <p className="text-sm text-muted-foreground">
                      Requires final project submission for completion
                    </p>
                  </div>
                  <Switch
                    id="practical"
                    checked={isPractical}
                    onCheckedChange={setIsPractical}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Modules & Sessions */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Modules & Sessions</h2>
                <p className="text-muted-foreground">
                  Structure your course content into modules and sessions
                </p>
              </div>

              <div className="space-y-4">
                {modules.map((module, moduleIndex) => (
                  <div
                    key={module.id}
                    className="bg-card border border-border rounded-xl p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sprint/10 flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-sprint" />
                        </div>
                        <Input
                          value={module.title}
                          onChange={(e) => updateModule(moduleIndex, "title", e.target.value)}
                          className="font-semibold"
                          placeholder="Module title"
                        />
                      </div>
                      {modules.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeModule(moduleIndex)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="pl-11 space-y-3">
                      {module.sessions.map((session, sessionIndex) => (
                        <div
                          key={session.id}
                          className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                        >
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                          <Video className="w-4 h-4 text-muted-foreground" />
                          <Input
                            value={session.title}
                            onChange={(e) => updateSession(moduleIndex, sessionIndex, "title", e.target.value)}
                            placeholder="Session title"
                            className="flex-1"
                          />
                          <Input
                            type="text"
                            value={session.videoUrl}
                            onChange={(e) => updateSession(moduleIndex, sessionIndex, "videoUrl", e.target.value)}
                            placeholder="Video URL"
                            className="w-48"
                          />
                          <Input
                            type="number"
                            value={session.duration}
                            onChange={(e) => updateSession(moduleIndex, sessionIndex, "duration", parseInt(e.target.value) || 0)}
                            placeholder="Min"
                            className="w-20"
                          />
                          {module.sessions.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSession(moduleIndex, sessionIndex)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addSession(moduleIndex)}
                        className="text-sprint hover:text-sprint"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Session
                      </Button>
                    </div>
                  </div>
                ))}

                <Button variant="outline" onClick={addModule} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Module
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Quizzes */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Module Quizzes</h2>
                <p className="text-muted-foreground">
                  Add quiz questions to test student understanding (65% pass required)
                </p>
              </div>

              {/* Module selector */}
              <div className="flex gap-2 flex-wrap">
                {modules.map((module, index) => (
                  <Button
                    key={module.id}
                    variant={selectedModuleIndex === index ? "sprint" : "outline"}
                    size="sm"
                    onClick={() => setSelectedModuleIndex(index)}
                  >
                    {module.title}
                    {module.quiz.length > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 rounded-full bg-sprint-foreground/20 text-xs">
                        {module.quiz.length}
                      </span>
                    )}
                  </Button>
                ))}
              </div>

              {/* Quiz questions for selected module */}
              <div className="space-y-4">
                {modules[selectedModuleIndex].quiz.map((question, qIndex) => (
                  <div
                    key={question.id}
                    className="bg-card border border-border rounded-xl p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                          <HelpCircle className="w-4 h-4 text-warning" />
                        </div>
                        <Input
                          value={question.question}
                          onChange={(e) => updateQuestion(selectedModuleIndex, qIndex, "question", e.target.value)}
                          placeholder="Enter your question"
                          className="flex-1"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestion(selectedModuleIndex, qIndex)}
                        className="text-destructive hover:text-destructive ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="pl-11 space-y-2">
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuestion(selectedModuleIndex, qIndex, "correctAnswer", oIndex)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                              question.correctAnswer === oIndex
                                ? "border-success bg-success text-success-foreground"
                                : "border-border hover:border-muted-foreground"
                            }`}
                          >
                            {question.correctAnswer === oIndex && (
                              <Check className="w-3 h-3" />
                            )}
                          </button>
                          <Input
                            value={option}
                            onChange={(e) => updateQuestionOption(selectedModuleIndex, qIndex, oIndex, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={() => addQuestion(selectedModuleIndex)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question to {modules[selectedModuleIndex].title}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Review & Publish</h2>
                <p className="text-muted-foreground">
                  Review your course before publishing
                </p>
              </div>

              <div className="grid gap-6">
                {/* Course summary */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold text-card-foreground mb-4">Course Details</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Title</dt>
                      <dd className="font-medium text-card-foreground">{title}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Price</dt>
                      <dd className="font-medium text-sprint">${price || "Free"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Type</dt>
                      <dd className="font-medium text-card-foreground">
                        {isPractical ? "Practical (Project Required)" : "Standard"}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Modules summary */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold text-card-foreground mb-4">Content Structure</h3>
                  <div className="space-y-3">
                    {modules.map((module, index) => (
                      <div key={module.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-sprint/10 flex items-center justify-center text-xs font-medium text-sprint">
                            {index + 1}
                          </div>
                          <span className="text-card-foreground">{module.title}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{module.sessions.length} sessions</span>
                          {module.quiz.length > 0 && (
                            <span className="text-warning">{module.quiz.length} quiz questions</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
                  <p className="text-sm text-warning-foreground">
                    <strong>Note:</strong> Your course will be saved as a draft. You can publish it later from your dashboard.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < 4 ? (
            <Button
              variant="sprint"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              variant="sprint"
              onClick={handlePublish}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Create Course
                </>
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
