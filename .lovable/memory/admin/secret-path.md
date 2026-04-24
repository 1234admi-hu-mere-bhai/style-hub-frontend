---
name: Secret Admin Path
description: Admin panel served at /muffigout-control-panel on the main domain; /admin returns 404
type: feature
---
The admin panel is reachable only at the secret path **`/muffigout-control-panel`** on the main domain (`muffigoutapparelhub.com`).

## Routing logic (src/App.tsx)
- `ADMIN_PATH = '/muffigout-control-panel'` constant.
- Routes `/muffigout-control-panel` and `/muffigout-control-panel/*` render `<Admin />`.
- `/admin` is intentionally NOT in the route table → visitors see standard NotFound (404).
- `isAdmin` flag (used to hide BottomNav, LiveSupportChat, PushNotificationPrompt) is true when pathname starts with `ADMIN_PATH`.

## Internal navigation
- `Admin.tsx` logout → `navigate('/muffigout-control-panel')`
- `StaffInvite.tsx` post-accept redirect → `navigate('/muffigout-control-panel')`

## Why a secret path (not subdomain)?
Tried `admin.muffigoutapparelhub.com` first. Lovable's primary-domain redirect forces all connected custom domains to redirect to the starred Primary domain, so the subdomain could not serve the admin panel independently. Secret path is the working solution.

## If the path is ever leaked
Change `ADMIN_PATH` constant in `src/App.tsx` and the two `navigate()` calls above to a new obscure value.
