---
name: Auto refund on pickup
description: PayU refund auto-fired when return package is picked up by Delhivery (whichever fires first — sync job or admin action). Wallet refunds removed.
type: feature
---
- Edge function `payu-refund` (verify_jwt=false, called server-to-server) issues `cancel_refund_transaction` against PayU using the original `payment_id` (mihpayid).
- Trigger sources (whichever fires first):
  1. `sync-delhivery-status` cron → on detecting "picked up" Delhivery status while order is in `return_approved`/`return_requested`/`picked_up_pending`, sets status `picked_up` and invokes `payu-refund`.
  2. `admin-update-order` → when admin sets status to `picked_up`, invokes `payu-refund`.
- Idempotent: skips if `refund_processed_at` is already set.
- COD orders are marked `refund_processed` without API call (offline settlement).
- On success: order → `refund_processed`, `returns.status` → `refunded`, user notified (in-app + push).
- Wallet feature (`wallet_credits` table, `get_wallet_balance` function) has been REMOVED — refunds always go to original payment source.
