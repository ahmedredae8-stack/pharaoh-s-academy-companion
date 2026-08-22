-- ============ CERTIFICATES ============
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_id text NOT NULL,
  course_title text NOT NULL,
  recipient_name text NOT NULL,
  serial text NOT NULL UNIQUE DEFAULT ('PH-' || upper(substr(encode(gen_random_bytes(6),'hex'),1,10))),
  lessons_completed int NOT NULL DEFAULT 0,
  quiz_average int NOT NULL DEFAULT 0,
  issued_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, path_id)
);
GRANT SELECT, INSERT ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "certificates_select_own" ON public.certificates FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "certificates_insert_own" ON public.certificates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.verify_certificate(p_serial text)
RETURNS TABLE (serial text, recipient_name text, course_title text, path_id text, lessons_completed int, quiz_average int, issued_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.serial, c.recipient_name, c.course_title, c.path_id, c.lessons_completed, c.quiz_average, c.issued_at
  FROM public.certificates c
  WHERE upper(trim(c.serial)) = upper(trim(p_serial))
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.verify_certificate(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated, service_role;

-- ============ COMMUNITY: PUBLIC PROFILE LOOKUP ============
CREATE OR REPLACE FUNCTION public.search_profiles(p_query text)
RETURNS TABLE (id uuid, display_name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.display_name, p.avatar_url
  FROM public.profiles p
  WHERE p.id <> auth.uid()
    AND coalesce(p.display_name,'') ILIKE '%' || trim(p_query) || '%'
    AND length(trim(p_query)) >= 2
  ORDER BY p.display_name
  LIMIT 20;
$$;
REVOKE ALL ON FUNCTION public.search_profiles(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_profiles(text) TO authenticated, service_role;

-- ============ POSTS ============
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 2 AND 600),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX posts_created_idx ON public.posts (created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_select_auth" ON public.posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "posts_insert_own" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_delete_own" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.post_likes (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.post_likes TO authenticated;
GRANT ALL ON public.post_likes TO service_role;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes_select_auth" ON public.post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "likes_insert_own" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_own" ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.guard_post_spam()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE recent int; last_at timestamptz; dup int;
BEGIN
  SELECT count(*), max(created_at) INTO recent, last_at
  FROM public.posts WHERE user_id = NEW.user_id AND created_at > now() - interval '10 minutes';
  IF recent >= 5 THEN
    RAISE EXCEPTION 'RATE_LIMIT: too many posts, try again later';
  END IF;
  IF last_at IS NOT NULL AND last_at > now() - interval '20 seconds' THEN
    RAISE EXCEPTION 'RATE_LIMIT: posting too fast';
  END IF;
  SELECT count(*) INTO dup FROM public.posts
  WHERE user_id = NEW.user_id AND lower(btrim(content)) = lower(btrim(NEW.content))
    AND created_at > now() - interval '24 hours';
  IF dup > 0 THEN
    RAISE EXCEPTION 'DUPLICATE: identical post already published';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER posts_spam_guard BEFORE INSERT ON public.posts FOR EACH ROW EXECUTE FUNCTION public.guard_post_spam();

-- ============ FRIENDSHIPS ============
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (requester_id <> addressee_id),
  UNIQUE (requester_id, addressee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "friendships_select_mine" ON public.friendships FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "friendships_insert_own" ON public.friendships FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "friendships_update_party" ON public.friendships FOR UPDATE TO authenticated
  USING (auth.uid() = addressee_id OR auth.uid() = requester_id)
  WITH CHECK (auth.uid() = addressee_id OR auth.uid() = requester_id);
CREATE POLICY "friendships_delete_party" ON public.friendships FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE OR REPLACE FUNCTION public.are_friends(a uuid, b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE f.status = 'accepted'
      AND ((f.requester_id = a AND f.addressee_id = b) OR (f.requester_id = b AND f.addressee_id = a))
  );
$$;
REVOKE ALL ON FUNCTION public.are_friends(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.are_friends(uuid, uuid) TO authenticated, service_role;

-- ============ DIRECT MESSAGES ============
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  CHECK (sender_id <> recipient_id)
);
CREATE INDEX messages_pair_idx ON public.messages (sender_id, recipient_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_select_party" ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "messages_insert_friend" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND public.are_friends(auth.uid(), recipient_id));
CREATE POLICY "messages_update_recipient" ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);

CREATE OR REPLACE FUNCTION public.guard_message_spam()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE recent int;
BEGIN
  SELECT count(*) INTO recent FROM public.messages
  WHERE sender_id = NEW.sender_id AND created_at > now() - interval '1 minute';
  IF recent >= 20 THEN
    RAISE EXCEPTION 'RATE_LIMIT: too many messages, slow down';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER messages_spam_guard BEFORE INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.guard_message_spam();

CREATE OR REPLACE FUNCTION public.community_feed(p_limit int DEFAULT 30, p_offset int DEFAULT 0)
RETURNS TABLE (id uuid, user_id uuid, content text, created_at timestamptz, display_name text, avatar_url text, likes int, liked boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.user_id, p.content, p.created_at,
         coalesce(pr.display_name, 'متدرّب') AS display_name,
         pr.avatar_url,
         (SELECT count(*)::int FROM public.post_likes l WHERE l.post_id = p.id) AS likes,
         EXISTS (SELECT 1 FROM public.post_likes l WHERE l.post_id = p.id AND l.user_id = auth.uid()) AS liked
  FROM public.posts p
  LEFT JOIN public.profiles pr ON pr.id = p.user_id
  WHERE auth.uid() IS NOT NULL
  ORDER BY p.created_at DESC
  LIMIT least(coalesce(p_limit,30), 50) OFFSET greatest(coalesce(p_offset,0),0);
$$;
REVOKE ALL ON FUNCTION public.community_feed(int,int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.community_feed(int,int) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.my_friends()
RETURNS TABLE (friendship_id uuid, user_id uuid, display_name text, avatar_url text, status text, direction text, unread int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT f.id,
         CASE WHEN f.requester_id = auth.uid() THEN f.addressee_id ELSE f.requester_id END AS user_id,
         coalesce(pr.display_name, 'متدرّب'), pr.avatar_url, f.status,
         CASE WHEN f.requester_id = auth.uid() THEN 'outgoing' ELSE 'incoming' END AS direction,
         (SELECT count(*)::int FROM public.messages m
           WHERE m.recipient_id = auth.uid() AND m.read_at IS NULL
             AND m.sender_id = CASE WHEN f.requester_id = auth.uid() THEN f.addressee_id ELSE f.requester_id END) AS unread
  FROM public.friendships f
  LEFT JOIN public.profiles pr
    ON pr.id = CASE WHEN f.requester_id = auth.uid() THEN f.addressee_id ELSE f.requester_id END
  WHERE auth.uid() IN (f.requester_id, f.addressee_id)
  ORDER BY f.updated_at DESC;
$$;
REVOKE ALL ON FUNCTION public.my_friends() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_friends() TO authenticated, service_role;