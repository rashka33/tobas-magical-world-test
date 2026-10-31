# REPORT h2e

Build `2026-10-30-bluey-h2e` on branch `cursor/bluey-h2c-rebuild-7a6d`. Not merged. Not published. Live coloring-world repo was not changed.

Soft-3D batch 1 is in the hub circles, Leo, and logo. Batch 2 title plates (`title-portrait` 720×1280, `title-landscape` 1280×720) are the seasonal title backgrounds. The logo sits above Play with at least 24px of clearance so Play does not cover the letter b. Counting's monkey is a circular crop of hub-feed. Memory card backs are leo-wave. No kid-visible preview labels. Dress-up and camel art is mapped but not shown, because those activities are not in this hub. `assets/art/p1/` is wired for later and there is no profile UI.

Levels and landscape layouts are unchanged. Service worker cache is `tcw-2026-10-30-bluey-h2e` (versioned, precache, network-first index.html).

## Art

Ingest reported every required slot present. Titles were re-encoded from soft3d-batch2.

No required slots missing.

## Tests

Playwright Chromium, iPhone user agent. Viewports 390×844, 375×667, 844×390, 667×375, 1280×800, levels L1–L3. Run with `node tests/h2c-layout.mjs`.

- Pass: **245**
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
