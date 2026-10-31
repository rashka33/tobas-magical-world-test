# REPORT h2c

Build `2026-10-30-bluey-h2c` on branch `cursor/bluey-h2c-rebuild-7a6d`. Not merged. Live coloring-world repo was not changed.

Bluey-inspired hub overlay (`assets/bluey-hub.css`, `assets/bluey-hub.js`) on the bundled app. Adaptive levels in `localStorage` key `tcw-bluey-levels` (L1–L3). Win moves a game up; two misses move it down. Sorter tray is 3 / 5 / 7 and grows from L2. No P1 (no avatar profile, no `strings.js`).

Offline service worker `sw.js`: versioned cache `tcw-2026-10-30-bluey-h2c`, precached shell and `assets/art/*.webp`, network-first `index.html`.

Critiquito h2c layout: landscape Counting is two columns (monkey + number circles on the left, banana button on the right). L3 numbers are 2×5. No kid-facing Goal chip. Memory uses star progress and Leo-wave card backs. L3 portrait is 3×4 near-square cards; L3 landscape is 6×2.

## Tests

Playwright Chromium, iPhone user agent. Viewports 390×844, 375×667, 844×390, 667×375, 1280×800. Run with `node tests/h2c-layout.mjs`.

- Pass: **215**
- Fail: **0**

All checks passed.

## Screenshots

- `artifacts/hub-level-stars.png`
- `artifacts/hub-level-stars-landscape.png`
- `artifacts/counting-L3-390x844.png`
- `artifacts/counting-L3-375x667.png`
- `artifacts/counting-L3-844x390.png`
- `artifacts/counting-L3-667x375.png`
- `artifacts/counting-L3-1280x800.png`
- `artifacts/memory-L1-390x844.png`
- `artifacts/memory-L1-375x667.png`
- `artifacts/memory-L1-844x390.png`
- `artifacts/memory-L1-667x375.png`
- `artifacts/memory-L1-1280x800.png`
- `artifacts/memory-L2-390x844.png`
- `artifacts/memory-L2-375x667.png`
- `artifacts/memory-L2-844x390.png`
- `artifacts/memory-L2-667x375.png`
- `artifacts/memory-L2-1280x800.png`
- `artifacts/memory-L3-390x844.png`
- `artifacts/memory-L3-375x667.png`
- `artifacts/memory-L3-844x390.png`
- `artifacts/memory-L3-667x375.png`
- `artifacts/memory-L3-1280x800.png`
