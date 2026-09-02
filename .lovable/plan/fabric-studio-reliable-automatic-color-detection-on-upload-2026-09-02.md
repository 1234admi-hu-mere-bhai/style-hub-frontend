# Fabric Studio: reliable automatic color detection on upload

## Goal
When an admin uploads a fabric swatch (or a shirt photo) in Fabric Studio, the "Lock shirt color" field should fill in by itself with the correct garment color and its readable name — every time, immediately.

## What's happening today
Auto-detection already exists, but it is weak in three ways:
- It samples from the uploaded file's public URL after upload, so if the image loads without cross-origin permission the detection silently gives up and the hex stays empty.
- It averages the whole image. On a shirt photo (white background, shadows, collar tag, buttons) the average drifts toward grey/white instead of the real fabric colour.
- If the admin ever typed a hex manually in a past session, auto-detect stays permanently off because that choice is restored from the saved session.

## What will change
1. **Detect from the picked file directly** — read the colour from the local file the moment it is chosen, before/alongside the upload. No network fetch, so it can never fail on cross-origin rules. The URL-based sampling stays as a fallback for restored sessions.
2. **Smarter colour picking** — instead of a flat average:
   - sample from the central region of the image (where the fabric/garment actually is),
   - drop near-white / near-black / very desaturated background and shadow pixels,
   - group remaining pixels into colour buckets and pick the most common bucket (dominant colour), then average within that bucket for a clean hex.
   - if almost everything got filtered out (a genuinely white or black fabric), fall back to the plain average so white/black shirts still resolve correctly.
3. **Auto-detect re-arms on every new upload** — uploading a new fabric/shirt turns auto-colour back on and refreshes the hex, while manual typing still overrides it for that image.
4. **Visible feedback** — after upload show a small "Detected: Navy #1a2a4f" line with the swatch (the existing nearest-name lookup), plus a "Re-detect" action next to the colour input so the admin can re-run it after a manual edit.

## Scope
- Single file: `src/components/admin/FabricToShirtStudio.tsx`.
- No backend, prompt, or edge-function changes; the generation prompts already consume `colorHex` as-is.
