-- ===== profiles: ban flag + admin access =====
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ban_reason text;

CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== user_roles: admin management =====
GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
CREATE POLICY "user_roles_select_admin" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_insert_admin" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_delete_admin" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ===== blocks =====
CREATE TABLE public.blocks (
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks_select_own" ON public.blocks FOR SELECT TO authenticated USING (auth.uid() = blocker_id);
CREATE POLICY "blocks_insert_own" ON public.blocks FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "blocks_delete_own" ON public.blocks FOR DELETE TO authenticated USING (auth.uid() = blocker_id);

CREATE OR REPLACE FUNCTION public.is_blocked(a uuid, b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocks x
    WHERE (x.blocker_id = a AND x.blocked_id = b) OR (x.blocker_id = b AND x.blocked_id = a)
  );
$$;
REVOKE ALL ON FUNCTION public.is_blocked(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_blocked(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_active_member(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT COALESCE((SELECT p.is_banned FROM public.profiles p WHERE p.id = _user_id), false);
$$;
REVOKE ALL ON FUNCTION public.is_active_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_member(uuid) TO authenticated, service_role;

-- ===== posts: image + moderation =====
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS image_url text;

DROP POLICY IF EXISTS "posts_insert_own" ON public.posts;
CREATE POLICY "posts_insert_own" ON public.posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_active_member(auth.uid()));
CREATE POLICY "posts_delete_admin" ON public.posts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ===== comments =====
CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 400),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX post_comments_post_idx ON public.post_comments (post_id, created_at);
GRANT SELECT, INSERT, DELETE ON public.post_comments TO authenticated;
GRANT ALL ON public.post_comments TO service_role;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_select_auth" ON public.post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert_own" ON public.post_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_active_member(auth.uid()));
CREATE POLICY "comments_delete_own" ON public.post_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ===== stories (24h) =====
CREATE TABLE public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text,
  media_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);
CREATE INDEX stories_expiry_idx ON public.stories (expires_at DESC);
GRANT SELECT, INSERT, DELETE ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stories_select_auth" ON public.stories FOR SELECT TO authenticated
  USING (expires_at > now() AND NOT public.is_blocked(auth.uid(), user_id));
CREATE POLICY "stories_insert_own" ON public.stories FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_active_member(auth.uid()));
CREATE POLICY "stories_delete_own" ON public.stories FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ===== messages: respect blocks and bans =====
DROP POLICY IF EXISTS "messages_insert_friend" ON public.messages;
CREATE POLICY "messages_insert_friend" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.are_friends(auth.uid(), recipient_id)
    AND NOT public.is_blocked(auth.uid(), recipient_id)
    AND public.is_active_member(auth.uid())
  );

-- ===== notifications =====
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications (user_id, created_at DESC);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.push_notification(_user_id uuid, _actor uuid, _type text, _title text, _body text, _link text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _user_id IS NULL OR _user_id = _actor THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link)
  VALUES (_user_id, _actor, _type, _title, _body, _link);
END; $$;
REVOKE ALL ON FUNCTION public.push_notification(uuid, uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE who text;
BEGIN
  SELECT coalesce(display_name, 'متدرّب') INTO who FROM public.profiles WHERE id = NEW.requester_id;
  IF TG_OP = 'INSERT' THEN
    PERFORM public.push_notification(NEW.addressee_id, NEW.requester_id, 'friend_request', 'طلب صداقة جديد', who || ' أرسل لك طلب صداقة', '/community');
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
    SELECT coalesce(display_name, 'متدرّب') INTO who FROM public.profiles WHERE id = NEW.addressee_id;
    PERFORM public.push_notification(NEW.requester_id, NEW.addressee_id, 'friend_accept', 'تم قبول طلب الصداقة', who || ' قبل طلب صداقتك', '/community');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER friendships_notify AFTER INSERT OR UPDATE ON public.friendships
FOR EACH ROW EXECUTE FUNCTION public.notify_friend_request();

CREATE OR REPLACE FUNCTION public.notify_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE who text;
BEGIN
  SELECT coalesce(display_name, 'متدرّب') INTO who FROM public.profiles WHERE id = NEW.sender_id;
  PERFORM public.push_notification(NEW.recipient_id, NEW.sender_id, 'message', 'رسالة جديدة', who || ' أرسل لك رسالة', '/community');
  RETURN NEW;
END; $$;
CREATE TRIGGER messages_notify AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_message();

CREATE OR REPLACE FUNCTION public.notify_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id uuid; who text;
BEGIN
  SELECT user_id INTO owner_id FROM public.posts WHERE id = NEW.post_id;
  SELECT coalesce(display_name, 'متدرّب') INTO who FROM public.profiles WHERE id = NEW.user_id;
  PERFORM public.push_notification(owner_id, NEW.user_id, 'like', 'إعجاب جديد', who || ' أعجب بمنشورك', '/community');
  RETURN NEW;
END; $$;
CREATE TRIGGER post_likes_notify AFTER INSERT ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.notify_like();

CREATE OR REPLACE FUNCTION public.notify_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id uuid; who text;
BEGIN
  SELECT user_id INTO owner_id FROM public.posts WHERE id = NEW.post_id;
  SELECT coalesce(display_name, 'متدرّب') INTO who FROM public.profiles WHERE id = NEW.user_id;
  PERFORM public.push_notification(owner_id, NEW.user_id, 'comment', 'تعليق جديد', who || ' علّق على منشورك', '/community');
  RETURN NEW;
END; $$;
CREATE TRIGGER post_comments_notify AFTER INSERT ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.notify_comment();

-- ===== certificates: admin review =====
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_note text;
ALTER TABLE public.certificates
  ADD CONSTRAINT certificates_status_check CHECK (status IN ('pending','approved','rejected'));
GRANT UPDATE ON public.certificates TO authenticated;
CREATE POLICY "certificates_select_admin" ON public.certificates FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "certificates_update_admin" ON public.certificates FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.verify_certificate(p_serial text)
RETURNS TABLE (serial text, recipient_name text, course_title text, path_id text, lessons_completed int, quiz_average int, issued_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.serial, c.recipient_name, c.course_title, c.path_id, c.lessons_completed, c.quiz_average, c.issued_at
  FROM public.certificates c
  WHERE upper(trim(c.serial)) = upper(trim(p_serial))
    AND c.status = 'approved'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.notify_certificate_review()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'approved' THEN
      PERFORM public.push_notification(NEW.user_id, NEW.reviewed_by, 'certificate', 'تم اعتماد شهادتك', 'شهادة ' || NEW.course_title || ' جاهزة للتحميل', '/certificate/' || NEW.serial);
    ELSIF NEW.status = 'rejected' THEN
      PERFORM public.push_notification(NEW.user_id, NEW.reviewed_by, 'certificate', 'تمت مراجعة شهادتك', coalesce(NEW.review_note, 'لم يتم اعتماد الشهادة حاليًا'), '/certificates');
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER certificates_notify AFTER UPDATE ON public.certificates
FOR EACH ROW EXECUTE FUNCTION public.notify_certificate_review();

-- ===== products catalog (admin managed, Play-ready) =====
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  kind text NOT NULL DEFAULT 'one_time' CHECK (kind IN ('one_time','subscription')),
  provider text NOT NULL DEFAULT 'google_play',
  play_status text NOT NULL DEFAULT 'draft' CHECK (play_status IN ('draft','pending','published','error')),
  play_synced_at timestamptz,
  play_error text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_select_active" ON public.products FOR SELECT TO anon, authenticated USING (active);
CREATE POLICY "products_admin_all" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER products_set_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== redeem codes =====
CREATE TABLE public.redeem_codes (
  code text PRIMARY KEY,
  product_id text NOT NULL,
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.redeem_codes TO authenticated;
GRANT ALL ON public.redeem_codes TO service_role;
ALTER TABLE public.redeem_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "redeem_admin_all" ON public.redeem_codes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== blocked-aware feed =====
DROP FUNCTION IF EXISTS public.community_feed(int,int);
DROP FUNCTION IF EXISTS public.search_profiles(text);
CREATE OR REPLACE FUNCTION public.community_feed(p_limit int DEFAULT 30, p_offset int DEFAULT 0)
RETURNS TABLE (id uuid, user_id uuid, content text, image_url text, created_at timestamptz, display_name text, avatar_url text, likes int, comments int, liked boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.user_id, p.content, p.image_url, p.created_at,
         coalesce(pr.display_name, 'متدرّب') AS display_name,
         pr.avatar_url,
         (SELECT count(*)::int FROM public.post_likes l WHERE l.post_id = p.id) AS likes,
         (SELECT count(*)::int FROM public.post_comments c WHERE c.post_id = p.id) AS comments,
         EXISTS (SELECT 1 FROM public.post_likes l WHERE l.post_id = p.id AND l.user_id = auth.uid()) AS liked
  FROM public.posts p
  LEFT JOIN public.profiles pr ON pr.id = p.user_id
  WHERE auth.uid() IS NOT NULL
    AND NOT public.is_blocked(auth.uid(), p.user_id)
    AND coalesce(pr.is_banned, false) = false
  ORDER BY p.created_at DESC
  LIMIT least(coalesce(p_limit,30), 50) OFFSET greatest(coalesce(p_offset,0),0);
$$;
REVOKE ALL ON FUNCTION public.community_feed(int,int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.community_feed(int,int) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.search_profiles(p_query text)
RETURNS TABLE (id uuid, display_name text, avatar_url text, friend_status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.display_name, p.avatar_url,
         coalesce((SELECT f.status FROM public.friendships f
                   WHERE (f.requester_id = auth.uid() AND f.addressee_id = p.id)
                      OR (f.addressee_id = auth.uid() AND f.requester_id = p.id)
                   LIMIT 1), 'none') AS friend_status
  FROM public.profiles p
  WHERE p.id <> auth.uid()
    AND coalesce(p.is_banned, false) = false
    AND NOT public.is_blocked(auth.uid(), p.id)
    AND coalesce(p.display_name,'') ILIKE '%' || trim(p_query) || '%'
    AND length(trim(p_query)) >= 2
  ORDER BY p.display_name
  LIMIT 20;
$$;
REVOKE ALL ON FUNCTION public.search_profiles(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_profiles(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.active_stories()
RETURNS TABLE (id uuid, user_id uuid, content text, media_url text, created_at timestamptz, expires_at timestamptz, display_name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.user_id, s.content, s.media_url, s.created_at, s.expires_at,
         coalesce(pr.display_name, 'متدرّب'), pr.avatar_url
  FROM public.stories s
  LEFT JOIN public.profiles pr ON pr.id = s.user_id
  WHERE auth.uid() IS NOT NULL
    AND s.expires_at > now()
    AND NOT public.is_blocked(auth.uid(), s.user_id)
    AND coalesce(pr.is_banned, false) = false
  ORDER BY s.created_at DESC
  LIMIT 60;
$$;
REVOKE ALL ON FUNCTION public.active_stories() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.active_stories() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.post_comments_feed(p_post_id uuid)
RETURNS TABLE (id uuid, user_id uuid, content text, created_at timestamptz, display_name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.user_id, c.content, c.created_at,
         coalesce(pr.display_name, 'متدرّب'), pr.avatar_url
  FROM public.post_comments c
  LEFT JOIN public.profiles pr ON pr.id = c.user_id
  WHERE auth.uid() IS NOT NULL
    AND c.post_id = p_post_id
    AND NOT public.is_blocked(auth.uid(), c.user_id)
  ORDER BY c.created_at ASC
  LIMIT 200;
$$;
REVOKE ALL ON FUNCTION public.post_comments_feed(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.post_comments_feed(uuid) TO authenticated, service_role;

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;