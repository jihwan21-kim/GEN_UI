-- Apply after hw3.sql in the existing project. Transactional and re-runnable.
begin;
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null check (char_length(topic) between 5 and 200),
  tone text not null check (tone in ('Dry humor', 'Chaotic', 'Wholesome')),
  caption text not null check (char_length(caption) between 1 and 240),
  prompt text not null check (char_length(prompt) between 1 and 2000),
  model text not null check (char_length(model) between 1 and 100),
  created_at timestamptz not null default now()
);
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.generations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  unique (generation_id, user_id)
);
create table if not exists public.generation_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  attempts integer not null default 1 check (attempts between 1 and 10),
  primary key (user_id, day)
);
-- Preserve earlier standalone captions; new captions must belong to a restaurant.
alter table public.generations add column if not exists restaurant_id bigint references public.restaurants(id);
create index if not exists generations_restaurant_idx on public.generations (restaurant_id, created_at desc);
create index if not exists generations_created_at_idx on public.generations (created_at desc);
create index if not exists votes_user_id_idx on public.votes (user_id);
-- All public tables have RLS. Unused tables without policies default to deny.
do $$ declare t record; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;
-- Remove legacy policies only on app-owned tables before tightening them.
do $$ declare p record; begin
  for p in select tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in ('profiles', 'restaurants', 'generations', 'votes', 'generation_usage') loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (id, first_name, last_name, avatar_url), update (first_name, last_name, avatar_url) on public.profiles to authenticated;
create policy profiles_read_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
revoke all on public.restaurants from anon, authenticated;
grant select on public.restaurants to anon, authenticated;
create policy restaurants_public_read on public.restaurants for select to anon, authenticated using (true);
revoke all on public.generations from anon, authenticated;
grant select on public.generations to anon, authenticated;
grant insert (user_id, restaurant_id, topic, tone, caption, prompt, model) on public.generations to authenticated;
create policy generations_public_read on public.generations for select to anon, authenticated using (true);
create policy generations_insert_own on public.generations for insert to authenticated with check ((select auth.uid()) = user_id and restaurant_id is not null);
revoke all on public.votes from anon, authenticated;
grant select on public.votes to authenticated;
grant insert (generation_id, user_id, value) on public.votes to authenticated;
create policy votes_read_own on public.votes for select to authenticated using ((select auth.uid()) = user_id);
create policy votes_insert_own on public.votes for insert to authenticated with check ((select auth.uid()) = user_id);
-- Counts are public, individual voting records are private.
create or replace function public.caption_scores()
returns table (generation_id uuid, upvotes bigint, downvotes bigint)
language sql stable security definer set search_path = '' as $$
  select g.id, count(v.id) filter (where v.value = 1), count(v.id) filter (where v.value = -1)
  from (select id from public.generations where restaurant_id is not null order by created_at desc limit 100) g
  left join public.votes v on v.generation_id = g.id group by g.id;
$$;
revoke all on function public.caption_scores() from public;
grant execute on function public.caption_scores() to anon, authenticated;
-- Atomic daily quota. Direct writes to counters are forbidden.
revoke all on public.generation_usage from anon, authenticated;
create or replace function public.claim_generation_attempt()
returns boolean language plpgsql security definer set search_path = '' as $$
declare claimed integer; begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into public.generation_usage (user_id, day, attempts)
  values (auth.uid(), (now() at time zone 'America/New_York')::date, 1)
  on conflict (user_id, day) do update set attempts = public.generation_usage.attempts + 1
    where public.generation_usage.attempts < 10
  returning attempts into claimed;
  return claimed is not null;
end $$;
revoke all on function public.claim_generation_attempt() from public;
grant execute on function public.claim_generation_attempt() to authenticated;
-- Supabase already enables RLS on storage.objects; do not ALTER this managed table.
drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar" on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));
commit;
-- Audit additional tables and policies after applying.
select schemaname, tablename, rowsecurity from pg_tables where schemaname in ('public', 'storage') order by schemaname, tablename;
select schemaname, tablename, policyname, roles, cmd, qual, with_check from pg_policies where schemaname in ('public', 'storage') order by tablename, policyname;
