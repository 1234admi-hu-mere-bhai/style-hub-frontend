---
name: Email verification & email change
description: Email verification enforced at signup (auto_confirm_email=false). Signup shows toast prompting verification and signs out partial session. Login already handles "Email not confirmed" error. Email change on /profile → supabase.auth.updateUser sends confirmation link to NEW address; change only applies after click.
type: feature
---
- Auth → auto_confirm_email = false
- /auth signup: after signUp → signOut + toast "verification link sent" + redirects to login tab
- /auth login: if Supabase returns "Email not confirmed" → user-facing error already shown
- /profile Personal Info → "Update Email" button calls supabase.auth.updateUser({email}, {emailRedirectTo: /profile}) → toast "verification link sent to new email"
- Forgot password flow at /reset-password remains unchanged
