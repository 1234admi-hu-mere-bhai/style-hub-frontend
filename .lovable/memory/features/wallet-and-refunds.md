---
name: Wallet & refund system
description: Wallet with PayU top-ups (preset-pack bonuses), wallet/source refund choice for returns with 6h admin window, no UPI refunds.
type: feature
---
## Wallet
- Tables: `wallets` (user_id PK, balance), `wallet_transactions` (type: topup|topup_bonus|purchase|refund|adjustment|reversal). Atomic writes via `adjust_wallet_balance` SECURITY DEFINER function (REVOKED from anon/authenticated — backend only).
- Page: `/wallet` — balance card, 4 preset packs (₹500+₹25, ₹1000+₹50, ₹2000+₹100, ₹5000+₹250 = flat 5%), custom amount input (NO bonus), tx history.
- Top-up flow: `wallet-topup-initiate` edge fn → creates `pending_payments` row with `is_wallet_topup=true` + `topup_bonus` → PayU hosted page → `payu-webhook` detects topup branch → credits principal + bonus as two transactions → notification + push.
- Admin can credit/debit via `admin-wallet-adjust` (requires owner or `customers` permission).

## Refund choice
- `returns` table extended: `allowed_refund_methods text[]` (default `['source']`, user-initiated returns get `['wallet','source']`), `selected_refund_method`, `admin_window_expires_at`.
- `request-return` creates the `returns` row with both methods allowed.
- Admin in `admin-update-order` can pass `allowed_refund_methods` to narrow choices. On status→`return_approved`, the function sets `admin_window_expires_at = now() + 6h`.
- User picks via `select-refund-method` edge fn (RLS also allows direct UPDATE limited to own returns within allowed list).
- `payu-refund` (auto-fires on `picked_up`): reads selection. If user picked `wallet` → credits wallet instantly. If `source` or window expired with no pick → existing PayU API refund. If window still open and no pick → returns 202 deferred.

## NOT supported
- ❌ UPI payout refunds (no PayU Payouts integration).
- ❌ Bonus on custom top-up amounts.
- ❌ Wallet expiry.

## Pending (next iteration)
- Checkout integration to apply wallet (partial or full) to new orders. Schema already has `orders.wallet_amount_used` and `pending_payments.wallet_amount_used` columns; `payu-hash` and `payu-webhook` still need the deduction logic.
- UI: refund-method picker on Order History page, allowed-methods checkboxes on AdminReturns, wallet balance row on Profile, AdminCustomers wallet adjustment dialog.
