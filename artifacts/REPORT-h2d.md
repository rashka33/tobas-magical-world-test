# REPORT h2d

Build `2026-10-30-bluey-h2d` on branch `cursor/bluey-h2c-rebuild-7a6d`. Not merged. Not published. Live coloring-world repo was not changed.

Kept adaptive levels (`tcw-bluey-levels`, win up, two misses down, sorter 3/5/7) and the landscape layouts (Counting two-column, Memory L3 6×2, level pills). Rebuilt the hub shell: seasonal title, sticker-circle tiles with no kid labels, Leo on the title and the hub, a press-and-hold gear instead of a Grown-ups text link, and a soft wipe between title, hub, and activities.

Offline service worker cache `tcw-2026-10-30-bluey-h2d`. Precache includes the soft-3D slots. `index.html` stays network-first.

## Art

The shared box `/workspace/toba/art/soft3d/` was not on disk. The ART map points at those slots. Shipped images are marked preview placeholders, not final art.

- `hub-bubbles` — expected `/workspace/toba/art/soft3d/hub-bubbles.png` (or .webp). Placeholder: `assets/art/hub-bubbles.webp`.
- `hub-balloons` — expected `/workspace/toba/art/soft3d/hub-balloons.png` (or .webp). Placeholder: `assets/art/hub-balloons.webp`.
- `hub-feed` — expected `/workspace/toba/art/soft3d/hub-feed.png` (or .webp). Placeholder: `assets/art/hub-feed.webp`.
- `hub-memory` — expected `/workspace/toba/art/soft3d/hub-memory.png` (or .webp). Placeholder: `assets/art/hub-memory.webp`.
- `hub-puzzle` — expected `/workspace/toba/art/soft3d/hub-puzzle.png` (or .webp). Placeholder: `assets/art/hub-puzzle.webp`.
- `hub-counting` — expected `/workspace/toba/art/soft3d/hub-counting.png` (or .webp). Placeholder: `assets/art/hub-counting.webp`.
- `hub-patterns` — expected `/workspace/toba/art/soft3d/hub-patterns.png` (or .webp). Placeholder: `assets/art/hub-patterns.webp`.
- `hub-sorter` — expected `/workspace/toba/art/soft3d/hub-sorter.png` (or .webp). Placeholder: `assets/art/hub-sorter.webp`.
- `title-landscape` — expected `/workspace/toba/art/soft3d/title-landscape.png` (or .webp). Placeholder: `assets/art/title-landscape.webp`.
- `title-portrait` — expected `/workspace/toba/art/soft3d/title-portrait.png` (or .webp). Placeholder: `assets/art/title-portrait.webp`.
- `leo-cheer` — expected `/workspace/toba/art/soft3d/leo-cheer.png` (or .webp). Placeholder: `assets/art/leo-cheer.webp`.
- `leo-wave` — expected `/workspace/toba/art/soft3d/leo-wave.png` (or .webp). Placeholder: `assets/art/leo-wave.webp`.
- `logo-toba` — expected `/workspace/toba/art/soft3d/logo-toba.png` (or .webp). Placeholder: `assets/art/logo-toba.webp`.
- `banana` — expected `/workspace/toba/art/soft3d/banana.png` (or .webp). Placeholder: `assets/art/banana.webp`.

## Tests

Playwright Chromium, iPhone user agent. Viewports 390×844, 375×667, 844×390, 667×375, 1280×800, levels L1–L3. Run with `node tests/h2c-layout.mjs`.

- Pass: **236**
- Fail: **0**

All checks passed.

## Screenshots

- `artifacts/title-portrait.png`
- `artifacts/title-landscape.png`
- `artifacts/hub-level-stars.png`
- `artifacts/hub-level-stars-landscape.png`
- `artifacts/grownups-hold-gate.png`
- `artifacts/counting-L3-844x390.png`
- `artifacts/counting-L3-667x375.png`
- `artifacts/memory-L3-844x390.png`
- `artifacts/memory-L3-667x375.png`
