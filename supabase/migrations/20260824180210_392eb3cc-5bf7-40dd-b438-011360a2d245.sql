CREATE TABLE public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  audio_url text,
  video_url text,
  image_url text,
  published boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.course_lessons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_lessons TO authenticated;
GRANT ALL ON public.course_lessons TO service_role;

ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published lessons are readable by everyone"
ON public.course_lessons FOR SELECT
USING (published OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert lessons"
ON public.course_lessons FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update lessons"
ON public.course_lessons FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete lessons"
ON public.course_lessons FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER course_lessons_updated_at
BEFORE UPDATE ON public.course_lessons
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX course_lessons_course_idx ON public.course_lessons (course_id, position);

CREATE TABLE public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL DEFAULT 'android',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_tokens TO authenticated;
GRANT ALL ON public.push_tokens TO service_role;

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own push tokens"
ON public.push_tokens FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER push_tokens_updated_at
BEFORE UPDATE ON public.push_tokens
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS template text NOT NULL DEFAULT 'imperial';

CREATE POLICY "Admins issue certificates manually"
ON public.certificates FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));