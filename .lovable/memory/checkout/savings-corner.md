---
name: Savings Corner
description: Compact coupon input bar at checkout; full coupon list moved to dedicated /coupons page
type: feature
---
At checkout (both mobile inline and desktop sidebar) the coupon UI is a compact bar:
- Input field (placeholder: "Enter coupon code") + APPLY button
- "View all coupons →" link below it that navigates to /coupons
- On invalid/expired/below-min-order: toast error "This coupon code is not valid." / "expired" / "A minimum order of ₹X is required for this coupon."

The /coupons page (src/pages/Coupons.tsx) lists all active coupons from the `coupons` table with discount badge, code (tap to copy), description, expiry, and an APPLY button that navigates to /checkout?coupon=CODE. Checkout auto-applies via a `useEffect` watching `searchParams.get('coupon')` (guarded by `autoApplyAttempted` ref so it fires once).

Rules retained:
- Only one coupon per order
- Coupons cannot stack with Flash Sale items (`allFlashSaleItems` blocks application; `hasFlashSaleItems` restricts coupon base to non-sale items)
