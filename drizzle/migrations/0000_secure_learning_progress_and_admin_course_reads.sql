CREATE OR REPLACE FUNCTION public.complete_course_session(_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
  v_course_id UUID;
  v_session_order INTEGER;
  v_module_order INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  v_profile_id := public.get_profile_id(auth.uid());
  SELECT c.id, s.order_index, m.order_index
    INTO v_course_id, v_session_order, v_module_order
    FROM public.sessions s JOIN public.modules m ON m.id = s.module_id
    JOIN public.courses c ON c.id = m.course_id WHERE s.id = _session_id;
  IF v_course_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.enrollments e WHERE e.user_id = v_profile_id AND e.course_id = v_course_id) THEN RAISE EXCEPTION 'Course enrollment required'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.sessions prior_s JOIN public.modules prior_m ON prior_m.id = prior_s.module_id
    WHERE prior_m.course_id = v_course_id
      AND (prior_m.order_index < v_module_order OR (prior_m.order_index = v_module_order AND prior_s.order_index < v_session_order))
      AND NOT EXISTS (SELECT 1 FROM public.user_progress p WHERE p.user_id = v_profile_id AND p.session_id = prior_s.id AND p.completed = true)
  ) THEN RAISE EXCEPTION 'Complete earlier sessions first'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.modules prior_m JOIN public.quizzes q ON q.module_id = prior_m.id
    WHERE prior_m.course_id = v_course_id AND prior_m.order_index < v_module_order
      AND NOT EXISTS (SELECT 1 FROM public.quiz_attempts a WHERE a.user_id = v_profile_id AND a.quiz_id = q.id AND a.passed = true)
  ) THEN RAISE EXCEPTION 'Pass the previous module quiz first'; END IF;
  INSERT INTO public.user_progress(user_id, session_id, completed, completed_at)
    VALUES (v_profile_id, _session_id, true, now())
    ON CONFLICT (user_id, session_id) DO UPDATE SET completed = true, completed_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_module_quiz(_quiz_id UUID, _answers JSONB)
RETURNS TABLE(score INTEGER, passed BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
  v_course_id UUID;
  v_module_id UUID;
  v_module_order INTEGER;
  v_total INTEGER;
  v_correct INTEGER;
  v_score INTEGER;
  v_passed BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  v_profile_id := public.get_profile_id(auth.uid());
  SELECT c.id, m.id, m.order_index INTO v_course_id, v_module_id, v_module_order
  FROM public.quizzes q JOIN public.modules m ON m.id = q.module_id JOIN public.courses c ON c.id = m.course_id WHERE q.id = _quiz_id;
  IF v_course_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.enrollments e WHERE e.user_id = v_profile_id AND e.course_id = v_course_id) THEN RAISE EXCEPTION 'Course enrollment required'; END IF;
  IF EXISTS (SELECT 1 FROM public.sessions s WHERE s.module_id = v_module_id AND NOT EXISTS (SELECT 1 FROM public.user_progress p WHERE p.user_id = v_profile_id AND p.session_id = s.id AND p.completed = true)) THEN RAISE EXCEPTION 'Complete this module first'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.sessions prior_s JOIN public.modules prior_m ON prior_m.id = prior_s.module_id
    WHERE prior_m.course_id = v_course_id AND prior_m.order_index < v_module_order
      AND NOT EXISTS (SELECT 1 FROM public.user_progress p WHERE p.user_id = v_profile_id AND p.session_id = prior_s.id AND p.completed = true)
  ) OR EXISTS (
    SELECT 1 FROM public.modules prior_m JOIN public.quizzes prior_q ON prior_q.module_id = prior_m.id
    WHERE prior_m.course_id = v_course_id AND prior_m.order_index < v_module_order
      AND NOT EXISTS (SELECT 1 FROM public.quiz_attempts a WHERE a.user_id = v_profile_id AND a.quiz_id = prior_q.id AND a.passed = true)
  ) THEN RAISE EXCEPTION 'Finish previous modules first'; END IF;
  SELECT count(*)::INTEGER, count(*) FILTER (WHERE (answer.item->>'answer_index')::INTEGER = question.correct_answer)::INTEGER
    INTO v_total, v_correct
    FROM public.quiz_questions question
    LEFT JOIN LATERAL jsonb_array_elements(COALESCE(_answers, '[]'::jsonb)) AS answer(item)
      ON answer.item->>'question_id' = question.id::text
    WHERE question.quiz_id = _quiz_id;
  IF v_total = 0 THEN RAISE EXCEPTION 'This quiz has no questions'; END IF;
  v_score := round((v_correct::NUMERIC / v_total) * 100)::INTEGER;
  SELECT v_score >= COALESCE(q.passing_score, 65) INTO v_passed FROM public.quizzes q WHERE q.id = _quiz_id;
  INSERT INTO public.quiz_attempts(user_id, quiz_id, score, passed, answers)
    VALUES (v_profile_id, _quiz_id, v_score, v_passed, COALESCE(_answers, '[]'::jsonb));
  RETURN QUERY SELECT v_score, v_passed;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_course_session(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_course_session(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.submit_module_quiz(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_module_quiz(UUID, JSONB) TO authenticated;
REVOKE INSERT, UPDATE ON public.user_progress FROM authenticated;
GRANT SELECT ON public.user_progress TO authenticated;
REVOKE INSERT ON public.quiz_attempts FROM authenticated;
GRANT SELECT ON public.quiz_attempts TO authenticated;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'courses' AND policyname = 'Admins can view all courses') THEN
    CREATE POLICY "Admins can view all courses" ON public.courses FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

CREATE POLICY "Enrolled students upload practical projects" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'practical-projects'
  AND (storage.foldername(name))[1] = public.get_profile_id(auth.uid())::TEXT
  AND EXISTS (SELECT 1 FROM public.enrollments e WHERE e.user_id = public.get_profile_id(auth.uid()) AND e.course_id::TEXT = (storage.foldername(name))[2])
);
CREATE POLICY "Students and course instructors access practical projects" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'practical-projects'
  AND (
    (storage.foldername(name))[1] = public.get_profile_id(auth.uid())::TEXT
    OR EXISTS (SELECT 1 FROM public.courses c WHERE c.id::TEXT = (storage.foldername(name))[2] AND c.instructor_id = public.get_profile_id(auth.uid()))
  )
);