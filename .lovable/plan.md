## Wallet & Refund System — Implementation Plan

### Scope confirmed
- **Wallet**: Top-up via PayU, balance never expires, usable at checkout (partial wallet + PayU allowed).
- **Top-up bonuses (preset packs only)**: ₹500→+₹25, ₹1000→+₹50, ₹2000→+₹100, ₹5000→+₹250 (flat 5%). Manual custom amount = no bonus.
- **Refund options for user**: ① Wallet (instant on pickup) or ② Original payment source (PayU auto-refund — existing flow). **No UPI refund.**
- **Admin window**: 6 hours after return is approved to set allowed refund methods. If unset → defaults to original source.
- **Old memory override**: The `auto-refund-on-pickup` memory says wallet is removed — will update it.

---

### 1. Database changes

**New tables**
- `wallets` — `user_id` (unique), `balance`, `updated_at`. RLS: user reads own; writes only via edge functions (service role).
- `wallet_transactions` — `user_id`, `amount` (+/-), `type` (`topup` | `topup_bonus` | `purchase` | `refund` | `adjustment`), `reference_type`, `reference_id`, `balance_after`, `description`, `created_at`. RLS: user reads own.

**Modify `orders`**
- `wallet_amount_used` numeric default 0
- `payu_amount` numeric default 0 (the non-wallet portion)

**Modify `returns`**
- `allowed_refund_methods` text[] default `['source']` (admin-set: `['wallet','source']`, `['wallet']`, or `['source']`)
- `selected_refund_method` text nullable (user pick: `wallet` | `source`)
- `admin_window_expires_at` timestamptz (set to `now() + 6h` when status → `return_approved`)

**Modify `pending_payments`**
- `wallet_amount_used` numeric default 0
- `is_wallet_topup` boolean default false

---

### 2. Edge functions

**New**
- `wallet-topup-initiate` — validate amount, compute bonus (preset packs only), create pending_payment with `is_wallet_topup=true`, return PayU hash.
- `wallet-topup-complete` — called from `payu-webhook` / `verify-payment` when `is_wallet_topup`. Credits wallet atomically (amount + bonus, two transactions).
- `select-refund-method` — user-facing. Validates choice is in `allowed_refund_methods` and return is in valid state.
- `expire-refund-window` — cron (every 15 min). For returns past 6h with no `selected_refund_method`, lock to `source`.

**Modified**
- `payu-webhook` + `verify-payment` — branch on `is_wallet_topup`; for regular orders, also persist `wallet_amount_used` and decrement wallet atomically.
- `create-cod-order` — block COD if wallet is being used (COD already pays cash, no wallet allowed) OR allow wallet to cover whole order and skip COD entirely.
- `admin-update-order` — when admin sets return → `return_approved`, set `admin_window_expires_at = now() + 6h`. New action: `set_allowed_refund_methods`.
- `payu-refund` (auto on pickup) — read `selected_refund_method`. If `wallet` → credit wallet instantly. If `source` → existing PayU refund. COD unchanged.

---

### 3. UI

**New pages/components**
- `/wallet` — balance card, top-up packs (4 preset cards with bonus badge) + "Custom amount" input (no bonus shown), transaction history table.
- `WalletSection` on Profile page — balance + link to /wallet.
- `Checkout` — "Use wallet balance" toggle (auto-applies max usable); shows split: wallet ₹X + PayU ₹Y.
- `OrderHistory` return-request modal — after admin sets allowed methods, show radio: "Refund to Wallet (instant)" / "Refund to original payment (5-7 days)" + 6h countdown.

**Admin**
- `AdminReturns` — per return: checkboxes "Allow Wallet refund" / "Allow Source refund" (defaults both on). Shows user's selection + countdown.
- `AdminCustomers` — wallet balance column + adjustment dialog (credit/debit with reason → `adjustment` transaction).

---

### 4. Key technical notes
- All wallet writes use a Postgres function (`adjust_wallet_balance`) with row lock to prevent race conditions.
- Wallet refund fires on the same `picked_up` trigger as PayU refund — instant credit + notification.
- Coupon/flash-sale logic untouched; wallet applies AFTER discounts.
- Min PayU amount when wallet partially covers = ₹1 (PayU rejects ₹0).
- COD + wallet: if wallet covers full total, order becomes prepaid (no COD fee). If partial, COD is disallowed (cleaner UX).

---

### What will NOT be built (per your decision)
- ❌ UPI payout refunds (no PayU Payouts integration)
- ❌ Wallet expiry
- ❌ Tiered bonus on custom amounts
