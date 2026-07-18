# Mobile API gateway

`mobile-v1` is the shared authenticated API for Android and iOS. It preserves
the `POST { "operation", "payload" }` contract and runs every database query
with the caller's JWT, so existing RLS policies remain authoritative.

Before deployment, set the optional geocoding secret from the repository root:

```sh
supabase secrets set MAPBOX_TOKEN="$VITE_MAPBOX_TOKEN" --project-ref ujulaxusutjlkdrbxsbg
```

Deploy with JWT verification enabled (configured in `supabase/config.toml`):

```sh
supabase functions deploy mobile-v1 --project-ref ujulaxusutjlkdrbxsbg --use-api
```

The Vercel route `/api/mobile/v1` is only a temporary proxy for previously
released builds. New builds call the Edge Function directly.
