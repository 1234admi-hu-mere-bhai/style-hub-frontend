---
name: Shipping & Delivery
description: Region-based shipping cost and delivery time rules calculated from address state/pincode
type: feature
---
Shipping is calculated automatically from the customer's address via `src/lib/shipping.ts` (`calculateShipping`).

**Rules (locked):**
- **West Bengal (intra-state)**: Flat ₹20 handling charge on every order. Delivery in **7 business days**. No free-shipping override.
- **Outside West Bengal**: Free shipping on orders ≥ ₹999, otherwise ₹99. Delivery in **10 business days**.
- ₹1 test product → always free.
- WB detection: `state === "West Bengal"` (case-insensitive) OR pincode prefix in `[70, 71, 72, 73, 74]`.

**Where applied:**
- `src/pages/Checkout.tsx` — uses `calculateShipping` with live address state + pincode; shows zone-aware hints.
- `src/components/CartDrawer.tsx` — shows "from ₹20" until subtotal hits ₹999, with WB note.
- `src/pages/ShippingPolicy.tsx`, `FAQ.tsx`, `TermsOfService.tsx`, `ProductDetail.tsx` — copy reflects the same rules.

Constants exported from `src/lib/shipping.ts`: `FREE_SHIPPING_THRESHOLD=999`, `WB_HANDLING_CHARGE=20`, `STANDARD_SHIPPING_FEE=99`, `WB_DELIVERY_DAYS=7`, `NATIONAL_DELIVERY_DAYS=10`.
