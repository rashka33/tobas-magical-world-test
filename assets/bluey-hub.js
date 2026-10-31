/* Toba's Magical World — premium hub shell (bluey-h2e).
   Adaptive levels stay in localStorage key tcw-bluey-levels.
   ART paths match /workspace/toba/art/soft3d/ slots. P1 is not part of this build. */
(function () {
  "use strict";

  var BUILD = "2026-10-30-bluey-h2e";
  var STORE = "tcw-bluey-levels";
  var IDS = ["bubbles", "balloons", "feed", "memory", "puzzle", "counting", "patterns", "sorter"];

  /* Level 1 / 2 / 3 counts. Sorter's tray grows starting at level 2. */
  var SPEC = {
    bubbles: [6, 10, 14],
    balloons: [3, 5, 7],
    feed: [3, 4, 6],
    memory: [3, 4, 6],
    puzzle: [2, 3, 4],
    counting: [5, 7, 10],
    patterns: [1, 2, 3],
    sorter: [3, 5, 7]
  };

  var NAMES = {
    bubbles: "Bubbles",
    balloons: "Balloons",
    feed: "Feed",
    memory: "Memory",
    puzzle: "Puzzle",
    counting: "Counting",
    patterns: "Patterns",
    sorter: "Sorter"
  };

  /* Soft-3D slots. Real files replace placeholders when the shared box is filled. */
  var ART = {
    bubbles: "assets/art/hub-bubbles.webp",
    balloons: "assets/art/hub-balloons.webp",
    feed: "assets/art/hub-feed.webp",
    memory: "assets/art/hub-memory.webp",
    puzzle: "assets/art/hub-puzzle.webp",
    counting: "assets/art/hub-counting.webp",
    patterns: "assets/art/hub-patterns.webp",
    sorter: "assets/art/hub-sorter.webp",
    titleLandscape: "assets/art/title-landscape.webp",
    titlePortrait: "assets/art/title-portrait.webp",
    leoCheer: "assets/art/leo-cheer.webp",
    leoWave: "assets/art/leo-wave.webp",
    logo: "assets/art/logo-toba.webp",
    banana: "assets/art/banana.webp",
    /* Ingested and mapped. Dress-up and camel are not hub activities in this build. */
    dressup: "assets/art/hub-dressup.webp",
    camel: "assets/art/hub-camel.webp",
    leoHello: "assets/art/leo-hello.webp",
    leoTalk: "assets/art/leo-talk.webp",
    p1: {
      avatar1: "assets/art/p1/avatar-1.webp",
      avatar2: "assets/art/p1/avatar-2.webp",
      avatar3: "assets/art/p1/avatar-3.webp",
      avatar4: "assets/art/p1/avatar-4.webp",
      avatar5: "assets/art/p1/avatar-5.webp",
      avatar6: "assets/art/p1/avatar-6.webp",
      avatarAdd: "assets/art/p1/avatar-add.webp",
      langEnglish: "assets/art/p1/lang-english.webp",
      langSomali: "assets/art/p1/lang-somali.webp"
    }
  };

  var TILE = {
    bubbles: "linear-gradient(180deg,#e7f7ff,#7ec8f0)",
    balloons: "linear-gradient(180deg,#ffe4ee,#ff9bbd)",
    feed: "linear-gradient(180deg,#fff1cc,#ffc14d)",
    memory: "linear-gradient(180deg,#f3e9ff,#c4b0f5)",
    puzzle: "linear-gradient(180deg,#ffe3cc,#f0a56a)",
    counting: "linear-gradient(180deg,#fff7c2,#ffe14a)",
    patterns: "linear-gradient(180deg,#e5ffe9,#8ed4a4)",
    sorter: "linear-gradient(180deg,#e5f6ff,#8fd4f0)"
  };

  var FACES = ["🦁", "🐵", "🐶", "🐱", "🐰", "🐸", "🦊", "🐼", "🐨", "🐯", "🐷", "🐮"];
  var FOODS = [
    { id: "banana", emoji: "🍌" },
    { id: "apple", emoji: "🍎" },
    { id: "carrot", emoji: "🥕" },
    { id: "grapes", emoji: "🍇" }
  ];
  var SHAPES = ["●", "■", "▲", "★", "♥", "◆", "⬟"];
  var PATTERN_A = ["🔴", "🔵", "🟢", "🟡"];

  function clampLevel(n) {
    n = Number(n) || 1;
    if (n < 1) return 1;
    if (n > 3) return 3;
    return Math.round(n);
  }

  function load() {
    var raw = {};
    try { raw = JSON.parse(localStorage.getItem(STORE) || "{}") || {}; } catch (e) { raw = {}; }
    var out = {};
    IDS.forEach(function (id) {
      var v = raw[id];
      var level = 1;
      var misses = 0;
      if (typeof v === "number") level = v;
      else if (v && typeof v === "object") {
        level = v.level;
        misses = v.misses || 0;
      }
      out[id] = { level: clampLevel(level), misses: Math.max(0, Number(misses) || 0) };
    });
    return out;
  }

  function save() {
    var raw = {};
    IDS.forEach(function (id) {
      raw[id] = { level: state[id].level, misses: state[id].misses };
    });
    try { localStorage.setItem(STORE, JSON.stringify(raw)); } catch (e) {}
  }

  var state = load();
  var screen = "title";
  var session = null;
  var root, stage, titleEl;
  var HOLD_MS = 680;

  function needFor(id) {
    return SPEC[id][state[id].level - 1];
  }

  function recordWin(id) {
    if (!state[id]) return;
    state[id].misses = 0;
    if (state[id].level < 3) state[id].level += 1;
    save();
    if (titleEl && screen === id) titleEl.textContent = "Yay!";
  }

  function recordMiss(id) {
    if (!state[id]) return;
    state[id].misses += 1;
    var dropped = false;
    if (state[id].misses >= 2) {
      state[id].misses = 0;
      if (state[id].level > 1) {
        state[id].level -= 1;
        dropped = true;
      }
    }
    save();
    if (titleEl && screen === id) titleEl.textContent = dropped ? "Easier next time" : "Try again";
    return dropped;
  }

  function resetGame(id) {
    if (!state[id]) return;
    state[id] = { level: 1, misses: 0 };
    save();
  }

  function setLevels(map) {
    if (!map) return;
    Object.keys(map).forEach(function (id) {
      if (!state[id]) return;
      var v = map[id];
      if (typeof v === "number") {
        state[id].level = clampLevel(v);
        state[id].misses = 0;
      } else if (v && typeof v === "object") {
        if (v.level != null) state[id].level = clampLevel(v.level);
        if (v.misses != null) state[id].misses = Math.max(0, Number(v.misses) || 0);
      }
    });
    save();
    if (screen === "hub") render();
    else if (screen === "grownups") render();
  }

  function stars(level) {
    var s = "";
    for (var i = 0; i < level; i++) s += "★";
    return s;
  }

  function starTrack(found, total) {
    var s = "";
    for (var i = 0; i < total; i++) s += i < found ? "★" : "☆";
    return s;
  }

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function el(html) {
    stage.innerHTML = html;
  }

  function render() {
    if (screen === "title") renderTitle();
    else if (screen === "hub") renderHub();
    else if (screen === "grownups") renderGrownups();
    else renderGame(screen);
    syncChrome();
    fit();
  }

  function renderTitle() {
    if (titleEl) titleEl.textContent = "Toba's Magical World";
    var land = window.innerWidth > window.innerHeight;
    var scene = land ? ART.titleLandscape : ART.titlePortrait;
    el(
      '<section class="title-screen' + (land ? " is-land" : "") + '">' +
        '<div class="title-scene">' +
          '<img class="title-art" data-slot="' + (land ? "title-landscape" : "title-portrait") + '" src="' + scene + '" alt="" />' +
        "</div>" +
        '<div class="logo-lockup" data-logo>' +
          '<img class="logo-img" src="' + ART.logo + '" alt="Toba" />' +
          '<span class="logo-b" data-logo-b></span>' +
        "</div>" +
        '<div class="title-gap">' +
          '<img class="leo-title" src="' + ART.leoCheer + '" alt="" />' +
        "</div>" +
        '<button type="button" id="bluey-play" class="play-btn" data-tap aria-label="Play">Play</button>' +
      "</section>"
    );
  }

  function renderHub() {
    if (titleEl) titleEl.textContent = "Toba's Magical World";
    var tiles = IDS.map(function (id) {
      var level = state[id].level;
      var pill = level >= 2
        ? '<span class="level-pill" data-level="' + level + '" aria-label="Level ' + level + '">' + stars(level) + "</span>"
        : "";
      var badge = level < 2 ? '<span class="new-badge">NEW</span>' : "";
      return (
        '<button type="button" class="hub-tile" data-tap data-game="' + id + '" aria-label="Play ' + NAMES[id] + ", level " + level + '">' +
          '<span class="hub-circle">' +
            '<img src="' + ART[id] + '" alt="" />' +
            badge + pill +
          "</span>" +
        "</button>"
      );
    }).join("");
    el(
      '<div class="hub">' +
        '<div class="hub-grid">' + tiles + "</div>" +
      "</div>"
    );
  }

  function renderGrownups() {
    titleEl.textContent = "Grown-ups";
    var rows = IDS.map(function (id) {
      return (
        '<div class="reset-row">' +
          '<span class="reset-name">' + NAMES[id] + "<br>Level " + state[id].level + "</span>" +
          '<button type="button" data-tap data-reset="' + id + '" aria-label="Reset ' + NAMES[id] + ' to level 1">Reset</button>' +
        "</div>"
      );
    }).join("");
    el(
      '<div class="grownups">' +
        '<p class="grownups-lead">A win moves a game up. Two misses move it down. Reset puts it back at level 1. Sorter grows from level 2.</p>' +
        '<div class="reset-grid">' + rows + "</div>" +
        '<button type="button" class="classic-btn" data-tap data-classic="1">Coloring World</button>' +
        '<p class="build-note">Build ' + BUILD + "</p>" +
      "</div>"
    );
  }

  function renderGame(id) {
    titleEl.textContent = NAMES[id] || "Play";
    if (id === "counting") renderCounting();
    else if (id === "memory") renderMemory();
    else if (id === "bubbles") renderBubbles();
    else if (id === "balloons") renderBalloons();
    else if (id === "feed") renderFeed();
    else if (id === "puzzle") renderPuzzle();
    else if (id === "patterns") renderPatterns();
    else if (id === "sorter") renderSorter();
  }

  function renderCounting() {
    var need = session.need;
    var nums = "";
    for (var n = 1; n <= need; n++) {
      var on = n <= session.filled ? " is-on" : "";
      nums += '<div class="num-circle' + on + '" data-num="' + n + '">' + n + "</div>";
    }
    el(
      '<section class="game counting-game" data-level="' + state.counting.level + '">' +
        '<div class="counting-board" data-board>' +
          '<div class="counting-left">' +
            '<div class="monkey-wrap"><img src="' + ART.feed + '" alt="" /></div>' +
            '<div class="num-grid" data-nums>' + nums + "</div>" +
          "</div>" +
          '<div class="counting-right">' +
            '<button type="button" class="banana-btn" data-tap aria-label="Count one banana">' +
              '<img src="' + ART.banana + '" alt="" />' +
            "</button>" +
          "</div>" +
        "</div>" +
      "</section>"
    );
  }

  function renderMemory() {
    var total = session.pairs;
    var cards = session.deck.map(function (card, index) {
      var up = card.up || card.matched ? " is-up" : "";
      if (card.matched) up += " is-matched";
      return (
        '<button type="button" class="mem-card' + up + '" data-tap data-card="' + index + '" aria-label="' +
          (card.up || card.matched ? card.face + " card" : "Face-down card") + '">' +
          '<img class="back" src="' + ART.leoWave + '" alt="" />' +
          '<span class="face" aria-hidden="true">' + card.face + "</span>" +
        "</button>"
      );
    }).join("");
    el(
      '<section class="game memory-game" data-level="' + state.memory.level + '">' +
        '<div class="memory-board" data-board>' +
          '<p class="star-progress" data-stars aria-label="' + session.matches + ' stars">' +
            starTrack(session.matches, total) +
          "</p>" +
          '<div class="memory-grid" data-grid>' + cards + "</div>" +
        "</div>" +
      "</section>"
    );
  }

  function choiceButton(attrs, inner, extraClass) {
    return '<button type="button" class="choice ' + (extraClass || "") + '" data-tap ' + attrs + ">" + inner + "</button>";
  }

  function renderBubbles() {
    var bits = session.items.map(function (item) {
      var cls = item.bad ? "is-mud" : "";
      if (item.gone) cls += " is-popped";
      return choiceButton(
        'data-bubble="' + item.i + '"' + (item.gone ? " disabled" : ""),
        item.bad ? "🪨" : "🫧",
        cls
      );
    }).join("");
    el(
      '<section class="game"><div class="play-board">' +
        '<p class="prompt">Pop the bubbles</p>' +
        '<div class="choice-grid bubble-grid">' + bits + "</div>" +
      "</div></section>"
    );
  }

  function renderBalloons() {
    var bits = session.order.map(function (n) {
      var gone = session.popped[n];
      return choiceButton(
        'data-balloon="' + n + '"' + (gone ? " disabled" : ""),
        String(n),
        gone ? "is-popped" : ""
      );
    }).join("");
    el(
      '<section class="game"><div class="play-board">' +
        '<p class="prompt">Pop in order</p>' +
        '<div class="choice-grid">' + bits + "</div>" +
      "</div></section>"
    );
  }

  function renderFeed() {
    var bits = session.choices.map(function (food) {
      return choiceButton('data-food="' + food.id + '" aria-label="' + food.id + '"', food.emoji, "");
    }).join("");
    el(
      '<section class="game"><div class="play-board">' +
        '<p class="prompt">' + session.want.emoji + "</p>" +
        '<div class="monkey-wrap" style="width:96px;height:96px"><img src="' + ART.feed + '" alt="" /></div>' +
        '<div class="choice-grid">' + bits + "</div>" +
      "</div></section>"
    );
  }

  function renderPuzzle() {
    var slots = session.slots.map(function (face, i) {
      return '<div class="num-circle' + (face ? " is-on" : "") + '" style="width:64px;height:64px;font-size:28px">' +
        (face || (i + 1)) + "</div>";
    }).join("");
    var bits = session.tray.map(function (face) {
      if (!face) return "";
      return choiceButton('data-piece="' + face + '"', face, "");
    }).join("");
    el(
      '<section class="game"><div class="play-board">' +
        '<p class="prompt">Fill the picture</p>' +
        '<div class="choice-grid">' + slots + "</div>" +
        '<div class="choice-grid">' + bits + "</div>" +
      "</div></section>"
    );
  }

  function renderPatterns() {
    var shown = session.shown.map(function (g) { return "<span>" + g + "</span>"; }).join(" ");
    var bits = session.choices.map(function (g) {
      return choiceButton('data-pattern="' + g + '"', g, "");
    }).join("");
    el(
      '<section class="game"><div class="play-board">' +
        '<p class="prompt">What comes next?</p>' +
        '<p class="prompt" aria-hidden="true">' + shown + " …</p>" +
        '<div class="choice-grid">' + bits + "</div>" +
      "</div></section>"
    );
  }

  function renderSorter() {
    var holes = session.holes.map(function (shape) {
      var filled = session.done[shape];
      return choiceButton(
        'data-hole="' + shape + '"' + (filled ? " disabled" : ""),
        filled ? shape : "○",
        filled ? "is-popped" : ""
      );
    }).join("");
    el(
      '<section class="game"><div class="play-board">' +
        '<p class="prompt">' + (session.current || "✓") + "</p>" +
        '<div class="choice-grid">' + holes + "</div>" +
      "</div></section>"
    );
  }

  function freshSession(id) {
    var need = needFor(id);
    if (id === "counting") return { filled: 0, need: need };
    if (id === "memory") {
      var faces = FACES.slice(0, need);
      var deck = shuffle(faces.concat(faces)).map(function (face, i) {
        return { face: face, id: i, up: false, matched: false };
      });
      return { deck: deck, lock: false, open: [], matches: 0, pairs: need, mismatches: 0 };
    }
    if (id === "bubbles") {
      var items = [];
      for (var i = 0; i < need; i++) items.push({ i: i, bad: false, gone: false });
      items.push({ i: need, bad: true, gone: false });
      return { items: shuffle(items), left: need };
    }
    if (id === "balloons") {
      var nums = [];
      for (var b = 1; b <= need; b++) nums.push(b);
      return { order: shuffle(nums), next: 1, need: need, popped: {} };
    }
    if (id === "feed") {
      return { got: 0, need: need, want: FOODS[0], choices: FOODS.slice() };
    }
    if (id === "puzzle") {
      var pieces = FACES.slice(0, need);
      return { pieces: pieces, slots: pieces.map(function () { return ""; }), tray: pieces.slice(), next: 0 };
    }
    if (id === "patterns") {
      return nextPattern({ round: 0, rounds: need, shown: [], answer: "", choices: [] });
    }
    if (id === "sorter") {
      var shapes = SHAPES.slice(0, need);
      return { holes: shapes, queue: shapes.slice(), current: shapes[0], done: {}, need: need, placed: 0 };
    }
    return {};
  }

  function nextPattern(sess) {
    var a = PATTERN_A[sess.round % PATTERN_A.length];
    var b = PATTERN_A[(sess.round + 1) % PATTERN_A.length];
    var shown = [a, b, a, b];
    var answer = a;
    var choices = shuffle([a, b, PATTERN_A[(sess.round + 2) % PATTERN_A.length]]);
    sess.shown = shown;
    sess.answer = answer;
    sess.choices = choices;
    return sess;
  }

  function openGame(id) {
    if (id === "home" || id === "hub") {
      screen = "hub";
      session = null;
    } else if (id === "title") {
      screen = "title";
      session = null;
    } else if (id === "grownups") {
      screen = "grownups";
      session = null;
    } else if (!SPEC[id]) {
      return;
    } else {
      screen = id;
      session = freshSession(id);
    }
    render();
    wipe();
  }

  function onBanana() {
    if (screen !== "counting" || !session) return;
    if (session.filled >= session.need) return;
    session.filled += 1;
    if (session.filled >= session.need) recordWin("counting");
    renderCounting();
    fit();
  }

  function onCard(index) {
    if (screen !== "memory" || !session || session.lock) return;
    var card = session.deck[index];
    if (!card || card.up || card.matched) return;
    card.up = true;
    session.open.push(index);
    if (session.open.length < 2) {
      renderMemory();
      fit();
      return;
    }
    var a = session.deck[session.open[0]];
    var b = session.deck[session.open[1]];
    if (a.face === b.face) {
      a.matched = true;
      b.matched = true;
      session.matches += 1;
      session.open = [];
      if (session.matches >= session.pairs) recordWin("memory");
      renderMemory();
      fit();
      return;
    }
    session.mismatches += 1;
    recordMiss("memory");
    session.lock = true;
    renderMemory();
    fit();
    var snap = session;
    window.setTimeout(function () {
      if (session !== snap) return;
      a.up = false;
      b.up = false;
      snap.open = [];
      snap.lock = false;
      if (screen === "memory") {
        renderMemory();
        fit();
      }
    }, 420);
  }

  function onRootClick(ev) {
    var t = ev.target;
    if (t.closest("#bluey-home")) {
      openGame("hub");
      return;
    }
    if (t.closest("#bluey-play")) {
      openGame("hub");
      return;
    }
    if (t.closest("#bluey-gear")) return;
    if (t.closest("[data-classic]")) {
      hideOverlay();
      return;
    }
    var reset = t.closest("[data-reset]");
    if (reset) {
      resetGame(reset.getAttribute("data-reset"));
      renderGrownups();
      return;
    }
    var game = t.closest("[data-game]");
    if (game && screen === "hub") {
      openGame(game.getAttribute("data-game"));
      return;
    }
    if (t.closest(".banana-btn")) {
      onBanana();
      return;
    }
    var card = t.closest("[data-card]");
    if (card) {
      onCard(Number(card.getAttribute("data-card")));
      return;
    }
    var bubble = t.closest("[data-bubble]");
    if (bubble && session) {
      var item = null;
      session.items.forEach(function (it) {
        if (String(it.i) === bubble.getAttribute("data-bubble")) item = it;
      });
      if (!item || item.gone) return;
      if (item.bad) {
        recordMiss("bubbles");
        bubble.classList.add("shake");
        return;
      }
      item.gone = true;
      session.left -= 1;
      if (session.left <= 0) recordWin("bubbles");
      renderBubbles();
      return;
    }
    var balloon = t.closest("[data-balloon]");
    if (balloon && session && screen === "balloons") {
      var n = Number(balloon.getAttribute("data-balloon"));
      if (session.popped[n]) return;
      if (n !== session.next) {
        recordMiss("balloons");
        balloon.classList.add("shake");
        return;
      }
      session.popped[n] = true;
      session.next += 1;
      if (session.next > session.need) recordWin("balloons");
      renderBalloons();
      return;
    }
    var food = t.closest("[data-food]");
    if (food && session && screen === "feed") {
      if (food.getAttribute("data-food") !== session.want.id) {
        recordMiss("feed");
        food.classList.add("shake");
        return;
      }
      session.got += 1;
      if (session.got >= session.need) {
        recordWin("feed");
        renderFeed();
        return;
      }
      session.want = FOODS[session.got % FOODS.length];
      session.choices = shuffle(FOODS);
      renderFeed();
      return;
    }
    var piece = t.closest("[data-piece]");
    if (piece && session && screen === "puzzle") {
      var face = piece.getAttribute("data-piece");
      if (face !== session.pieces[session.next]) {
        recordMiss("puzzle");
        piece.classList.add("shake");
        return;
      }
      session.slots[session.next] = face;
      session.tray = session.tray.filter(function (f) { return f !== face; });
      session.next += 1;
      if (session.next >= session.pieces.length) recordWin("puzzle");
      renderPuzzle();
      return;
    }
    var pat = t.closest("[data-pattern]");
    if (pat && session && screen === "patterns") {
      if (pat.getAttribute("data-pattern") !== session.answer) {
        recordMiss("patterns");
        pat.classList.add("shake");
        return;
      }
      session.round += 1;
      if (session.round >= session.rounds) {
        recordWin("patterns");
        renderPatterns();
        return;
      }
      nextPattern(session);
      renderPatterns();
      return;
    }
    var hole = t.closest("[data-hole]");
    if (hole && session && screen === "sorter") {
      var shape = hole.getAttribute("data-hole");
      if (shape !== session.current) {
        recordMiss("sorter");
        hole.classList.add("shake");
        return;
      }
      session.done[shape] = true;
      session.placed += 1;
      session.queue.shift();
      session.current = session.queue[0] || "";
      if (session.placed >= session.need) recordWin("sorter");
      renderSorter();
    }
  }

  function fit() {
    if (screen === "title") fitTitle();
    else if (screen === "counting") fitCounting();
    else if (screen === "memory") fitMemory();
  }

  function fitTitle() {
    var img = stage.querySelector(".title-art");
    var section = stage.querySelector(".title-screen");
    if (!img || !section) return;
    var land = window.innerWidth > window.innerHeight;
    var next = land ? ART.titleLandscape : ART.titlePortrait;
    if (img.getAttribute("src") !== next) {
      img.setAttribute("src", next);
      img.setAttribute("data-slot", land ? "title-landscape" : "title-portrait");
    }
    section.classList.toggle("is-land", land);
  }

  function boardBox(board) {
    var cs = getComputedStyle(board);
    var padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    var padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    return {
      w: Math.max(0, board.clientWidth - padX),
      h: Math.max(0, board.clientHeight - padY)
    };
  }

  function applyCountSizes(board, monkeyS, cell, ban, cols, rows, gap) {
    var monkey = board.querySelector(".monkey-wrap");
    var banana = board.querySelector(".banana-btn");
    var grid = board.querySelector(".num-grid");
    var nums = board.querySelectorAll(".num-circle");
    monkey.style.width = monkey.style.height = Math.max(36, Math.floor(monkeyS)) + "px";
    var banPx = Math.max(48, Math.floor(ban));
    banana.style.width = banana.style.height = banPx + "px";
    var c = Math.max(16, Math.floor(cell));
    for (var i = 0; i < nums.length; i++) {
      nums[i].style.width = nums[i].style.height = c + "px";
      nums[i].style.fontSize = Math.max(11, Math.floor(c * 0.42)) + "px";
    }
    grid.style.gap = gap + "px";
    grid.style.gridTemplateColumns = "repeat(" + cols + ", " + c + "px)";
    grid.style.gridTemplateRows = "repeat(" + rows + ", " + c + "px)";
  }

  function countOverflows(board) {
    var b = board.getBoundingClientRect();
    var els = board.querySelectorAll(".num-circle, .monkey-wrap, .banana-btn");
    for (var i = 0; i < els.length; i++) {
      var a = els[i].getBoundingClientRect();
      if (a.width < 8 || a.height < 8) return true;
      if (a.left < b.left - 0.5 || a.top < b.top - 0.5 || a.right > b.right + 0.5 || a.bottom > b.bottom + 0.5) return true;
    }
    return false;
  }

  function fitCounting() {
    var board = stage.querySelector("[data-board]");
    if (!board || !session) return;
    var nums = board.querySelectorAll(".num-circle");
    var n = nums.length;
    var cols = n === 10 ? 5 : n;
    var rows = n === 10 ? 2 : 1;
    var gap = 8;
    var land = board.clientWidth > board.clientHeight;
    board.classList.toggle("is-land", land);
    board.dataset.cols = String(cols);
    board.dataset.rows = String(rows);
    var box = boardBox(board);
    if (box.w < 40 || box.h < 40) return;

    var monkeyS, cell, ban;
    if (land) {
      var leftW = Math.floor(box.w * 0.58) - 8;
      var rightW = box.w - Math.floor(box.w * 0.58) - 8;
      monkeyS = Math.min(leftW * 0.42, box.h * 0.36);
      var gridH = box.h - monkeyS - gap - 8;
      cell = Math.min(
        (leftW - gap * (cols - 1)) / cols,
        (gridH - gap * (rows - 1)) / rows
      );
      ban = Math.min(rightW - 6, box.h - 8);
    } else {
      monkeyS = Math.min(box.w * 0.36, box.h * 0.22);
      ban = Math.min(box.w * 0.5, box.h * 0.3);
      var gridHP = box.h - monkeyS - ban - gap * 2 - 8;
      cell = Math.min(
        (box.w - gap * (cols - 1) - 8) / cols,
        (gridHP - gap * (rows - 1)) / rows
      );
    }

    var guard = 0;
    applyCountSizes(board, monkeyS, cell, ban, cols, rows, gap);
    while (countOverflows(board) && guard < 14) {
      guard += 1;
      monkeyS *= 0.9;
      cell *= 0.9;
      ban *= 0.9;
      applyCountSizes(board, monkeyS, cell, ban, cols, rows, gap);
    }
  }

  function fitMemory() {
    var board = stage.querySelector(".memory-board");
    var grid = stage.querySelector(".memory-grid");
    if (!board || !grid || !session) return;
    var cards = grid.querySelectorAll(".mem-card");
    var count = cards.length;
    var land = board.clientWidth > board.clientHeight;
    var cols, rows;
    if (count >= 12 && land) { cols = 6; rows = 2; }
    else if (count >= 12) { cols = 3; rows = 4; }
    else if (count === 8) { cols = 4; rows = 2; }
    else { cols = 3; rows = 2; }
    var gap = 10;
    var starsEl = board.querySelector(".star-progress");
    var starsH = starsEl ? starsEl.offsetHeight : 26;
    var box = boardBox(board);
    var availW = box.w;
    var availH = box.h - starsH - 6;
    var card = Math.floor(Math.min(
      (availW - gap * (cols - 1)) / cols,
      (availH - gap * (rows - 1)) / rows
    ));
    if (!isFinite(card) || card < 28) card = 28;
    grid.dataset.cols = String(cols);
    grid.dataset.rows = String(rows);
    grid.dataset.land = land ? "1" : "0";

    function apply(size) {
      var s = Math.floor(size);
      grid.style.gap = gap + "px";
      grid.style.gridTemplateColumns = "repeat(" + cols + ", " + s + "px)";
      grid.style.gridTemplateRows = "repeat(" + rows + ", " + s + "px)";
      for (var i = 0; i < cards.length; i++) {
        cards[i].style.width = s + "px";
        cards[i].style.height = s + "px";
        var face = cards[i].querySelector(".face");
        if (face) face.style.fontSize = Math.max(16, Math.floor(s * 0.42)) + "px";
      }
    }

    apply(card);
    var guard = 0;
    var b = board.getBoundingClientRect();
    function overflow() {
      b = board.getBoundingClientRect();
      for (var i = 0; i < cards.length; i++) {
        var a = cards[i].getBoundingClientRect();
        if (a.left < b.left - 0.5 || a.top < b.top - 0.5 || a.right > b.right + 0.5 || a.bottom > b.bottom + 0.5) return true;
      }
      return false;
    }
    while (overflow() && guard < 16 && card > 28) {
      guard += 1;
      card -= 4;
      apply(card);
    }
  }

  function hideOverlay() {
    root.classList.add("is-hidden");
    document.documentElement.classList.remove("bluey-lock");
    var back = document.getElementById("bluey-return");
    if (back) back.hidden = false;
    var space = document.querySelector("[data-generated-space-root]");
    if (space) space.removeAttribute("aria-hidden");
    var footer = document.getElementById("tcw-footer");
    if (footer) footer.removeAttribute("aria-hidden");
  }

  function showOverlay() {
    root.classList.remove("is-hidden");
    document.documentElement.classList.add("bluey-lock");
    var back = document.getElementById("bluey-return");
    if (back) back.hidden = true;
    var space = document.querySelector("[data-generated-space-root]");
    if (space) space.setAttribute("aria-hidden", "true");
    var footer = document.getElementById("tcw-footer");
    if (footer) footer.setAttribute("aria-hidden", "true");
  }

  function syncChrome() {
    var inGame = screen !== "title" && screen !== "hub";
    root.classList.toggle("has-home", inGame);
    root.classList.toggle("is-title", screen === "title");
    root.classList.toggle("is-hub", screen === "hub");
    var home = document.getElementById("bluey-home");
    if (home) {
      if (inGame) home.removeAttribute("hidden");
      else home.setAttribute("hidden", "");
    }
    var leo = document.querySelector(".hub-leo");
    if (leo) leo.hidden = screen === "title";
  }

  function wipe() {
    var wipeEl = root.querySelector(".bluey-wipe");
    root.classList.remove("is-settled");
    if (!wipeEl) {
      root.classList.add("is-settled");
      return;
    }
    var finished = false;
    function done() {
      if (finished) return;
      finished = true;
      wipeEl.classList.remove("is-on");
      wipeEl.hidden = true;
      root.classList.add("is-settled");
    }
    wipeEl.hidden = false;
    wipeEl.classList.remove("is-on");
    void wipeEl.offsetWidth;
    wipeEl.classList.add("is-on");
    wipeEl.addEventListener("animationend", done, { once: true });
    window.setTimeout(done, 560);
  }

  function bindHold(gear) {
    var active = false;
    var raf = 0;
    var start = 0;
    function frame() {
      var p = Math.min(1, (Date.now() - start) / HOLD_MS);
      gear.style.setProperty("--hold", String(p));
      if (p >= 1) {
        end(true);
        return;
      }
      raf = window.requestAnimationFrame(frame);
    }
    function begin(ev) {
      if (active) return;
      active = true;
      start = Date.now();
      gear.classList.add("is-holding");
      try {
        if (ev && ev.pointerId != null && gear.setPointerCapture) gear.setPointerCapture(ev.pointerId);
      } catch (e) {}
      frame();
    }
    function end(open) {
      if (!active && !open) return;
      active = false;
      window.cancelAnimationFrame(raf);
      gear.classList.remove("is-holding");
      gear.style.setProperty("--hold", "0");
      if (open) openGame("grownups");
    }
    gear.addEventListener("pointerdown", function (ev) {
      if (ev.button && ev.button !== 0) return;
      ev.preventDefault();
      begin(ev);
    });
    gear.addEventListener("pointerup", function () { end(false); });
    gear.addEventListener("pointercancel", function () { end(false); });
    gear.addEventListener("pointerleave", function () { if (active) end(false); });
  }

  function mount() {
    document.documentElement.classList.add("bluey-lock");
    root = document.createElement("div");
    root.id = "bluey-root";
    root.setAttribute("data-build", BUILD);
    root.classList.add("is-settled");
    root.innerHTML =
      '<div class="bluey-wipe" hidden></div>' +
      '<div class="bluey-shell">' +
        '<header class="bluey-top">' +
          '<img class="hub-leo" src="' + ART.leoWave + '" alt="" />' +
          '<h1 id="bluey-title">Toba\'s Magical World</h1>' +
        "</header>" +
        '<div id="bluey-stage"></div>' +
      "</div>" +
      '<button type="button" id="bluey-gear" class="gear-btn" data-tap aria-label="Grown-ups, press and hold">' +
        '<span class="gear-icon" aria-hidden="true">⚙</span>' +
        '<svg class="hold-ring" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20"></circle></svg>' +
      "</button>" +
      '<button type="button" id="bluey-home" class="home-btn" data-tap aria-label="Home" hidden>🏠</button>';
    document.body.appendChild(root);
    stage = document.getElementById("bluey-stage");
    titleEl = document.getElementById("bluey-title");
    if (titleEl) titleEl.__tcwStamped = true;
    var gear = document.getElementById("bluey-gear");
    if (gear) {
      gear.__tcwStamped = true;
      bindHold(gear);
    }
    root.addEventListener("click", onRootClick);

    var back = document.createElement("button");
    back.type = "button";
    back.id = "bluey-return";
    back.className = "bluey-return";
    back.hidden = true;
    back.textContent = "Games";
    back.setAttribute("aria-label", "Back to games");
    back.addEventListener("click", function () {
      showOverlay();
      screen = "hub";
      session = null;
      render();
    });
    document.body.appendChild(back);

    showOverlay();
    render();

    if (typeof ResizeObserver === "function") {
      var ro = new ResizeObserver(function () { fit(); });
      ro.observe(root);
    }
    window.addEventListener("resize", fit);
    window.addEventListener("tcw-go", function (ev) {
      if (!ev.detail) return;
      showOverlay();
      openGame(String(ev.detail));
    });
  }

  window.__bluey = {
    build: BUILD,
    store: STORE,
    spec: SPEC,
    art: ART,
    state: function () {
      var copy = {};
      IDS.forEach(function (id) {
        copy[id] = { level: state[id].level, misses: state[id].misses };
      });
      return copy;
    },
    setLevels: setLevels,
    open: openGame,
    win: recordWin,
    miss: recordMiss,
    reset: function (id) {
      resetGame(id);
      if (screen === "grownups") renderGrownups();
      if (screen === "hub") renderHub();
    },
    fit: fit,
    screen: function () { return screen; }
  };

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
