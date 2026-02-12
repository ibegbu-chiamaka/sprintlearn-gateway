
-- Add category column to courses
ALTER TABLE public.courses ADD COLUMN category text DEFAULT 'general';
