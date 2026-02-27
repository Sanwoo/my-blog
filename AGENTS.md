# Echoes Blog Platform

A Chinese-language blog/CMS built with Next.js 16 (App Router), Tailwind CSS v4, Supabase (PostgreSQL + Auth + Realtime), Markdown editing.

## Cursor Cloud specific instructions

### Services

| Service | How to run | Port |
|---------|-----------|------|
| Next.js dev server | `pnpm dev` | 3000 |
| Supabase (local) | `supabase start` (requires Docker) | 54321 (API), 54322 (DB), 54323 (Studio) |

### Common commands

See `package.json` scripts: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm start`.

### Environment variables

A `.env.local` file is needed with:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase API URL (local: `http://127.0.0.1:54321`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key (for browser client)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (for server-side)
- `PUBLISH_SECRET` — any bearer token for the `/api/publish` route
- `NEXT_PUBLIC_SITE_URL` — the site URL for share links (default: `http://localhost:3000`)
- `NEXT_PUBLIC_ADMIN_EMAILS` — comma-separated list of admin email addresses

### Architecture

- Articles are stored in Supabase `posts` table with `content_format` field (either `markdown` or `html`)
- Comments use Supabase Auth (GitHub/Google OAuth) with RLS policies
- Online presence uses a `online_presence` table with 30-second heartbeat
- The editor requires authentication; only admin emails (NEXT_PUBLIC_ADMIN_EMAILS) see the "写文章" link in nav

### Gotchas

- **Docker required**: Supabase local runs via Docker containers. Docker must be started before `supabase start`. In Cloud Agent VMs, use `fuse-overlayfs` storage driver and `iptables-legacy`.
- **Supabase migrations**: Apply schema via `supabase db reset` or `supabase db push`. Two migration files exist in `supabase/migrations/`.
- **Lint**: `pnpm lint` has pre-existing warnings/errors in the codebase.
- **No automated test framework**: The project has no test suite configured.
- **OAuth**: For comment login to work in production, configure GitHub/Google OAuth providers in Supabase Dashboard.
