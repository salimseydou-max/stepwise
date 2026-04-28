create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.student_profiles (
  id uuid primary key,
  username text not null default '',
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  language text not null default 'en' check (language in ('en', 'es', 'fr')),
  notifications_enabled boolean not null default true,
  ai_suggestions_enabled boolean not null default true,
  sound_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recent_searches (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.student_profiles(id) on delete cascade,
  query text not null check (char_length(btrim(query)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists recent_searches_profile_created_idx
  on public.recent_searches (profile_id, created_at desc);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.student_profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(btrim(content)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_profile_created_idx
  on public.chat_messages (profile_id, created_at asc);

create table if not exists public.completion_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.student_profiles(id) on delete cascade,
  completion_key text not null,
  question text not null,
  source_label text not null,
  points integer not null default 0 check (points >= 0),
  completed_at timestamptz not null default now(),
  day_key date not null default current_date,
  created_at timestamptz not null default now(),
  unique (profile_id, completion_key)
);

create index if not exists completion_entries_profile_completed_idx
  on public.completion_entries (profile_id, completed_at desc);

create table if not exists public.challenge_progress (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.student_profiles(id) on delete cascade,
  challenge_id text not null check (challenge_id in ('daily-math', 'science-quiz', 'quick-practice')),
  interacted boolean not null default false,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, challenge_id)
);

create trigger set_student_profiles_updated_at
before update on public.student_profiles
for each row
execute function public.set_updated_at();

create trigger set_challenge_progress_updated_at
before update on public.challenge_progress
for each row
execute function public.set_updated_at();

alter table public.student_profiles enable row level security;
alter table public.recent_searches enable row level security;
alter table public.chat_messages enable row level security;
alter table public.completion_entries enable row level security;
alter table public.challenge_progress enable row level security;

-- Demo/public policies for anonymous client-side persistence.
-- Replace these with auth.uid()-based policies before production auth rollout.
create policy if not exists "public profiles access"
  on public.student_profiles
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy if not exists "public recent searches access"
  on public.recent_searches
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy if not exists "public chat messages access"
  on public.chat_messages
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy if not exists "public completion entries access"
  on public.completion_entries
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy if not exists "public challenge progress access"
  on public.challenge_progress
  for all
  to anon, authenticated
  using (true)
  with check (true);
