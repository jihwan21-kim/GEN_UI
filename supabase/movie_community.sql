-- OneLine Cinema community expansion. Run AFTER supabase/movie_oneliners.sql.
-- Additive: no changes to the existing restaurant application or private drafts.
-- Public information is strictly the handle, bio, avatar and aggregate counts.
begin;

create table if not exists public.movie_public_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique
    check (handle ~ '^[a-z][a-z0-9_]{2,19}$')
    check (handle not in ('admin', 'support', 'moderator', 'official')),
  bio text not null default '' check (char_length(bio) <= 280),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 2048),
  created_at timestamptz not null default now()
);

alter table public.movie_public_profiles enable row level security;
revoke all on public.movie_public_profiles from anon, authenticated;
grant select (user_id, handle, bio, avatar_url, created_at)
  on public.movie_public_profiles to anon, authenticated;
grant insert (user_id, handle, bio, avatar_url)
  on public.movie_public_profiles to authenticated;
grant update (handle, bio, avatar_url)
  on public.movie_public_profiles to authenticated;

drop policy if exists cinema_profiles_public_read on public.movie_public_profiles;
drop policy if exists cinema_profiles_insert_own on public.movie_public_profiles;
drop policy if exists cinema_profiles_update_own on public.movie_public_profiles;
create policy cinema_profiles_public_read on public.movie_public_profiles
  for select to anon, authenticated using (true);
create policy cinema_profiles_insert_own on public.movie_public_profiles
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy cinema_profiles_update_own on public.movie_public_profiles
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- The review's author identifier is needed to link a public review to its
-- public profile. Do NOT expose draft_id or drafts, and never expose email.
grant select (user_id) on public.movie_reviews to anon, authenticated;
create index if not exists movie_reviews_author_idx
  on public.movie_reviews (user_id, created_at desc);

-- Counts are computed by a limited SECURITY DEFINER function. Individual
-- voters remain private. A film's #1 includes positive-score ties, based on
-- likes minus dislikes, and counts each leading review once.
create or replace function public.movie_author_stats()
returns table (
  user_id uuid,
  handle text,
  bio text,
  avatar_url text,
  published_count bigint,
  likes_received bigint,
  net_votes bigint,
  top_reviews bigint
)
language sql stable security definer set search_path = ''
as $$
  with scores as (
    select
      r.id,
      r.user_id,
      r.movie_id,
      count(v.review_id) filter (where v.value = 1)::bigint as likes,
      count(v.review_id) filter (where v.value = -1)::bigint as dislikes
    from public.movie_reviews r
    left join public.movie_review_votes v on v.review_id = r.id
    group by r.id, r.user_id, r.movie_id
  ),
  leaders as (
    select
      s.*,
      max(s.likes - s.dislikes) over (partition by s.movie_id) as winning_score
    from scores s
  ),
  totals as (
    select
      l.user_id,
      count(*)::bigint as published_count,
      sum(l.likes)::bigint as likes_received,
      sum(l.likes - l.dislikes)::bigint as net_votes,
      count(*) filter (
        where l.likes - l.dislikes = l.winning_score
          and l.winning_score > 0
      )::bigint as top_reviews
    from leaders l
    group by l.user_id
  )
  -- Start with the authors of PUBLISHED reviews, not registered public
  -- profiles, or existing #1 reviews vanish from leaderboards until a user
  -- creates an @handle. Anonymous creators have NULL handle/bio/avatar.
  select
    t.user_id, p.handle, p.bio, p.avatar_url,
    t.published_count::bigint,
    t.likes_received::bigint,
    t.net_votes::bigint,
    t.top_reviews::bigint
  from totals t
  left join public.movie_public_profiles p on p.user_id = t.user_id;
$$;
revoke all on function public.movie_author_stats() from public;
grant execute on function public.movie_author_stats() to anon, authenticated;

commit;
