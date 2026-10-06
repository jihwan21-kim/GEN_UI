-- Apply once after hw4.sql. Re-runnable; preserves existing restaurants/captions/votes.
begin;
alter table public.restaurants
  add column if not exists address text,
  add column if not exists photo_path text,
  add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.restaurants enable row level security;
create unique index if not exists restaurants_name_address_unique
  on public.restaurants (lower(trim(name)), lower(trim(coalesce(address, ''))));
grant insert (name, category, address, photo_path, created_by) on public.restaurants to authenticated;
-- Grant only the restaurants identity/serial sequence, if one exists.
do $$ declare seq text; begin
  seq := pg_get_serial_sequence('public.restaurants', 'id');
  if seq is not null then execute format('grant usage on sequence %s to authenticated', seq); end if;
end $$;
drop policy if exists restaurants_insert_own on public.restaurants;
create policy restaurants_insert_own on public.restaurants for insert to authenticated
with check (
  created_by = (select auth.uid())
  and char_length(trim(name)) between 2 and 100
  and char_length(trim(category)) between 2 and 50
  and char_length(trim(address)) between 5 and 200
  and (photo_path is null or (photo_path like (select auth.uid())::text || '/%' and char_length(photo_path) <= 200))
);
-- Votes may change value or be cancelled; identity and caption cannot be changed.
grant update (value), delete on public.votes to authenticated;
drop policy if exists votes_update_own on public.votes;
drop policy if exists votes_delete_own on public.votes;
create policy votes_update_own on public.votes for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy votes_delete_own on public.votes for delete to authenticated
using (user_id = (select auth.uid()));
-- Public counts, never voter identities; count all captions for restaurant ranking.
create or replace function public.restaurant_popularity()
returns table (restaurant_id bigint, likes bigint, dislikes bigint)
language sql stable security definer set search_path = '' as $$
 select g.restaurant_id, count(v.id) filter (where v.value = 1), count(v.id) filter (where v.value = -1)
 from public.generations g join public.votes v on v.generation_id = g.id
 where g.restaurant_id is not null group by g.restaurant_id
 having count(v.id) filter (where v.value = 1) > 0
 order by count(v.id) filter (where v.value = 1) - count(v.id) filter (where v.value = -1) desc,
 count(v.id) filter (where v.value = 1) desc, g.restaurant_id asc limit 3;
$$;
revoke all on function public.restaurant_popularity() from public;
grant execute on function public.restaurant_popularity() to anon, authenticated;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('restaurant-photos', 'restaurant-photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists restaurant_photo_upload on storage.objects;
create policy restaurant_photo_upload on storage.objects for insert to authenticated
with check (bucket_id = 'restaurant-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists restaurant_photo_read_own on storage.objects;
create policy restaurant_photo_read_own on storage.objects for select to authenticated
using (bucket_id = 'restaurant-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists restaurant_photo_delete on storage.objects;
create policy restaurant_photo_delete on storage.objects for delete to authenticated
using (bucket_id = 'restaurant-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
commit;
