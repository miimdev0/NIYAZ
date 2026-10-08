/*  نیاز · همراه هوشمند نماز  —  نسخهٔ ۳٫۰
    © Mojtaba Meidani — مجتبی میدانی  */
(function () {
  "use strict";

  /* ================= ابزارها ================= */
  var FA = "۰۱۲۳۴۵۶۷۸۹";
  function f(n) { return String(n).replace(/\d/g, function (d) { return FA[d]; }); }
  function $(id) { return document.getElementById(id); }
  /* فقط وقتی مقدار عوض شده در DOM بنویس (سرعت و مصرف باتری) */
  function setT(el, txt) { if (el && el.textContent !== txt) el.textContent = txt; }
  function setW(el, w) { if (el && el.style.width !== w) el.style.width = w; }
  function all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function fix(a, b) { return a - b * Math.floor(a / b); }
  var rad = Math.PI / 180;
  function hhmm(h) {
    var m = Math.round(fix(h, 24) * 60), hh = Math.floor(m / 60) % 24, mm = m % 60;
    return f((hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm);
  }
  function hms(sec) {
    sec = Math.max(0, Math.floor(sec));
    var h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = sec % 60;
    function p(x) { return (x < 10 ? "0" : "") + x; }
    return f(p(h) + ":" + p(m) + ":" + p(s));
  }
  function minutesText(m) {
    m = Math.max(0, Math.round(m));
    var h = Math.floor(m / 60), mm = m % 60;
    return h && mm ? f(h) + " ساعت و " + f(mm) + " دقیقه" : h ? f(h) + " ساعت" : f(mm) + " دقیقه";
  }
  function relDays(n) {
    if (n === 0) return "امروز";
    if (n === 1) return "فردا";
    if (n === 2) return "پس‌فردا";
    return f(n) + " روز دیگر";
  }
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function toast(t) {
    var el = $("toast"); el.textContent = t; el.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(function () { el.hidden = true; }, 4200);
  }
  function beep() {
    try {
      var A = window.AudioContext || window.webkitAudioContext, a = new A(), o = a.createOscillator(), g = a.createGain();
      o.connect(g); g.connect(a.destination); o.frequency.value = 660;
      g.gain.setValueAtTime(0.25, a.currentTime); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 1.4);
      o.start(); o.stop(a.currentTime + 1.4);
    } catch (e) { }
  }
  var NATIVE = NZ.nat.native();
  function LN() { return NATIVE && window.Capacitor.Plugins ? window.Capacitor.Plugins.LocalNotifications : null; }
  var CONTENT = NZ.content, CAL = NZ.cal;

  /* ================= ظاهرها (تم‌ها) ================= */
  var THEMES = [
    { k: "midnight", n: "نیمه‌شب", sw: ["#050b1f", "#16295f", "#f4c25b"], v: { sky1: "#050b1f", sky2: "#16295f", orb: "#7aa7ff", gold: "#f4c25b", gold2: "#e0a12b", teal: "#5fd3d0", ink: "#f4f8fb", aura: "#7aa7ff" }, dark: 1 },
    { k: "haram", n: "مسجدالحرام", sw: ["#04150f", "#0d4030", "#f2c75c"], v: { sky1: "#04150f", sky2: "#0d4030", orb: "#65e0a8", gold: "#f2c75c", gold2: "#c99a2e", teal: "#7de2c3", ink: "#eafaf1", aura: "#3fd39a" }, dark: 1 },
    { k: "dome", n: "گنبد فیروزه", sw: ["#041922", "#0b4053", "#6fe3e0"], v: { sky1: "#041922", sky2: "#0b4053", orb: "#63e7e2", gold: "#7fe6e2", gold2: "#39b7c9", teal: "#8ef0e6", ink: "#eefcff", aura: "#48d6e0" }, dark: 1 },
    { k: "desert", n: "کویر", sw: ["#1c1108", "#5a3418", "#ffb45c"], v: { sky1: "#1c1108", sky2: "#5a3418", orb: "#ffb45c", gold: "#ffb45c", gold2: "#e08a2c", teal: "#ffd8a8", ink: "#fff3e2", aura: "#ff9d4d" }, dark: 1 },
    { k: "lotus", n: "نیلوفر", sw: ["#170a20", "#4b1f52", "#ff9ecb"], v: { sky1: "#170a20", sky2: "#4b1f52", orb: "#d98cff", gold: "#ffb0d8", gold2: "#c76aa8", teal: "#e5a7ff", ink: "#fdf0ff", aura: "#c58cff" }, dark: 1 },
    { k: "emerald", n: "زمرد شب", sw: ["#04140f", "#0a3b2c", "#8ef2b6"], v: { sky1: "#04140f", sky2: "#0a3b2c", orb: "#6ef0a8", gold: "#a8f0b8", gold2: "#4fbf82", teal: "#8ef2d6", ink: "#effff5", aura: "#57e39a" }, dark: 1 },
    { k: "coast", n: "ساحل آرام", sw: ["#031a26", "#0c4a63", "#8fd8ff"], v: { sky1: "#031a26", sky2: "#0c4a63", orb: "#78d8ff", gold: "#9fe0ff", gold2: "#4fa8d8", teal: "#8ff0e0", ink: "#eefaff", aura: "#5ec8ff" }, dark: 1 },
    { k: "galaxy", n: "کهکشان", sw: ["#0a0718", "#2b1b63", "#c8a6ff"], v: { sky1: "#0a0718", sky2: "#2b1b63", orb: "#b18cff", gold: "#d6bcff", gold2: "#8a6ad8", teal: "#a8c8ff", ink: "#f2eeff", aura: "#9b7bff" }, dark: 1 },
    { k: "paper", n: "کاغذ کهنه", sw: ["#f7efe0", "#e6d5b8", "#8a5a24"], v: { sky1: "#f7efe0", sky2: "#e2cfae", orb: "#f0c98a", gold: "#8a5a24", gold2: "#b07a34", teal: "#2f7d6b", ink: "#33261a", aura: "#dfa96a" }, dark: 0 },
    { k: "dawn", n: "سپیده", sw: ["#fdeef4", "#e7d9f7", "#b8608f"], v: { sky1: "#fdeef4", sky2: "#dccdf5", orb: "#f6bcd6", gold: "#a8517f", gold2: "#c8779f", teal: "#4f8fae", ink: "#3a2340", aura: "#e0a0c8" }, dark: 0 }
  ];
  var ACCENTS = [
    ["#f4c25b", "#e0a12b", "زرّین"], ["#7fe6e2", "#39b7c9", "فیروزه"],
    ["#8ef2b6", "#3fbf7f", "زمردی"], ["#ffb0d8", "#c76aa8", "نیلوفری"],
    ["#ffb45c", "#e08a2c", "کهربایی"], ["#b8b0ff", "#7a6ad8", "بنفشه"],
    ["#ff9a8b", "#e06a5c", "شنگرف"], ["#cfe4ff", "#8fb4e0", "نقره‌ای"]
  ];
  function theme() { return THEMES.filter(function (t) { return t.k === cfg.theme; })[0] || THEMES[0]; }
  function applyTheme() {
    var t = theme(), r = document.documentElement.style;
    r.setProperty("--sky1", t.v.sky1);
    r.setProperty("--sky2", t.v.sky2);
    r.setProperty("--orb", t.v.orb);
    r.setProperty("--gold", t.v.gold);
    r.setProperty("--gold2", t.v.gold2);
    r.setProperty("--teal", t.v.teal);
    r.setProperty("--ink", t.v.ink);
    r.setProperty("--aura", t.v.aura);
    var acc = cfg.accent && cfg.accent.length ? cfg.accent : null;
    if (acc && ACCENTS[acc]) {
      r.setProperty("--gold", ACCENTS[acc][0]);
      r.setProperty("--gold2", ACCENTS[acc][1]);
    }
    document.body.dataset.theme = t.k;
    document.body.dataset.themeDark = t.dark ? "1" : "0";
    document.body.dataset.light = t.dark ? "0" : "1";
    var mt = document.querySelector('meta[name="theme-color"]');
    if (mt) mt.setAttribute("content", t.v.sky1);
  }

  /* ================= صدا ================= */
  /* مؤذن آفلاین به‌صورت پیش‌فرض روی «صدای اذان» تنظیم است.
     پخش زندهٔ مؤذن و انتخاب مؤذن در این نسخه پیاده نشده است (بنا به درخواست). */
  var EXTS = ["mp3", "ogg", "wav"], audioEl = null, playing = "", sndToken = 0, adhanAudio = null;
  function stopSound() {
    sndToken++;
    if (audioEl) { try { audioEl.pause(); } catch (e) { } audioEl = null; }
    playing = ""; drawPlayer();
    if (adhanAudio) { try { adhanAudio.pause(); } catch (e) { } adhanAudio = null; drawAdhanPlayer(); }
  }
  function playSound(name, cb) {
    stopSound();
    var i = 0, token = sndToken;
    (function next() {
      if (token !== sndToken) return;
      if (i >= EXTS.length) { if (cb) cb(false); return; }
      var a = new Audio("audio/" + name + "." + EXTS[i++]), moved = false;
      function mv() { if (moved) return; moved = true; next(); }
      a.onerror = mv;
      a.onended = function () { if (token === sndToken) { audioEl = null; playing = ""; drawPlayer(); } };
      var pr = a.play();
      if (pr && pr.then) {
        pr.then(function () {
          if (token !== sndToken) { a.pause(); return; }
          audioEl = a; playing = name; drawPlayer(); if (cb) cb(true);
        }).catch(function (e) { if (e && e.name === "NotAllowedError") { if (cb) cb(false); } else mv(); });
      } else { audioEl = a; playing = name; drawPlayer(); if (cb) cb(true); }
    })();
  }
  function alertSound() {
    if (cfg.snd === "default") { beep(); return; }
    playSound(cfg.snd, function (ok) { if (!ok) beep(); });
  }

  /* ================= اطلاعات سازنده ================= */
  var CREATOR = {
    name: "مجتبی میدانی",
    role: "سازنده و طراح نیاز",
    bio: "نیاز را ساختم تا نماز با حضور قلب بیشتر و حواس‌پرتی کمتر خوانده شود؛ با محتوای کامل و بدون حذف.",
    version: "۳٫۰",
    links: { "تلگرام": "", "اینستاگرام": "", "ایمیل": "", "وب‌سایت": "" }
  };

  /* ================= تصاویر حالت‌ها ================= */
  var DEFAULT_IMAGES = { stand: "", ruku: "", sajdah: "", sit: "" };
  var POSE_NAME = { stand: "قیام", ruku: "رکوع", sajdah: "سجده", sit: "نشستن" };

  /* ================= شهرها ================= */
  var CITIES = [
    ["تهران", 35.6892, 51.389, "Asia/Tehran"], ["مشهد", 36.2972, 59.6067, "Asia/Tehran"], ["اصفهان", 32.6546, 51.668, "Asia/Tehran"],
    ["شیراز", 29.5918, 52.5837, "Asia/Tehran"], ["تبریز", 38.0962, 46.2738, "Asia/Tehran"], ["قم", 34.6416, 50.8746, "Asia/Tehran"],
    ["اهواز", 31.3183, 48.6706, "Asia/Tehran"], ["کرج", 35.8327, 50.9915, "Asia/Tehran"], ["کرمانشاه", 34.3277, 47.0778, "Asia/Tehran"],
    ["ارومیه", 37.5527, 45.076, "Asia/Tehran"], ["رشت", 37.2808, 49.5832, "Asia/Tehran"], ["زاهدان", 29.4963, 60.8629, "Asia/Tehran"],
    ["کرمان", 30.2839, 57.0834, "Asia/Tehran"], ["همدان", 34.7989, 48.515, "Asia/Tehran"], ["یزد", 31.8974, 54.3569, "Asia/Tehran"],
    ["اردبیل", 38.2498, 48.2933, "Asia/Tehran"], ["بندرعباس", 27.1865, 56.2808, "Asia/Tehran"], ["اراک", 34.0954, 49.6892, "Asia/Tehran"],
    ["سنندج", 35.3219, 46.9862, "Asia/Tehran"], ["قزوین", 36.2688, 50.0041, "Asia/Tehran"], ["زنجان", 36.6765, 48.4963, "Asia/Tehran"],
    ["گرگان", 36.8427, 54.4439, "Asia/Tehran"], ["ساری", 36.5633, 53.0601, "Asia/Tehran"], ["بوشهر", 28.9234, 50.8203, "Asia/Tehran"],
    ["خرم‌آباد", 33.4878, 48.3558, "Asia/Tehran"], ["بیرجند", 32.8649, 59.2262, "Asia/Tehran"], ["سمنان", 35.5769, 53.392, "Asia/Tehran"],
    ["ایلام", 33.6374, 46.4227, "Asia/Tehran"], ["یاسوج", 30.6682, 51.5879, "Asia/Tehran"], ["شهرکرد", 32.3256, 50.8644, "Asia/Tehran"],
    ["بجنورد", 37.4747, 57.329, "Asia/Tehran"], ["نیشابور", 36.2133, 58.7958, "Asia/Tehran"], ["قشم", 26.9581, 56.2719, "Asia/Tehran"],
    ["مراغه", 37.3894, 46.2383, "Asia/Tehran"], ["دزفول", 32.3805, 48.4064, "Asia/Tehran"], ["خوی", 38.5503, 44.9521, "Asia/Tehran"],
    ["بیروت", 33.8938, 35.5018, "Asia/Beirut"], ["دمشق", 33.5138, 36.2765, "Asia/Damascus"], ["بغداد", 33.3152, 44.3661, "Asia/Baghdad"],
    ["کربلا", 32.616, 44.0249, "Asia/Baghdad"], ["نجف", 31.996, 44.315, "Asia/Baghdad"], ["کاظمین", 33.38, 44.34, "Asia/Baghdad"],
    ["سامرا", 34.1983, 43.8742, "Asia/Baghdad"], ["مکه", 21.4225, 39.8262, "Asia/Riyadh"], ["مدینه", 24.4672, 39.6112, "Asia/Riyadh"],
    ["قاهره", 30.0444, 31.2357, "Africa/Cairo"], ["استانبول", 41.0082, 28.9784, "Europe/Istanbul"], ["دبی", 25.2048, 55.2708, "Asia/Dubai"],
    ["دوحه", 25.2854, 51.531, "Asia/Qatar"], ["کویت", 29.3759, 47.9774, "Asia/Kuwait"], ["مسقط", 23.588, 58.3829, "Asia/Muscat"],
    ["باکو", 40.4093, 49.8671, "Asia/Baku"], ["ایروان", 40.1792, 44.4991, "Asia/Yerevan"], ["عشق‌آباد", 37.9601, 58.3261, "Asia/Ashgabat"],
    ["دوشنبه", 38.5598, 68.787, "Asia/Dushanbe"], ["تاشکند", 41.2995, 69.2401, "Asia/Tashkent"], ["کابل", 34.5553, 69.2075, "Asia/Kabul"],
    ["هرات", 34.3529, 62.204, "Asia/Kabul"], ["کراچی", 24.8607, 67.0011, "Asia/Karachi"], ["لاهور", 31.5204, 74.3587, "Asia/Karachi"],
    ["دهلی", 28.6139, 77.209, "Asia/Kolkata"], ["حیدرآباد", 17.385, 78.4867, "Asia/Kolkata"], ["داکا", 23.8103, 90.4125, "Asia/Dhaka"],
    ["کوالالامپور", 3.139, 101.6869, "Asia/Kuala_Lumpur"], ["جاکارتا", -6.2088, 106.8456, "Asia/Jakarta"], ["لندن", 51.5074, -0.1278, "Europe/London"],
    ["منچستر", 53.4808, -2.2426, "Europe/London"], ["پاریس", 48.8566, 2.3522, "Europe/Paris"], ["مارسی", 43.2965, 5.3698, "Europe/Paris"],
    ["برلین", 52.52, 13.405, "Europe/Berlin"], ["هامبورگ", 53.5511, 9.9937, "Europe/Berlin"], ["فرانکفورت", 50.1109, 8.6821, "Europe/Berlin"],
    ["وین", 48.2082, 16.3738, "Europe/Vienna"], ["لاهه", 52.0705, 4.3007, "Europe/Amsterdam"], ["آمستردام", 52.3676, 4.9041, "Europe/Amsterdam"],
    ["بروکسل", 50.8503, 4.3517, "Europe/Brussels"], ["رم", 41.9028, 12.4964, "Europe/Rome"], ["مادرید", 40.4168, -3.7038, "Europe/Madrid"],
    ["استکهلم", 59.3293, 18.0686, "Europe/Stockholm"], ["اسلو", 59.9139, 10.7522, "Europe/Oslo"], ["کپنهاگ", 55.6761, 12.5683, "Europe/Copenhagen"],
    ["کوالا", 3.139, 101.6869, "Asia/Kuala_Lumpur"], ["مسکو", 55.7558, 37.6173, "Europe/Moscow"], ["آلماتی", 43.238, 76.8897, "Asia/Almaty"],
    ["تورنتو", 43.6532, -79.3832, "America/Toronto"], ["مونترال", 45.5019, -73.5674, "America/Toronto"], ["ونکوور", 49.2827, -123.1207, "America/Vancouver"],
    ["نیویورک", 40.7128, -74.006, "America/New_York"], ["واشینگتن", 38.9072, -77.0369, "America/New_York"], ["شیکاگو", 41.8781, -87.6298, "America/Chicago"],
    ["هیوستون", 29.7604, -95.3698, "America/Chicago"], ["لوس‌آنجلس", 34.0522, -118.2437, "America/Los_Angeles"], ["لس‌آنجلس", 34.0522, -118.2437, "America/Los_Angeles"],
    ["سان‌فرانسیسکو", 37.7749, -122.4194, "America/Los_Angeles"], ["مکزیکوسیتی", 19.4326, -99.1332, "America/Mexico_City"], ["سائوپائولو", -23.5505, -46.6333, "America/Sao_Paulo"],
    ["سیدنی", -33.8688, 151.2093, "Australia/Sydney"], ["ملبورن", -37.8136, 144.9631, "Australia/Melbourne"], ["توکیو", 35.6762, 139.6503, "Asia/Tokyo"],
    ["پکن", 39.9042, 116.4074, "Asia/Shanghai"], ["سنگاپور", 1.3521, 103.8198, "Asia/Singapore"], ["بانکوک", 13.7563, 100.5018, "Asia/Bangkok"],
    ["ژوهانسبورگ", -26.2041, 28.0473, "Africa/Johannesburg"], ["لاگوس", 6.5244, 3.3792, "Africa/Lagos"], ["نایروبی", -1.2921, 36.8219, "Africa/Nairobi"]
  ];

  /* ================= وضعیت و تنظیمات ================= */
  var PN = { fajr: "صبح", zuhr: "ظهر", asr: "عصر", maghrib: "مغرب", isha: "عشا" };
  var P = CONTENT.PRAYERS;
  function pr(k) { return P.filter(function (p) { return p.k === k; })[0]; }
  var zero5 = function () { return { fajr: 0, zuhr: 0, asr: 0, maghrib: 0, isha: 0 }; };
  var DEFAULTS = {
    sky: "auto", tap: "step", tq: "on", notif: "off", pre: "0", sun: "off", vib: "on",
    fs: 26, method: "auto", asr: "1", snd: "azan", iq: "0", auto: "on", spd: "normal",
    adj: zero5(), qaza: zero5(), imgs: {}, theme: "midnight", accent: "", surah: "tawhid",
    datebar: "on", notifDate: "on", azanScreen: "on", playAdhan: "on", calView: "j",
    filters: { "ملی": true, "مذهبی": true, "جهانی": true, "فرهنگی": true }, anim: "on", bigtext: "on"
  };
  var cfg = Object.assign({}, DEFAULTS, load("rk-cfg", {}), load("rk-cfg3", {}));
  cfg.adj = Object.assign(zero5(), cfg.adj);
  cfg.qaza = Object.assign(zero5(), cfg.qaza);
  cfg.filters = Object.assign({}, DEFAULTS.filters, cfg.filters || {});
  var loc = load("rk-loc", { label: "تهران", lat: 35.6892, lng: 51.389, tz: "Asia/Tehran" });
  var scheme = load("rk-scheme", "shia");
  var sess = load("rk-sess", null);
  var log = load("rk-log", {});
  var C = null, heading = null, wake = null, lastKey = "", TODAY = 0;
  function saveCfg() { save("rk-cfg3", cfg); }
  function buzz(p) { if (cfg.vib !== "on") return; try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { } }

  /* ================= محاسبهٔ اوقات ================= */
  var _dtfCache = {};
  function dtfFor(tz) {
    var key = tz || "local", f = _dtfCache[key];
    if (f) return f;
    var opt = { hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" };
    try { opt.timeZone = key; f = new Intl.DateTimeFormat("en-US", opt); }
    catch (e) { delete opt.timeZone; f = new Intl.DateTimeFormat("en-US", opt); }
    _dtfCache[key] = f;
    return f;
  }
  function zoneNow(tz, date) {
    var o = {};
    try {
      dtfFor(tz).formatToParts(date).forEach(function (p) { o[p.type] = +p.value; });
    } catch (e) { o = { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate(), hour: date.getHours(), minute: date.getMinutes(), second: date.getSeconds() }; }
    var asUtc = Date.UTC(o.year, o.month - 1, o.day, o.hour % 24, o.minute, o.second);
    return {
      y: o.year, m: o.month, d: o.day, h: (o.hour % 24) + o.minute / 60 + o.second / 3600,
      off: (asUtc - Math.floor(date.getTime() / 1000) * 1000) / 3600000
    };
  }
  var METHODS = {
    tehran: { fajr: 17.7, mag: 4.5, isha: 14 }, mwl: { fajr: 18, mag: 0.833, isha: 17 },
    isna: { fajr: 15, mag: 0.833, isha: 15 }, egypt: { fajr: 19.5, mag: 0.833, isha: 17.5 },
    karachi: { fajr: 18, mag: 0.833, isha: 18 }, ummalqura: { fajr: 18.5, mag: 0.833, ishaMin: 90 }
  };
  function methodKey() { return cfg.method === "auto" ? (scheme === "shia" ? "tehran" : "mwl") : cfg.method; }
  function times(z, lat, lng) {
    var M = METHODS[methodKey()] || METHODS.tehran;
    var jd = Date.UTC(z.y, z.m - 1, z.d, 12) / 86400000 + 2440587.5, D = jd - 2451545.0;
    var g = fix(357.529 + 0.98560028 * D, 360), q = fix(280.459 + 0.98564736 * D, 360);
    var L = fix(q + 1.915 * Math.sin(g * rad) + 0.02 * Math.sin(2 * g * rad), 360);
    var e = 23.439 - 0.00000036 * D;
    var RA = Math.atan2(Math.cos(e * rad) * Math.sin(L * rad), Math.cos(L * rad)) / rad / 15;
    var eqt = q / 15 - fix(RA, 24);
    var decl = Math.asin(Math.sin(e * rad) * Math.sin(L * rad)) / rad;
    var noon = 12 + z.off - lng / 15 - eqt;
    function H(alt) {
      var c = (Math.sin(alt * rad) - Math.sin(decl * rad) * Math.sin(lat * rad)) / (Math.cos(decl * rad) * Math.cos(lat * rad));
      return (c > 1 || c < -1) ? NaN : Math.acos(c) / rad / 15;
    }
    var F = +cfg.asr || 1;
    var asrAlt = Math.atan(1 / (F + Math.tan(Math.abs(lat - decl) * rad))) / rad;
    var t = {
      fajr: noon - H(-M.fajr), sunrise: noon - H(-0.833), zuhr: noon + 0.02, asr: noon + H(asrAlt),
      sunset: noon + H(-0.833), maghrib: noon + H(-M.mag), isha: noon + H(-(M.isha || 0))
    };
    if (isNaN(t.fajr)) t.fajr = noon - 6;
    if (isNaN(t.sunrise)) t.sunrise = noon - 5;
    if (isNaN(t.asr)) t.asr = noon + 3;
    if (isNaN(t.sunset)) t.sunset = noon + 5;
    if (isNaN(t.maghrib)) t.maghrib = noon + 5.2;
    if (M.ishaMin) t.isha = t.maghrib + M.ishaMin / 60;
    if (isNaN(t.isha)) t.isha = noon + 7.5;
    ["fajr", "zuhr", "asr", "maghrib", "isha"].forEach(function (k) { t[k] += (+cfg.adj[k] || 0) / 60; });
    return t;
  }
  function absTime(z, h) { return Date.UTC(z.y, z.m - 1, z.d) + (h - z.off) * 3600000; }
  function qiblaBearing(lat, lng) {
    var a = lat * rad, b = 21.4225 * rad, d = (39.8262 - lng) * rad;
    return fix(Math.atan2(Math.sin(d) * Math.cos(b), Math.cos(a) * Math.sin(b) - Math.sin(a) * Math.cos(b) * Math.cos(d)) / rad, 360);
  }
  function qiblaDist(lat, lng) {
    var a = lat * rad, b = 21.4225 * rad, dl = (39.8262 - lng) * rad;
    return 6371 * Math.acos(Math.min(1, Math.sin(a) * Math.sin(b) + Math.cos(a) * Math.cos(b) * Math.cos(dl)));
  }
  function compassWord(b) { return ["شمال", "شمال شرق", "شرق", "جنوب شرق", "جنوب", "جنوب غرب", "غرب", "شمال غرب"][Math.round(b / 45) % 8]; }

  /* ================= تقویم ================= */
  function jdnNow() { return CAL.jdnFromDate(new Date(), loc.tz); }
  function dayInfoOf(jdn) { return CAL.dayInfo(jdn); }
  function todayInfo() { return dayInfoOf(jdnNow()); }
  function occText(info, max) {
    if (!info || !info.occ.length) return "";
    var list = info.occ.filter(function (o) { return cfg.filters[o.cat] !== false; });
    if (!list.length) list = info.occ;
    return list.slice(0, max || 2).map(function (o) { return o.title; }).join(" · ");
  }

  /* ================= مراحل نماز ================= */
  function stepsOf(p, r) { return CONTENT.buildSteps(p, r, scheme, { secondSurah: cfg.surah }); }
  function tqItems(k) { return CONTENT.tqItems(k, scheme); }

  /* ================= آسمان و وضعیت لحظه‌ای ================= */
  function compute() {
    var now = new Date(), z = zoneNow(loc.tz, now), t = times(z, loc.lat, loc.lng);
    var order = ["fajr", "zuhr", "asr", "maghrib", "isha"];
    var end = { fajr: t.sunrise, zuhr: t.asr, asr: t.maghrib, maghrib: t.isha, isha: t.fajr + 24 };
    var n = z.h < t.fajr ? z.h + 24 : z.h, cur = null, i;
    for (i = 0; i < order.length; i++) if (n >= t[order[i]] && n < end[order[i]]) cur = order[i];
    var res = { z: z, t: t, cur: cur, at: now.getTime() };
    if (cur) { res.left = end[cur] - n; res.span = end[cur] - t[cur]; }
    else {
      var nx = "zuhr";
      for (i = 0; i < order.length; i++) if (t[order[i]] > z.h) { nx = order[i]; break; }
      res.next = nx; res.wait = t[nx] - z.h; res.span = Math.max(0.5, t[nx] - t.sunrise);
    }
    res.chosen = cur || res.next;
    return res;
  }
  function phaseOf(c) {
    var t = c.t, h = c.z.h;
    if (h < t.fajr || h >= t.isha) return "night";
    if (h < t.sunrise) return "dawn";
    if (h < t.zuhr) return "morning";
    if (h < t.asr) return "noon";
    if (h < t.maghrib - 0.6) return "afternoon";
    if (h < t.maghrib) return "sunset";
    return "dusk";
  }
  var lastPhase = "";
  function setPhase() {
    var p = cfg.sky === "night" ? "night" : cfg.sky === "day" ? "noon" : phaseOf(C);
    if (p === lastPhase) return;
    lastPhase = p;
    document.body.dataset.phase = p;
  }
  function dayKey(z) { return z.y + "-" + z.m + "-" + z.d; }

  /* ================= نوار دائمی تاریخ ================= */
  function renderDateBar() {
    var jdn = jdnNow(), info = dayInfoOf(jdn);
    var j = CAL.shortJalali(jdn), h = CAL.shortHijri(jdn), g = CAL.shortGreg(jdn);
    $("dbJ").textContent = j;
    $("dbH").textContent = h + " ق";
    $("dbG").textContent = g;
    $("dbWd").textContent = info.weekday;
    var occ = occText(info, 2), bar = $("occBar");
    var badges = info.occ.map(function (o) {
      return '<span class="oc ' + (o.off ? "off" : "") + '" data-cat="' + o.cat + '">' + o.title + "</span>";
    }).join("");
    if (badges) { bar.innerHTML = badges; bar.hidden = false; } else { bar.hidden = true; bar.innerHTML = ""; }
    document.title = "نیاز · " + j + " · وقت نماز " + PN[C ? C.chosen : "fajr"];
    $("dbMoon").textContent = info.moon.name;
  }
  var lastClock = "";
  function tickDateBar() {
    if (!C) return;
    var t = C.t, dpray, d = C.at ? (Date.now() - C.at) / 3600000 : 0;
    if (C.cur) dpray = "تا پایان وقت " + PN[C.cur] + " · " + hms(Math.max(0, C.left - d) * 3600);
    else dpray = "تا اذان " + PN[C.next] + " · " + hms(Math.max(0, C.wait - d) * 3600);
    setT($("dbX"), dpray);
    var z = zoneNow(loc.tz, new Date());
    var secs = Math.floor((z.h * 3600) % 60);
    var c = hhmm(z.h) + ":" + f(("0" + secs).slice(-2));
    if (c !== lastClock) { lastClock = c; setT($("dbClock"), c); }
  }

  /* ================= خانه ================= */
  var ZDAY = {
    shia: [["یا ذا الجلال و الاکرام", "يَا ذَا الْجَلَالِ وَالْإِكْرَامِ"], ["یا قاضی الحاجات", "يَا قَاضِيَ الْحَاجَاتِ"], ["یا ارحم الراحمین", "يَا أَرْحَمَ الرَّاحِمِينَ"], ["یا حی یا قیوم", "يَا حَيُّ يَا قَيُّومُ"], ["صلوات", "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ"], ["دعای فرج", "اللَّهُمَّ عَجِّلْ لِوَلِيِّكَ الْفَرَجَ"], ["یا رب العالمین", "يَا رَبَّ الْعَالَمِينَ"]],
    sunni: [["سبحان الله و بحمده", "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ"]]
  };
  function zdayOf(z) {
    var wd = new Date(Date.UTC(z.y, z.m - 1, z.d)).getUTCDay();
    return scheme === "shia" ? ZDAY.shia[wd] : ZDAY.sunni[0];
  }
  function lastDays(n) {
    var out = [], jdn = jdnNow();
    for (var i = n - 1; i >= 0; i--) {
      var d = dayInfoOf(jdn - i);
      out.push({ key: d.j.y + "-" + d.j.m + "-" + d.j.d, n: (log[d.j.y + "-" + d.j.m + "-" + d.j.d] || []).length, lbl: d.weekday.slice(0, 3), today: i === 0 });
    }
    return out;
  }
  function streak() {
    var s = 0, i = 0, d = lastDays(60).reverse();
    if (d[0].n < 5) i = 1;
    for (; i < d.length; i++) { if (d[i].n >= 5) s++; else break; }
    return s;
  }

  function renderHome() {
    C = compute(); setPhase();
    var z = C.z, t = C.t, done = log[dayKey(z)] || [], html = "";
    $("locName").textContent = loc.label;
    renderDateBar();
    P.forEach(function (p) {
      var cls = p.k === C.cur ? "cur" : (t[p.k] < z.h ? "past" : "");
      html += '<li class="' + cls + '"><button type="button" data-k="' + p.k + '"><span>' + p.n + '<span class="r">' + f(p.r) +
        " رکعت</span>" + (done.indexOf(p.k) >= 0 ? '<span class="ok">✓</span>' : "") + '</span><span class="t">' + hhmm(t[p.k]) + "</span></button></li>";
    });
    $("list").innerHTML = html;
    var wk = "";
    lastDays(7).forEach(function (x) {
      wk += '<div class="' + (x.today ? "today" : "") + '"><i><b style="height:' + (x.n / 5 * 100) + '%"></b></i><span>' + x.lbl + "</span></div>";
    });
    $("week").innerHTML = wk;
    var s = streak(); $("streak").textContent = s ? "🔥 " + f(s) + " روز پیاپی" : "امروز را کامل کن";
    var zd = zdayOf(z); $("zdAr").textContent = zd[1]; $("zdTitle").textContent = "ذکر امروز · " + zd[0] + " (×۱۰۰)";
    all("[data-s]").forEach(function (b) { if (b.dataset.s) b.setAttribute("aria-pressed", b.dataset.s === scheme); });
    lastKey = (C.cur || C.next) + ":" + !!C.cur;
    tick(true);
    pushNativeSoon();
  }

  var CIRC = 2 * Math.PI * 90;
  var lastRing = "", lastTickMin = -1;
  function tick(skipCompute) {
    if (!skipCompute) {
      C = compute();
      var k = (C.cur || C.next) + ":" + !!C.cur;
      if (k !== lastKey && !$("home").hidden) { renderHome(); return; }
      setPhase();
    }
    var z = C.z, t = C.t, secs, prog;
    if (C.cur) {
      secs = C.left * 3600; prog = 1 - C.left / C.span;
      setT($("nowText"), "وقت نماز " + pr(C.cur).n);
      setT($("subText"), C.cur === "isha" ? "تا اذان صبح" : "تا پایان وقت");
    } else {
      secs = C.wait * 3600; prog = 1 - C.wait / C.span;
      setT($("nowText"), "نماز بعدی: " + pr(C.next).n);
      setT($("subText"), "ساعت " + hhmm(t[C.next]));
    }
    setT($("count"), hms(secs));
    setT($("clock"), hhmm(z.h));
    var off = (CIRC * (1 - Math.max(0, Math.min(1, prog)))).toFixed(1);
    if (off !== lastRing) { lastRing = off; $("rprog").style.strokeDashoffset = off; }
    setT($("startBtn"), "شروع نماز " + pr(C.chosen).n);
    tickDateBar();
    var mk = Math.floor(C.z.h * 60);              /* تغییر دقیقه: تازه‌سازی سنگین */
    if (mk !== lastTickMin) { lastTickMin = mk; drawArc(); renderMiniTimes(); }
    renderTL();
  }

  /* ردیف اوقات کوچک زیر حلقه */
  var lastMiniSig = "";
  function renderMiniTimes() {
    var t = C.t, h = "";
    P.forEach(function (p) {
      var cls = p.k === C.chosen ? "on" : (t[p.k] < C.z.h ? "past" : "");
      h += '<div class="' + cls + '"><span>' + p.n + "</span><b>" + hhmm(t[p.k]) + "</b></div>";
    });
    h += '<div class="' + (C.z.h > C.t.sunrise && C.z.h < C.t.sunset ? "on" : "") + '"><span>طلوع</span><b>' + hhmm(t.sunrise) + "</b></div>";
    if (h !== lastMiniSig) { lastMiniSig = h; $("miniTimes").innerHTML = h; }
  }

  /* ================= چقدر وقت داری؟ ================= */
  var PRAY_MIN = { 2: 5, 3: 7, 4: 9 };
  function renderTL() {
    var t = C.t, z = C.z, card = $("tlCard"), done = log[dayKey(z)] || [];
    var cls = "ok", badge, big, a = "", b = "", msg, frac;
    if (C.cur) {
      var p = pr(C.cur), dur = PRAY_MIN[p.r] || 8, nh = z.h < t.fajr ? z.h + 24 : z.h;
      var rem = C.left, span = C.span, endLbl = "پایان وقت", late = false;
      var mid = (t.sunset + t.fajr + 24) / 2;
      if (C.cur === "isha" && scheme === "shia") {
        if (nh < mid) { rem = mid - nh; span = mid - t.isha; endLbl = "نیمه‌شب شرعی"; }
        else late = true;
      }
      var remMin = rem * 60, elapsedMin = (span - rem) * 60;
      frac = Math.max(0, Math.min(1, rem / span));
      big = minutesText(remMin) + " باقی مانده";
      a = "آخرین لحظهٔ شروع: " + hhmm(z.h + rem - dur / 60);
      b = endLbl + ": " + hhmm(z.h + rem);
      if (done.indexOf(C.cur) >= 0) { cls = "done"; badge = "خوانده شد ✓"; msg = "نماز " + p.n + " را خوانده‌ای؛ بقیهٔ وقت برای ذکر و دعاست."; }
      else if (late) { cls = "danger"; badge = "بعد از نیمه‌شب"; msg = "از نیمه‌شب شرعی گذشته؛ هرچه زودتر نماز عشا را بخوان."; }
      else if (remMin <= dur + 5) { cls = "danger"; badge = "وقت تنگ"; msg = "وقت تنگ است؛ همین حالا شروع کن! نماز " + p.n + " حدود " + f(dur) + " دقیقه طول می‌کشد."; }
      else if (remMin <= 30) { cls = "danger"; badge = "وقت کم"; msg = "کمتر از نیم ساعت مانده؛ وضو بگیر و شروع کن."; }
      else if (remMin <= 60) { cls = "warn"; badge = "وقت کم"; msg = "حدود یک ساعت یا کمتر مانده؛ کارهایت را جمع کن."; }
      else if (elapsedMin <= 20) { badge = "اول وقت"; msg = "اول وقت است؛ بهترین فرصت برای نماز " + p.n + "."; }
      else { badge = "وقت فراخ"; msg = "وقت فراخ است؛ با آرامش بخوان. نماز " + p.n + " حدود " + f(dur) + " دقیقه طول می‌کشد."; }
    } else {
      var np = pr(C.next);
      frac = Math.max(0, Math.min(1, 1 - C.wait / C.span));
      big = "نماز " + np.n + " تا " + minutesText(C.wait * 60) + " دیگر";
      a = "شروع: " + hhmm(t[C.next]); b = "";
      badge = "بین دو نماز";
      msg = done.indexOf("fajr") < 0 && z.h > t.sunrise ? "نماز صبح امروز ثبت نشده؛ اگر نخوانده‌ای، قضایش را بخوان." : "آماده شو؛ وضو بگیر و منتظر وقت بمان.";
    }
    var cn = "glass card tl " + (cls === "ok" ? "" : cls);
    if (card.className !== cn) card.className = cn;
    setT($("tlBadge"), badge); setT($("tlBig"), big);
    setW($("tlFill"), (frac * 100).toFixed(1) + "%");
    setT($("tlA"), a); setT($("tlB"), b); setT($("tlMsg"), msg);
  }

  var lastArcKey = "";
  function drawArc() {
    var t = C.t, h = C.z.h, W = 320;
    var arcKey = Math.floor(h * 60) + "|" + Math.round(t.sunrise * 60) + "|" + Math.round(t.sunset * 60);
    if (arcKey === lastArcKey) return;
    lastArcKey = arcKey;
    function pt(u) { var a = 1 - u; return [a * a * 20 + 2 * a * u * 160 + u * u * 300, a * a * 84 + 2 * a * u * -56 + u * u * 84]; }
    var s = '<path d="M20 84 Q160 -56 300 84" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="2" stroke-dasharray="3 5"/>' +
      '<line x1="8" x2="312" y1="84" y2="84" stroke="rgba(255,255,255,.25)"/>';
    var day = h >= t.sunrise && h <= t.sunset, u, p;
    if (day) {
      u = (h - t.sunrise) / (t.sunset - t.sunrise); p = pt(u);
      s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="16" fill="rgba(255,214,120,.25)"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="8" fill="var(--gold)"/>';
    } else {
      var hh = h < t.sunrise ? h + 24 : h; u = (hh - t.sunset) / (t.sunrise + 24 - t.sunset); p = pt(Math.max(0, Math.min(1, u)));
      s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="14" fill="rgba(200,215,255,.22)"/><text x="' + p[0] + '" y="' + (p[1] + 6) + '" style="font-size:18px;fill:#e8eefc">☾</text>';
    }
    s += '<text x="6" y="94" style="text-anchor:start">طلوع ' + hhmm(t.sunrise) + '</text><text x="314" y="94" style="text-anchor:end">غروب ' + hhmm(t.sunset) + "</text>";
    $("arc").innerHTML = s;
  }

  /* ================= تقویم ================= */
  var calJ = null, calH = null, calG = null, calFilterOpen = false;
  function ensureCal() {
    var today = jdnNow();
    if (!calJ) { var j = CAL.jalaliFromJdn(today); calJ = { y: j.y, m: j.m }; }
    if (!calH) { var h = CAL.hijriFromJdn(today); calH = { y: h.y, m: h.m }; }
    if (!calG) { var g = CAL.gregFromJdn(today); calG = { y: g.y, m: g.m }; }
  }
  function calMonthMatrix() {
    ensureCal();
    if (cfg.calView === "h") return CAL.monthGridHijri(calH.y, calH.m);
    if (cfg.calView === "g") return CAL.monthGridGreg(calG.y, calG.m);
    return CAL.monthGridJalali(calJ.y, calJ.m);
  }
  function calTitle() {
    ensureCal();
    if (cfg.calView === "h") return CAL.H_MONTHS[calH.m - 1] + " " + f(calH.y) + " ق";
    if (cfg.calView === "g") return CAL.G_MONTHS[calG.m - 1] + " " + f(calG.y);
    return CAL.J_MONTHS[calJ.m - 1] + " " + f(calJ.y);
  }
  function monthShift(n) {
    ensureCal();
    if (cfg.calView === "h") {
      var m = calH.m + n, y = calH.y;
      while (m > 12) { m -= 12; y++; } while (m < 1) { m += 12; y--; }
      calH = { y: y, m: m };
    } else if (cfg.calView === "g") {
      var mg = calG.m + n, yg = calG.y;
      while (mg > 12) { mg -= 12; yg++; } while (mg < 1) { mg += 12; yg--; }
      calG = { y: yg, m: mg };
    } else {
      var r = CAL.addJalaliMonths(calJ.y, calJ.m, n); calJ = r;
    }
    renderCalendar();
  }
  function chipRow() {
    return '<div class="calfilters">' + Object.keys(CAL.CATS).map(function (c) {
      return '<button type="button" data-cat="' + c + '" aria-pressed="' + (cfg.filters[c] !== false) + '">' + c + "</button>";
    }).join("") + '<button type="button" data-cat="__off" aria-pressed="' + (cfg.onlyOff ? "true" : "false") + '">تعطیلات رسمی</button></div>';
  }
  function renderCalendar() {
    ensureCal();
    var today = jdnNow(), cells = calMonthMatrix(), html = "", i;
    $("calTitle").textContent = calTitle();
    all("#calView button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.v === cfg.calView); });
    $("calDow").innerHTML = CAL.WEEK_S.map(function (w) { return "<span>" + w + "</span>"; }).join("");
    for (i = 0; i < cells.length; i++) {
      var jdn = cells[i], info = dayInfoOf(jdn);
      var occ = info.occ.filter(function (o) { return cfg.filters[o.cat] !== false; });
      if (cfg.onlyOff) occ = occ.filter(function (o) { return o.off; });
      var inMonth = true;
      if (cfg.calView === "h") inMonth = (info.h.y === calH.y && info.h.m === calH.m);
      else if (cfg.calView === "g") inMonth = (info.g.y === calG.y && info.g.m === calG.m);
      else inMonth = (info.j.y === calJ.y && info.j.m === calJ.m);
      var cls = ["ccell"];
      if (!inMonth) cls.push("dim");
      if (jdn === today) cls.push("today");
      if (info.friday) cls.push("fri");
      if (occ.some(function (o) { return o.off; })) cls.push("holiday");
      html += '<button type="button" class="' + cls.join(" ") + '" data-jdn="' + jdn + '">' +
        '<b>' + f(info.j.d) + "</b>" +
        '<i>' + f(info.h.d) + "</i>" +
        (occ.length ? '<s class="' + (occ[0].off ? "off" : "") + '"></s>' : "") +
        "</button>";
    }
    $("calGrid").innerHTML = html;
    $("calFilters").innerHTML = chipRow();
    renderUpcoming();
    var t = dayInfoOf(today);
    $("calToday").innerHTML = '<div class="ct-head"><span>' + t.weekday + " " + CAL.fmtJalali(today) + "</span>" +
      '<button type="button" class="chip" id="calTodayBtn">امروز</button></div>' +
      '<div class="ct-dates"><span>' + CAL.fmtHijri(today) + "</span><span>" + CAL.fmtGreg(today) + "</span>" +
      '<span>🌙 ' + t.moon.name + " · " + f(t.moon.pct) + "٪</span></div>" +
      (t.occ.length ? '<ul class="ct-occ">' + t.occ.map(function (o) {
        return '<li class="' + (o.off ? "off" : "") + '"><span class="cat ' + o.cat + '">' + o.cat + "</span><b>" + o.title + "</b>" +
          (o.note ? "<em>" + o.note + "</em>" : "") + (o.off ? '<span class="oftag">تعطیل رسمی</span>' : "") + "</li>";
      }).join("") + "</ul>" : '<p class="note">مناسبت خاصی برای امروز ثبت نشده است.</p>');
    var b = $("calTodayBtn"); if (b) b.onclick = function () { calJ = calH = calG = null; renderCalendar(); };
    var hdr = $("calHdrDate"); if (hdr) hdr.textContent = CAL.fmtJalali(today, true);
    pushNativeSoon();
  }
  function renderUpcoming() {
    ensureCal();
    var cats = {};
    Object.keys(CAL.CATS).forEach(function (c) { if (cfg.filters[c] !== false) cats[c] = 1; });
    var list = CAL.upcoming(jdnNow(), 75, cats);
    if (cfg.onlyOff) list = list.filter(function (x) { return x.off; });
    if (!list.length) { $("calUp").innerHTML = '<p class="note">مناسبتی با این فیلترها پیدا نشد.</p>'; return; }
    var h = "";
    list.slice(0, 40).forEach(function (x) {
      h += '<li><div class="up-when"><b>' + relDays(x.inDays) + "</b><span>" + CAL.shortJalali(x.jdn) + "</span></div>" +
        '<div class="up-body">' + x.occ.map(function (o) {
          return '<span class="up-occ ' + (o.off ? "off" : "") + '"><span class="cat ' + o.cat + '">' + o.cat + "</span>" + o.title + "</span>";
        }).join("") + "</div></li>";
    });
    $("calUp").innerHTML = h;
  }
  function openDaySheet(jdn) {
    var info = dayInfoOf(jdn), key = info.j.y + "-" + info.j.m + "-" + info.j.d, done = log[key] || [];
    var h = '<div class="sh-head"><b>' + info.weekday + "</b><span>" + (jdn === jdnNow() ? "امروز" : (jdn === jdnNow() + 1 ? "فردا" : "")) + "</span></div>" +
      '<div class="sh-dates">' +
      '<div><span>شمسی</span><b>' + CAL.fmtJalali(jdn) + "</b></div>" +
      '<div><span>قمری</span><b>' + CAL.fmtHijri(jdn) + "</b></div>" +
      '<div><span>میلادی</span><b>' + CAL.fmtGreg(jdn) + "</b></div>" +
      "</div>" +
      '<div class="sh-moon">🌙 فاز ماه: ' + info.moon.name + " · " + f(info.moon.pct) + "٪ نور</div>";
    if (info.occ.length) {
      h += '<ul class="ct-occ">' + info.occ.map(function (o) {
        return '<li class="' + (o.off ? "off" : "") + '"><span class="cat ' + o.cat + '">' + o.cat + "</span><b>" + o.title + "</b>" +
          (o.note ? "<em>" + o.note + "</em>" : "") + (o.off ? '<span class="oftag">تعطیل رسمی</span>' : "") + "</li>";
      }).join("") + "</ul>";
    } else h += '<p class="note">مناسبت خاصی ثبت نشده است.</p>';
    if (done.length) h += '<div class="sh-log">نمازهای ثبت‌شدهٔ این روز: ' + done.map(function (k) { return PN[k]; }).join("، ") + "</div>";
    h += '<div class="row"><button type="button" class="glass" id="shQaza">قضای این روز؟</button><button type="button" class="glass" id="shClose">بستن</button></div>';
    $("sheetBody").innerHTML = h;
    showSheet(true);
    $("shClose").onclick = function () { showSheet(false); };
    $("shQaza").onclick = function () {
      showSheet(false);
      toast("قضاها را از تنظیمات › نمازهای قضا به‌روز کن");
      go("settings");
    };
  }
  function showSheet(on) { $("sheet").hidden = !on; document.body.classList.toggle("sheet", !!on); }

  /* ================= اذان و اقامه ================= */
  var AZ = CONTENT.AZ, azTab = "adhan";
  function nextAdhan() {
    var now = Date.now();
    for (var d = 0; d < 2; d++) {
      var z = zoneNow(loc.tz, new Date(now + d * 86400000)), t = times(z, loc.lat, loc.lng);
      for (var i = 0; i < P.length; i++) { var at = absTime(z, t[P[i].k]); if (at > now) return { p: P[i], at: at, h: t[P[i].k], isFajr: P[i].k === "fajr" }; }
    }
    return null;
  }
  function drawAzan() {
    var now = Date.now(), iq = +cfg.iq || 0, z = zoneNow(loc.tz, new Date(now)), t = times(z, loc.lat, loc.lng), rec = null, i, nx, left, name, badge;
    if (iq) for (i = 0; i < P.length; i++) { var a = absTime(z, t[P[i].k]); if (a <= now && now < a + iq * 60000) rec = { p: P[i], at: a, h: t[P[i].k], isFajr: P[i].k === "fajr" }; }
    nx = rec || nextAdhan(); if (!nx) return;
    if (rec) { name = "اقامهٔ نماز " + nx.p.n; badge = "تا اقامه"; left = (nx.at + iq * 60000 - now) / 1000; }
    else { name = "اذان " + nx.p.n; badge = "اذان بعدی"; left = (nx.at - now) / 1000; }
    setT($("azNextName"), name); setT($("azNextBadge"), badge);
    setT($("azNextAdhan"), hhmm(nx.h));
    setT($("azNextIqama"), iq ? hhmm(nx.h + iq / 60) : "—");
    setT($("azNextLeft"), hms(left));
  }
  function drawPlayer() {
    var a = $("azPlayAzan"), b = $("azPlaySoft"); if (!a) return;
    a.setAttribute("aria-pressed", playing === "azan"); b.setAttribute("aria-pressed", playing === "soft");
    $("azPlayMsg").textContent = playing ? "در حال پخش…" : "";
  }
  function renderAzan() {
    var shia = scheme === "shia", h = "", nx = nextAdhan();
    $("azSchemeTag").textContent = shia ? "شیعه" : "اهل سنت";
    CONTENT.azanLines(azTab, shia, nx ? nx.isFajr : true).forEach(function (l) {
      h += '<li><span class="az-x">×' + f(l.x) + '</span><div class="az-body"><div class="ar" lang="ar" dir="rtl">' + l.ar + '</div><div class="fa">' + l.fa + "</div>" +
        (l.tag ? '<span class="az-tag">' + l.tag + "</span>" : "") + "</div></li>";
    });
    $("azLines").innerHTML = h;
    $("azTextNote").textContent = "متن بر اساس مذهبی که در صفحهٔ خانه انتخاب کرده‌ای نمایش داده می‌شود؛ بین فقه‌ها اندکی تفاوت هست.";
    all("#azTabSeg button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.v === azTab); });
    applyCfg(); drawAzan(); drawPlayer();
  }
  function playPreview(name) {
    if (playing === name) { stopSound(); return; }
    playSound(name, function (ok) { if (!ok) toast("فایل صدا پیدا نشد؛ آن را در پوشهٔ audio بگذار."); });
  }

  /* ================= صفحهٔ اذان (بجای اعلان) ================= */
  var asKey = "", asTimer = null, adhanAudio = null;
  function adhanScreenPayload(k) {
    var jdn = jdnNow(), info = dayInfoOf(jdn), z = zoneNow(loc.tz, new Date()), t = times(z, loc.lat, loc.lng);
    return {
      k: k, n: PN[k] || k, time: hhmm(t[k]),
      j: CAL.shortJalali(jdn), h: CAL.shortHijri(jdn) + " ق", g: CAL.shortGreg(jdn),
      wd: info.weekday, occ: occText(info, 3), moon: info.moon.name,
      loc: loc.label
    };
  }
  function openAdhanScreen(k, opts) {
    opts = opts || {};
    if (!pr(k)) k = nextAdhan() ? nextAdhan().p.k : "fajr";
    asKey = k;
    var d = adhanScreenPayload(k);
    $("asTitle").textContent = "وقت اذان " + d.n;
    $("asSub").textContent = "اذان " + d.n + " · ساعت " + d.time + " · " + d.loc;
    $("asJ").textContent = d.wd + " " + d.j;
    $("asH").textContent = d.h;
    $("asG").textContent = d.g;
    $("asOcc").textContent = d.occ ? "مناسبت: " + d.occ : "";
    $("asOcc").hidden = !d.occ;
    $("asMoon").textContent = "🌙 " + d.moon;
    $("adhanScreen").hidden = false;
    document.body.classList.add("adhan-open");
    drawAdhanPlayer();
    updateAdhanClock();
    clearInterval(asTimer);
    asTimer = setInterval(updateAdhanClock, 1000);
    if (opts.silent !== true && cfg.playAdhan === "on") startAdhanAudio();
    buzz([120, 60, 120, 60, 200]);
    if (!NATIVE) setWake(true);
  }
  function updateAdhanClock() {
    var z = zoneNow(loc.tz, new Date());
    setT($("asClock"), hhmm(z.h));
    var left = Math.max(0, 60 - Math.round((z.h * 3600) % 60));
    setT($("asTicker"), "این صفحه می‌ماند تا اذان تمام شود · " + f(left) + " ثانیه");
  }
  function closeAdhanScreen(silent) {
    $("adhanScreen").hidden = true;
    document.body.classList.remove("adhan-open");
    clearInterval(asTimer); asTimer = null;
    if (!silent) { stopAdhanAudio(); NZ.nat.stopAdhan(); }
    if (!NATIVE) setWake(false);
  }
  function startAdhanAudio() {
    stopAdhanAudio();
    var a = new Audio("audio/azan.mp3"), token = ++sndToken;
    a.onended = function () { if (token === sndToken) { adhanAudio = null; drawAdhanPlayer(); } };
    a.ontimeupdate = function () { if (token === sndToken) drawAdhanPlayer(); };
    a.onerror = function () { if (token === sndToken) { adhanAudio = null; drawAdhanPlayer(); } };
    var p = a.play();
    if (p && p.then) p.then(function () { if (token === sndToken) { adhanAudio = a; drawAdhanPlayer(); } }).catch(function () { drawAdhanPlayer(); });
    else { adhanAudio = a; drawAdhanPlayer(); }
  }
  function stopAdhanAudio() { if (adhanAudio) { try { adhanAudio.pause(); } catch (e) { } adhanAudio = null; } drawAdhanPlayer(); }
  function toggleAdhanAudio() { if (adhanAudio) { stopAdhanAudio(); NZ.nat.stopAdhan(); } else startAdhanAudio(); }
  function drawAdhanPlayer() {
    var el = $("asPlay"); if (!el) return;
    el.textContent = adhanAudio ? "⏸ توقف اذان" : "▶ پخش اذان";
    var bar = $("asBar"); if (!bar) return;
    if (adhanAudio && adhanAudio.duration) {
      bar.style.width = ((adhanAudio.currentTime / adhanAudio.duration) * 100).toFixed(1) + "%";
    } else bar.style.width = adhanAudio ? "2%" : "0%";
  }

  /* ================= برنامه‌ریزی اعلان‌ها ================= */
  function buildList() {
    var list = [], now = Date.now(), pre = +cfg.pre || 0, iq = +cfg.iq || 0;
    for (var d = 0; d < 8; d++) {
      var z = zoneNow(loc.tz, new Date(now + d * 86400000)), t = times(z, loc.lat, loc.lng), base = d * 40;
      P.forEach(function (p, i) {
        var at = absTime(z, t[p.k]);
        list.push({ id: base + i + 1, at: at, kind: "main", k: p.k, n: p.n, sound: cfg.snd, title: "وقت نماز " + p.n, body: "اذان " + p.n + " · " + hhmm(t[p.k]) + " · " + loc.label });
        if (pre) list.push({ id: base + i + 11, at: at - pre * 60000, kind: "pre", k: p.k, n: p.n, sound: "soft", title: f(pre) + " دقیقه تا نماز " + p.n, body: "آمادهٔ نماز شو · " + hhmm(t[p.k]) });
        if (iq) list.push({ id: base + i + 21, at: at + iq * 60000, kind: "iq", k: p.k, n: p.n, sound: "soft", title: "اقامهٔ نماز " + p.n, body: "قد قامت الصلاة · " + hhmm(t[p.k] + iq / 60) });
      });
      if (cfg.sun === "on") list.push({ id: base + 6, at: absTime(z, t.sunrise), kind: "sun", sound: "soft", title: "طلوع آفتاب", body: "وقت نماز صبح به پایان رسید · " + hhmm(t.sunrise) });
    }
    return list.filter(function (n) { return n.at > now + 3000; });
  }
  function buildNativeSchedule() {
    var list = [], now = Date.now(), pre = +cfg.pre || 0, iq = +cfg.iq || 0;
    for (var d = 0; d < 25; d++) {
      var z = zoneNow(loc.tz, new Date(now + d * 86400000)), t = times(z, loc.lat, loc.lng);
      P.forEach(function (p) {
        var at = absTime(z, t[p.k]);
        list.push({ at: at, k: p.k, n: p.n, kind: "main", sound: cfg.snd, title: "وقت اذان " + p.n, body: "اذان " + p.n + " · " + hhmm(t[p.k]) + " · " + loc.label });
        if (pre) list.push({ at: at - pre * 60000, k: p.k, n: p.n, kind: "pre", sound: "soft", title: f(pre) + " دقیقه تا نماز " + p.n, body: "آمادهٔ نماز شو · " + hhmm(t[p.k]) });
        if (iq) list.push({ at: at + iq * 60000, k: p.k, n: p.n, kind: "iq", sound: "soft", title: "اقامهٔ نماز " + p.n, body: "قد قامت الصلاة · " + hhmm(t[p.k] + iq / 60) });
      });
      if (cfg.sun === "on") list.push({ at: absTime(z, t.sunrise), kind: "sun", sound: "soft", title: "طلوع آفتاب", body: "وقت نماز صبح به پایان رسید · " + hhmm(t.sunrise) });
    }
    return list.filter(function (n) { return n.at > now + 3000; }).slice(0, 390);
  }
  function dateInfoPayload() {
    var jdn = jdnNow(), info = dayInfoOf(jdn);
    return {
      j: CAL.shortJalali(jdn) + " " + f(info.j.y),
      h: CAL.shortHijri(jdn) + " " + f(info.h.y),
      g: CAL.shortGreg(jdn) + " " + f(info.g.y),
      occ: occText(info, 2), loc: loc.label, moon: info.moon.name
    };
  }
  function widgetPayload() {
    var now = Date.now(), days = [], jdn0 = jdnNow();
    for (var i = 0; i < 4; i++) {
      var jdn = jdn0 + i, info = dayInfoOf(jdn);
      var z = zoneNow(loc.tz, new Date(now + i * 86400000)), t = times(z, loc.lat, loc.lng);
      var times2 = P.map(function (p) { return { n: p.n, k: p.k, t: hhmm(t[p.k]), ms: absTime(z, t[p.k]) }; });
      days.push({
        start: absTime(z, 0),
        j: CAL.fmtJalali(jdn), h: CAL.fmtHijri(jdn), g: CAL.fmtGreg(jdn),
        occ: occText(info, 2), times: times2
      });
    }
    return { brand: "نیاز", loc: loc.label, moon: dayInfoOf(jdn0).moon.name, days: days };
  }
  function pushNative() {
    if (!NZ.nat.has()) return;
    var cfgJson = {
      enabled: true, sound: cfg.snd, pre: +cfg.pre || 0, iq: +cfg.iq || 0, sun: cfg.sun === "on",
      playAdhan: cfg.playAdhan === "on", azanScreen: cfg.azanScreen === "on", notifyDate: cfg.notifDate === "on",
      label: loc.label, items: buildNativeSchedule()
    };
    NZ.nat.setConfig(cfgJson);
    NZ.nat.push({ dateinfo: JSON.stringify(dateInfoPayload()), widget: JSON.stringify(widgetPayload()) });
  }
  var pushT = null;
  function pushNativeSoon() { clearTimeout(pushT); pushT = setTimeout(pushNative, 2500); }

  /* پشتیبان برای نسخه‌های قدیمی یا مروگر (اعلان محلی Capacitor) */
  var schedTimer = null;
  function reschedule() {
    clearTimeout(schedTimer);
    schedTimer = setTimeout(function () {
      if (NZ.nat.has()) { pushNative(); return; }
      scheduleLN();
    }, 900);
  }
  function ensurePerm() {
    var ln = LN(); if (!ln) return Promise.resolve(false);
    return ln.checkPermissions().then(function (p) {
      if (p.display === "granted") return true;
      return ln.requestPermissions().then(function (r) { return r.display === "granted"; });
    });
  }
  var LN_CH = [
    { id: "azan_v1", name: "اذان", sound: "azan" },
    { id: "soft_v1", name: "یادآوری ملایم", sound: "soft" },
    { id: "default_v1", name: "اعلان‌های نیاز", sound: "" }
  ];
  function ensureLNChannels() {
    var ln = LN(); if (!ln || !ln.createChannel) return Promise.resolve();
    var chain = Promise.resolve();
    LN_CH.forEach(function (c) {
      chain = chain.then(function () {
        var o = { id: c.id, name: c.name, description: "اعلان‌های نیاز", importance: 5, visibility: 1, vibration: true, lights: true };
        if (c.sound) o.sound = c.sound;
        return ln.createChannel(o);
      }).catch(function () { });
    });
    return chain;
  }
  function scheduleLN() {
    var ln = LN(); if (!ln || NZ.nat.has()) return Promise.resolve();
    return ln.getPending().then(function (pd) {
      var ids = (pd.notifications || []).map(function (n) { return { id: n.id }; });
      return ids.length ? ln.cancel({ notifications: ids }) : null;
    }).then(function () {
      if (cfg.notif !== "on") return null;
      return ensurePerm().then(function (ok) {
        if (!ok) { toast("اجازهٔ اعلان داده نشد؛ از تنظیمات گوشی فعالش کن."); return null; }
        return ensureLNChannels();
      }).then(function () {
        var list = buildList().map(function (n) {
          var o = {
            id: n.id, title: n.title, body: n.body,
            channelId: n.sound === "azan" ? "azan_v1" : (n.sound === "default" ? "default_v1" : "soft_v1"),
            schedule: { at: new Date(n.at), allowWhileIdle: true }
          };
          return o;
        });
        return list.length ? ln.schedule({ notifications: list }) : null;
      });
    }).catch(function () { });
  }
  function enableNotif() {
    if (NZ.nat.has()) {
      NZ.nat.requestNotif().then(function (r) {
        pushNative();
        toast(r && r.granted === false ? "اجازهٔ اعلان داده نشد؛ از تنظیمات گوشی روشنش کن." : "اعلان‌ها برای ۳۰ روز آینده زمان‌بندی شد.");
      });
    } else if (NATIVE) {
      enableLN();
    } else {
      try { if (window.Notification && Notification.permission === "default") Notification.requestPermission(); } catch (e) { }
      toast("در مرورگر اعلان‌ها فقط وقتی صفحه باز است می‌آیند.");
    }
  }
  function enableLN() {
    var ln = LN(); if (!ln) return;
    ensurePerm().then(function (ok) {
      if (!ok) { cfg.notif = "off"; saveCfg(); applyCfg(); toast("اجازهٔ اعلان داده نشد."); return; }
      scheduleLN().then(function () { toast("اعلان‌ها برای ۷ روز آینده تنظیم شد."); });
    });
  }
  function testNotif(mode) {
    if (NZ.nat.has()) {
      NZ.nat.testAlarm(mode || "notif").then(function (r) {
        toast(mode === "azan" ? "تا ۸ ثانیهٔ دیگر صفحهٔ اذان و صدای اذان می‌آید." : "تا ۵ ثانیهٔ دیگر اعلان آزمایشی می‌آید.");
      });
      return;
    }
    toast("تا ۵ ثانیهٔ دیگر…");
    setTimeout(function () {
      if (mode === "azan") { openAdhanScreen(C ? C.chosen : "fajr", { silent: false }); return; }
      alertSound(); buzz([200, 100, 200]); toast("اعلان آزمایشی ✓");
      try { if (window.Notification && Notification.permission === "granted") new Notification("نیاز · اعلان آزمایشی"); } catch (e) { }
    }, 5000);
  }
  var lastAlert = load("rk-alerted", "");
  function checkAlert() {
    if (cfg.notif !== "on" || NATIVE || !C) return;
    P.forEach(function (p) {
      var d = C.z.h - C.t[p.k], key = dayKey(C.z) + p.k;
      if (d >= 0 && d < 0.02 && lastAlert !== key) {
        lastAlert = key; save("rk-alerted", key);
        if (cfg.azanScreen === "on" && C.cur === p.k) openAdhanScreen(p.k);
        else { toast("وقت نماز " + p.n + " شد"); alertSound(); buzz([200, 100, 200]); }
        try { if (window.Notification && Notification.permission === "granted") new Notification("وقت نماز " + p.n); } catch (e) { }
      }
    });
  }

  /* ================= قبله ================= */
  var rose = $("rose"), lastAlign = false, roseAngle = 0, qRaf = 0;
  function drawQibla() {
    var b = qiblaBearing(loc.lat, loc.lng);
    $("qDeg").textContent = f(Math.round(b)) + "° " + compassWord(b);
    $("qDist").textContent = f(String(Math.round(qiblaDist(loc.lat, loc.lng))).replace(/\B(?=(\d{3})+(?!\d))/g, "٬")) + " کیلومتر";
    $("kaaba").style.transform = "rotate(" + b + "deg)";
    var comp = $("compass");
    if (heading == null) {
      roseAngle = 0; rose.style.transform = "rotate(0deg)"; $("cdeg").textContent = ""; $("qState").textContent = "قطب‌نما غیرفعال"; comp.classList.remove("aligned");
      $("compassBtn").hidden = false; return;
    }
    $("compassBtn").hidden = true;
    var tgt = -heading;
    roseAngle += fix(tgt - roseAngle + 180, 360) - 180;
    rose.style.transform = "rotate(" + roseAngle + "deg)";
    $("cdeg").textContent = f(Math.round(heading)) + "°";
    var diff = fix(b - heading + 180, 360) - 180, ok = Math.abs(diff) < 4;
    comp.classList.toggle("aligned", ok);
    $("qState").textContent = ok ? "رو به قبله‌ای ✓" : (diff > 0 ? "به راست بچرخ" : "به چپ بچرخ");
    if (ok && !lastAlign) buzz(60);
    lastAlign = ok;
  }
  function onOri(e) {
    var h = null;
    if (e.webkitCompassHeading != null) h = e.webkitCompassHeading;
    else if (e.alpha != null && (e.absolute || e.type === "deviceorientationabsolute")) h = 360 - e.alpha;
    if (h == null) return;
    heading = heading == null ? h : fix(heading + 0.3 * (fix(h - heading + 180, 360) - 180), 360);
    if (!$("qibla").hidden && !qRaf) qRaf = requestAnimationFrame(function () { qRaf = 0; drawQibla(); });
  }
  var compassOn = false;
  function startCompass() {
    var D = window.DeviceOrientationEvent;
    function go() {
      if (compassOn) return; compassOn = true;
      window.addEventListener("deviceorientationabsolute", onOri, true);
      window.addEventListener("deviceorientation", onOri, true);
      setTimeout(function () { if (heading == null) toast("حسگر جهت در دسترس نیست؛ فقط زاویه نمایش داده می‌شود."); }, 2500);
    }
    if (D && typeof D.requestPermission === "function") {
      D.requestPermission().then(function (r) { if (r === "granted") go(); else toast("اجازهٔ حسگر داده نشد."); }).catch(function () { toast("حسگر جهت در دسترس نیست."); });
    } else go();
  }

  /* ================= تسبیح ================= */
  var PRESETS = CONTENT.ZIKR;
  var TARGETS = [33, 100, 313, 1000, 0];
  var tb = Object.assign({ ar: PRESETS[0][1], fa: PRESETS[0][0], c: 0, t: 33, rounds: 0, day: "", tot: 0 }, load("rk-tb", {}));
  function drawTb(pulse) {
    var z = zoneNow(loc.tz, new Date()), key = dayKey(z);
    if (tb.day !== key) { tb.day = key; tb.tot = 0; }
    var h = "";
    PRESETS.forEach(function (p, i) { h += '<button type="button" data-i="' + i + '" aria-pressed="' + (tb.fa === p[0]) + '">' + p[0] + "</button>"; });
    if (!PRESETS.some(function (p) { return p[0] === tb.fa; })) h = '<button type="button" aria-pressed="true">' + tb.fa + "</button>" + h;
    $("tbChips").innerHTML = h;
    var th = "";
    TARGETS.forEach(function (n) { th += '<button type="button" data-t="' + n + '" aria-pressed="' + (tb.t === n) + '">' + (n ? f(n) : "∞") + "</button>"; });
    $("tbTargets").innerHTML = th;
    $("tbCnt").textContent = f(tb.c);
    $("tbOf").textContent = (tb.t ? "از " + f(tb.t) : "بدون هدف") + (tb.rounds ? " · دور " + f(tb.rounds + 1) : "");
    $("tbRing").style.setProperty("--p", tb.t ? tb.c / tb.t * 100 : 0);
    $("tbAr").textContent = tb.ar; $("tbFa").textContent = tb.fa;
    $("tbToday").textContent = "مجموع امروز: " + f(tb.tot);
    if (pulse) { var r = $("tbRing"); r.classList.remove("pulse"); void r.offsetWidth; r.classList.add("pulse"); }
    save("rk-tb", tb);
  }
  function tbTap() {
    tb.c++; tb.tot++; save("rk-tb-all", load("rk-tb-all", 0) + 1); buzz(8);
    if (tb.t && tb.c >= tb.t) { buzz([70, 40, 70]); toast("به " + f(tb.t) + " رسیدی"); tb.c = 0; tb.rounds++; }
    drawTb(true);
  }
  function renderDuaList() {
    var h = "";
    CONTENT.DUAS.forEach(function (d, i) {
      h += '<li><button type="button" data-dua="' + i + '"><b>' + d.n + "</b><span>" + d.ar.slice(0, 46) + "…</span></button></li>";
    });
    $("duaList").innerHTML = h;
  }

  /* ================= ناوبری ================= */
  var SCREENS = ["home", "calendar", "azan", "tasbih", "qibla", "settings", "creator", "loc", "pray", "taqib", "end"];
  function show(id) {
    SCREENS.forEach(function (s) { $(s).hidden = s !== id; });
    var el = $(id), tab = el.dataset.tab;
    all("#tabs button").forEach(function (b) { b.setAttribute("aria-current", b.dataset.go === tab); });
    if (id !== "pray") autoStop();
    var praying = id === "pray" || id === "taqib";
    document.body.classList.toggle("praying", praying);
    document.body.classList.toggle("sub", id === "loc" || id === "end" || id === "creator");
    if (praying && sess) document.body.dataset.prayer = sess.k; else document.body.removeAttribute("data-prayer");
    window.scrollTo(0, 0);
    setWake(praying || id === "tasbih");
  }
  function setWake(on) {
    try {
      if (on && "wakeLock" in navigator) navigator.wakeLock.request("screen").then(function (l) { wake = l; }).catch(function () { });
      else if (!on && wake) { wake.release(); wake = null; }
    } catch (e) { }
  }
  function go(tab) {
    show(tab);
    if (tab === "home") renderHome();
    if (tab === "calendar") renderCalendar();
    if (tab === "qibla") { drawQibla(); var D = window.DeviceOrientationEvent; if (!(D && typeof D.requestPermission === "function")) startCompass(); }
    if (tab !== "azan" && playing) stopSound();
    if (tab === "azan") renderAzan();
    if (tab === "tasbih") { drawTb(); renderDuaList(); }
    if (tab === "settings") { applyCfg(); buildAdj(); renderStats(); renderThemeBox(); renderSysBox(); renderWidgetBox(); }
    if (tab === "creator") renderCreator();
  }

  /* ================= سازنده ================= */
  function renderCreator() {
    $("cname").textContent = CREATOR.name; $("crole").textContent = CREATOR.role; $("cbio").textContent = CREATOR.bio;
    $("cver").textContent = "نسخهٔ " + CREATOR.version;
    var h = "";
    Object.keys(CREATOR.links).forEach(function (k) {
      var v = CREATOR.links[k]; if (!v) return;
      if (k === "ایمیل" && v.indexOf("mailto:") !== 0) v = "mailto:" + v;
      h += '<a class="chip" target="_blank" rel="noopener" href="' + v + '">' + k + "</a>";
    });
    $("clinks").innerHTML = h;
    var total = 0; Object.keys(log).forEach(function (d) { total += log[d].length; });
    $("cs1").textContent = f(total); $("cs2").textContent = f(streak());
    $("cs3").textContent = f(load("rk-tb-all", 0));
  }
  var taps = 0;
  if ($("clogo")) $("clogo").onclick = function () {
    taps++;
    if (taps >= 5) { taps = 0; confetti(); buzz([40, 30, 40]); toast("ساخته‌شده با عشق توسط " + CREATOR.name); }
  };

  /* ================= پیشروی خودکار نماز ================= */
  var autoT = null, autoStart = 0, autoLeft = 0, autoDur = 0, autoHold = false;
  var SPEED = { slow: 1.4, normal: 1, fast: 0.75 };
  function stepDur() {
    var base = 0;
    if (cfg.tap === "rakat") steps.forEach(function (x) { base += x.d || 8; });
    else base = steps[sess.s].d || 8;
    return Math.max(2, base * (SPEED[cfg.spd] || 1));
  }
  function autoStop() { clearTimeout(autoT); autoT = null; }
  function barSet(pct, sec) {
    var el = $("autoFill"); el.style.transition = "none"; el.style.width = pct + "%";
    if (sec > 0) { void el.offsetWidth; el.style.transition = "width " + sec + "s linear"; el.style.width = "100%"; }
  }
  function drawAutoBtn() { $("autoBtn").textContent = autoHold ? "▶ ادامهٔ خودکار" : "⏸ توقف خودکار"; }
  function autoRun(left, pct) {
    autoStop(); autoStart = Date.now(); autoLeft = left;
    autoT = setTimeout(function () { autoT = null; prayNext(); }, left * 1000);
    barSet(pct, left);
  }
  function autoArm() {
    autoStop();
    var on = cfg.auto === "on" && sess && sess.t === "p";
    $("autoBar").hidden = !on; $("autoBtn").hidden = !on;
    if (!on) return;
    autoDur = stepDur(); autoLeft = autoDur; drawAutoBtn();
    if (autoHold) { barSet(0, 0); return; }
    autoRun(autoDur, 0);
  }
  function autoToggle() {
    if (autoHold) { autoHold = false; drawAutoBtn(); autoRun(autoLeft, (1 - autoLeft / autoDur) * 100); }
    else {
      autoHold = true; autoStop();
      autoLeft = Math.max(0.5, autoLeft - (Date.now() - autoStart) / 1000);
      barSet((1 - autoLeft / autoDur) * 100, 0); drawAutoBtn();
    }
  }

  /* ================= نماز ================= */
  var steps = [];
  function start(k) {
    autoHold = false;
    sess = { t: "p", k: k, r: 1, s: 0 };
    save("rk-sess", sess);
    closeAdhanScreen(true);
    NZ.nat.stopAdhan();
    renderPray();
  }
  function renderPray() {
    var p = pr(sess.k);
    steps = stepsOf(p, sess.r);
    if (sess.s >= steps.length) sess.s = steps.length - 1;
    var st = steps[sess.s];
    show("pray");
    $("title").textContent = "نماز " + p.n + " · رکعت " + f(sess.r) + " از " + f(p.r);
    var done = sess.r - 1 + (st.rk ? 1 : 0), rh = "";
    for (var i = 0; i < p.r; i++) rh += '<i class="' + (i < done ? "full" : "") + (i === sess.r - 1 ? " act" : "") + '"><b></b></i>';
    $("rakats").innerHTML = rh;
    var url = (cfg.imgs && cfg.imgs[st.pose]) || DEFAULT_IMAGES[st.pose] || "", img = $("poseImg"), pose = $("pose");
    $("poseLabel").textContent = POSE_NAME[st.pose];
    if (url) { img.src = url; img.hidden = false; pose.className = "pose"; img.onerror = function () { img.hidden = true; pose.className = "pose noimg"; }; }
    else { img.hidden = true; pose.className = "pose noimg"; }
    $("stepName").textContent = st.name;
    $("arText").innerHTML = (st.lines || []).map(function (l) {
      return '<div class="arline"><div class="ar" lang="ar" dir="rtl">' + l[0] + '</div><div class="tr">' + l[1] + "</div></div>";
    }).join("");
    $("faText").textContent = st.note || st.fa || "";
    $("badges").innerHTML = (st.tags || []).map(function (t) { return '<span class="' + (t === "بلند" ? "loud" : "") + '">' + t + "</span>"; }).join("");
    var dh = ""; steps.forEach(function (_, j) { dh += '<i class="' + (j === sess.s ? "on" : "") + '"></i>'; });
    $("dots").innerHTML = dh;
    $("tapNote").textContent = cfg.auto === "on" ? "مراحل خودکار پیش می‌روند · لمس = رد کردن مرحله" : (cfg.tap === "rakat" ? "هر لمس = یک رکعت" : "هر جای صفحه را لمس کن");
    var zk = $("zikr"); zk.classList.remove("slide"); void zk.offsetWidth; zk.classList.add("slide");
    save("rk-sess", sess);
    autoArm();
  }
  function prayNext() {
    var p = pr(sess.k);
    if (cfg.tap === "rakat") { buzz(40); if (sess.r < p.r) { sess.r++; sess.s = 0; renderPray(); } else finishPrayer(); return; }
    if (sess.s < steps.length - 1) { sess.s++; buzz(15); renderPray(); return; }
    if (sess.r < p.r) { sess.r++; sess.s = 0; buzz(40); renderPray(); return; }
    finishPrayer();
  }
  function prayPrev() {
    if (sess.s > 0 && cfg.tap !== "rakat") { sess.s--; renderPray(); return; }
    if (sess.r > 1 && (cfg.tap === "rakat" || sess.s === 0)) {
      sess.r--; sess.s = cfg.tap === "rakat" ? 0 : stepsOf(pr(sess.k), sess.r).length - 1; renderPray();
    }
  }
  function finishPrayer() {
    buzz([80, 40, 80]);
    var key = dayKey(zoneNow(loc.tz, new Date()));
    log[key] = log[key] || [];
    if (log[key].indexOf(sess.k) < 0) log[key].push(sess.k);
    save("rk-log", log);
    if (cfg.tq === "on") { sess = { t: "q", k: sess.k, i: 0, c: 0 }; save("rk-sess", sess); renderTq(); }
    else endAll("نمازت ثبت شد.");
  }

  /* ================= تعقیبات ================= */
  var items = [];
  function renderTq() {
    items = tqItems(sess.k);
    if (sess.i >= items.length) sess.i = items.length - 1;
    var it = items[sess.i];
    show("taqib");
    $("tqTitle").textContent = "تعقیبات نماز " + pr(sess.k).n;
    var h = ""; items.forEach(function (_, j) { h += '<i class="' + (j < sess.i ? "full" : "") + (j === sess.i ? " act" : "") + '"><b></b></i>'; });
    $("tqBar").innerHTML = h;
    $("tqName").textContent = it.n; $("tqAr").textContent = it.ar; $("tqFa").textContent = it.fa;
    var cd = $("tqCard"); cd.classList.remove("slide"); void cd.offsetWidth; cd.classList.add("slide");
    drawCount(false); save("rk-sess", sess);
  }
  function drawCount(pulse) {
    var it = items[sess.i];
    $("cnt").textContent = it.c > 1 ? f(sess.c) : "◦";
    $("cntOf").textContent = it.c > 1 ? "از " + f(it.c) : "لمس برای ادامه";
    $("ring").style.setProperty("--p", it.c > 1 ? sess.c / it.c * 100 : 0);
    if (pulse) { var r = $("ring"); r.classList.remove("pulse"); void r.offsetWidth; r.classList.add("pulse"); }
  }
  function tqNext() {
    var it = items[sess.i];
    if (it.c > 1 && sess.c < it.c - 1) { sess.c++; buzz(10); drawCount(true); save("rk-sess", sess); return; }
    if (it.c > 1) { sess.c = it.c; drawCount(true); }
    buzz(it.c > 1 ? [50, 30, 50] : 20);
    if (sess.i < items.length - 1) { sess.i++; sess.c = 0; renderTq(); }
    else endAll("تعقیبات هم تمام شد. دعاهایت مستجاب.");
  }
  function tqPrev() {
    if (sess.c > 0) { sess.c = 0; renderTq(); return; }
    if (sess.i > 0) { sess.i--; renderTq(); }
  }
  function endAll(msg) {
    sess = null; save("rk-sess", null);
    $("endText").textContent = msg; show("end"); confetti();
  }

  /* ================= افکت جشن ================= */
  function confetti() {
    var cv = $("fx"), cx = cv && cv.getContext ? cv.getContext("2d") : null;
    if (!cx) return;
    var W = cv.width = innerWidth, H = cv.height = innerHeight, ps = [], i;
    var col = ["#f4c25b", "#ffe29a", "#5fd3d0", "#ffffff", "#e0a12b"];
    for (i = 0; i < 90; i++) ps.push({ x: W / 2, y: H * 0.35, vx: (Math.random() - 0.5) * 11, vy: -Math.random() * 12 - 2, r: Math.random() * 5 + 2, c: col[i % 5], a: 1 });
    var n = 0;
    (function step() {
      cx.clearRect(0, 0, W, H);
      ps.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.vy += 0.28; p.a -= 0.007; cx.globalAlpha = Math.max(0, p.a); cx.fillStyle = p.c; cx.fillRect(p.x, p.y, p.r, p.r * 1.6); });
      if (++n < 150) requestAnimationFrame(step); else cx.clearRect(0, 0, W, H);
    })();
  }

  /* ================= موقعیت ================= */
  function renderCities(q) {
    q = (q || "").trim(); var h = "";
    CITIES.forEach(function (c, i) { if (!q || c[0].indexOf(q) >= 0) h += '<li><button type="button" data-i="' + i + '">' + c[0] + "</button></li>"; });
    $("cityList").innerHTML = h || '<li class="note">شهری پیدا نشد؛ از موقعیت دقیق استفاده کن.</li>';
  }
  function setLoc(l) { loc = l; save("rk-loc", loc); go("home"); reschedule(); }

  /* ================= تنظیمات ================= */
  function applyCfg() {
    document.documentElement.style.setProperty("--arfs", cfg.fs + "px");
    document.body.classList.toggle("noanim", cfg.anim === "off");
    applyTheme();
    var segs = [["skySeg", "sky"], ["tapSeg", "tap"], ["tqSeg", "tq"], ["notifSeg", "notif"], ["preSeg", "pre"], ["sunSeg", "sun"],
      ["vibSeg", "vib"], ["asrSeg", "asr"], ["sndSeg", "snd"], ["iqSeg", "iq"], ["autoSeg", "auto"], ["spdSeg", "spd"],
      ["azanSeg", "azanScreen"], ["playSeg", "playAdhan"], ["dateNotifSeg", "notifDate"], ["datebarSeg", "datebar"], ["animSeg", "anim"]];
    segs.forEach(function (x) {
      var box = $(x[0]); if (!box) return;
      all("#" + x[0] + " button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.v === String(cfg[x[1]])); });
    });
    if ($("methodSel")) $("methodSel").value = cfg.method;
    if ($("surahSel")) $("surahSel").value = cfg.surah;
    all(".field.img").forEach(function (i) { i.value = (cfg.imgs && cfg.imgs[i.dataset.p]) || ""; });
    if ($("sndNote")) $("sndNote").textContent = NZ.nat.has()
      ? "صدای اذان در «صفحهٔ اذان» خودِ برنامه پخش می‌شود؛ پس می‌توانی قطعش کنی."
      : (NATIVE ? "صدای اعلان از فایل‌های پوشهٔ audio ساخته می‌شود؛ بعد از عوض‌کردن فایل، APK را دوباره بساز." : "این صدا فقط وقتی برنامه باز است پخش می‌شود.");
    if ($("notifNote")) $("notifNote").textContent = NZ.nat.has()
      ? "اعلان‌ها با آلارم دقیق اندروید برای ۲۵ روز آینده زمان‌بندی می‌شوند و با بسته بودن برنامه هم می‌آیند."
      : (NATIVE ? "اعلان‌ها برای ۷ روز آینده زمان‌بندی می‌شوند." : "در مرورگر فقط وقتی صفحه باز است اعلان می‌آید؛ برای اعلان پس‌زمینه برنامه را نصب کن.");
    document.body.dataset.datebar = cfg.datebar === "on" ? "1" : "0";
  }
  function stepper(box, obj, key, name, fmt, min, max, after) {
    var row = document.createElement("div"); row.className = "ar2";
    row.innerHTML = "<span>" + name + '</span><span class="st"><button type="button" aria-label="کم">−</button><b></b><button type="button" aria-label="زیاد">+</button></span>';
    var b = row.querySelector("b"), bs = row.querySelectorAll("button");
    function draw() { b.textContent = fmt(obj[key]); }
    bs[0].onclick = function () { obj[key] = Math.max(min, obj[key] - 1); saveCfg(); draw(); after && after(); };
    bs[1].onclick = function () { obj[key] = Math.min(max, obj[key] + 1); saveCfg(); draw(); after && after(); };
    draw(); box.appendChild(row);
  }
  function buildAdj() {
    var a = $("adjBox"), q = $("qazaBox"); a.innerHTML = ""; q.innerHTML = "";
    P.forEach(function (p) {
      stepper(a, cfg.adj, p.k, p.n, function (v) { return (v > 0 ? "+" : "") + f(v); }, -30, 30, function () { reschedule(); });
      stepper(q, cfg.qaza, p.k, p.n, function (v) { return f(v); }, 0, 9999);
    });
  }
  function renderStats() {
    var days = Object.keys(log), total = 0, full = 0;
    days.forEach(function (d) { total += log[d].length; if (log[d].length >= 5) full++; });
    $("stats").textContent = "نمازهای ثبت‌شده: " + f(total) + " · روزهای کامل: " + f(full) + " از " + f(days.length) + " روز";
  }
  function seg(id, key, after) {
    all("#" + id + " button").forEach(function (b) {
      b.onclick = function () { cfg[key] = b.dataset.v; saveCfg(); applyCfg(); if (after) after(); };
    });
  }
  function renderThemeBox() {
    var h = "";
    THEMES.forEach(function (t) {
      h += '<button type="button" class="thcard' + (cfg.theme === t.k ? " on" : "") + '" data-theme="' + t.k + '">' +
        '<span class="thsw" style="background:linear-gradient(140deg,' + t.sw[0] + "," + t.sw[1] + ')">' +
        '<i style="background:' + t.sw[2] + '"></i></span>' +
        "<b>" + t.n + "</b></button>";
    });
    $("themeBox").innerHTML = h;
    var a = '<button type="button" class="acsw' + (!cfg.accent ? " on" : "") + '" data-accent="" title="رنگ خودِ تم"><i style="background:var(--gold)"></i></button>';
    ACCENTS.forEach(function (x, i) {
      a += '<button type="button" class="acsw' + (cfg.accent === String(i) ? " on" : "") + '" data-accent="' + i + '" title="' + x[2] + '">' +
        '<i style="background:linear-gradient(140deg,' + x[0] + "," + x[1] + ')"></i></button>';
    });
    $("accentBox").innerHTML = a;
  }
  function renderSysBox() {
    var box = $("sysBox");
    if (!NZ.nat.has()) {
      box.innerHTML = '<p class="note">' + (NATIVE
        ? "این نسخه از برنامه از ماژول بومی جدید پشتیبانی نمی‌کند؛ برای اعلان دائمی و صفحهٔ اذان، APK تازه را نصب کن."
        : "در مرورگر، اعلان دائمی و صفحهٔ اذان فقط تا وقتی این صفحه باز است کار می‌کند. برای حالت کامل، APK اندروید را نصب کن.") + "</p>";
      return;
    }
    box.innerHTML = '<p class="note">در حال بررسی وضعیت…</p>';
    NZ.nat.ping().then(function (s) {
      if (!s) { box.innerHTML = '<p class="note">وضعیت در دسترس نیست.</p>'; return; }
      function row(ok, title, hint, btn, act) {
        return '<div class="sysrow"><span class="dot ' + (ok ? "ok" : "bad") + '"></span><div><b>' + title + '</b><em>' + hint + "</em></div>" +
          (btn ? '<button type="button" class="chip" data-sys="' + act + '">' + btn + "</button>" : "") + "</div>";
      }
      var h = "";
      h += row(s.notif, "اجازهٔ اعلان", s.notif ? "فعال است" : "خاموش است؛ اعلان‌ها دیده نمی‌شوند", s.notif ? "" : "روشن کن", "notif");
      h += row(s.exact, "آلارم دقیق", s.exact ? "فعال است؛ اذان سر وقت می‌رسد" : "غیرفعال؛ اذان ممکن است دیرتر برسد", s.exact ? "" : "فعال کن", "exact");
      h += row(s.fullscreen, "صفحهٔ تمام‌صفحه (روی قفل)", s.fullscreen ? "فعال است" : "غیرفعال؛ به‌جای صفحه، اعلان می‌آید", s.fullscreen ? "" : "فعال کن", "full");
      h += '<div class="sysrow"><span class="dot ok"></span><div><b>بهینه‌سازی باتری</b><em>اگر گوشی اعلان‌ها را دیر می‌دهد، نیاز را مستثنا کن</em></div><button type="button" class="chip" data-sys="battery">مستثنا کن</button></div>';
      h += '<div class="sysrow"><span class="dot ok"></span><div><b>هستهٔ اعلان دائمی</b><em>اعلان تاریخ با یک سرویس سبک و بدون محاسبهٔ پیوسته</em></div><button type="button" class="chip" data-sys="svc">' + (cfg.notifDate === "on" ? "خاموش کن" : "روشن کن") + "</button></div>";
      if (s.nextName) h += '<div class="sysrow"><span class="dot ok"></span><div><b>اذان بعدی</b><em>اذان ' + s.nextName + " · " + hhmm(((s.nextAt - Date.now()) / 3600000) + C.z.h) + "</em></div></div>";
      box.innerHTML = h;
      all("#sysBox [data-sys]").forEach(function (b) {
        b.onclick = function () {
          var a = b.dataset.sys;
          if (a === "notif") { NZ.nat.requestNotif().then(function () { renderSysBox(); }); }
          else if (a === "exact") NZ.nat.openExactSettings();
          else if (a === "full") NZ.nat.openFullScreenSettings();
          else if (a === "battery") NZ.nat.openBatterySettings();
          else if (a === "svc") {
            cfg.notifDate = cfg.notifDate === "on" ? "off" : "on"; saveCfg(); applyCfg();
            if (cfg.notifDate === "on") NZ.nat.startDate(); else NZ.nat.stopDate();
            renderSysBox();
          }
        };
      });
    });
  }
  function renderWidgetBox() {
    var box = $("widgetBox"), w = widgetPayload(), d = w.days[0];
    var next = d.times.filter(function (x) { return x.ms > Date.now(); })[0] || d.times[0];
    box.innerHTML =
      '<div class="wprev"><div class="wp-top"><img src="icon.svg" alt=""><div><b>نیاز · ' + d.j + "</b><span>" + d.h + "</span><span>" + d.g + "</span></div></div>" +
      (d.occ ? '<div class="wp-occ">' + d.occ + "</div>" : "") +
      '<div class="wp-next"><b>اذان ' + next.n + "</b><strong>" + next.t + "</strong></div>" +
      '<div class="wp-loc">' + loc.label + " · " + w.moon + "</div></div>" +
      '<div class="row"><button type="button" class="glass" id="addWidget">افزودن ویجت به صفحهٔ اصلی</button>' +
      '<button type="button" class="glass" id="refreshWidget">به‌روزرسانی</button></div>' +
      '<p class="note">' + (NZ.nat.has() ? "با یک لمس، ویجت روی صفحهٔ اصلی گذاشته می‌شود؛ اگر نشد، جای خالی صفحهٔ اصلی را نگه دار و «ویجت‌ها» › نیاز را انتخاب کن." : "ویجت فقط در نسخهٔ اندروید کار می‌کند.") + "</p>";
    var a = $("addWidget");
    if (a) a.onclick = function () {
      if (!NZ.nat.has()) { toast("ویجت در مرورگر در دسترس نیست."); return; }
      NZ.nat.addWidget().then(function (r) { toast(r && r.pinned ? "ویجت را روی صفحهٔ اصلی بگذار" : "از فهرست ویجت‌های صفحهٔ اصلی، نیاز را انتخاب کن."); });
    };
    var rf = $("refreshWidget");
    if (rf) rf.onclick = function () { pushNative(); NZ.nat.refreshWidget(); renderWidgetBox(); toast("ویجت به‌روز شد."); };
  }

  /* ================= رویدادها ================= */
  $("startBtn").onclick = function () { start(C.chosen); };
  $("list").onclick = function (e) { var b = e.target.closest("button[data-k]"); if (b) start(b.dataset.k); };
  all("[data-s]").forEach(function (b) {
    if (!b.dataset.s) return;
    b.onclick = function () { scheme = b.dataset.s; save("rk-scheme", scheme); renderHome(); reschedule(); };
  });
  all("[data-go]").forEach(function (b) { b.onclick = function () { go(b.dataset.go); }; });
  $("homeBtn").onclick = function () { go("home"); };
  $("exitBtn").onclick = function () { sess = null; save("rk-sess", null); go("home"); };
  $("skipBtn").onclick = function () { endAll("نمازت ثبت شد."); };
  $("prevBtn").onclick = function (e) { e.stopPropagation(); prayPrev(); };
  $("autoBtn").onclick = function (e) { e.stopPropagation(); autoToggle(); };
  $("tqPrev").onclick = function (e) { e.stopPropagation(); tqPrev(); };
  $("compassBtn").onclick = startCompass;
  $("zdGo").onclick = function () { var zd = zdayOf(C.z); tb = Object.assign(tb, { ar: zd[1], fa: zd[0], c: 0, t: 100, rounds: 0 }); go("tasbih"); };

  // نوار تاریخ
  $("dbOpen").onclick = function () { go("calendar"); };
  $("occBar").onclick = function () { go("calendar"); };

  // لمس هر جای صفحه
  document.addEventListener("click", function (e) {
    if (e.target.closest("button,input,a,select,label,textarea")) return;
    if (!$("adhanScreen").hidden) return;
    if (!$("pray").hidden) prayNext();
    else if (!$("taqib").hidden) tqNext();
    else if (!$("tasbih").hidden) tbTap();
  });

  // تسبیح
  $("tbChips").onclick = function (e) { var b = e.target.closest("button[data-i]"); if (!b) return; var p = PRESETS[+b.dataset.i]; tb.fa = p[0]; tb.ar = p[1]; tb.c = 0; tb.rounds = 0; drawTb(); };
  $("tbTargets").onclick = function (e) { var b = e.target.closest("button[data-t]"); if (!b) return; tb.t = +b.dataset.t; tb.c = 0; tb.rounds = 0; drawTb(); };
  $("tbReset").onclick = function () { tb.c = 0; tb.rounds = 0; drawTb(); };
  $("tbUndo").onclick = function () { if (tb.c > 0) { tb.c--; tb.tot = Math.max(0, tb.tot - 1); drawTb(); } };
  document.addEventListener("click", function (e) {
    var b = e.target.closest("#duaList button[data-dua]"); if (!b) return;
    var d = CONTENT.DUAS[+b.dataset.dua];
    tb = Object.assign(tb, { ar: d.ar, fa: d.n + " · برای شمارش لمس کن", c: 0, t: 0, rounds: 0 });
    drawTb(); toast("دعای " + d.n + " آمادهٔ خواندن است");
  });

  // تقویم
  $("calPrev").onclick = function () { monthShift(-1); };
  $("calNext").onclick = function () { monthShift(1); };
  $("calTodayNav").onclick = function () { calJ = calH = calG = null; renderCalendar(); };
  all("#calView button").forEach(function (b) {
    b.onclick = function () { cfg.calView = b.dataset.v; saveCfg(); renderCalendar(); };
  });
  $("calGrid").onclick = function (e) { var b = e.target.closest("button[data-jdn]"); if (b) openDaySheet(+b.dataset.jdn); };
  $("calFilters").onclick = function (e) {
    var b = e.target.closest("button[data-cat]"); if (!b) return;
    var c = b.dataset.cat;
    if (c === "__off") cfg.onlyOff = !cfg.onlyOff; else cfg.filters[c] = !(cfg.filters[c] !== false);
    saveCfg(); renderCalendar();
  };
  $("sheet").onclick = function (e) { if (e.target.id === "sheet") showSheet(false); };

  // موقعیت
  $("locChip").onclick = function () { renderCities(""); $("citySearch").value = ""; $("gpsMsg").textContent = ""; show("loc"); };
  $("citySearch").oninput = function () { renderCities(this.value); };
  $("cityList").onclick = function (e) { var b = e.target.closest("button[data-i]"); if (!b) return; var c = CITIES[+b.dataset.i]; setLoc({ label: c[0], lat: c[1], lng: c[2], tz: c[3] }); };
  $("gpsBtn").onclick = function () {
    if (!navigator.geolocation) { $("gpsMsg").textContent = "این دستگاه موقعیت‌یابی ندارد."; return; }
    $("gpsMsg").textContent = "در حال یافتن موقعیت…";
    navigator.geolocation.getCurrentPosition(function (pos) {
      var tz = "UTC"; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch (e) { }
      setLoc({ label: "موقعیت من", lat: pos.coords.latitude, lng: pos.coords.longitude, tz: tz });
    }, function () { $("gpsMsg").textContent = "اجازهٔ موقعیت داده نشد؛ شهر را از فهرست انتخاب کن."; }, { timeout: 12000, enableHighAccuracy: true });
  };
  all(".back").forEach(function (b) { b.onclick = function () { go(b.dataset.back || "home"); }; });

  // تنظیمات
  seg("skySeg", "sky", function () { if (C) setPhase(); });
  seg("tapSeg", "tap"); seg("tqSeg", "tq"); seg("vibSeg", "vib"); seg("autoSeg", "auto"); seg("spdSeg", "spd");
  seg("notifSeg", "notif", function () { if (cfg.notif === "on") enableNotif(); else { if (NZ.nat.has()) NZ.nat.clear(); else scheduleLN(); } });
  seg("preSeg", "pre", reschedule); seg("sunSeg", "sun", reschedule);
  seg("sndSeg", "snd", function () { reschedule(); if (cfg.snd === "default") stopSound(); else playSound(cfg.snd); });
  seg("iqSeg", "iq", function () { reschedule(); drawAzan(); });
  seg("azanSeg", "azanScreen", reschedule);
  seg("playSeg", "playAdhan", reschedule);
  seg("dateNotifSeg", "notifDate", function () {
    if (!NZ.nat.has()) { toast("اعلان دائمی فقط در نسخهٔ اندروید کار می‌کند."); return; }
    if (cfg.notifDate === "on") NZ.nat.startDate(); else NZ.nat.stopDate();
    pushNative(); renderSysBox();
  });
  seg("datebarSeg", "datebar");
  seg("animSeg", "anim", function () { applyCfg(); });
  all("#azTabSeg button").forEach(function (b) { b.onclick = function () { azTab = b.dataset.v; renderAzan(); }; });
  $("azPlayAzan").onclick = function () { playPreview("azan"); };
  $("azPlaySoft").onclick = function () { playPreview("soft"); };
  $("azStop").onclick = stopSound;
  seg("asrSeg", "asr", function () { renderHome(); reschedule(); });
  $("methodSel").onchange = function () { cfg.method = this.value; saveCfg(); renderHome(); reschedule(); };
  if ($("surahSel")) $("surahSel").onchange = function () { cfg.surah = this.value; saveCfg(); toast("سورهٔ دوم رکعت‌ها تغییر کرد."); };
  $("testNotif").onclick = function () { testNotif("notif"); };
  if ($("testAzan")) $("testAzan").onclick = function () { testNotif("azan"); };
  if ($("testDate")) $("testDate").onclick = function () { NZ.nat.testAlarm("date"); renderSysBox(); };
  if ($("openAppSettings")) $("openAppSettings").onclick = function () { NZ.nat.openAppSettings(); };
  $("fsPlus").onclick = function () { cfg.fs = Math.min(40, cfg.fs + 2); saveCfg(); applyCfg(); };
  $("fsMinus").onclick = function () { cfg.fs = Math.max(18, cfg.fs - 2); saveCfg(); applyCfg(); };
  all(".field.img").forEach(function (i) { i.oninput = function () { cfg.imgs = cfg.imgs || {}; cfg.imgs[i.dataset.p] = i.value.trim(); saveCfg(); }; });
  $("resetStats").onclick = function () { log = {}; save("rk-log", log); renderStats(); toast("آمار پاک شد."); };
  if ($("themeBox")) $("themeBox").onclick = function (e) {
    var b = e.target.closest("button[data-theme]"); if (!b) return;
    cfg.theme = b.dataset.theme; saveCfg(); applyCfg(); renderThemeBox(); buzz(15);
    toast("ظاهر «" + theme().n + "» فعال شد");
  };
  if ($("accentBox")) $("accentBox").onclick = function (e) {
    var b = e.target.closest("button[data-accent]"); if (!b) return;
    cfg.accent = b.dataset.accent; saveCfg(); applyCfg(); renderThemeBox();
  };

  // اعلان‌های تقویمی (تغییر روز) برای به‌روزرسانی نوار تاریخ
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) return;
    if (!$("home").hidden) renderHome();
    if (!$("calendar").hidden) renderCalendar();
    if (!$("pray").hidden || !$("taqib").hidden || !$("tasbih").hidden) setWake(true);
    if (NATIVE && cfg.notif === "on") reschedule();
    checkNativeAction();
  });

  /* ================= عملی که از صفحهٔ اذان می‌آید ================= */
  function handleAction(a) {
    if (!a) return;
    if (a.action === "prayer" && a.k && pr(a.k)) { toast("نماز " + PN[a.k] + " شروع شد"); start(a.k); }
    else if (a.action === "azanText") { azTab = "adhan"; go("azan"); }
    else if (a.action === "date") go("calendar");
  }
  function checkNativeAction() {
    if (!NZ.nat.has()) return;
    NZ.nat.consumeAction().then(function (r) {
      if (r && r.action) { try { handleAction(JSON.parse(r.action)); } catch (e) { handleAction({ action: r.action }); } }
    });
  }
  function routeHash() {
    var h = (location.hash || "").replace(/^#/, "");
    if (!h) return false;
    var p = h.split(/[=&]/);
    if (p[0] === "adhan") { openAdhanScreen(p[1] || (C.chosen || "fajr")); return true; }
    if (p[0] === "calendar") { go("calendar"); return true; }
    if (p[0] === "azan") { go("azan"); return true; }
    return false;
  }
  window.addEventListener("hashchange", routeHash);
  NZ.nat.onAction(handleAction);


  /* ================= دکمه‌های صفحهٔ اذان ================= */
  $("asPlay").onclick = function () { toggleAdhanAudio(); };
  $("asPray").onclick = function () { start(asKey || (C ? C.chosen : "fajr")); };
  $("asText").onclick = function () { closeAdhanScreen(true); azTab = "adhan"; go("azan"); };
  $("asClose").onclick = function () { closeAdhanScreen(false); };
  $("asCalendar").onclick = function () { closeAdhanScreen(true); go("calendar"); };
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (!$("adhanScreen").hidden) closeAdhanScreen(false);
      else if (!$("sheet").hidden) showSheet(false);
    }
  });

  /* پیام‌های کوچک بالای صفحه هنگام لمس نوار تاریخ */
  $("dbMoon").onclick = function () { go("calendar"); };

  /* ================= ساعت جهانی ================= */
  var lastAllMin = -1;
  setInterval(function () {
    if (document.hidden) return;                     /* در پس‌زمینه هیچ محاسبه‌ای انجام نمی‌شود */
    if (!$("home").hidden) {
      tick();
    } else {
      var mAll = Math.floor(Date.now() / 60000);
      if (C && mAll !== lastAllMin) { lastAllMin = mAll; C = compute(); drawArc(); renderMiniTimes(); }
      tickDateBar();
      if (!$("azan").hidden) drawAzan();
    }
    checkAlert();
    var today = jdnNow();
    if (TODAY !== today) { TODAY = today; if (!$("calendar").hidden) renderCalendar(); renderDateBar(); }
  }, 1000);

  /* ================= شروع ================= */
  applyCfg();
  ensureCal();
  TODAY = jdnNow();
  setTimeout(function () { $("splash").classList.add("hide"); }, 2100);
  $("splash").onclick = function () { $("splash").classList.add("hide"); };
  C = compute();
  if (sess && sess.t === "q" && sess.k && pr(sess.k)) renderTq();
  else if (sess && sess.k && pr(sess.k)) { autoHold = true; renderPray(); toast("نماز نیمه‌کاره مانده بود؛ برای ادامه «ادامهٔ خودکار» را بزن."); }
  else go("home");
  if (NATIVE && cfg.notif === "on") reschedule();
  if (NZ.nat.has()) { pushNative(); checkNativeAction(); }
  if (!routeHash() && NZ.nat.has() && cfg.notifDate === "on") NZ.nat.startDate();
  renderStats();
  renderThemeBox();
})();
