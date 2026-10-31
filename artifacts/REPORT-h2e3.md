# REPORT h2e3

Build `2026-10-30-bluey-h2e3` on branch `cursor/bluey-h2c-rebuild-7a6d`. Not merged. Not published. Live coloring-world repo was not changed.

Title Play is a huge circle with a white triangle and no readable word. The logo stays above it with at least 24px of clearance, and the letter b is not covered, in portrait and landscape. The hub header uses the Toba logo instead of a text title. Memory L3 shows exactly six stars, one per pair.

Soft-3D hub, seasonal titles, logo clearance, leo-wave memory backs, and level layouts are otherwise unchanged. No profile UI.

Levels and landscape layouts are unchanged. Service worker cache is `tcw-2026-10-30-bluey-h2e3` (versioned, precache, network-first index.html).

## Art

Ingest reported every required slot present. Titles were re-encoded from soft3d-batch2.

No required slots missing.

## Tests

Playwright Chromium, iPhone user agent. Viewports 390×844, 375×667, 844×390, 667×375, 1280×800, levels L1–L3. Run with `node tests/h2c-layout.mjs`.

- Pass: **261**
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
