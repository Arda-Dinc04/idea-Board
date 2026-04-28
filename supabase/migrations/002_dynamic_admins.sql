create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text not null,
  normalized_name text not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  constraint admin_users_email_lowercase_check check (email = lower(email))
);

insert into public.admin_users (email, display_name, normalized_name)
values
  ('ardadinc04@gmail.com', 'Arda', 'arda'),
  ('luanthony523@gmail.com', 'David', 'david'),
  ('yanzewu88@gmail.com', 'Timur', 'timur')
on conflict (email) do update
set
  display_name = excluded.display_name,
  normalized_name = excluded.normalized_name;

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

drop policy if exists "Admins can manage admin users" on public.admin_users;
create policy "Admins can manage admin users"
  on public.admin_users for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.admin_users to authenticated;
