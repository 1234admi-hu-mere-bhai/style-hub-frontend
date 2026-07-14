---
name: Exchange flow
description: Same-product size/color exchange initiated by customer from Track Order, reuses returns table pipeline
type: feature
---

Customer-initiated exchange for the **same product**, different size or color only. No refund path (same-value swap).

- Entry: Track Order page → "Exchange" button (replaces old "Replace"). 7-day window from delivery, same as returns.
- Dialog captures new size + new color (from `products.sizes` / `products.colors`); original variant is disabled in the picker.
- Edge function `request-exchange` validates window, ownership, variant differs from original, no active return/exchange already open. Inserts a `returns` row with `request_type='exchange'`, `allowed_refund_methods=[]`, and updates order status to `return_requested` with `return_reason` prefixed `Exchange: ...`.
- Schema: `returns` has `request_type` (`'return' | 'exchange'`, default `return`), `exchange_size`, `exchange_color`. Trigger `validate_exchange_return` enforces at least one variant field set on exchange rows.
- Admin sees requests in AdminReturns; the "Exchange:" prefix on the reason distinguishes them.
- Locked scope: same SKU only, no different-product swaps, no price top-ups, no COD (prepaid-only site).
