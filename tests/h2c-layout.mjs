/**
 * Playwright layout checks for the Bluey hub overlay (build 2026-10-30-bluey-h2e).
 * Chromium + iPhone user agent. Asserts tap targets stay fully inside the viewport
 * (a banana cut off by the landscape board fails) and memory cards do not overlap.
 *
 *   node tests/h2c-layout.mjs
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "artifacts");
mkdirSync(outDir, { recursive: true });

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

const VIEWPORTS = [
  { w: 390, h: 844 },
  { w: 375, h: 667 },
  { w: 844, h: 390 },
  { w: 667, h: 375 },
  { w: 1280, h: 800 },
];

const passes = [];
const fails = [];

function check(name, cond, detail) {
  if (cond) passes.push(name);
  else fails.push(detail ? name + " — " + detail : name);
}

function serve() {
  return new Promise((resolve, reject) => {
    const child = spawn("python3", ["-m", "http.server", "8765", "--bind", "127.0.0.1"], {
      cwd: root,
      stdio: "ignore",
    });
    const start = Date.now();
    const ping = () => {
      fetch("http://127.0.0.1:8765/index.html?nosw=1")
        .then((res) => {
          if (res.ok) resolve(child);
          else if (Date.now() - start > 8000) reject(new Error("server status " + res.status));
          else setTimeout(ping, 150);
        })
        .catch(() => {
          if (Date.now() - start > 8000) reject(new Error("server did not start"));
          else setTimeout(ping, 150);
        });
    };
    child.on("error", reject);
    setTimeout(ping, 200);
  });
}

async function setVP(page, vp) {
  await page.setViewportSize({ width: vp.w, height: vp.h });
  await page.evaluate(() => window.__bluey && window.__bluey.fit());
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

async function settled(page) {
  await page.waitForFunction(() => document.getElementById("bluey-root")?.classList.contains("is-settled"), null, { timeout: 4000 });
}

async function tapReport(page) {
  return page.evaluate(() => {
    const problems = [];
    const nodes = document.querySelectorAll("#bluey-root [data-tap]");
    nodes.forEach((el) => {
      if (el.closest("[hidden]")) return;
      const r = el.getBoundingClientRect();
      const label = el.getAttribute("aria-label") || el.getAttribute("data-game") || el.id || el.className;
      if (r.width < 2 || r.height < 2) {
        problems.push(label + " has no box");
        return;
      }
      if (r.left < -0.5 || r.top < -0.5 || r.right > window.innerWidth + 0.5 || r.bottom > window.innerHeight + 0.5) {
        problems.push(label + " outside viewport");
        return;
      }
      const cx = (r.left + r.right) / 2;
      const cy = (r.top + r.bottom) / 2;
      const m = Math.min(6, r.width / 3, r.height / 3);
      const pts = [
        [cx, cy],
        [cx, r.top + m],
        [cx, r.bottom - m],
        [r.left + m, cy],
        [r.right - m, cy],
      ];
      for (const [x, y] of pts) {
        if (x < -0.5 || y < -0.5 || x > window.innerWidth + 0.5 || y > window.innerHeight + 0.5) {
          problems.push(label + " outside viewport");
          return;
        }
        const hit = document.elementFromPoint(x, y);
        if (!hit || (hit !== el && !el.contains(hit))) {
          problems.push(label + " covered or clipped");
          return;
        }
      }
    });
    return { count: nodes.length, problems };
  });
}

function clusters(values, tol) {
  const sorted = values.slice().sort((a, b) => a - b);
  const groups = [];
  sorted.forEach((v) => {
    if (!groups.length || Math.abs(v - groups[groups.length - 1]) > tol) groups.push(v);
    else groups[groups.length - 1] = (groups[groups.length - 1] + v) / 2;
  });
  return groups.length;
}

async function memoryGeometry(page) {
  return page.evaluate(() => {
    const cards = [...document.querySelectorAll(".mem-card")].map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, bottom: r.bottom };
    });
    const text = (document.querySelector(".memory-board") || document.body).innerText || "";
    const backs = [...document.querySelectorAll(".mem-card .back")].map((img) => ({
      src: img.getAttribute("src") || "",
      w: img.naturalWidth,
    }));
    const q = text.includes("?");
    return { cards, text, backs, q, cols: document.querySelector(".memory-grid")?.dataset.cols, rows: document.querySelector(".memory-grid")?.dataset.rows };
  });
}

function memoryChecks(name, geo, vp) {
  const cards = geo.cards;
  check(name + " has cards", cards.length >= 6, "count " + cards.length);
  let overlap = false;
  let off = false;
  let squish = false;
  let minGap = Infinity;
  cards.forEach((a, i) => {
    if (Math.abs(a.w - a.h) > 2) squish = true;
    if (a.x < -1 || a.y < -1 || a.right > vp.w + 1 || a.bottom > vp.h + 1) off = true;
    cards.forEach((b, j) => {
      if (j <= i) return;
      const ix = Math.min(a.right, b.right) - Math.max(a.x, b.x);
      const iy = Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y);
      if (ix > 1 && iy > 1) overlap = true;
      const sameRow = Math.abs(a.y - b.y) < 4;
      const sameCol = Math.abs(a.x - b.x) < 4;
      if (sameRow && b.x > a.x) minGap = Math.min(minGap, b.x - a.right);
      if (sameCol && b.y > a.y) minGap = Math.min(minGap, b.y - a.bottom);
    });
  });
  check(name + " near-square", !squish);
  check(name + " on screen", !off);
  check(name + " no overlap", !overlap);
  check(name + " gap >= 8", minGap >= 8, "gap " + minGap);
  check(name + " no question mark", !geo.q && !/pairs/i.test(geo.text));
  check(name + " leo backs", geo.backs.every((b) => b.src.includes("leo-wave") && b.w > 0));
  const xs = cards.map((c) => c.x);
  const ys = cards.map((c) => c.y);
  const colN = clusters(xs, 6);
  const rowN = clusters(ys, 6);
  const land = vp.w > vp.h;
  if (cards.length >= 12) {
    if (land) {
      check(name + " L3 landscape 6x2", colN === 6 && rowN === 2, colN + "x" + rowN);
    } else {
      check(name + " L3 portrait 3x4", colN === 3 && rowN === 4, colN + "x" + rowN);
    }
  }
  return { colN, rowN, minGap };
}

async function countingChecks(page, vp) {
  const info = await page.evaluate(() => {
    const board = document.querySelector(".counting-board");
    const b = board.getBoundingClientRect();
    const pieces = [...board.querySelectorAll(".num-circle, .monkey-wrap, .banana-btn")].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        cls: el.className,
        x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, bottom: r.bottom,
        inside: r.left >= b.left - 1 && r.top >= b.top - 1 && r.right <= b.right + 1 && r.bottom <= b.bottom + 1,
      };
    });
    const ban = document.querySelector(".banana-btn").getBoundingClientRect();
    const nums = [...document.querySelectorAll(".num-circle")].map((el) => el.getBoundingClientRect());
    const left = document.querySelector(".counting-left").getBoundingClientRect();
    const right = document.querySelector(".counting-right").getBoundingClientRect();
    const text = document.querySelector("#bluey-root").innerText || "";
    const label = document.querySelector(".banana-btn").getAttribute("aria-label") || "";
    const monkey = document.querySelector(".monkey-wrap img");
    return {
      land: board.classList.contains("is-land"),
      pieces,
      ban: { x: ban.x, y: ban.y, w: ban.width, h: ban.height, right: ban.right, bottom: ban.bottom },
      nums: nums.map((r) => ({ x: r.x, y: r.y, w: r.width, h: r.height })),
      sideBySide: right.x >= left.x + left.width * 0.4,
      stacked: ban.y >= nums[0].y + nums[0].height - 2,
      text,
      label,
      monkeySrc: monkey ? monkey.getAttribute("src") : "",
      monkeyW: monkey ? monkey.naturalWidth : 0,
      filled: document.querySelectorAll(".num-circle.is-on").length,
    };
  });
  const name = "counting L3 " + vp.w + "x" + vp.h;
  const outside = info.pieces.filter((p) => !p.inside || p.x < -1 || p.y < -1 || p.right > vp.w + 1 || p.bottom > vp.h + 1);
  check(name + " pieces inside board and viewport", outside.length === 0, JSON.stringify(outside.map((p) => p.cls)));
  check(name + " banana big", info.ban.w >= 48 && info.ban.h >= 48, JSON.stringify(info.ban));
  check(name + " no Goal chip", !/goal/i.test(info.text));
  check(name + " banana aria only", info.label.toLowerCase().includes("banana") && !/goal/i.test(info.label));
  check(name + " monkey art", (info.monkeySrc || "").includes("hub-feed") && info.monkeyW > 0);
  const colN = clusters(info.nums.map((n) => n.x), 6);
  const rowN = clusters(info.nums.map((n) => n.y), 6);
  check(name + " numbers 2x5", colN === 5 && rowN === 2, colN + "x" + rowN);
  if (vp.w > vp.h) {
    check(name + " landscape 2-col", info.land && info.sideBySide, "land=" + info.land + " side=" + info.sideBySide);
  } else {
    check(name + " portrait stack", !info.land && info.stacked, "land=" + info.land + " stacked=" + info.stacked);
  }
  return info;
}

async function main() {
  const sw = readFileSync(join(root, "sw.js"), "utf8");
  const index = readFileSync(join(root, "index.html"), "utf8");
  const hub = readFileSync(join(root, "assets/bluey-hub.js"), "utf8");
  check("sw versioned cache", sw.includes('var CACHE = "tcw-" + BUILD_ID') && sw.includes("2026-10-30-bluey-h2e"));
  check("sw precaches hub and art", ["bluey-hub.css", "bluey-hub.js", "hub-feed.webp", "leo-wave.webp", "banana.webp"].every((s) => sw.includes(s)));
  check("sw network-first index.html", /function networkFirst/.test(sw) && /isIndex\(url\)/.test(sw) && sw.includes("networkFirst(req)"));
  check("index wires hub and one-line bridge", index.includes("assets/bluey-hub.css") && index.includes("assets/bluey-hub.js") && /window\.__tcwGo=function/.test(index));
  check("index registers sw", index.includes('navigator.serviceWorker.register("sw.js'));
  check("no strings.js", !existsSync(join(root, "assets/strings.js")) && !hub.includes("strings.js"));
  check("no avatar profile", !/avatar profile/i.test(hub));

  const server = await serve();
  const browser = await chromium.launch({ headless: true });
  const pageErrors = [];
  try {
    const context = await browser.newContext({
      userAgent: IPHONE_UA,
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 1,
    });
    await context.addInitScript(() => {
      localStorage.setItem("tcw-name-chosen", "1");
      localStorage.setItem("tcw-startcard", "seen");
      localStorage.setItem("tcw-bluey-levels", JSON.stringify({
        bubbles: 2,
        balloons: 3,
        feed: 2,
        memory: 3,
        puzzle: 2,
        counting: 3,
        patterns: 2,
        sorter: 3,
      }));
    });
    const page = await context.newPage();
    page.on("pageerror", (err) => pageErrors.push(String(err)));
    await page.goto("http://127.0.0.1:8765/index.html?nosw=1", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".title-screen", { timeout: 15000 });
    await settled(page);

    const build = await page.evaluate(() => ({
      stamp: document.getElementById("tcw-buildstamp")?.textContent || "",
      root: document.getElementById("bluey-root")?.getAttribute("data-build") || "",
      bridge: typeof window.__tcwGo,
    }));
    check("build id stamped", build.stamp.includes("2026-10-30-bluey-h2e") && build.root === "2026-10-30-bluey-h2e");
    check("bridge is a function", build.bridge === "function");

    async function titleChecks(label, slot) {
      const info = await page.evaluate(() => {
        const b = document.querySelector("[data-logo-b]").getBoundingClientRect();
        const logo = document.querySelector(".logo-img").getBoundingClientRect();
        const play = document.querySelector("#bluey-play").getBoundingClientRect();
        const leo = document.querySelector(".leo-title").getBoundingClientRect();
        const ix = Math.min(b.right, play.right) - Math.max(b.left, play.left);
        const iy = Math.min(b.bottom, play.bottom) - Math.max(b.top, play.top);
        const text = document.querySelector("#bluey-root").innerText || "";
        return {
          overlap: ix > 1 && iy > 1,
          playH: play.height,
          leoW: leo.width,
          scene: document.querySelector(".title-art")?.getAttribute("data-slot") || "",
          bW: b.width,
          gap: play.top - logo.bottom,
          logoW: document.querySelector(".logo-img").naturalWidth,
          preview: /preview/i.test(text),
        };
      });
      check(label + " play misses letter b", !info.overlap && info.bW > 8, JSON.stringify(info));
      check(label + " logo sits 24px above play", info.gap >= 24, "gap " + info.gap);
      check(label + " play is huge", info.playH >= 88, "h " + info.playH);
      check(label + " leo on title", info.leoW > 36, "leo " + info.leoW);
      check(label + " title art", info.scene === slot, info.scene);
      check(label + " logo image", info.logoW > 0);
      check(label + " no preview watermark", !info.preview);
      const taps = await tapReport(page);
      check(label + " tap targets", taps.problems.length === 0, taps.problems.slice(0, 6).join("; "));
    }

    await titleChecks("title portrait", "title-portrait");
    await page.screenshot({ path: join(outDir, "title-portrait.png") });
    await setVP(page, { w: 844, h: 390 });
    await titleChecks("title landscape", "title-landscape");
    await page.screenshot({ path: join(outDir, "title-landscape.png") });
    await setVP(page, { w: 667, h: 375 });
    await titleChecks("title short landscape", "title-landscape");
    await setVP(page, { w: 390, h: 844 });

    await page.locator("#bluey-play").click();
    await page.waitForSelector(".hub-tile", { timeout: 15000 });
    await settled(page);

    const kidText = await page.locator("#bluey-root").innerText();
    check("no grown-ups text link on the hub", !/grown-ups/i.test(kidText));
    check("no labels under hub tiles", await page.locator(".hub-label").count() === 0);
    check("hub shows leo wave", await page.locator(".hub-leo").count() === 1);

    const pills = await page.locator(".level-pill").count();
    const newBadges = await page.locator(".new-badge").count();
    check("hub shows 8 level pills", pills === 8, "pills " + pills);
    check("level pills differ from NEW badge", newBadges === 0, "new " + newBadges);

    await page.screenshot({ path: join(outDir, "hub-level-stars.png") });
    await setVP(page, { w: 844, h: 390 });
    await page.screenshot({ path: join(outDir, "hub-level-stars-landscape.png") });
    const landPills = await page.locator(".level-pill").count();
    check("landscape hub still shows pills", landPills === 8, "pills " + landPills);
    const hubTaps = await tapReport(page);
    check("landscape hub tap targets fully in viewport", hubTaps.problems.length === 0, hubTaps.problems.slice(0, 6).join("; "));

    await setVP(page, { w: 390, h: 844 });
    const portTaps = await tapReport(page);
    check("portrait hub tap targets fully in viewport", portTaps.problems.length === 0, portTaps.problems.slice(0, 6).join("; "));

    await page.locator("#bluey-gear").click();
    check("quick gear tap stays on hub", (await page.evaluate(() => window.__bluey.screen())) === "hub");
    await page.evaluate(() => {
      const gear = document.getElementById("bluey-gear");
      const r = gear.getBoundingClientRect();
      gear.dispatchEvent(new PointerEvent("pointerdown", {
        bubbles: true, cancelable: true, pointerId: 1, pointerType: "touch", button: 0,
        clientX: r.x + r.width / 2, clientY: r.y + r.height / 2,
      }));
    });
    await page.waitForTimeout(320);
    await page.screenshot({ path: join(outDir, "grownups-hold-gate.png") });
    const hold = await page.evaluate(() => {
      const gear = document.getElementById("bluey-gear");
      return { holding: gear.classList.contains("is-holding"), p: Number(gear.style.getPropertyValue("--hold") || "0") };
    });
    check("hold gate is visible while pressed", hold.holding && hold.p > 0.2, JSON.stringify(hold));
    await page.evaluate(() => {
      document.getElementById("bluey-gear").dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 1, pointerType: "touch" }));
    });
    check("release before the hold finishes stays on hub", (await page.evaluate(() => window.__bluey.screen())) === "hub");

    for (const vp of VIEWPORTS) {
      await setVP(page, vp);
      await page.evaluate(() => window.__bluey.open("counting"));
      await page.waitForSelector(".banana-btn");
      await page.evaluate(() => window.__bluey.fit());
      const before = await tapReport(page);
      check("counting " + vp.w + "x" + vp.h + " tap targets", before.problems.length === 0, before.problems.slice(0, 8).join("; "));
      for (let i = 0; i < 4; i++) {
        await page.locator(".banana-btn").click({ timeout: 4000 });
      }
      const filled = await page.locator(".num-circle.is-on").count();
      check("counting " + vp.w + "x" + vp.h + " banana fills numbers", filled === 4, "filled " + filled);
      await countingChecks(page, vp);
      const after = await tapReport(page);
      check("counting " + vp.w + "x" + vp.h + " still tappable after play", after.problems.length === 0, after.problems.slice(0, 6).join("; "));
      await page.screenshot({ path: join(outDir, "counting-L3-" + vp.w + "x" + vp.h + ".png") });
    }

    for (const level of [1, 2, 3]) {
      for (const vp of VIEWPORTS) {
        await setVP(page, vp);
        await page.evaluate((lvl) => {
          window.__bluey.setLevels({ memory: lvl });
          window.__bluey.open("memory");
          window.__bluey.fit();
        }, level);
        await page.waitForSelector(".mem-card");
        const geo = await memoryGeometry(page);
        const tag = "memory L" + level + " " + vp.w + "x" + vp.h;
        check(tag + " card count", geo.cards.length === [0, 6, 8, 12][level], "cards " + geo.cards.length);
        memoryChecks(tag, geo, vp);
        const taps = await tapReport(page);
        check(tag + " tap targets", taps.problems.length === 0, taps.problems.slice(0, 6).join("; "));
        await page.screenshot({ path: join(outDir, "memory-L" + level + "-" + vp.w + "x" + vp.h + ".png") });
      }
    }

    await setVP(page, { w: 390, h: 844 });
    await page.evaluate(() => window.__tcwGo("grownups"));
    await page.waitForSelector("[data-reset]");
    const resets = await page.locator("[data-reset]").count();
    check("grown-ups can reset each game", resets === 8, "resets " + resets);
    let grownTaps = await tapReport(page);
    check("portrait grown-ups resets clear the home button", grownTaps.problems.length === 0, grownTaps.problems.slice(0, 8).join("; "));
    await setVP(page, { w: 667, h: 375 });
    await page.evaluate(() => window.__bluey.fit());
    grownTaps = await tapReport(page);
    check("landscape grown-ups resets clear the home button", grownTaps.problems.length === 0, grownTaps.problems.slice(0, 8).join("; "));

    const levels = await page.evaluate(() => {
      window.__bluey.setLevels({ bubbles: 1, balloons: 2, sorter: 1, counting: 3 });
      window.__bluey.win("bubbles");
      window.__bluey.miss("balloons");
      window.__bluey.miss("balloons");
      window.__bluey.win("counting");
      window.__bluey.reset("sorter");
      const st = window.__bluey.state();
      const spec = window.__bluey.spec;
      return {
        st,
        store: window.__bluey.store,
        raw: localStorage.getItem("tcw-bluey-levels"),
        sorter: spec.sorter,
        bubbles: spec.bubbles,
        memory: spec.memory,
        counting: spec.counting,
      };
    });
    check("storage key tcw-bluey-levels", levels.store === "tcw-bluey-levels" && (levels.raw || "").includes("bubbles"));
    check("win levels up", levels.st.bubbles.level === 2 && levels.st.bubbles.misses === 0, JSON.stringify(levels.st.bubbles));
    check("two misses level down", levels.st.balloons.level === 1 && levels.st.balloons.misses === 0, JSON.stringify(levels.st.balloons));
    check("win caps at L3", levels.st.counting.level === 3, JSON.stringify(levels.st.counting));
    check("spec counts", JSON.stringify(levels.bubbles) === "[6,10,14]" && JSON.stringify(levels.memory) === "[3,4,6]" && JSON.stringify(levels.counting) === "[5,7,10]");
    check("sorter grows from L2", JSON.stringify(levels.sorter) === "[3,5,7]" && levels.st.sorter.level === 1);

    const bridgeOpened = await page.evaluate(() => {
      window.__tcwGo("counting");
      return window.__bluey.screen();
    });
    check("window.__tcwGo opens a game", bridgeOpened === "counting");

    check("no bluey page errors", pageErrors.length === 0, pageErrors.slice(0, 3).join(" | "));
    await context.close();
  } finally {
    await browser.close();
    server.kill("SIGTERM");
  }

  let artStatus = { missing: [], finalArt: false, sourceDirExists: false };
  try { artStatus = JSON.parse(readFileSync(join(root, "assets/art/ART-STATUS.json"), "utf8")); } catch (e) {}
  const summary = {
    build: "2026-10-30-bluey-h2e",
    pass: passes.length,
    fail: fails.length,
    fails,
    artFinal: !!artStatus.finalArt,
    artMissing: artStatus.missing || [],
  };
  writeFileSync(join(outDir, "h2e-results.json"), JSON.stringify(summary, null, 2));

  const shots = [
    "title-portrait.png",
    "title-landscape.png",
    "hub-level-stars.png",
    "hub-level-stars-landscape.png",
    "grownups-hold-gate.png",
    "counting-L3-844x390.png",
    "counting-L3-667x375.png",
    "memory-L3-844x390.png",
    "memory-L3-667x375.png",
  ];
  const missing = (artStatus.missing || []).map((slot) => "- `" + slot + "` — expected `/workspace/toba/art/soft3d/" + slot + ".png` (or .webp). Placeholder: `assets/art/" + slot + ".webp`.");
  const report = [
    "# REPORT h2e",
    "",
    "Build `2026-10-30-bluey-h2e` on branch `cursor/bluey-h2c-rebuild-7a6d`. Not merged. Not published. Live coloring-world repo was not changed.",
    "",
    "Soft-3D batch 1 is in the hub circles, Leo, and logo. Batch 2 title plates (`title-portrait` 720×1280, `title-landscape` 1280×720) are the seasonal title backgrounds. The logo sits above Play with at least 24px of clearance so Play does not cover the letter b. Counting's monkey is a circular crop of hub-feed. Memory card backs are leo-wave. No kid-visible preview labels. Dress-up and camel art is mapped but not shown, because those activities are not in this hub. `assets/art/p1/` is wired for later and there is no profile UI.",
    "",
    "Levels and landscape layouts are unchanged. Service worker cache is `tcw-2026-10-30-bluey-h2e` (versioned, precache, network-first index.html).",
    "",
    "## Art",
    "",
    artStatus.finalArt
      ? "Ingest reported every required slot present. Titles were re-encoded from soft3d-batch2."
      : "Ingest reported missing slots.",
    "",
    missing.length ? missing.join("\n") : "No required slots missing.",
    "",
    "## Tests",
    "",
    "Playwright Chromium, iPhone user agent. Viewports 390×844, 375×667, 844×390, 667×375, 1280×800, levels L1–L3. Run with `node tests/h2c-layout.mjs`.",
    "",
    "- Pass: **" + passes.length + "**",
    "- Fail: **" + fails.length + "**",
    "",
    fails.length ? "### Failures\n\n" + fails.map((f) => "- " + f).join("\n") : "All checks passed.",
    "",
    "## Screenshots",
    "",
    ...shots.map((name) => "- `artifacts/" + name + "`"),
    "",
  ].join("\n");
  writeFileSync(join(outDir, "REPORT-h2e.md"), report);
  console.log(JSON.stringify(summary, null, 2));
  if (fails.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
