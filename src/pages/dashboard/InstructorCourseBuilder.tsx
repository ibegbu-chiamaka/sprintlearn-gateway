import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

type LessonDraft = { title: string; videoUrl: string; minutes: string };
type QuestionDraft = { prompt: string; options: string[]; answer: number };
type ModuleDraft = { title: string; description: string; sessions: LessonDraft[]; quizTitle: string; questions: QuestionDraft[] };
const blankQuestion = (): QuestionDraft => ({ prompt: "", options: ["", "", "", ""], answer: 0 });
const blankModule = (): ModuleDraft => ({ title: "", description: "", sessions: [{ title: "", videoUrl: "", minutes: "" }], quizTitle: "", questions: [] });

export default function InstructorCourseBuilder() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("0");
  const [thumbnail, setThumbnail] = useState("");
  const [practical, setPractical] = useState(false);
  const [modules, setModules] = useState<ModuleDraft[]>([blankModule()]);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);

  const setModule = (index: number, patch: Partial<ModuleDraft>) => setModules((items) => items.map((item, i) => i === index ? { ...item, ...patch } : item));
  const setLesson = (mi: number, si: number, patch: Partial<LessonDraft>) => setModules((items) => items.map((module, i) => i === mi ? { ...module, sessions: module.sessions.map((session, j) => j === si ? { ...session, ...patch } : session) } : module));
  const setQuestion = (mi: number, qi: number, patch: Partial<QuestionDraft>) => setModules((items) => items.map((module, i) => i === mi ? { ...module, questions: module.questions.map((question, j) => j === qi ? { ...question, ...patch } : question) } : module));
  const setOption = (mi: number, qi: number, oi: number, value: string) => setModules((items) => items.map((module, i) => i === mi ? { ...module, questions: module.questions.map((question, j) => j === qi ? { ...question, options: question.options.map((option, k) => k === oi ? value : option) } : question) } : module));

  const publishCourse = async (event: FormEvent) => {
    event.preventDefault();
    if (!profile) return;
    if (step < 3) { setStep((current) => current + 1); return; }
    if (modules.some((module) => !module.title.trim() || !module.sessions.length || module.sessions.some((session) => !session.title.trim()))) {
      toast({ title: "Finish module details", description: "Each module and lesson needs a title.", variant: "destructive" }); return;
    }
    if (modules.some((module) => (module.quizTitle.trim() || module.questions.length) && (!module.quizTitle.trim() || module.questions.length === 0 || module.questions.some((q) => !q.prompt.trim() || q.options.some((option) => !option.trim()))))) {
      toast({ title: "Finish quiz details", description: "A quiz needs a title and fully completed questions.", variant: "destructive" }); return;
    }
    setBusy(true);
    const { data: course, error } = await supabase.from("courses").insert({
      title: title.trim(), description: description.trim(), category: category.trim() || "General",
      price: Number(price) || 0, thumbnail_url: thumbnail.trim() || null, is_practical: practical,
      instructor_id: profile.id, is_published: false,
    }).select("id").single();
    if (error || !course) { setBusy(false); toast({ title: "Course could not be created", description: error?.message, variant: "destructive" }); return; }
    for (const [moduleIndex, module] of modules.entries()) {
      const { data: savedModule, error: moduleError } = await supabase.from("modules").insert({ course_id: course.id, title: module.title.trim(), description: module.description.trim() || null, order_index: moduleIndex }).select("id").single();
      if (moduleError || !savedModule) { setBusy(false); toast({ title: "Module could not be saved", description: `Course draft created; finish the module in edit mode. ${moduleError?.message ?? ""}`, variant: "destructive" }); navigate(`/dashboard/instructor/courses/${course.id}`); return; }
      const lessonRows = module.sessions.map((session, sessionIndex) => ({ module_id: savedModule.id, title: session.title.trim(), video_url: session.videoUrl.trim() || null, duration_minutes: session.minutes ? Number(session.minutes) : null, order_index: sessionIndex }));
      const { error: lessonError } = await supabase.from("sessions").insert(lessonRows);
      if (lessonError) { setBusy(false); toast({ title: "Lessons could not be saved", description: lessonError.message, variant: "destructive" }); navigate(`/dashboard/instructor/courses/${course.id}`); return; }
      if (module.quizTitle.trim()) {
        const { data: quiz, error: quizError } = await supabase.from("quizzes").insert({ module_id: savedModule.id, title: module.quizTitle.trim(), passing_score: 65 }).select("id").single();
        if (quizError || !quiz) { setBusy(false); toast({ title: "Quiz could not be saved", description: quizError?.message, variant: "destructive" }); navigate(`/dashboard/instructor/courses/${course.id}`); return; }
        const { error: questionsError } = await supabase.from("quiz_questions").insert(module.questions.map((question, questionIndex) => ({ quiz_id: quiz.id, question: question.prompt.trim(), options: question.options, correct_answer: question.answer, order_index: questionIndex })));
        if (questionsError) { setBusy(false); toast({ title: "Quiz questions could not be saved", description: questionsError.message, variant: "destructive" }); navigate(`/dashboard/instructor/courses/${course.id}`); return; }
      }
    }
    setBusy(false);
    toast({ title: "Course saved as a draft", description: "Review your course details before publishing." });
    navigate(`/dashboard/instructor/courses/${course.id}`);
  };

  return <main className="min-h-screen bg-background">
    <header className="border-b border-border bg-card"><div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4 sm:px-6"><Link to="/dashboard/instructor" aria-label="Back to instructor dashboard"><ArrowLeft className="h-5 w-5"/></Link><div><p className="text-sm text-muted-foreground">Instructor workspace</p><h1 className="text-xl font-bold">Create a course</h1></div></div></header>
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <ol className="mb-8 grid grid-cols-3 border-y border-border">{["Course details", "Modules & lessons", "Quizzes & review"].map((label, index) => <li key={label} className={`py-3 text-sm ${step === index + 1 ? "font-semibold text-foreground" : "text-muted-foreground"}`}><span className="mr-2">0{index + 1}</span>{label}</li>)}</ol>
      <form onSubmit={(event) => void publishCourse(event)}>
        {step === 1 && <section className="space-y-5"><div><Label htmlFor="course-title">Course title</Label><Input id="course-title" className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required/></div><div><Label htmlFor="course-description">Description</Label><Textarea id="course-description" className="mt-1 min-h-32" value={description} onChange={(e) => setDescription(e.target.value)} required/></div><div className="grid gap-5 sm:grid-cols-2"><div><Label htmlFor="course-category">Category</Label><Input id="course-category" className="mt-1" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Design, Data"/></div><div><Label htmlFor="course-price">Price (USD)</Label><Input id="course-price" className="mt-1" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}/></div></div><div><Label htmlFor="course-thumbnail">Thumbnail image URL</Label><Input id="course-thumbnail" className="mt-1" type="url" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} placeholder="https://…"/></div><div className="flex items-center justify-between border-y border-border py-4"><div><p className="font-medium">Practical course</p><p className="text-sm text-muted-foreground">Requires a final project reviewed by an instructor.</p></div><Switch checked={practical} onCheckedChange={setPractical} aria-label="Practical course"/></div></section>}
        {step === 2 && <section className="space-y-8">{modules.map((module, moduleIndex) => <div key={moduleIndex} className="border-b border-border pb-7"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Module {moduleIndex + 1}</h2>{modules.length > 1 && <Button type="button" variant="ghost" size="icon" aria-label="Remove module" onClick={() => setModules((items) => items.filter((_, index) => index !== moduleIndex))}><Trash2 className="h-4 w-4"/></Button>}</div><div className="space-y-4"><div><Label>Module title</Label><Input className="mt-1" value={module.title} onChange={(e) => setModule(moduleIndex, { title: e.target.value })}/></div><div><Label>Module description</Label><Textarea className="mt-1" value={module.description} onChange={(e) => setModule(moduleIndex, { description: e.target.value })}/></div>{module.sessions.map((session, sessionIndex) => <div key={sessionIndex} className="grid gap-3 border-l-2 border-border pl-4 sm:grid-cols-[1fr_1fr_100px_auto]"><Input aria-label="Lesson title" placeholder="Lesson title" value={session.title} onChange={(e) => setLesson(moduleIndex, sessionIndex, { title: e.target.value })}/><Input aria-label="Video URL" type="url" placeholder="Video URL" value={session.videoUrl} onChange={(e) => setLesson(moduleIndex, sessionIndex, { videoUrl: e.target.value })}/><Input aria-label="Duration in minutes" type="number" min="1" placeholder="Minutes" value={session.minutes} onChange={(e) => setLesson(moduleIndex, sessionIndex, { minutes: e.target.value })}/><Button type="button" variant="ghost" size="icon" aria-label="Remove lesson" disabled={module.sessions.length === 1} onClick={() => setModule(moduleIndex, { sessions: module.sessions.filter((_, index) => index !== sessionIndex) })}><Trash2 className="h-4 w-4"/></Button></div>)}<Button type="button" variant="outline" size="sm" onClick={() => setModule(moduleIndex, { sessions: [...module.sessions, { title: "", videoUrl: "", minutes: "" }] })}><Plus className="mr-2 h-4 w-4"/>Add lesson</Button></div></div>)}<Button type="button" variant="outline" onClick={() => setModules((items) => [...items, blankModule()])}><Plus className="mr-2 h-4 w-4"/>Add module</Button></section>}
        {step === 3 && <section className="space-y-6">{modules.map((module, moduleIndex) => <div key={moduleIndex} className="border-b border-border pb-6"><h2 className="font-semibold">{module.title || `Module ${moduleIndex + 1}`}</h2><div className="mt-4"><Label>Quiz title (optional)</Label><Input className="mt-1" value={module.quizTitle} onChange={(e) => setModule(moduleIndex, { quizTitle: e.target.value })} placeholder="Module check-in"/></div>{module.questions.map((question, questionIndex) => <div key={questionIndex} className="mt-5 space-y-3 border-l-2 border-border pl-4"><div className="flex items-center justify-between"><Label>Question {questionIndex + 1}</Label><Button type="button" variant="ghost" size="icon" aria-label="Remove question" onClick={() => setModule(moduleIndex, { questions: module.questions.filter((_, index) => index !== questionIndex) })}><Trash2 className="h-4 w-4"/></Button></div><Textarea value={question.prompt} onChange={(e) => setQuestion(moduleIndex, questionIndex, { prompt: e.target.value })} placeholder="Question"/>{question.options.map((option, optionIndex) => <div key={optionIndex} className="flex items-center gap-3"><input type="radio" name={`answer-${moduleIndex}-${questionIndex}`} checked={question.answer === optionIndex} onChange={() => setQuestion(moduleIndex, questionIndex, { answer: optionIndex })} aria-label={`Mark option ${optionIndex + 1} correct`}/><Input value={option} onChange={(e) => setOption(moduleIndex, questionIndex, optionIndex, e.target.value)} placeholder={`Answer ${optionIndex + 1}`}/></div>)}<p className="text-xs text-muted-foreground">Choose the correct answer with the circle.</p></div>)}{module.quizTitle.trim() && <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => setModule(moduleIndex, { questions: [...module.questions, blankQuestion()] })}><Plus className="mr-2 h-4 w-4"/>Add question</Button>}</div>)}<div className="border-y border-border py-4"><p className="font-medium">Passing score</p><p className="text-sm text-muted-foreground">Students need 65% or higher to unlock the following module.</p></div><div className="border-b border-border pb-4"><p className="font-medium">Publishing</p><p className="text-sm text-muted-foreground">Your course is saved as a draft; publish it from course details after review.</p></div></section>}
        <div className="mt-8 flex justify-between border-t border-border pt-5">{step > 1 ? <Button type="button" variant="outline" onClick={() => setStep((current) => current - 1)}>Back</Button> : <Link to="/dashboard/instructor"><Button type="button" variant="ghost">Cancel</Button></Link>}{step < 3 ? <Button type="submit" variant="sprint" disabled={!title.trim() || !description.trim()}>Continue</Button> : <Button type="submit" variant="sprint" disabled={busy || !title.trim() || !description.trim()}>{busy ? "Saving course…" : "Save course draft"}</Button>}</div>
      </form>
    </div>
  </main>;
}