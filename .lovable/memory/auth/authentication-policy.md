---
name: Authentication policy
description: Guest checkout disabled, login required for orders/checkout. Email + password only (phone login removed). Forgot password via email reset link to /reset-password page. Google OAuth supported.
type: feature
---
- No guest checkout — `/auth` required before checkout/orders/profile.
- Login methods: Email + password ONLY. Phone-based sign in/sign up was removed (no method toggle, no phone field on signup).
- Signup collects email + password only; profile phone can still be added later via Profile page.
- Forgot password: dialog on /auth → `supabase.auth.resetPasswordForEmail` → user receives email link → `/reset-password` page calls `auth.updateUser({ password })` then signs out so user logs in fresh.
- Google OAuth still supported alongside.
