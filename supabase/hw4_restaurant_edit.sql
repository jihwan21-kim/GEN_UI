-- Apply after hw4_restaurants.sql. No existing rows are changed.
begin;
grant update (name, category, address, photo_path) on public.restaurants to authenticated;
drop policy if exists restaurants_update_own on public.restaurants;
create policy restaurants_update_own on public.restaurants for update to authenticated
using (created_by = (select auth.uid()))
with check (
  created_by = (select auth.uid())
  and char_length(trim(name)) between 2 and 100
  and char_length(trim(category)) between 2 and 50
  and char_length(trim(address)) between 5 and 200
  and (photo_path is null or (photo_path like (select auth.uid())::text || '/%' and char_length(photo_path) <= 200))
);
commit;
