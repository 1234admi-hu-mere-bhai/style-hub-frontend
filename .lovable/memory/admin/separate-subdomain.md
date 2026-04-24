---
name: Separate Admin Subdomain
description: Admin panel served on admin.muffigoutapparelhub.com; /admin path on main domain is blocked (404)
type: feature
---
The admin panel runs on a dedicated subdomain `admin.muffigoutapparelhub.com`.

## Routing logic (src/App.tsx)
- `isAdminHost()` checks `window.location.hostname` for `admin.muffigoutapparelhub.com` (or any `admin.*` host for previews).
- When on the admin host, ALL paths render `<Admin />` via a catch-all route. Only `/staff-invite/:token` and `/reset-password` are kept as separate routes (so staff invite emails still work).
- On the main domain, `/admin` is intentionally NOT in the route table — visitors get the standard NotFound (404).

## DNS setup required (one-time, by owner)
1. Lovable → Project Settings → Domains → Connect Domain
2. Enter `admin.muffigoutapparelhub.com`
3. Add the A record shown by Lovable (typically `185.158.133.1`) for the `admin` subdomain at the registrar
4. Wait for verification + SSL provisioning

## Internal `navigate('/admin')` calls
Used in Admin logout and StaffInvite redirect. On the admin subdomain these resolve to `https://admin.muffigoutapparelhub.com/admin` which still hits the catch-all `<Admin />` route — works correctly.
