# Echoes Blog Platform

A Chinese-language blog/CMS built with Next.js 16 (App Router), Tailwind CSS v4, TipTap editor, and Supabase (PostgreSQL).

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
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (get from `supabase status`)
- `PUBLISH_SECRET` — any bearer token for the `/api/publish` route

### Gotchas

- **Docker required**: Supabase local runs via Docker containers. Docker must be started (`sudo dockerd`) before running `supabase start`. In Cloud Agent VMs, use `fuse-overlayfs` storage driver and `iptables-legacy`.
- **Supabase migrations**: The database schema is at `supabase/schema.sql`. A copy lives at `supabase/migrations/20240101000000_create_posts.sql` for `supabase start` to auto-apply.
- **Editor SSR**: The TipTap editor page (`/editor`) is a client component; ensure `immediatelyRender: false` is set in the `useEditor` config to avoid SSR hydration errors.
- **Lint**: `pnpm lint` has pre-existing warnings/errors in the codebase (react-compiler set-state-in-effect, unused imports, missing alt text). These are not introduced by setup.
- **No test framework**: The project has no automated test suite configured.
