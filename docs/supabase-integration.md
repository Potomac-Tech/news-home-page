# Supabase Integration

Task 005 adds the first Supabase client foundation for the Next.js scaffold.

## Project Target

The only valid Supabase project ref for this workspace is `xlpkdoeldtlhearqajat`.

The matching project URL is:

```text
https://xlpkdoeldtlhearqajat.supabase.co
```

Do not use `nwoluvjdojzayozyzlob`.

## Environment Variables

Use `next-app/.env.example` as the template for local Next.js development.

Browser-safe variables:

```text
NEXT_PUBLIC_SUPABASE_URL=https://xlpkdoeldtlhearqajat.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

Server-only variables:

```text
SUPABASE_SECRET_KEY=sb_secret_xxx
```

Never prefix secret keys with `NEXT_PUBLIC_`. Anything with that prefix can be bundled into browser code.

## Client Utilities

- `next-app/lib/supabase/client.ts` creates a browser Supabase client for Client Components.
- `next-app/lib/supabase/server.ts` creates a server Supabase client for Server Components, Server Actions, and Route Handlers.
- `next-app/lib/supabase/proxy.ts` refreshes Auth claims and writes session cookies at the request boundary.
- `next-app/proxy.ts` wires the Supabase session refresh proxy into Next.js.

The shared config in `next-app/lib/supabase/config.ts` rejects any `NEXT_PUBLIC_SUPABASE_URL` that does not exactly target `xlpkdoeldtlhearqajat`.

## Security Notes

- Browser code uses only the Supabase URL and publishable key.
- Server secret keys are documented for future server-only workflows but are not imported by browser or server client helpers in this task.
- Server-side access checks should use `supabase.auth.getClaims()` rather than trusting unvalidated session data.
- Authorization must later be enforced with normalized tables, trusted app metadata, and RLS policies.
