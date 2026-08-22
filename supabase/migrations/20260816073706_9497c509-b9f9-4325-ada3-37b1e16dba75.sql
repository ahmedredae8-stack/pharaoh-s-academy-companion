create or replace function public.leaderboard_top(_limit int default 50)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  labs bigint,
  quiz_points bigint,
  xp bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id as user_id,
    coalesce(p.display_name, 'مجنّد مجهول') as display_name,
    p.avatar_url,
    coalesce(l.labs, 0) as labs,
    coalesce(q.points, 0) as quiz_points,
    coalesce(l.labs, 0) * 20 + coalesce(q.points, 0) * 10 as xp
  from public.profiles p
  left join (
    select user_id, count(*) as labs from public.lab_completions group by user_id
  ) l on l.user_id = p.id
  left join (
    select user_id, sum(score) as points from public.quiz_results group by user_id
  ) q on q.user_id = p.id
  order by xp desc, display_name asc
  limit greatest(1, least(coalesce(_limit, 50), 100));
$$;

revoke all on function public.leaderboard_top(int) from public, anon;
grant execute on function public.leaderboard_top(int) to authenticated;
grant execute on function public.leaderboard_top(int) to service_role;