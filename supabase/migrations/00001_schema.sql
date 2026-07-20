CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  user_type TEXT CHECK (user_type IN ('student', 'experienced')),
  college_name TEXT,
  degree TEXT,
  graduation_year TEXT,
  current_role TEXT,
  experience_years INTEGER,
  industry TEXT,
  current_company TEXT,
  desired_role TEXT,
  desired_company TEXT,
  desired_industry TEXT,
  salary_range TEXT,
  work_type TEXT CHECK (work_type IN ('remote', 'hybrid', 'onsite')),
  github_connected BOOLEAN DEFAULT false,
  github_token TEXT,
  linkedin_connected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE TABLE resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Resume',
  template TEXT NOT NULL DEFAULT 'modern' CHECK (template IN ('ats-professional', 'modern', 'student', 'minimal')),
  personal_info JSONB DEFAULT '{}'::jsonb,
  summary TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own resumes"
  ON resumes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own resumes"
  ON resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes"
  ON resumes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes"
  ON resumes FOR DELETE
  USING (auth.uid() = user_id);

CREATE TABLE education (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
  institution TEXT NOT NULL,
  degree TEXT NOT NULL,
  field TEXT DEFAULT '',
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  cgpa TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage education of own resumes"
  ON education FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM resumes WHERE resumes.id = education.resume_id AND resumes.user_id = auth.uid()
    )
  );

CREATE TABLE experience (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  location TEXT DEFAULT '',
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  current BOOLEAN DEFAULT false,
  responsibilities JSONB DEFAULT '[]'::jsonb,
  achievements JSONB DEFAULT '[]'::jsonb,
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE experience ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage experience of own resumes"
  ON experience FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM resumes WHERE resumes.id = experience.resume_id AND resumes.user_id = auth.uid()
    )
  );

CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  technologies JSONB DEFAULT '[]'::jsonb,
  live_url TEXT DEFAULT '',
  github_url TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage projects of own resumes"
  ON projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM resumes WHERE resumes.id = projects.resume_id AND resumes.user_id = auth.uid()
    )
  );

CREATE TABLE skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
  technical JSONB DEFAULT '[]'::jsonb,
  soft JSONB DEFAULT '[]'::jsonb,
  tools JSONB DEFAULT '[]'::jsonb,
  frameworks JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage skills of own resumes"
  ON skills FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM resumes WHERE resumes.id = skills.resume_id AND resumes.user_id = auth.uid()
    )
  );

CREATE TABLE certifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  issuer TEXT DEFAULT '',
  date TEXT DEFAULT '',
  url TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage certifications of own resumes"
  ON certifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM resumes WHERE resumes.id = certifications.resume_id AND resumes.user_id = auth.uid()
    )
  );

CREATE TABLE achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  date TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage achievements of own resumes"
  ON achievements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM resumes WHERE resumes.id = achievements.resume_id AND resumes.user_id = auth.uid()
    )
  );

CREATE TABLE languages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  proficiency TEXT CHECK (proficiency IN ('native', 'fluent', 'advanced', 'intermediate', 'basic')),
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage languages of own resumes"
  ON languages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM resumes WHERE resumes.id = languages.resume_id AND resumes.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
