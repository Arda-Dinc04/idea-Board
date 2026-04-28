# Weekly Idea Board

A mobile-first idea submission app with an admin-only workflow board for weekly build ideas.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Postgres
- Supabase Auth for admins only
- Supabase Realtime for admin board refreshes

## Local Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Required env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_INVITE_DEFAULT_PASSWORD=
```

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL editor or through the Supabase CLI.
3. Create Supabase Auth users for the preset admins, or configure `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_INVITE_DEFAULT_PASSWORD` so an existing admin can create new admin accounts from the app.
4. Add the env vars to `.env.local` and Vercel.

Preset admin emails are seeded into `admin_users`:

- `ardadinc04@gmail.com`
- `luanthony523@gmail.com`
- `yanzewu88@gmail.com`

Admin authorization is database-backed through `admin_users` and the SQL `public.is_admin()` helper. Existing admins can add more admins from the dashboard header.

## Routes

- `/` public anonymous idea submission
- `/admin/login` admin email/password login
- `/admin` current active weekly board
- `/admin/working` ideas being built
- `/admin/completed` shipped ideas
- `/admin/history` old weekly boards

## Checks

```bash
npm run lint
npm run build
```
