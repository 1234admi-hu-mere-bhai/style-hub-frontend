## What we're building

Match the Myntra reference for the price + Mega Deal block, and expose the pieces that need admin control.

### 1. Price line above the Mega Deal card (`src/pages/ProductDetail.tsx`)

Replace the current price row with a Myntra-style line:

- `MRP ₹2,499` — grey, struck-through
- `₹876` — big, bold, black
- Pink pill badge `65% OFF!` — high-contrast, uppercase
- A small orange/red **campaign label** below (e.g. `Deal of the Day`) — only shown when a campaign is active for that product

Percentage comes from the existing `product.originalPrice` vs `product.price` (already computed), so no data change for the % badge itself.

### 2. Mega Deal card (`src/components/BankOffersCard.tsx`)

Rebuild the card to match the reference layout:

- Left: a small **badge** (rounded "MEGA DEAL" tag styled from tokens, no external asset)
- Middle: `Get at ₹791` in bold, with a subtle underline accent
- Right: green pill `Extra ₹85 Off`
- Bottom bar: `With Bank Offer` on the left, `Details ›` link on the right that expands the current offer list (kept but restyled to Myntra density)

The final "Get at" price = current product price − best-applicable bank discount. That math already exists in `useBankOffers.ts`.

### 3. New "Campaign label" concept (small addition)

To power the `Deal of the Day` line, add a new column to the existing `flash_sales` table:

- `campaign_label text` (e.g. "Deal of the Day", "Limited Drop", "Weekend Steal")

When a product is inside an active flash sale that has a `campaign_label`, the label renders under the price. If empty, nothing renders. No new table, no new fetch — reuses the flash-sale lookup that already runs on the product page.

## Admin panel changes

**a. Flash Sales module (`src/components/admin/AdminFlashSales.tsx`)**
- New text field **Campaign label** in the create/edit form ("Deal of the Day" default), stored in the new `campaign_label` column.
- Column shown in the flash-sale list so admins can see which label is live.

**b. Bank Offers module (`src/components/admin/AdminBankOffers.tsx`)**
- Add **Edit** (currently only insert) so existing rows can be corrected without deleting.
- Add **Badge text** field (defaults to `MEGA DEAL`) so the pill on the card can be renamed per offer without a code change.
- Add **Footer text** field (defaults to `With Bank Offer`) for the bottom-left caption.
- Add **Schedule fields** (`start_time`, `end_time`) — columns already exist, just not exposed in the UI.
- Add a **live preview** of the finished card at the bottom of the form so admins see exactly what shoppers will see.

`badge_text` and `footer_text` are two new nullable text columns on `bank_offers` (default kept in code, so old rows keep working).

## Files touched

- `src/pages/ProductDetail.tsx` — new price line with MRP strike-through, bold offer price, pink `% OFF!` pill, campaign label.
- `src/components/BankOffersCard.tsx` — Myntra-style Mega Deal card layout.
- `src/components/admin/AdminBankOffers.tsx` — edit mode, badge/footer text, schedule fields, live preview.
- `src/components/admin/AdminFlashSales.tsx` — campaign label field + list column.
- One migration: add `campaign_label` to `flash_sales`, add `badge_text` + `footer_text` to `bank_offers`.

No new tables, no edge-function changes.
