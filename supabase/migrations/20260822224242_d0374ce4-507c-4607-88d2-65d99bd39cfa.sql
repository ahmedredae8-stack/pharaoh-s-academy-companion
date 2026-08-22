ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS signature_name text,
  ADD COLUMN IF NOT EXISTS signature_title text,
  ADD COLUMN IF NOT EXISTS signature_url text,
  ADD COLUMN IF NOT EXISTS honors text;

DROP FUNCTION IF EXISTS public.verify_certificate(text);

CREATE FUNCTION public.verify_certificate(p_serial text)
 RETURNS TABLE(serial text, recipient_name text, course_title text, path_id text, lessons_completed integer, quiz_average integer, issued_at timestamp with time zone, signature_name text, signature_title text, signature_url text, honors text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT c.serial, c.recipient_name, c.course_title, c.path_id, c.lessons_completed, c.quiz_average, c.issued_at,
         c.signature_name, c.signature_title, c.signature_url, c.honors
  FROM public.certificates c
  WHERE upper(trim(c.serial)) = upper(trim(p_serial))
    AND c.status = 'approved'
  LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION public.verify_certificate(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated, service_role;