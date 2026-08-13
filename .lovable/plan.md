# Options for a Backend That Never Pauses

Current state, confirmed this turn: your hosted database and authentication service are **paused**, so every login and data request fails before it reaches your code. Nothing in the app is broken.

Pausing happens because the backend is on a free-tier style instance that sleeps when idle. So the real question is not "which database", it is "which plan / which host keeps auth always awake and keeps my data".

## Option A — Keep the current backend, remove the pausing (recommended)

- Resume it once (Cloud panel → Resume), then keep it from sleeping by upgrading the Cloud/backend plan to a paid always-on tier.
- Zero code changes, zero migration, zero password resets. All orders, products, storage files, ~50 functions and secrets stay exactly as they are.
- Fastest path back to working owner and customer login: minutes.

## Option B — Your own Supabase project (paid tier), full data migration

Same engine, so auth behaves identically — the gain is that you own the billing and can pick an always-on paid plan.

What it takes:
1. Create your own project on a paid plan (no auto-pause).
2. Export schema from `supabase/migrations` and re-apply it to the new project.
3. Copy table data (products, orders, order_items, profiles, reviews, coupons, wallets, addresses, staff tables, notifications, pincode cache) via SQL dump / CSV.
4. Copy storage bucket objects (product images, review images, invoices).
5. Redeploy all edge functions and re-add every secret (PayU key/salt, Delhivery, Gemini, push keys).
6. Point the app's URL and publishable key at the new project.
7. **Users**: auth users can be migrated with their hashed passwords only via a full `auth` schema dump, which is not exportable from Lovable Cloud — so every customer would need a password reset. This is the main cost.

Effort: roughly a day of careful work plus verification of payments, shipping and push.

## Option C — Self-hosted Postgres + auth on a VPS

- You run Postgres, GoTrue (auth), storage and a server to replace every edge function.
- Never pauses, but you own uptime, backups, SSL, security patching, and all ~50 functions must be re-hosted.
- Same password-reset problem as Option B.
- Only worth it if you have a dedicated ops reason — not to fix this outage.

## Not viable — Oracle / MySQL

Authentication, row-level security policies, the edge functions, storage and realtime are all Postgres-specific. Moving to Oracle or MySQL is a ground-up rebuild of the entire backend with no login benefit. I would not do this.

## Data safety in every option

No data is lost by pausing — the contents come back as they were on resume. In Options B and C the data is copied, not recreated, so orders and products carry over; only auth passwords cannot be carried.

## Recommended sequence

1. Resume the paused backend now so the store works again (I can run the resume with your approval, or you click Resume in the Cloud panel).
2. Verify owner login and storefront end-to-end in a real browser session, and fix any genuine code issue that surfaces.
3. Decide afterwards, with the site live, whether to stay on an always-on Cloud plan (Option A) or migrate to your own Supabase project (Option B). If you pick B, I will write a dedicated migration plan with an ordered cutover checklist.
