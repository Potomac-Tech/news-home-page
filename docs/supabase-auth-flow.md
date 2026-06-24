# Supabase Auth Flow

Task 006 adds the initial login, logout, session refresh, and protected-route behavior for the Next.js scaffold.

## Routes

| Route | Purpose |
| --- | --- |
| `/auth/login` | Client-side sign-in form with magic-link and password modes. |
| `/auth/callback` | Exchanges Supabase email-link codes for a server session, then redirects to the requested path. |
| `/auth/logout` | Signs the user out and redirects back to `/auth/login`. |
| `/member` | Protected server-rendered route that validates Supabase Auth claims and redirects unauthenticated users. |

## Session Handling

`next-app/proxy.ts` calls `updateSession()` from `next-app/lib/supabase/proxy.ts`. That proxy refreshes Supabase Auth claims with `supabase.auth.getClaims()` and writes refreshed cookies at the request boundary.

Protected server routes should use `supabase.auth.getClaims()` for access checks. Do not rely on unvalidated session data for authorization.

## Current Verification Limit

The code builds without local Supabase keys, but live login could not be exercised in this automation run because no real `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` was available. Once a key is added to `next-app/.env.local`, verify:

1. `/member` redirects to `/auth/login?next=/member` when signed out.
2. Magic-link sign-in reaches `/auth/callback` and lands on `/member`.
3. Password sign-in lands on `/member` for existing approved credentials.
4. `/auth/logout` clears the session and returns to `/auth/login`.
