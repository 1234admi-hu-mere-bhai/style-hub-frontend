
# Plan — Exchange flow + Free-shipping progress bar

Two focused features. Both keep business logic minimal and reuse existing infra.

---

## 1. Free-shipping progress bar (Cart Drawer)

Replace the current static "Add ₹X more for free shipping" line with an animated progress bar that reflects the real shipping rules from `src/lib/shipping.ts` (₹999 threshold, WB flat ₹20 handling, ₹1 test items always free).

**UI (in `src/components/CartDrawer.tsx`, above the Subtotal row):**
- Track: `h-2 bg-secondary rounded-full`, fill: gradient primary→teal, animated width transition.
- Copy above the bar:
  - Free unlocked → `🎉 Free shipping unlocked!` (green)
  - Progressing → `Add {formatPrice(remaining)} more for FREE shipping` (primary)
  - Test item present → `🎁 Free shipping on this order`
- Small "West Bengal: ₹20 handling still applies" note stays where it is.
- Uses `FREE_SHIPPING_THRESHOLD` from `src/lib/shipping.ts` (single source of truth — no hardcoding 999).

**No business-logic changes** — this is pure presentation. Cart totals, checkout, and shipping calc stay untouched.

---

## 2. Exchange flow (mirrors Return)

Add a customer-initiated **exchange** request for a different **size or color** of the same product, reusing the `returns` table and lifecycle. Refund logic is skipped — the outbound replacement is dispatched once the returned item is picked up.

### Schema (migration)
Extend the existing `returns` table with 3 nullable columns:
- `request_type text not null default 'return'` — `'return' | 'exchange'`
- `exchange_size text`
- `exchange_color text`

Add a partial CHECK trigger: when `request_type='exchange'`, at least one of `exchange_size`/`exchange_color` must be set and must differ from the original order item.

### Edge function: `request-exchange`
Cloned from `request-return`, with these differences:
- Accepts `{ orderId, orderItemId, exchangeSize?, exchangeColor?, reasonCode, reasonDetails }`.
- Validates: order is `delivered`, within 7-day window (reuse existing constant), item belongs to order, at least one of size/color differs from the original.
- Verifies the target variant exists and is `in_stock` in `products` (reads `sizes`/`colors` arrays).
- Inserts `returns` row with `request_type='exchange'`, `allowed_refund_methods=[]` (no refund path), `status='return_requested'`.
- Pushes notification: `🔁 Exchange requested for ••••XXXX`.

### Admin (`AdminReturns.tsx`)
- New "Type" column badge: **Return** / **Exchange** (teal).
- Exchange rows show `Requested: Size L → M` inline.
- Approve → sets `status='return_approved'` (same as return).
- On `picked_up` status change:
  - **Return** path: existing `payu-refund` runs (unchanged).
  - **Exchange** path: skip refund entirely; auto-invoke a small `dispatch-exchange` helper that:
    1. Creates a new `orders` row cloned from original, with `parent_order_id`, `is_exchange=true`, `total=0`, `payment_status='exchange'`.
    2. Overrides the single `order_items` row with new size/color.
    3. Calls existing Delhivery auto-shipment shared helper (`_shared/auto-shipment.ts`) to generate AWB.
    4. Pushes: `📦 Exchange shipped — ••••XXXX`.
  - New columns on `orders`: `parent_order_id uuid`, `is_exchange boolean default false` (added in the same migration).

### Customer UI
- **`ReturnExchange.tsx`** (existing page): add a top toggle **Return / Exchange**. Exchange mode shows size + color selectors (populated from the order item's product variants) and hides refund-method copy.
- **`OrderHistory.tsx` / `TrackOrder.tsx`**: existing "Request Replacement" button becomes "Request Return or Exchange" and routes to the same page with a query param.
- Status timeline shows: `Exchange Requested → Approved → Picked Up → Exchange Shipped → Delivered`.

### Emails / notifications
- Reuse `order-shipped` template for the exchange dispatch (subject prefixed `Exchange:`).
- Reuse push categories `orders`; dedupe keys `exchange-req-<id>`, `exchange-ship-<id>`.

### Out of scope (locked)
- Exchange to a **different product** — same SKU only.
- Price-difference collection — exchanges are same-variant swaps, no payment top-up.
- COD exchanges — n/a (prepaid-only).

---

## Ship order

1. Cart Drawer progress bar (single-file frontend change) — 1 pass.
2. Migration for `returns` + `orders` columns.
3. `request-exchange` edge function.
4. `ReturnExchange.tsx` toggle UI.
5. Admin badge + dispatch helper.
6. Update `OrderHistory` / `TrackOrder` entry points.

---

## Technical notes

- Files touched: `src/components/CartDrawer.tsx`, `src/pages/ReturnExchange.tsx`, `src/components/admin/AdminReturns.tsx`, `src/pages/OrderHistory.tsx`, `src/pages/TrackOrder.tsx`, `supabase/functions/request-exchange/index.ts` (new), `supabase/functions/dispatch-exchange/index.ts` (new), one migration.
- Reuses: `returns` table, `_shared/auto-shipment.ts`, `send-push`, existing 7-day window constant, push categories, `formatPrice`, `FREE_SHIPPING_THRESHOLD`.
- No new secrets, no new third-party integrations.
- Memory update: append an `mem://features/exchange-flow` entry describing the same-variant swap rule.

Approve to implement.
