# Restore Admin Login (Resume Paused Backend)

## What's actually wrong

Your hosted database and authentication service are **paused**. While paused, every request from your site — owner login, staff login, customer login, orders, product data — fails before it reaches any of your code. This is not a bug in the admin panel.

Confirmed this turn: the backend status check reports the project as paused, and earlier database queries failed with connection timeouts.

## Why not migrate

- **Your own Supabase project** — same engine, so login would behave exactly the same. It would not fix anything, and it would mean a fresh project: re-migrating schema, orders, products, storage files and all secrets. Customer passwords cannot be exported, so every user would have to reset their password.
- **Oracle / MySQL** — not viable. Authentication, row-level security policies, ~50 edge functions, storage buckets and realtime are all built on Postgres plus the managed auth service. There is no Oracle path in this stack; it would be a ground-up rebuild with zero login benefit.

Keeping the current backend is the right call.

## Steps

1. **Resume the backend.** I run the resume action — it needs your approval when it appears, same as a migration prompt. Alternatively you can resume it yourself from the Cloud panel.
2. **Confirm it is healthy.** Poll the backend status until it reports active and healthy. Do not test login before this — a half-started backend gives misleading errors.
3. **Verify owner login end-to-end.** Sign in at the admin panel with your owner credentials in a real browser session and confirm the dashboard loads, not just that the sign-in call succeeds.
4. **Fix any genuine code issue that surfaces.** With the backend live, if login still fails, inspect the owner check in the admin gate and the staff context lookup, and repair whatever the actual error points to.
5. **Spot-check the storefront.** Confirm products, cart and customer login work again so nothing else was left broken by the outage.

## Technical notes

- Resume and status are handled through the Cloud tooling; no schema migration is required.
- Admin access is gated by an owner/staff check on the server side plus the staff context hook in the app. Both will be re-examined only if step 3 fails.
- No data is lost by pausing — the database contents are intact and come back as they were.
