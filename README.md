## Echoes

### Environment

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_your_key"
SUPABASE_SECRET_KEY="sb_secret_your_key"
ADMIN_EMAIL="you@example.com"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### Supabase Dashboard

Enable these auth settings in Supabase:

- Email provider with `email + password`
- GitHub provider
- Manual identity linking
- Disable signup email confirmation if you want email signup to log in immediately

Storage:

- Create or keep the public `avatars` bucket if you are not bootstrapping from `supabase/schema.sql`

### Database Bootstrap

For a fresh Supabase project:

1. Run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL editor.
2. Optionally run [`supabase/seed.sql`](./supabase/seed.sql) to load local test content.

The current `schema.sql` is intentionally a fresh-database bootstrap script. It is not designed to migrate an existing legacy database in place.

For an existing Echoes database, run [`supabase/interaction-notifications-migration.sql`](./supabase/interaction-notifications-migration.sql) to upgrade reply notifications into unified interaction notifications.
