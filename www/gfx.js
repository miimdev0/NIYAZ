/* ============================================================
   gfx.js — موتور «سوپر گرافیک» نیاز ۳٫۳
   ساخته‌شده توسط مجتبی میدانی · © Mojtaba Meidani

   آسمان زنده روی canvas: ستاره‌های چشمک‌زن، شفق قطبیِ روان،
   ابرهای شناور، غبار نور و شهاب‌سنگ‌های تصادفی.
   افکت‌های جشن روی لایهٔ پیش‌زمینه: آتش‌بازی نور، ذرات طلایی،
   موج‌های حلقه‌ای و «شهاب بزرگ» برای روزهای کامل.

   اصول: ارزان (سقف ~۳۰ فریم)، بدون وابستگی به اینترنت،
   و با «انیمیشن: خاموش» یا prefers-reduced-motion کامل می‌خوابد.
   ============================================================ */
(function () {
  "use strict";

  var reduced = false;
  try { reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { }

  function animOff() {
    return reduced || (document.body && document.body.classList.contains("noanim"));
  }

  var DPR = 1;
  try { DPR = Math.min(window.devicePixelRatio || 1, 2); } catch (e) { }
  var TAU = Math.PI * 2;

  /* ---------- لایهٔ آسمان ---------- */
  var sky = null, skx = null, SW = 0, SH = 0;
  var stars = [], dust = [], clouds = [], shots = [];
  /* ---------- لایهٔ افکت (پیش‌زمینه) ---------- */
  var fx = null, fxx = null, FW = 0, FH = 0;
  var sparks = [], rings = [], comets = [];

  var raf = 0, sleepT = 0, lastDraw = 0, nextShot = 0;

  /* ================= ساخت و اندازه‌گیری ================= */
  function ensureCanvases() {
    if (!sky) {
      sky = document.getElementById("skyfx");
      if (!sky) {
        var host = document.getElementById("sky") || document.body;
        sky = document.createElement("canvas");
        sky.id = "skyfx";
        sky.setAttribute("aria-hidden", "true");
        host.appendChild(sky);
      }
      skx = sky.getContext ? sky.getContext("2d") : null;
    }
    if (!fx) {
      fx = document.getElementById("fx");
      if (fx) fxx = fx.getContext ? fx.getContext("2d") : null;
    }
    return !!(skx && fxx);
  }

  function fit() {
    if (!ensureCanvases()) return;
    var w = Math.max(1, window.innerWidth || 1), h = Math.max(1, window.innerHeight || 1);
    SW = w; SH = h; FW = w; FH = h;
    try {
      sky.width = Math.round(w * DPR); sky.height = Math.round(h * DPR);
      skx.setTransform(DPR, 0, 0, DPR, 0, 0);
      fx.width = Math.round(w * DPR); fx.height = Math.round(h * DPR);
      fxx.setTransform(DPR, 0, 0, DPR, 0, 0);
    } catch (e) { }
    seed();
  }

  function seed() {
    var i, k, n;
    n = Math.round(Math.min(110, (SW * SH) / 15000));
    stars = [];
    for (i = 0; i < n; i++) stars.push({
      x: Math.random() * SW, y: Math.random() * SH * 0.94,
      r: Math.random() * 1.3 + 0.35,
      a: Math.random() * 0.5 + 0.35,
      tw: Math.random() * 1.5 + 0.35,
      ph: Math.random() * TAU
    });
    n = Math.round(Math.min(26, (SW * SH) / 36000));
    dust = [];
    for (i = 0; i < n; i++) dust.push({
      x: Math.random() * SW, y: Math.random() * SH,
      r: Math.random() * 13 + 5,
      vx: (Math.random() - 0.5) * 6,
      vy: -(Math.random() * 5 + 1.6),
      a: Math.random() * 0.14 + 0.05,
      ph: Math.random() * TAU
    });
    clouds = [];
    for (i = 0; i < 4; i++) {
      var puffs = [], np = 5 + Math.floor(Math.random() * 4);
      for (k = 0; k < np; k++) puffs.push({
        dx: (k - np / 2) * 26 + Math.random() * 18,
        dy: Math.random() * 16 - 8,
        r: 22 + Math.random() * 26
      });
      clouds.push({
        x: Math.random() * SW, y: SH * (0.12 + Math.random() * 0.42),
        s: Math.random() * 0.8 + 0.7,
        v: (Math.random() * 5 + 3) * (Math.random() < 0.5 ? 1 : -1),
        puffs: puffs
      });
    }
    shots = [];
    nextShot = 0;
  }

  /* ================= شرایط آسمان ================= */
  function phase() { return (document.body && document.body.dataset.phase) || "night"; }
  function starA(p) {
    if (p === "night") return 1; if (p === "dusk") return 0.85; if (p === "dawn") return 0.7;
    if (p === "sunset") return 0.28; return 0;
  }
  function auroraA(p) {
    if (p === "night") return 1; if (p === "dusk") return 0.75; if (p === "dawn") return 0.32; return 0;
  }
  function cloudA(p) {
    if (p === "night" || p === "dusk") return 0.2; if (p === "dawn") return 0.55; return 0.85;
  }

  /* ================= رسم آسمان ================= */
  function drawStars(t, a) {
    if (a <= 0) return;
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var tw = 0.55 + 0.45 * Math.sin(t * 0.001 * s.tw + s.ph);
      var al = s.a * tw * a;
      if (al <= 0.012) continue;
      skx.globalAlpha = al;
      skx.fillStyle = "#fff";
      skx.beginPath(); skx.arc(s.x, s.y, s.r, 0, TAU); skx.fill();
      if (s.r > 1.1) {
        skx.globalAlpha = al * 0.32;
        skx.beginPath(); skx.arc(s.x, s.y, s.r * 2.7, 0, TAU); skx.fill();
      }
    }
    skx.globalAlpha = 1;
  }

  /* شفق قطبی: روبان‌های موجی با ترکیب نوری */
  function drawAurora(t, a) {
    if (a <= 0) return;
    var ribs = [
      { y: SH * 0.30, amp: SH * 0.055, k: 0.0042, sp: 0.00022, w: 34, c: ["#37e0a8", "#3fb9e8", "#8a63f2"] },
      { y: SH * 0.42, amp: SH * 0.075, k: 0.0031, sp: -0.00016, w: 54, c: ["#2ad6bb", "#5a8cf0", "#b06cf0"] },
      { y: SH * 0.21, amp: SH * 0.04, k: 0.0055, sp: 0.00031, w: 22, c: ["#7cf0c8", "#63c8f0", "#a070f0"] }
    ];
    skx.save();
    skx.globalCompositeOperation = "lighter";
    for (var r = 0; r < ribs.length; r++) {
      var rb = ribs[r];
      var g = skx.createLinearGradient(0, 0, SW, 0);
      g.addColorStop(0, rb.c[0]); g.addColorStop(0.5, rb.c[1]); g.addColorStop(1, rb.c[2]);
      skx.beginPath();
      for (var x = 0; x <= SW + 40; x += 40) {
        var y = rb.y + Math.sin(x * rb.k + t * rb.sp) * rb.amp +
          Math.sin(x * rb.k * 2.3 + t * rb.sp * 1.6) * rb.amp * 0.45;
        if (x === 0) skx.moveTo(x, y); else skx.lineTo(x, y);
      }
      skx.strokeStyle = g; skx.lineJoin = "round"; skx.lineCap = "round";
      skx.lineWidth = rb.w; skx.globalAlpha = 0.09 * a; skx.stroke();
      skx.lineWidth = rb.w * 0.42; skx.globalAlpha = 0.15 * a; skx.stroke();
    }
    skx.restore();
    skx.globalAlpha = 1;
  }

  /* ابرهای نرم شناور */
  function drawClouds(a, dt) {
    if (a <= 0) return;
    for (var i = 0; i < clouds.length; i++) {
      var c = clouds[i];
      c.x += c.v * dt / 1000;
      if (c.v > 0 && c.x - 180 * c.s > SW) c.x = -180 * c.s;
      if (c.v < 0 && c.x + 180 * c.s < 0) c.x = SW + 180 * c.s;
      for (var k = 0; k < c.puffs.length; k++) {
        var p = c.puffs[k], px = c.x + p.dx * c.s, py = c.y + p.dy * c.s, pr = p.r * c.s;
        var g = skx.createRadialGradient(px, py, 0, px, py, pr);
        g.addColorStop(0, "rgba(255,255,255," + (0.15 * a).toFixed(3) + ")");
        g.addColorStop(1, "rgba(255,255,255,0)");
        skx.fillStyle = g;
        skx.beginPath(); skx.arc(px, py, pr, 0, TAU); skx.fill();
      }
    }
  }

  /* غبار نور: ذرات درخشان معلق */
  function drawDust(t, dt, a) {
    for (var i = 0; i < dust.length; i++) {
      var d = dust[i];
      d.x += d.vx * dt / 1000; d.y += d.vy * dt / 1000;
      if (d.y + d.r < 0) { d.y = SH + d.r; d.x = Math.random() * SW; }
      if (d.x + d.r < 0) d.x = SW + d.r;
      if (d.x - d.r > SW) d.x = -d.r;
      var al = d.a * a * (0.7 + 0.3 * Math.sin(t * 0.0008 + d.ph));
      if (al <= 0.004) continue;
      var g = skx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
      g.addColorStop(0, "rgba(255,244,214," + al.toFixed(3) + ")");
      g.addColorStop(1, "rgba(255,244,214,0)");
      skx.fillStyle = g;
      skx.beginPath(); skx.arc(d.x, d.y, d.r, 0, TAU); skx.fill();
    }
  }

  /* شهاب‌سنگ‌های تصادفی با ردّ نورانی */
  function spawnShot(big) {
    shots.push({
      x: Math.random() * SW * 0.85 + SW * 0.08,
      y: -24,
      vx: (Math.random() < 0.5 ? 1 : -1) * (0.45 + Math.random() * 0.4),
      vy: 0.75 + Math.random() * 0.5,
      sp: (big ? 520 : 780) + Math.random() * 560,
      len: big ? 220 : 90 + Math.random() * 130,
      w: big ? 3.4 : 2.1,
      a: 1
    });
  }
  function drawShots(dt) {
    for (var i = shots.length - 1; i >= 0; i--) {
      var s = shots[i];
      s.x += s.vx * s.sp * dt / 1000; s.y += s.vy * s.sp * dt / 1000;
      s.a -= dt / 1150;
      if (s.a <= 0 || s.y > SH + 80 || s.x < -140 || s.x > SW + 140) { shots.splice(i, 1); continue; }
      var ang = Math.atan2(s.vy, s.vx);
      var tx = s.x - Math.cos(ang) * s.len, ty = s.y - Math.sin(ang) * s.len;
      var g = skx.createLinearGradient(s.x, s.y, tx, ty);
      g.addColorStop(0, "rgba(255,255,255," + (0.9 * s.a).toFixed(3) + ")");
      g.addColorStop(0.35, "rgba(255,232,190," + (0.42 * s.a).toFixed(3) + ")");
      g.addColorStop(1, "rgba(255,220,160,0)");
      skx.strokeStyle = g; skx.lineWidth = s.w; skx.lineCap = "round";
      skx.beginPath(); skx.moveTo(s.x, s.y); skx.lineTo(tx, ty); skx.stroke();
      skx.globalAlpha = s.a * 0.85; skx.fillStyle = "#fff";
      skx.beginPath(); skx.arc(s.x, s.y, 2.2, 0, TAU); skx.fill();
      skx.globalAlpha = s.a * 0.28;
      skx.beginPath(); skx.arc(s.x, s.y, 7.5, 0, TAU); skx.fill();
      skx.globalAlpha = 1;
    }
  }

  /* ================= افکت‌های جشن (پیش‌زمینه) ================= */
  function burstAt(x, y, n, c1, c2, spread) {
    for (var i = 0; i < n; i++) {
      var ang = (i / n) * TAU + Math.random() * 0.3;
      var sp = (spread || 300) * (0.45 + Math.random() * 0.75);
      sparks.push({
        x: x, y: y, px: x, py: y,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        r: Math.random() * 2.3 + 1.1,
        c: Math.random() < 0.5 ? c1 : c2,
        a: 1, ttl: 950 + Math.random() * 750, age: 0,
        g: 160 + Math.random() * 140
      });
    }
    rings.push({ x: x, y: y, r: 6, vr: 240, a: 0.75, c: c1, w: 2.2 });
  }

  function ringAt(x, y, c, w) {
    rings.push({ x: x, y: y, r: 8, vr: 300, a: 0.8, c: c, w: w || 2 });
  }

  function drawSparks(dt) {
    for (var i = sparks.length - 1; i >= 0; i--) {
      var p = sparks[i];
      p.age += dt;
      if (p.age >= p.ttl) { sparks.splice(i, 1); continue; }
      p.px = p.x; p.py = p.y;
      p.vx *= 0.982; p.vy = p.vy * 0.982 + p.g * dt / 1000;
      p.x += p.vx * dt / 1000; p.y += p.vy * dt / 1000;
      var k = 1 - p.age / p.ttl;
      fxx.globalAlpha = Math.max(0, k * 0.95);
      fxx.strokeStyle = p.c; fxx.lineWidth = p.r * 1.15; fxx.lineCap = "round";
      fxx.beginPath(); fxx.moveTo(p.px, p.py); fxx.lineTo(p.x, p.y); fxx.stroke();
    }
    fxx.globalAlpha = 1;
    for (var j = rings.length - 1; j >= 0; j--) {
      var r = rings[j];
      r.r += r.vr * dt / 1000; r.a -= dt / 700;
      if (r.a <= 0 || r.r > Math.max(FW, FH)) { rings.splice(j, 1); continue; }
      fxx.globalAlpha = Math.max(0, r.a);
      fxx.strokeStyle = r.c; fxx.lineWidth = r.w;
      fxx.beginPath(); fxx.arc(r.x, r.y, r.r, 0, TAU); fxx.stroke();
    }
    fxx.globalAlpha = 1;
  }

  /* شهاب بزرگ طلایی برای «روز کامل» */
  function drawComets(dt) {
    for (var i = comets.length - 1; i >= 0; i--) {
      var c = comets[i];
      c.x += c.vx * c.sp * dt / 1000; c.y += c.vy * c.sp * dt / 1000;
      c.a -= dt / 2400;
      if (c.a <= 0 || c.x > FW + 260 || c.y > FH + 120) { comets.splice(i, 1); continue; }
      var ang = Math.atan2(c.vy, c.vx);
      var tx = c.x - Math.cos(ang) * 260, ty = c.y - Math.sin(ang) * 260;
      var g = fxx.createLinearGradient(c.x, c.y, tx, ty);
      g.addColorStop(0, "rgba(255,240,200," + (0.95 * c.a).toFixed(3) + ")");
      g.addColorStop(0.4, "rgba(244,194,91," + (0.5 * c.a).toFixed(3) + ")");
      g.addColorStop(1, "rgba(244,194,91,0)");
      fxx.strokeStyle = g; fxx.lineWidth = 5; fxx.lineCap = "round";
      fxx.beginPath(); fxx.moveTo(c.x, c.y); fxx.lineTo(tx, ty); fxx.stroke();
      fxx.globalAlpha = Math.max(0, c.a);
      fxx.fillStyle = "#fff4d6";
      fxx.beginPath(); fxx.arc(c.x, c.y, 4.5, 0, TAU); fxx.fill();
      fxx.globalAlpha = Math.max(0, c.a * 0.35);
      fxx.beginPath(); fxx.arc(c.x, c.y, 16, 0, TAU); fxx.fill();
      fxx.globalAlpha = 1;
      /* پاشیدن جرقه‌های طلایی روی مسیر */
      if (Math.random() < 0.65) sparks.push({
        x: c.x, y: c.y, px: c.x, py: c.y,
        vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60,
        r: Math.random() * 2 + 1, c: Math.random() < 0.5 ? "#ffe29a" : "#f4c25b",
        a: 1, ttl: 700 + Math.random() * 500, age: 0, g: 40
      });
    }
  }

  /* ================= حلقهٔ اصلی ================= */
  function clearSky() { if (skx) skx.clearRect(0, 0, SW, SH); }
  function clearFx() { if (fxx) fxx.clearRect(0, 0, FW, FH); }

  function frame(t) {
    raf = 0;
    if (document.hidden) return;
    if (animOff()) { clearSky(); clearFx(); schedule(); return; }
    if (!skx || !fxx) { ensureCanvases(); fit(); schedule(); return; }
    var dt = lastDraw ? Math.min(64, t - lastDraw) : 16;
    if (lastDraw && t - lastDraw < 30) { schedule(); return; }   /* سقف ~۳۰ فریم */
    lastDraw = t;

    var p = phase();
    clearSky();
    drawStars(t, starA(p));
    drawAurora(t, auroraA(p));
    drawClouds(cloudA(p), dt);
    drawDust(t, dt, p === "night" || p === "dusk" ? 1 : 0.55);
    /* شهاب تصادفی: شب بیشتر، روز هرگز */
    var gap = p === "night" ? 4200 : (p === "dusk" || p === "dawn" ? 8000 : (p === "sunset" ? 14000 : 0));
    if (gap) {
      if (!nextShot) nextShot = t + gap * (0.5 + Math.random());
      if (t >= nextShot) { spawnShot(false); nextShot = t + gap * (0.5 + Math.random()); }
    } else nextShot = 0;
    drawShots(dt);

    if (sparks.length || rings.length || comets.length) {
      clearFx();
      drawSparks(dt);
      drawComets(dt);
    } else clearFx();
    schedule();
  }

  function schedule() {
    if (document.hidden) return;
    if (animOff()) {
      if (!sleepT) sleepT = setTimeout(function () { sleepT = 0; schedule(); }, 900);
      return;
    }
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function start() {
    if (!ensureCanvases()) return;
    fit();
    schedule();
  }

  /* ================= API عمومی ================= */
  var PAL = ["#f4c25b", "#ffe29a", "#5fd3d0", "#ffffff", "#ff8f6b", "#a9b7ff"];
  window.NZGFX = {
    /* آتش‌بازی چندتایی برای جشن «تقبل الله» و پایان نماز */
    fireworks: function () {
      if (animOff()) return;
      if (!ensureCanvases()) return;
      if (!FW) fit();
      for (var b = 0; b < 4; b++) {
        (function (i) {
          setTimeout(function () {
            if (animOff()) return;
            var x = FW * (0.18 + Math.random() * 0.64), y = FH * (0.16 + Math.random() * 0.3);
            burstAt(x, y, 40, PAL[i % PAL.length], PAL[(i + 2) % PAL.length], 320);
          }, i * 260);
        })(b);
      }
      schedule();
    },
    /* انفجار کوچک ذرات در یک نقطه (تسبیح، لمس دکمه‌ها) */
    burst: function (x, y, n, color) {
      if (animOff()) return;
      if (!ensureCanvases()) return;
      if (!FW) fit();
      burstAt(x, y, n || 16, color || "#f4c25b", "#ffe29a", 190);
      schedule();
    },
    /* موج حلقه‌ای نورانی */
    ripple: function (x, y, color) {
      if (animOff()) return;
      if (!ensureCanvases()) return;
      if (!FW) fit();
      ringAt(x, y, color || "#f4c25b", 2.4);
      schedule();
    },
    /* شهاب طلایی بزرگ: «امروز هر پنج نماز را خواندی» */
    fullDay: function () {
      if (animOff()) return;
      if (!ensureCanvases()) return;
      if (!FW) fit();
      comets.push({ x: -120, y: FH * 0.14, vx: 1.1, vy: 0.3, sp: Math.max(FW, FH) * 0.9, a: 1 });
      setTimeout(function () {
        if (animOff()) return;
        burstAt(FW * 0.68, FH * 0.32, 52, "#ffe29a", "#f4c25b", 340);
      }, 820);
      setTimeout(function () {
        if (animOff()) return;
        burstAt(FW * 0.38, FH * 0.22, 40, "#fff6dd", "#ffd98a", 300);
      }, 1120);
      schedule();
    },
    /* یک شهاب معمولی (برای لحظه‌های خاص) */
    shoot: function () {
      if (animOff()) return;
      spawnShot(true);
      schedule();
    },
    refresh: function () { fit(); schedule(); }
  };

  /* ================= راه‌اندازی ================= */
  function onResize() {
    clearTimeout(onResize.t);
    onResize.t = setTimeout(function () { fit(); schedule(); }, 200);
  }

  function boot() {
    start();
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onResize, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) { lastDraw = 0; nextShot = 0; schedule(); }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
