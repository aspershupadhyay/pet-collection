-- Petcraft community backend (Supabase / Postgres).
-- Run once in the Supabase SQL editor, then set VITE_SUPABASE_URL and
-- VITE_SUPABASE_ANON_KEY for the build (GitHub → Settings → Secrets → Actions).

-- ── Showcase submissions ────────────────────────────────────────────────
create table if not exists public.works (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null check (char_length(title) between 2 and 80),
  description text not null default '' check (char_length(description) <= 400),
  author_name text not null check (char_length(author_name) between 1 and 60),
  category    text not null default 'Other' check (category in ('Character', 'Setup', 'Theme', 'Cursor', 'Other')),
  media_type  text not null check (media_type in ('image', 'video')),
  media_url   text not null check (media_url ~ '^https://'),
  link        text check (link is null or link ~ '^https://'),
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at  timestamptz not null default now()
);

create index if not exists works_status_created on public.works (status, created_at desc);

alter table public.works enable row level security;

-- Everyone sees approved work; you also see your own while it's in review.
drop policy if exists "works readable" on public.works;
create policy "works readable" on public.works
  for select using (status = 'approved' or user_id = auth.uid());

-- Signed-in users can submit, always as themselves and always into review.
drop policy if exists "works insert own" on public.works;
create policy "works insert own" on public.works
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

-- Approve from the dashboard (Table editor → works → status = approved);
-- the service role bypasses RLS, so no update policy is needed.

-- ── View counts ─────────────────────────────────────────────────────────
create table if not exists public.item_views (
  item_key text primary key check (char_length(item_key) <= 120),
  count    bigint not null default 0
);

alter table public.item_views enable row level security;

drop policy if exists "views readable" on public.item_views;
create policy "views readable" on public.item_views for select using (true);

-- Writes only through this function, one increment per call.
create or replace function public.record_view(item_key text)
returns bigint
language sql
security definer
set search_path = public
as $$
  insert into public.item_views as v (item_key, count)
  values (record_view.item_key, 1)
  on conflict (item_key) do update set count = v.count + 1
  returning v.count;
$$;

revoke all on function public.record_view(text) from public;
grant execute on function public.record_view(text) to anon, authenticated;

-- ── Preview uploads (images and screen recordings) ──────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('previews', 'previews', true, 26214400,
        array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do nothing;

-- Upload only into your own folder: previews/<user id>/<file>
drop policy if exists "previews upload own" on storage.objects;
create policy "previews upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'previews' and (storage.foldername(name))[1] = auth.uid()::text);
