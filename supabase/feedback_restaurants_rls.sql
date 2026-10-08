-- Apply in Supabase SQL Editor after checking existing policies.
-- Restrict restaurant changes to the authenticated creator.
alter table public.restaurants enable row level security;

-- Remove permissive write policies; leave existing SELECT policies intact.
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'restaurants'
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  loop
    execute format('drop policy if exists %I on public.restaurants', p.policyname);
  end loop;
end $$;

create policy "restaurants_insert_own"
on public.restaurants for insert to authenticated
with check (created_by = (select auth.uid()));

create policy "restaurants_update_own"
on public.restaurants for update to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

create policy "restaurants_delete_own"
on public.restaurants for delete to authenticated
using (created_by = (select auth.uid()));

-- Keep a public read policy if the app is meant to show restaurants to visitors.
-- Existing SELECT policies are deliberately unchanged.
