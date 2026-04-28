create extension if not exists pgcrypto;

create table if not exists public.week_boards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at date not null,
  ends_at date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  constraint week_boards_valid_range check (ends_at >= starts_at)
);

create unique index if not exists one_active_week_board
  on public.week_boards (is_active)
  where is_active;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text not null,
  normalized_name text not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  constraint admin_users_email_lowercase_check check (email = lower(email))
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.week_boards(id) on delete cascade,
  idea_text text not null,
  submitter_name text not null default 'Anonymous',
  normalized_submitter_name text not null default 'anonymous',
  category text,
  status text not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ideas_status_check check (status in ('submitted', 'working', 'completed', 'archived')),
  constraint ideas_category_check check (
    category is null or category in (
      'Startup',
      'Game',
      'AI Tool',
      'Website',
      'Social',
      'Useless but Funny',
      'Other'
    )
  ),
  constraint ideas_text_length_check check (char_length(trim(idea_text)) between 100 and 1000)
);

create table if not exists public.idea_stars (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  admin_user_id uuid not null,
  created_at timestamptz not null default now(),
  unique (idea_id, admin_user_id)
);

create table if not exists public.builders (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  normalized_name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.idea_assignments (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  builder_id uuid not null references public.builders(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (idea_id, builder_id)
);

create table if not exists public.idea_completions (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  deployment_url text,
  github_url text,
  twitter_url text,
  notes text,
  completed_at timestamptz not null default now(),
  unique (idea_id)
);

create index if not exists ideas_board_id_idx on public.ideas(board_id);
create index if not exists ideas_status_idx on public.ideas(status);
create index if not exists ideas_created_at_idx on public.ideas(created_at desc);
create index if not exists idea_stars_idea_id_idx on public.idea_stars(idea_id);
create index if not exists idea_assignments_idea_id_idx on public.idea_assignments(idea_id);
create index if not exists idea_assignments_builder_id_idx on public.idea_assignments(builder_id);
create index if not exists idea_completions_idea_id_idx on public.idea_completions(idea_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ideas_set_updated_at on public.ideas;
create trigger ideas_set_updated_at
  before update on public.ideas
  for each row
  execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where admin_users.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

alter table public.admin_users enable row level security;
alter table public.week_boards enable row level security;
alter table public.ideas enable row level security;
alter table public.idea_stars enable row level security;
alter table public.builders enable row level security;
alter table public.idea_assignments enable row level security;
alter table public.idea_completions enable row level security;

drop policy if exists "Admins can manage admin users" on public.admin_users;
create policy "Admins can manage admin users"
  on public.admin_users for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Public can read active week boards" on public.week_boards;
create policy "Public can read active week boards"
  on public.week_boards for select
  to anon, authenticated
  using (is_active = true or public.is_admin());

drop policy if exists "Admins can manage week boards" on public.week_boards;
create policy "Admins can manage week boards"
  on public.week_boards for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Public can submit ideas to active boards" on public.ideas;
create policy "Public can submit ideas to active boards"
  on public.ideas for insert
  to anon, authenticated
  with check (
    status = 'submitted'
    and exists (
      select 1
      from public.week_boards
      where week_boards.id = ideas.board_id
        and week_boards.is_active = true
    )
  );

drop policy if exists "Admins can manage ideas" on public.ideas;
create policy "Admins can manage ideas"
  on public.ideas for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can manage idea stars" on public.idea_stars;
create policy "Admins can manage idea stars"
  on public.idea_stars for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can manage builders" on public.builders;
create policy "Admins can manage builders"
  on public.builders for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can manage idea assignments" on public.idea_assignments;
create policy "Admins can manage idea assignments"
  on public.idea_assignments for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can read idea completions" on public.idea_completions;
create policy "Admins can read idea completions"
  on public.idea_completions for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can insert idea completions" on public.idea_completions;
create policy "Admins can insert idea completions"
  on public.idea_completions for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update idea completions" on public.idea_completions;
create policy "Admins can update idea completions"
  on public.idea_completions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.admin_users to authenticated;
grant select on public.week_boards to anon, authenticated;
grant insert on public.ideas to anon, authenticated;
grant select, insert, update, delete on public.week_boards to authenticated;
grant select, insert, update, delete on public.ideas to authenticated;
grant select, insert, update, delete on public.idea_stars to authenticated;
grant select, insert, update, delete on public.builders to authenticated;
grant select, insert, update, delete on public.idea_assignments to authenticated;
grant select, insert, update on public.idea_completions to authenticated;

insert into public.builders (display_name, normalized_name)
values
  ('Arda', 'arda'),
  ('David', 'david'),
  ('Timur', 'timur'),
  ('Texas', 'texas')
on conflict (normalized_name) do nothing;

insert into public.admin_users (email, display_name, normalized_name)
values
  ('ardadinc04@gmail.com', 'Arda', 'arda'),
  ('luanthony523@gmail.com', 'David', 'david'),
  ('yanzewu88@gmail.com', 'Timur', 'timur')
on conflict (email) do update
set
  display_name = excluded.display_name,
  normalized_name = excluded.normalized_name;

insert into public.week_boards (title, starts_at, ends_at, is_active)
values ('Week of Apr 27', '2026-04-27', '2026-05-03', true)
on conflict do nothing;

do $$
begin
  alter publication supabase_realtime add table public.ideas;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.idea_stars;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.idea_assignments;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.builders;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.idea_completions;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
