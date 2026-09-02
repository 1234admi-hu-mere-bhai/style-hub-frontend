# Per-size spec sheets + M / L / XL / 2XL sizing

## 1. Fabric Studio: a spec sheet image per size

Today the studio keeps a single spec-sheet image, so generating for another size overwrites it. Change it to hold one spec image per size.

- The Size dropdown offers M, L, XL, 2XL only, and switching it auto-fills that size's measurements (chest / length / sleeve / shoulder), which stay editable.
- The spec preview shows the image saved for the currently selected size. Switching size instantly swaps the preview — no regeneration.
- If the selected size has no image yet, the preview area shows an empty state with a "Generate spec sheet for {size}" button.
- Small size chips (M · L · XL · 2XL) above the preview mark which sizes already have an image, so it is obvious what is left to do.
- "Generate spec sheets — all sizes" now covers exactly M, L, XL, 2XL and fills all four slots.
- Download / Save-to-product and the prompt-export mode use the currently selected size's image and measurements.
- All four images persist in the saved studio session, same as now.

## 2. Sizes limited to M, L, XL, 2XL everywhere

- Storefront Size Guide page: chart rows become M, L, XL, 2XL (inches and cm tabs).
- Size chart modal on the product page: same four rows.
- Home page discovery filter chips and the Products page size filter: M, L, XL, 2XL only.
- Wherever "XXL" is displayed it becomes "2XL"; the measurements are unchanged.
- Existing product records that carry other sizes are not rewritten — only the option lists and charts shown to users change.

## Technical notes

- `SIZE_CHART` in `src/components/admin/FabricToShirtStudio.tsx` is trimmed to M, L, XL, 2XL (2XL takes the old XXL numbers: chest 46, length 32, sleeve 26, shoulder 19), and `BULK_SPEC_SIZES` matches.
- `specUrl: string` becomes `specBySize: Record<string, string>`; the localStorage session shape migrates old `specUrl` into the current size's slot so nothing is lost.
- Bulk results reuse the same map instead of a separate `bulkSpec` array.
- Size lists updated in `src/pages/SizeGuide.tsx`, `src/components/SizeChartModal.tsx`, `src/pages/Products.tsx`, `src/pages/Index.tsx`.
- No backend or edge-function changes: `generate-shirt-from-fabric` already accepts per-size `specs`.
