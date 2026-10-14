/* OSI Hackathon @ NC State — interactions */
(function () {
  "use strict";

  var C = window.SITE_CONFIG || {};
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  /* ---------- Links from config ---------- */
  var links = {
    register: C.registerUrl,
    slack: C.slackUrl,
    global: C.globalSiteUrl,
    globalRegister: C.globalRegisterUrl
  };
  $$("[data-link]").forEach(function (a) {
    var url = links[a.getAttribute("data-link")];
    if (url) {
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
    } else if (a.hasAttribute("data-pending")) {
      a.textContent = a.getAttribute("data-pending");
      a.classList.add("is-pending");
      a.setAttribute("aria-disabled", "true");
      a.removeAttribute("href");
    }
  });

  /* ---------- Theme ---------- */
  var mql = window.matchMedia("(prefers-color-scheme: dark)");
  function resolvedTheme() {
    return root.getAttribute("data-theme") || (mql.matches ? "dark" : "light");
  }
  function syncTheme() {
    var t = resolvedTheme();
    root.setAttribute("data-theme-resolved", t);
    var btn = $("#theme-toggle");
    if (btn) btn.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
    document.dispatchEvent(new CustomEvent("themechange"));
  }
  syncTheme();
  if (mql.addEventListener) mql.addEventListener("change", syncTheme);
  $("#theme-toggle").addEventListener("click", function () {
    var next = resolvedTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    syncTheme();
  });

  /* ---------- Header: scroll state, mobile menu ---------- */
  var header = $(".site-header");
  function measureHeader() {
    var h = header.offsetHeight;
    root.style.setProperty("--header-h", h + "px");
    root.style.setProperty("--nav-top", h + "px");
  }
  measureHeader();
  window.addEventListener("resize", measureHeader);

  function onScroll() { root.classList.toggle("is-scrolled", window.scrollY > 8); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var navToggle = $("#nav-toggle");
  function setNav(open) {
    root.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  navToggle.addEventListener("click", function () { setNav(!root.classList.contains("nav-open")); });
  $$("#nav-links a").forEach(function (a) { a.addEventListener("click", function () { setNav(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setNav(false); });

  /* ---------- Active nav link ---------- */
  var navMap = {};
  $$("#nav-links a[href^='#']").forEach(function (a) {
    if (!a.hasAttribute("data-link")) navMap[a.getAttribute("href").slice(1)] = a;
  });
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = navMap[en.target.id];
        if (!a) return;
        if (en.isIntersecting) {
          Object.keys(navMap).forEach(function (k) { navMap[k].classList.remove("is-active"); });
          a.classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(navMap).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = $$(".reveal");
  if (!("IntersectionObserver" in window) || reduceMotion) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    // stagger siblings that reveal together
    revealEls.forEach(function (el) {
      var sibs = $$(":scope > .reveal", el.parentElement);
      var i = sibs.indexOf(el);
      if (i > 0) el.style.transitionDelay = Math.min(i * 70, 420) + "ms";
    });
    var rv = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); rv.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { rv.observe(el); });
  }

  /* ---------- Count-up numbers ---------- */
  var counters = $$("[data-count]");
  function runCounter(el) {
    var target = +el.getAttribute("data-count");
    var suffix = el.getAttribute("data-suffix") || "";
    var t0 = performance.now(), dur = 1200;
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      var v = Math.round(target * (1 - Math.pow(1 - p, 3)));
      el.textContent = v + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  if ("IntersectionObserver" in window && !reduceMotion) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCounter(en.target); co.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { el.textContent = "0"; co.observe(el); });
  }

  /* ---------- Countdown ---------- */
  var start = new Date(C.eventStart || "2026-10-21T10:00:00-04:00").getTime();
  var end = new Date(C.eventEnd || "2026-10-22T18:00:00-04:00").getTime();
  var cd = $("#countdown"), cdLabel = $("#countdown-label"), cdGrid = $("#countdown-grid");
  var cdEls = { d: $("#cd-d"), h: $("#cd-h"), m: $("#cd-m"), s: $("#cd-s") };
  function pad(n) { return n < 10 ? "0" + n : String(n); }
  function tick() {
    var now = Date.now(), target, label;
    if (now < start) { target = start; label = "Kickoff in"; }
    else if (now < end) { target = end; label = "Hacking is live · submissions close in"; cd.classList.add("is-live"); }
    else {
      cdLabel.textContent = "That's a wrap — thank you for building with us!";
      cdGrid.hidden = true;
      return false;
    }
    var diff = Math.max(0, target - now);
    var d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24, m = Math.floor(diff / 6e4) % 60, s = Math.floor(diff / 1e3) % 60;
    cdLabel.textContent = label;
    cdEls.d.textContent = pad(d); cdEls.h.textContent = pad(h); cdEls.m.textContent = pad(m); cdEls.s.textContent = pad(s);
    return true;
  }
  if (tick()) var cdTimer = setInterval(function () { if (!tick()) clearInterval(cdTimer); }, 1000);

  /* ---------- Schedule tabs + "happening now" ---------- */
  var tabs = $$(".tab");
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { selectTab(t); });
    t.addEventListener("keydown", function (e) {
      var k = e.key, n = null;
      if (k === "ArrowRight" || k === "ArrowDown") n = tabs[(i + 1) % tabs.length];
      if (k === "ArrowLeft" || k === "ArrowUp") n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (k === "Home") n = tabs[0];
      if (k === "End") n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); selectTab(n, true); }
    });
  });

  function markNow() {
    var now = Date.now();
    $$(".tabpanel").forEach(function (panel) {
      var live = false;
      $$("li[data-start]", panel).forEach(function (li) {
        var s = new Date(li.getAttribute("data-start")).getTime();
        var e = new Date(li.getAttribute("data-end")).getTime();
        li.classList.toggle("is-now", now >= s && now < e);
        li.classList.toggle("is-past", now >= e);
        if (now >= s && now < e) live = true;
      });
      var tab = document.getElementById(panel.getAttribute("aria-labelledby"));
      if (tab) tab.classList.toggle("has-now", live);
    });
  }
  // open the most relevant day automatically
  (function () {
    var now = Date.now();
    var day2 = new Date("2026-10-22T00:00:00-04:00").getTime();
    if (now >= end) selectTab($("#tab-after"));
    else if (now >= day2) selectTab($("#tab-d2"));
  })();
  markNow();
  setInterval(markNow, 60000);

  /* ---------- Resource filters ---------- */
  var chips = $$(".chip");
  var items = $$("#resource-list li");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.getAttribute("data-filter");
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-pressed", String(on));
      });
      items.forEach(function (li) { li.hidden = !(f === "all" || li.getAttribute("data-cat") === f); });
    });
  });

  /* ==========================================================================
     Canvas helpers
     ========================================================================== */
  function cssVar(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }
  function hexToRgb(hex) {
    hex = hex.replace("#", "");
    if (hex.length === 3) hex = hex.replace(/(.)/g, "$1$1");
    var n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function rgba(c, a) { return "rgba(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + "," + a + ")"; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function setupCanvas(canvas, draw) {
    var ctx = canvas.getContext("2d");
    var state = { w: 0, h: 0, visible: true, running: false, ctx: ctx };
    function resize() {
      var r = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.w = r.width; state.h = r.height;
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!state.running) draw(state, performance.now());
    }
    function loop(now) {
      if (!state.visible || document.hidden || reduceMotion) { state.running = false; return; }
      state.running = true;
      draw(state, now);
      requestAnimationFrame(loop);
    }
    function kick() { if (!state.running && !reduceMotion) requestAnimationFrame(loop); }
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener("resize", resize);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { state.visible = en[0].isIntersecting; if (state.visible) kick(); }).observe(canvas);
    }
    document.addEventListener("visibilitychange", kick);
    document.addEventListener("themechange", function () { if (!state.running) draw(state, performance.now()); });
    resize();
    kick();
    return state;
  }

  /* ==========================================================================
     Hero: crystal lattice ⇄ neural network
     ========================================================================== */
  var lattice = $("#lattice");
  if (lattice) (function () {
    var NX = 4, NY = 3, NZ = 3;
    var LAYERS = [4, 6, 8, 8, 6, 4];      // 36 neurons = 4 × 3 × 3 atoms
    var nodes = [], latticeEdges = [], netEdges = [], outgoing = [];
    var colors = {};
    var pointer = { x: -1e4, y: -1e4 };
    var figState = $("#fig-state"), figNext = $("#fig-state-next");
    var lastLabel = "";

    function readColors() {
      colors.red = hexToRgb(cssVar("--red") || "#CC0000");
      colors.blue = hexToRgb(cssVar("--blue") || "#4156A1");
      colors.ink = hexToRgb(cssVar("--ink-2") || "#474C54");
      colors.line = hexToRgb(cssVar("--ink-3") || "#6E747D");
      colors.dark = (root.getAttribute("data-theme-resolved") === "dark");
    }
    readColors();
    document.addEventListener("themechange", readColors);

    // atoms on a 4×3×3 rock-salt grid
    var idx = {};
    for (var x = 0; x < NX; x++) for (var y = 0; y < NY; y++) for (var z = 0; z < NZ; z++) {
      idx[x + "," + y + "," + z] = nodes.length;
      nodes.push({
        lx: x - (NX - 1) / 2, ly: y - (NY - 1) / 2, lz: z - (NZ - 1) / 2,
        species: (x + y + z) % 2,
        ox: 0, oy: 0, act: 0, phase: Math.random() * Math.PI * 2
      });
    }
    nodes.forEach(function (n, i) {
      var gx = n.lx + (NX - 1) / 2, gy = n.ly + (NY - 1) / 2, gz = n.lz + (NZ - 1) / 2;
      [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach(function (d) {
        var j = idx[(gx + d[0]) + "," + (gy + d[1]) + "," + (gz + d[2])];
        if (j !== undefined) latticeEdges.push([i, j]);
      });
    });

    // assign each atom a neuron slot: atoms sorted left→right map to layers left→right
    var order = nodes.map(function (_, i) { return i; }).sort(function (a, b) {
      var A = nodes[a], B = nodes[b];
      return (A.lx - B.lx) || (A.ly - B.ly) || (A.lz - B.lz);
    });
    var layerOf = [], k = 0;
    LAYERS.forEach(function (count, L) {
      var slot = [];
      for (var r = 0; r < count; r++) {
        var n = nodes[order[k++]];
        n.layer = L; n.row = r; n.rows = count;
        slot.push(nodes.indexOf(n));
      }
      layerOf.push(slot);
    });
    for (var L = 0; L < layerOf.length - 1; L++) {
      layerOf[L].forEach(function (a) {
        layerOf[L + 1].forEach(function (b) {
          outgoing[a] = outgoing[a] || [];
          outgoing[a].push(netEdges.length);
          netEdges.push([a, b]);
        });
      });
    }

    // signals travelling through the network
    var pulses = [], lastSpawn = 0;
    function spawn(fromNode) {
      var outs = outgoing[fromNode];
      if (!outs) return;
      var e = outs[(Math.random() * outs.length) | 0];
      pulses.push({ e: e, p: 0, speed: 0.9 + Math.random() * 0.6 });
    }

    // cycle: hold lattice → morph → hold network → morph back
    var HOLD = 4200, MORPH = 2400, CYCLE = 2 * (HOLD + MORPH);
    function morphT(now) {
      var c = now % CYCLE;
      if (c < HOLD) return 0;
      if (c < HOLD + MORPH) return ease((c - HOLD) / MORPH);
      if (c < 2 * HOLD + MORPH) return 1;
      return 1 - ease((c - 2 * HOLD - MORPH) / MORPH);
    }

    lattice.addEventListener("pointermove", function (e) {
      var r = lattice.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
    });
    lattice.addEventListener("pointerleave", function () { pointer.x = pointer.y = -1e4; });

    var prev = performance.now();
    setupCanvas(lattice, function (st, now) {
      var ctx = st.ctx, w = st.w, h = st.h;
      if (!w || !h) return;
      var dt = Math.min(64, now - prev) / 1000; prev = now;
      var t = reduceMotion ? 0 : morphT(now);
      ctx.clearRect(0, 0, w, h);

      var m = Math.min(w, h);
      var cx = w / 2, cy = h / 2 - m * 0.02;
      var s = m * 0.19;
      var ang = reduceMotion ? 0.55 : now * 0.00022, tilt = 0.38;
      var ca = Math.cos(ang), sa = Math.sin(ang), ct = Math.cos(tilt), stl = Math.sin(tilt);

      // network layout
      var padX = w * 0.13, spanX = w - 2 * padX;
      var gapY = Math.min(h * 0.095, m * 0.1);

      nodes.forEach(function (n, i) {
        // lattice: rotate around Y, tilt around X, perspective project
        var x1 = n.lx * ca + n.lz * sa, z1 = -n.lx * sa + n.lz * ca;
        var y1 = n.ly * ct - z1 * stl, z2 = n.ly * stl + z1 * ct;
        var f = 6 / (6 + z2);
        var jiggle = reduceMotion ? 0 : (1 - t) * 1.6;
        var ax = cx + x1 * s * f + Math.sin(now * 0.003 + n.phase) * jiggle;
        var ay = cy + y1 * s * f + Math.cos(now * 0.0027 + n.phase) * jiggle;

        // network position
        var bx = padX + spanX * (n.layer / (LAYERS.length - 1));
        var by = cy + (n.row - (n.rows - 1) / 2) * gapY;

        var px = ax + (bx - ax) * t, py = ay + (by - ay) * t;

        // pointer repulsion (smoothed)
        var dx = px - pointer.x, dy = py - pointer.y, d2 = dx * dx + dy * dy, R = m * 0.18;
        var tx = 0, ty = 0;
        if (d2 < R * R && d2 > 0.01) {
          var d = Math.sqrt(d2), push = (1 - d / R) * m * 0.05;
          tx = dx / d * push; ty = dy / d * push;
        }
        n.ox += (tx - n.ox) * 0.12; n.oy += (ty - n.oy) * 0.12;

        n.x = px + n.ox; n.y = py + n.oy;
        n.depth = z2 * (1 - t);
        n.r = (m * 0.028 * f) * (1 - t) + (m * 0.017) * t;
        n.act = Math.max(0, n.act - dt * 1.4);
      });

      // edges
      var edgeCol = colors.line;
      var la = (colors.dark ? 0.5 : 0.42) * (1 - t);
      if (la > 0.01) {
        ctx.lineWidth = 1.4;
        latticeEdges.forEach(function (e) {
          var a = nodes[e[0]], b = nodes[e[1]];
          var depthFade = 0.55 + 0.45 * (1 - (a.depth + b.depth + 3) / 6);
          ctx.strokeStyle = rgba(edgeCol, la * depthFade);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        });
      }
      var na = (colors.dark ? 0.16 : 0.13) * t;
      if (na > 0.01) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = rgba(colors.blue, na);
        ctx.beginPath();
        netEdges.forEach(function (e) {
          var a = nodes[e[0]], b = nodes[e[1]];
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        });
        ctx.stroke();
      }

      // signals
      if (!reduceMotion && t > 0.6) {
        if (now - lastSpawn > 320) { lastSpawn = now; spawn(layerOf[0][(Math.random() * layerOf[0].length) | 0]); }
      }
      for (var p = pulses.length - 1; p >= 0; p--) {
        var pu = pulses[p];
        pu.p += dt * pu.speed;
        var e = netEdges[pu.e], A = nodes[e[0]], B = nodes[e[1]];
        if (pu.p >= 1) {
          B.act = Math.min(1, B.act + 0.8);
          pulses.splice(p, 1);
          if (t > 0.5 && Math.random() < 0.85) spawn(e[1]);
          continue;
        }
        var qx = A.x + (B.x - A.x) * pu.p, qy = A.y + (B.y - A.y) * pu.p;
        ctx.strokeStyle = rgba(colors.red, 0.55 * t);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        var tail = Math.max(0, pu.p - 0.18);
        ctx.moveTo(A.x + (B.x - A.x) * tail, A.y + (B.y - A.y) * tail);
        ctx.lineTo(qx, qy);
        ctx.stroke();
        ctx.fillStyle = rgba(colors.red, 0.9 * t);
        ctx.beginPath(); ctx.arc(qx, qy, 2.2, 0, Math.PI * 2); ctx.fill();
      }
      if (t < 0.3) pulses.length = 0;

      // nodes, back to front
      var drawOrder = nodes.slice().sort(function (a, b) { return b.depth - a.depth; });
      drawOrder.forEach(function (n) {
        var atomCol = n.species ? colors.red : colors.ink;
        var col = mix(atomCol, colors.blue, t);
        col = mix(col, colors.red, n.act * t);
        var depthAlpha = 0.55 + 0.45 * (1 - (n.depth + 1.5) / 3);
        var alpha = depthAlpha * (1 - t) + t;

        if (n.act > 0.05 && t > 0.5) {
          ctx.fillStyle = rgba(colors.red, 0.18 * n.act);
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 2.4, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = rgba(col, alpha);
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();

        // specular highlight gives atoms a little volume
        var hl = (1 - t) * 0.45;
        if (hl > 0.02) {
          ctx.fillStyle = "rgba(255,255,255," + hl + ")";
          ctx.beginPath(); ctx.arc(n.x - n.r * 0.32, n.y - n.r * 0.34, n.r * 0.32, 0, Math.PI * 2); ctx.fill();
        }
        // neuron ring
        if (t > 0.02) {
          ctx.strokeStyle = rgba(col, 0.35 * t);
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 3, 0, Math.PI * 2); ctx.stroke();
        }
      });

      // caption follows the morph
      var label = t < 0.5 ? "lattice" : "network";
      if (label !== lastLabel && figState) {
        lastLabel = label;
        figState.textContent = label === "lattice" ? "crystal lattice" : "neural network";
        figNext.textContent = label === "lattice" ? "neural network" : "crystal lattice";
      }
    });
  })();

  /* ==========================================================================
     Closing panel: hexagonal lattice with a travelling phonon wave
     ========================================================================== */
  var closing = $("#closing-lattice");
  if (closing) (function () {
    var col = {};
    function readColors() {
      col.ink = hexToRgb(cssVar("--ink-3") || "#6E747D");
      col.red = hexToRgb(cssVar("--red") || "#CC0000");
    }
    readColors();
    document.addEventListener("themechange", readColors);

    setupCanvas(closing, function (st, now) {
      var ctx = st.ctx, w = st.w, h = st.h;
      if (!w || !h) return;
      ctx.clearRect(0, 0, w, h);
      var a = 34, rowH = a * Math.sqrt(3) / 2;
      var time = reduceMotion ? 0 : now * 0.001;
      var startX = w > 760 ? w * 0.56 : w * 0.25;   // keep the lattice to the right of the copy
      var pts = [];
      for (var r = -1, row = 0; r * rowH < h + rowH; r++, row++) {
        var off = (row % 2) * a / 2;
        var line = [];
        for (var x = startX - a + off; x < w + a; x += a) {
          var y = r * rowH;
          var wave = Math.sin(x * 0.018 + y * 0.01 - time * 1.6);
          var fade = Math.min(1, Math.max(0, (x - startX) / (w * 0.25)));
          line.push({ x: x + wave * 3, y: y + Math.cos(x * 0.02 - time * 1.6) * 3, wv: wave, fade: fade });
        }
        pts.push(line);
      }
      ctx.lineWidth = 1;
      for (var i = 0; i < pts.length; i++) {
        for (var j = 0; j < pts[i].length; j++) {
          var p = pts[i][j];
          if (p.fade <= 0) continue;
          var nb = [pts[i][j + 1]];
          if (pts[i + 1]) {
            var shift = (i % 2) ? 0 : -1;
            nb.push(pts[i + 1][j + shift], pts[i + 1][j + shift + 1]);
          }
          ctx.strokeStyle = rgba(col.ink, 0.22 * p.fade);
          ctx.beginPath();
          nb.forEach(function (q) { if (q) { ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); } });
          ctx.stroke();
        }
      }
      for (i = 0; i < pts.length; i++) {
        for (j = 0; j < pts[i].length; j++) {
          p = pts[i][j];
          if (p.fade <= 0) continue;
          var hot = Math.max(0, p.wv);
          ctx.fillStyle = hot > 0.85 ? rgba(col.red, 0.75 * p.fade) : rgba(col.ink, (0.35 + hot * 0.3) * p.fade);
          ctx.beginPath(); ctx.arc(p.x, p.y, 2 + hot * 1.6, 0, Math.PI * 2); ctx.fill();
        }
      }
    });
  })();
})();
