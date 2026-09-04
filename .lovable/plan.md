# Per-size spec sheet images on the product page

Goal: each available size (M, L, XL, 2XL) can have its own spec-sheet image. When a shopper taps a size, only the spec sheet swaps — the main product gallery stays untouched. Admin can upload just one image for one size at a time.

## Storefront (product page)

- Under the size selector, a "Size spec sheet" block appears only when the selected size has an image.
- Selecting a different size instantly swaps that image (no reload, gallery unchanged).
- Tapping the image opens it in the existing fullscreen zoom dialog, so measurements are readable on mobile.
- If a size has no spec sheet, the block is hidden and a "View size chart" link stays available (current behaviour).
- The size chart modal also shows the selected size's spec sheet at the top when one exists.

## Admin: sizes as a dropdown + one image per size

The "Sizes (comma-separated)" text box is replaced by a proper size picker:

- A dropdown listing standard sizes in order, smallest to largest: XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL, 6XL.
- Picking a size from the dropdown adds it as a row; already-added sizes are hidden from the dropdown. Rows always stay sorted smallest to largest, no matter the order they were added.
- Each size row has: the size name, its spec-sheet thumbnail (if uploaded), an "Upload image" button (single image, that size only), and a Remove button that drops the size and its image.
- A free-text "Add custom size" option remains for anything outside the standard list.
- Uploading affects only that size's slot — nothing else is overwritten.

In Fabric Studio, the existing per-size generated spec images get a "Save spec sheets to product" button that writes all filled sizes into the product's slots in one click (still one slot per size, no gallery pollution).


## Technical notes

- New column `products.size_spec_sheets jsonb not null default '{}'::jsonb` — a map of `{ "M": url, "L": url, ... }`. Migration only adds the column; existing RLS/grants on `products` already cover it.
- Allow the field through `supabase/functions/admin-products/index.ts` create/update payload handling.
- `src/hooks/useDbProducts.ts`: map to `sizeSpecSheets: Record<string, string>` on `StoreProduct` (and the raw row type).
- `src/pages/ProductDetail.tsx`: derive `specSheetUrl = product.sizeSpecSheets?.[selectedSize]`; render the block below the size chips, reusing `ImageZoomDialog`.
- `src/components/SizeChartModal.tsx`: accept optional `specImage` + `size` props and render it above the table.
- `src/components/admin/AdminProducts.tsx`: add `size_spec_sheets` to the form state and reuse the existing `product-images` storage upload helper (`uploadingField` pattern) per-size.
- `src/components/admin/FabricToShirtStudio.tsx`: extend `saveToProduct` (or add a sibling action) to merge `specBySize` into `size_spec_sheets` instead of pushing into `additional_images`.
