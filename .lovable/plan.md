## App-Open Splash Animations — Video Previews

I'll generate one short MP4 (~2 seconds, 1080×1920 portrait, no sound) for each of the 6 splash directions, using your gold MUFFIGOUT logo on a dark brand background. All saved to `/mnt/documents/` so you can preview and pick.

### Videos to render

1. **splash-1-logo-forge.mp4** — Logo draws stroke-by-stroke, then a gold shimmer sweeps across it. Tagline fades in below.
2. **splash-2-fabric-unfold.mp4** — Purple→gold fabric strip unfolds diagonally, revealing the logo behind it.
3. **splash-3-mirror-polish.mp4** — Logo enters blurred + dim, snaps into focus while a vertical light ray sweeps across (polishing effect).
4. **splash-4-stitched-in.mp4** — Animated gold stitch line traces the MG monogram outline like a sewing seam, then fills.
5. **splash-5-pulse-bloom.mp4** — Single gold dot pulses, expands into a ring, logo blooms outward. Quick and punchy.
6. **splash-6-catwalk-reveal.mp4** — Spotlight drops from above, lights up the logo on a "stage" with subtle drifting dust particles.

### How it'll be built

- Frames generated with Python/PIL using your existing `public/icon-512.png` brand logo
- Encoded to MP4 with ffmpeg (H.264, 30fps)
- Each file ~300–700 KB, around 2 seconds long
- No code in the project is touched — these are preview artifacts only

### What you do next

Watch the 6 clips, tell me which number to implement (or mix two), and I'll wire it into the app as the splash/loading screen.