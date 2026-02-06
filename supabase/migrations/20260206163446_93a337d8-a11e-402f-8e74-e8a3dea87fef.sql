-- Create role enum for users
CREATE TYPE public.user_role AS ENUM ('student', 'instructor');

-- Create app_role enum for admin access
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create submission status enum
CREATE TYPE public.submission_status AS ENUM ('pending', 'pass', 'fail');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'student',
    is_verified_expert BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table for admin access (following security best practices)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Create courses table
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    instructor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    price DECIMAL(10, 2) DEFAULT 0,
    is_practical BOOLEAN DEFAULT FALSE,
    thumbnail_url TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create modules table
CREATE TABLE public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    video_url TEXT,
    duration_minutes INTEGER,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quizzes table (one per module)
CREATE TABLE public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL UNIQUE,
    title TEXT NOT NULL,
    passing_score INTEGER DEFAULT 65,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz questions table
CREATE TABLE public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of options
    correct_answer INTEGER NOT NULL, -- Index of correct option
    order_index INTEGER NOT NULL DEFAULT 0
);

-- Create enrollments table
CREATE TABLE public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (user_id, course_id)
);

-- Create user progress table
CREATE TABLE public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (user_id, session_id)
);

-- Create quiz attempts table
CREATE TABLE public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
    score INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    answers JSONB,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create practical submissions table
CREATE TABLE public.practical_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT,
    feedback TEXT,
    status submission_status DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (student_id, course_id)
);

-- Create instructor revenue table
CREATE TABLE public.instructor_revenue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create withdrawal requests table
CREATE TABLE public.withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create verification requests table for instructors
CREATE TABLE public.verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    documents_url TEXT,
    status TEXT DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practical_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    )
$$;

-- Create function to get profile id from auth user
CREATE OR REPLACE FUNCTION public.get_profile_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM public.profiles WHERE user_id = _user_id
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies (admin only)
CREATE POLICY "Admins can manage user roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Courses policies
CREATE POLICY "Anyone can view published courses" ON public.courses FOR SELECT USING (is_published = true OR instructor_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Instructors can create courses" ON public.courses FOR INSERT WITH CHECK (instructor_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Instructors can update own courses" ON public.courses FOR UPDATE USING (instructor_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Instructors can delete own courses" ON public.courses FOR DELETE USING (instructor_id = public.get_profile_id(auth.uid()));

-- Modules policies
CREATE POLICY "Anyone can view modules of visible courses" ON public.modules FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses WHERE courses.id = modules.course_id AND (courses.is_published = true OR courses.instructor_id = public.get_profile_id(auth.uid())))
);
CREATE POLICY "Instructors can manage modules" ON public.modules FOR ALL USING (
    EXISTS (SELECT 1 FROM public.courses WHERE courses.id = modules.course_id AND courses.instructor_id = public.get_profile_id(auth.uid()))
);

-- Sessions policies
CREATE POLICY "Anyone can view sessions of visible courses" ON public.sessions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.modules m JOIN public.courses c ON c.id = m.course_id WHERE m.id = sessions.module_id AND (c.is_published = true OR c.instructor_id = public.get_profile_id(auth.uid())))
);
CREATE POLICY "Instructors can manage sessions" ON public.sessions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.modules m JOIN public.courses c ON c.id = m.course_id WHERE m.id = sessions.module_id AND c.instructor_id = public.get_profile_id(auth.uid()))
);

-- Quizzes policies
CREATE POLICY "Anyone can view quizzes of visible courses" ON public.quizzes FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.modules m JOIN public.courses c ON c.id = m.course_id WHERE m.id = quizzes.module_id AND (c.is_published = true OR c.instructor_id = public.get_profile_id(auth.uid())))
);
CREATE POLICY "Instructors can manage quizzes" ON public.quizzes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.modules m JOIN public.courses c ON c.id = m.course_id WHERE m.id = quizzes.module_id AND c.instructor_id = public.get_profile_id(auth.uid()))
);

-- Quiz questions policies
CREATE POLICY "Anyone can view quiz questions" ON public.quiz_questions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.quizzes q JOIN public.modules m ON m.id = q.module_id JOIN public.courses c ON c.id = m.course_id WHERE q.id = quiz_questions.quiz_id AND (c.is_published = true OR c.instructor_id = public.get_profile_id(auth.uid())))
);
CREATE POLICY "Instructors can manage quiz questions" ON public.quiz_questions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.quizzes q JOIN public.modules m ON m.id = q.module_id JOIN public.courses c ON c.id = m.course_id WHERE q.id = quiz_questions.quiz_id AND c.instructor_id = public.get_profile_id(auth.uid()))
);

-- Enrollments policies
CREATE POLICY "Users can view own enrollments" ON public.enrollments FOR SELECT USING (user_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Users can enroll themselves" ON public.enrollments FOR INSERT WITH CHECK (user_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Instructors can view enrollments for their courses" ON public.enrollments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses WHERE courses.id = enrollments.course_id AND courses.instructor_id = public.get_profile_id(auth.uid()))
);

-- User progress policies
CREATE POLICY "Users can view own progress" ON public.user_progress FOR SELECT USING (user_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Users can update own progress" ON public.user_progress FOR INSERT WITH CHECK (user_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Users can modify own progress" ON public.user_progress FOR UPDATE USING (user_id = public.get_profile_id(auth.uid()));

-- Quiz attempts policies
CREATE POLICY "Users can view own quiz attempts" ON public.quiz_attempts FOR SELECT USING (user_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Users can submit quiz attempts" ON public.quiz_attempts FOR INSERT WITH CHECK (user_id = public.get_profile_id(auth.uid()));

-- Practical submissions policies
CREATE POLICY "Students can view own submissions" ON public.practical_submissions FOR SELECT USING (student_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Students can submit projects" ON public.practical_submissions FOR INSERT WITH CHECK (student_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Students can update own submissions" ON public.practical_submissions FOR UPDATE USING (student_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Instructors can view submissions for their courses" ON public.practical_submissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses WHERE courses.id = practical_submissions.course_id AND courses.instructor_id = public.get_profile_id(auth.uid()))
);
CREATE POLICY "Instructors can grade submissions" ON public.practical_submissions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.courses WHERE courses.id = practical_submissions.course_id AND courses.instructor_id = public.get_profile_id(auth.uid()))
);

-- Instructor revenue policies
CREATE POLICY "Instructors can view own revenue" ON public.instructor_revenue FOR SELECT USING (instructor_id = public.get_profile_id(auth.uid()));

-- Withdrawal requests policies
CREATE POLICY "Instructors can view own withdrawals" ON public.withdrawal_requests FOR SELECT USING (instructor_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Instructors can request withdrawals" ON public.withdrawal_requests FOR INSERT WITH CHECK (instructor_id = public.get_profile_id(auth.uid()));

-- Verification requests policies
CREATE POLICY "Instructors can view own verification" ON public.verification_requests FOR SELECT USING (instructor_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Instructors can request verification" ON public.verification_requests FOR INSERT WITH CHECK (instructor_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Admins can manage verifications" ON public.verification_requests FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();