-- Create storage bucket for practical submissions
INSERT INTO storage.buckets (id, name, public) 
VALUES ('practical-submissions', 'practical-submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for practical submissions
CREATE POLICY "Students can upload their submissions"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'practical-submissions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view submissions"
ON storage.objects FOR SELECT
USING (bucket_id = 'practical-submissions');

-- Add unique constraint for user_progress upsert
ALTER TABLE public.user_progress 
ADD CONSTRAINT user_progress_user_session_unique 
UNIQUE (user_id, session_id);

-- Add unique constraint for practical_submissions
ALTER TABLE public.practical_submissions
ADD CONSTRAINT practical_submissions_student_course_unique
UNIQUE (student_id, course_id);