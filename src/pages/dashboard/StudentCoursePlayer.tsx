import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Award, Check, CheckCircle2, ChevronRight, FileUp, Lock, Play, RotateCcw } from "lucide-react";
import { isCourseComplete, isQuizPassed } from "@/lib/learning";

type Session = { id: string; title: string; video_url: string | null; duration_minutes: number | null; order_index: number };
type Question = { id: string; question: string; options: string[]; order_index: number };
type Module = { id: string; title: string; description: string | null; order_index: number; sessions: Session[]; quiz: { id: string; title: string; passing_score: number | null; questions: Question[] } | null };
type Course = { id: string; title: string; description: string | null; is_practical: boolean | null; thumbnail_url: string | null; modules: Module[] };

export default function StudentCoursePlayer() {
  const { courseId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [passedQuizzes, setPassedQuizzes] = useState<Set<string>>(new Set());
  const [quizScores, setQuizScores] = useState<Record<string, number>>({});
  const [submission, setSubmission] = useState<{ status: string | null; feedback: string | null; file_name: string | null } | null>(null);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    if (!courseId || !profile) return;
    setLoading(true);
    const { data: enrollment, error: enrollError } = await supabase.from("enrollments").select("id").eq("course_id", courseId).eq("user_id", profile.id).maybeSingle();
    if (enrollError || !enrollment) {
      toast({ title: "Enrollment required", description: "Enroll in this course before opening the lessons.", variant: "destructive" });
      navigate("/dashboard/student", { replace: true });
      return;
    }
    const { data: courseRow, error } = await supabase.from("courses").select("id,title,description,is_practical,thumbnail_url").eq("id", courseId).maybeSingle();
    if (error || !courseRow) {
      toast({ title: "Course unavailable", variant: "destructive" });
      navigate("/dashboard/student", { replace: true });
      return;
    }
    const { data: moduleRows } = await supabase.from("modules").select("id,title,description,order_index").eq("course_id", courseId).order("order_index");
    const modules: Module[] = [];
    for (const module of moduleRows ?? []) {
      const [{ data: sessions }, { data: quiz }] = await Promise.all([
        supabase.from("sessions").select("id,title,video_url,duration_minutes,order_index").eq("module_id", module.id).order("order_index"),
        supabase.from("quizzes").select("id,title,passing_score").eq("module_id", module.id).maybeSingle(),
      ]);
      let quizData: Module["quiz"] = null;
      if (quiz) {
        const { data: questions } = await supabase.from("quiz_questions").select("id,question,options,order_index").eq("quiz_id", quiz.id).order("order_index");
        quizData = { ...quiz, questions: (questions ?? []).map((q) => ({ ...q, options: Array.isArray(q.options) ? q.options.filter((o): o is string => typeof o === "string") : [] })) };
      }
      modules.push({ ...module, sessions: sessions ?? [], quiz: quizData });
    }
    const [{ data: progress }, { data: attempts }, { data: submissionRow }] = await Promise.all([
      supabase.from("user_progress").select("session_id").eq("user_id", profile.id).eq("completed", true),
      supabase.from("quiz_attempts").select("quiz_id,score,passed").eq("user_id", profile.id),
      supabase.from("practical_submissions").select("status,feedback,file_name").eq("student_id", profile.id).eq("course_id", courseId).maybeSingle(),
    ]);
    const done = new Set((progress ?? []).map((p) => p.session_id));
    const passed = new Set((attempts ?? []).filter((a) => a.passed).map((a) => a.quiz_id));
    const scores: Record<string, number> = {};
    for (const attempt of attempts ?? []) scores[attempt.quiz_id] = attempt.score;
    setCourse({ ...courseRow, modules });
    setCompleted(done);
    setPassedQuizzes(passed);
    setQuizScores(scores);
    setSubmission(submissionRow);
    const firstUnlocked = modules.flatMap((m) => m.sessions).find((s) => !done.has(s.id)) ?? modules[0]?.sessions[0];
    setActiveSession((previous) => previous && modules.some((m) => m.sessions.some((s) => s.id === previous)) ? previous : firstUnlocked?.id ?? null);
    setLoading(false);
  }, [courseId, profile, navigate]);

  useEffect(() => { void load(); }, [load]);

  const sortedSessions = useMemo(() => course?.modules.flatMap((module) => module.sessions.map((session) => ({ ...session, moduleId: module.id, moduleTitle: module.title }))) ?? [], [course]);
  const selected = sortedSessions.find((session) => session.id === activeSession) ?? null;
  const selectedModule = course?.modules.find((module) => module.id === selected?.moduleId) ?? null;
  const completedCount = completed.size;
  const totalCount = sortedSessions.length;
  const allQuizzesPassed = (course?.modules ?? []).every((module) => !module.quiz || passedQuizzes.has(module.quiz.id));
  const courseComplete = Boolean(course && isCourseComplete({ allSessionsComplete: totalCount > 0 && completedCount === totalCount, allQuizzesPassed, practicalRequired: Boolean(course.is_practical), practicalPassed: submission?.status === "pass" }));
  const unlockedSessions = useMemo(() => {
    const unlocked = new Set<string>();
    let blocked = false;
    for (const module of course?.modules ?? []) {
      if (blocked) continue;
      for (const session of module.sessions) {
        if (!blocked) unlocked.add(session.id);
        if (!completed.has(session.id)) { blocked = true; break; }
      }
      if (module.quiz && !passedQuizzes.has(module.quiz.id)) blocked = true;
    }
    return unlocked;
  }, [course, completed, passedQuizzes]);

  const completeSession = async () => {
    if (!selected) return;
    setWorking(true);
    const { error } = await supabase.rpc("complete_course_session", { _session_id: selected.id });
    setWorking(false);
    if (error) { toast({ title: "Lesson still locked", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Lesson completed" });
    await load();
  };

  const submitQuiz = async () => {
    if (!selectedModule?.quiz) return;
    const quiz = selectedModule.quiz;
    if (quiz.questions.some((question) => answers[question.id] === undefined)) { toast({ title: "Answer every question", variant: "destructive" }); return; }
    setWorking(true);
    const { data, error } = await supabase.rpc("submit_module_quiz", { _quiz_id: quiz.id, _answers: quiz.questions.map((question) => ({ question_id: question.id, answer_index: answers[question.id] })) });
    setWorking(false);
    if (error) { toast({ title: "Quiz could not be submitted", description: error.message, variant: "destructive" }); return; }
    const result = Array.isArray(data) ? data[0] : data;
    const didPass = isQuizPassed(result.score, quiz.passing_score ?? 65);
    setQuizScores((previous) => ({ ...previous, [quiz.id]: result.score }));
    setAnswers({});
    toast({ title: didPass ? "Module passed" : "Not quite — try again", description: `Score: ${result.score}%. ${didPass ? "The next module is now unlocked." : `You need ${quiz.passing_score ?? 65}% to continue.`}` });
    await load();
  };

  const uploadProject = async (file?: File) => {
    if (!file || !course || !profile) return;
    if (file.size > 50 * 1024 * 1024) { toast({ title: "File is too large", description: "Choose a file under 50 MB.", variant: "destructive" }); return; }
    setWorking(true);
    const path = `${profile.id}/${course.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: uploadError } = await supabase.storage.from("practical-projects").upload(path, file, { upsert: true });
    if (uploadError) { setWorking(false); toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" }); return; }
    const payload = { file_url: path, file_name: file.name, feedback: null, status: "pending" as const, submitted_at: new Date().toISOString() };
    const result = submission
      ? await supabase.from("practical_submissions").update(payload).eq("student_id", profile.id).eq("course_id", course.id)
      : await supabase.from("practical_submissions").insert({ ...payload, student_id: profile.id, course_id: course.id });
    setWorking(false);
    if (result.error) { toast({ title: "Submission not saved", description: result.error.message, variant: "destructive" }); return; }
    toast({ title: "Project submitted", description: "Your instructor will review your work." });
    await load();
  };

  const downloadCertificate = () => {
    if (!course || !courseComplete) return;
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    pdf.setDrawColor(0, 31, 63);
    pdf.setLineWidth(1.5);
    pdf.rect(12, 12, 273, 186);
    pdf.setTextColor(0, 31, 63);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(30);
    pdf.text("Certificate of Completion", 148.5, 66, { align: "center" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(16);
    pdf.text("This certifies that", 148.5, 89, { align: "center" });
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(25);
    pdf.text(profile?.full_name || user?.email || "Learner", 148.5, 108, { align: "center" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(16);
    pdf.text("has successfully completed", 148.5, 128, { align: "center" });
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(21);
    pdf.text(course.title, 148.5, 147, { align: "center", maxWidth: 240 });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.text(new Date().toLocaleDateString(), 148.5, 169, { align: "center" });
    pdf.save(`${course.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-certificate.pdf`);
  };

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading course…</div>;
  if (!course) return null;

  const canSubmitProject = totalCount > 0 && completedCount === totalCount && allQuizzesPassed && Boolean(course.is_practical);
  return <div className="min-h-screen bg-background">
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="min-w-0"><Link to="/dashboard/student" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4"/>My learning</Link><h1 className="mt-2 truncate text-xl font-bold">{course.title}</h1></div>
        <div className="hidden w-56 sm:block"><div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>Course progress</span><span>{totalCount ? Math.round(completedCount / totalCount * 100) : 0}%</span></div><Progress value={totalCount ? completedCount / totalCount * 100 : 0} className="h-2"/></div>
        {courseComplete && <Button variant="sprint" onClick={downloadCertificate}><Award className="mr-2 h-4 w-4"/>Certificate</Button>}
      </div>
    </header>
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0">
        {selected ? <>
          <div className="aspect-video overflow-hidden bg-muted">
            {selected.video_url ? <iframe title={selected.title} src={selected.video_url} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen/> : <div className="grid h-full place-items-center"><div className="text-center"><Play className="mx-auto h-10 w-10 text-muted-foreground"/><p className="mt-3 text-sm text-muted-foreground">No lesson video has been added yet.</p></div></div>}
          </div>
          <div className="py-5"><p className="text-sm text-muted-foreground">{selected.moduleTitle}</p><h2 className="mt-1 text-2xl font-bold">{selected.title}</h2>{selected.duration_minutes != null && <p className="mt-2 text-sm text-muted-foreground">{selected.duration_minutes} minutes</p>}
            <div className="mt-6 flex flex-wrap items-center gap-3">{completed.has(selected.id) ? <span className="inline-flex items-center gap-2 text-sm text-success"><CheckCircle2 className="h-4 w-4"/>Completed</span> : <Button variant="sprint" disabled={working} onClick={() => void completeSession()}>Mark lesson complete</Button>}
              {(() => { const index = sortedSessions.findIndex((s) => s.id === selected.id); const next = sortedSessions[index + 1]; return next && unlockedSessions.has(next.id) ? <Button variant="outline" onClick={() => setActiveSession(next.id)}>Next lesson <ChevronRight className="ml-1 h-4 w-4"/></Button> : null; })()}
            </div>
          </div>
          {selectedModule?.quiz && selectedModule.sessions.at(-1)?.id === selected.id && <div className="mt-5 border-t border-border pt-6"><h3 className="text-lg font-semibold">{selectedModule.quiz.title}</h3><p className="mt-1 text-sm text-muted-foreground">Pass with at least {selectedModule.quiz.passing_score ?? 65}% to unlock the next module.</p>{selectedModule.quiz.questions.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">This quiz has no questions yet.</p> : <div className="mt-5 space-y-6">{selectedModule.quiz.questions.map((question, index) => <fieldset key={question.id} className="space-y-2"><legend className="mb-2 font-medium">{index + 1}. {question.question}</legend>{question.options.map((option, choice) => <label key={`${question.id}-${choice}`} className="flex cursor-pointer items-start gap-3 border border-border px-3 py-3 text-sm has-[:checked]:border-primary"><input type="radio" name={question.id} checked={answers[question.id] === choice} onChange={() => setAnswers((previous) => ({ ...previous, [question.id]: choice }))}/>{option}</label>)}</fieldset>)}<div className="flex flex-wrap items-center gap-3"><Button variant="sprint" disabled={working || passedQuizzes.has(selectedModule.quiz.id)} onClick={() => void submitQuiz()}>{working ? "Checking…" : passedQuizzes.has(selectedModule.quiz.id) ? "Quiz passed" : "Submit quiz"}</Button>{quizScores[selectedModule.quiz.id] !== undefined && <span className="text-sm text-muted-foreground">Latest score: {quizScores[selectedModule.quiz.id]}%</span>}{!passedQuizzes.has(selectedModule.quiz.id) && quizScores[selectedModule.quiz.id] !== undefined && <RotateCcw className="h-4 w-4 text-muted-foreground"/>}</div></div>}</div>}
        </> : <div className="aspect-video grid place-items-center bg-muted text-center"><div><h2 className="text-lg font-semibold">Course content is being prepared</h2><p className="mt-2 text-sm text-muted-foreground">Your instructor has not added any lesson sessions yet.</p></div></div>}
        {course.is_practical && canSubmitProject && <section className="mt-8 border-t border-border pt-6"><h2 className="text-xl font-semibold">Final project</h2><p className="mt-2 text-sm text-muted-foreground">Upload your work for instructor review. The course completes after it is approved.</p><label className="mt-5 flex cursor-pointer items-center gap-3 border border-dashed border-border p-5"><FileUp className="h-5 w-5 text-muted-foreground"/><span className="flex-1 text-sm">{submission?.file_name ?? "Choose a project file"}</span><input type="file" className="sr-only" onChange={(event) => void uploadProject(event.target.files?.[0])} disabled={working}/><Button asChild variant="outline" size="sm"><span>{working ? "Uploading…" : submission ? "Replace file" : "Upload"}</span></Button></label>{submission && <p className="mt-3 text-sm text-muted-foreground">Status: <span className="capitalize">{submission.status ?? "pending"}</span>{submission.feedback ? ` · ${submission.feedback}` : ""}</p>}</section>}
        {courseComplete && <div className="mt-8 border-t border-border py-6"><p className="inline-flex items-center gap-2 font-semibold text-success"><Check className="h-5 w-5"/>Course completed</p><p className="mt-2 text-sm text-muted-foreground">Your certificate is ready to download.</p></div>}
      </section>
      <aside className="border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"><h2 className="text-lg font-semibold">Course content</h2><div className="mt-4 space-y-5">{course.modules.map((module, moduleIndex) => <div key={module.id}><div className="mb-2"><p className="text-xs font-semibold uppercase text-muted-foreground">Module {moduleIndex + 1}</p><p className="font-medium">{module.title}</p></div><div className="space-y-1">{module.sessions.map((session) => { const isOpen = unlockedSessions.has(session.id); return <button key={session.id} disabled={!isOpen} onClick={() => setActiveSession(session.id)} className={`flex w-full items-center gap-3 px-3 py-3 text-left text-sm ${selected?.id === session.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-muted"} disabled:cursor-not-allowed disabled:opacity-50`}><span className="shrink-0">{completed.has(session.id) ? <CheckCircle2 className="h-4 w-4 text-success"/> : isOpen ? <Play className="h-4 w-4"/> : <Lock className="h-4 w-4"/>}</span><span className="min-w-0 flex-1 truncate">{session.title}</span></button>; })}{module.quiz && <div className="flex items-center gap-3 border-t border-border px-3 py-3 text-sm"><Award className={`h-4 w-4 shrink-0 ${passedQuizzes.has(module.quiz.id) ? "text-success" : "text-muted-foreground"}`}/><span className="min-w-0 flex-1 truncate">{module.quiz.title}</span><span className="text-xs text-muted-foreground">{passedQuizzes.has(module.quiz.id) ? "Passed" : "Quiz"}</span></div>}</div></div>)}</div>
        {course.is_practical && <div className="mt-6 border-t border-border pt-5"><p className="text-sm font-medium">Practical project</p><p className="mt-1 text-xs text-muted-foreground">{submission?.status === "pass" ? "Approved" : submission?.status === "pending" ? "Awaiting instructor review" : "Required for course completion"}</p></div>}
      </aside>
    </main>
  </div>;
}