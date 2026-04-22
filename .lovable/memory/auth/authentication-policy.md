---
name: Authentication policy
description: Guest checkout disabled, login required for orders/checkout. Email + Phone (as identifier) login both supported, password is shared. Forgot password via email reset link to /reset-password page.
type: feature
---
- No guest checkout — `/auth` required before checkout/orders/profile.
- Login methods: Email + password OR Mobile (10-digit) + password (phone resolved to email via `get_email_by_phone` RPC).
- Signup collects email + phone + password; phone stored in `profiles.phone` (unique).
- Forgot password: dialog on /auth → `supabase.auth.resetPasswordForEmail` → user receives email link → `/reset-password` page calls `auth.updateUser({ password })` then signs out so user logs in fresh.
- Google OAuth still supported alongside.
