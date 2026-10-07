/*  نیاز · همراه هوشمند نماز
    © Mojtaba Meidani — مجتبی میدانی  */
(function () {
  "use strict";

  /* ================= ابزارها ================= */
  var FA = "۰۱۲۳۴۵۶۷۸۹";
  function f(n) { return String(n).replace(/\d/g, function (d) { return FA[d]; }); }
  function $(id) { return document.getElementById(id); }
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
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
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
    } catch (e) {}
  }
  var NATIVE = !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
  function LN() { return NATIVE && window.Capacitor.Plugins ? window.Capacitor.Plugins.LocalNotifications : null; }

  /* ================= تصاویر حالت‌ها =================
     آدرس تصویر را اینجا یا از «تنظیمات» وارد کن؛ فایل محلی هم می‌شود: "img/ruku.jpg" */
  var DEFAULT_IMAGES = { stand: "", ruku: "", sajdah: "", sit: "" };
  var POSE_NAME = { stand: "قیام", ruku: "رکوع", sajdah: "سجده", sit: "نشستن" };

  /* ================= اطلاعات سازنده =================
     هر چیزی را که خواستی اینجا عوض کن؛ لینک‌های خالی نمایش داده نمی‌شوند. */
  var CREATOR = {
    name: "مجتبی میدانی",
    role: "سازنده و طراح نیاز",
    bio: "نیاز را ساختم تا نماز با حضور قلب بیشتر و حواس‌پرتی کمتر خوانده شود.",
    version: "۲٫۰",
    links: { "تلگرام": "", "اینستاگرام": "", "ایمیل": "", "وب‌سایت": "" }
  };

  /* ================= شهرها ================= */
  var CITIES = [
    ["تهران",35.6892,51.389,"Asia/Tehran"],["مشهد",36.2972,59.6067,"Asia/Tehran"],["اصفهان",32.6546,51.668,"Asia/Tehran"],
    ["شیراز",29.5918,52.5837,"Asia/Tehran"],["تبریز",38.0962,46.2738,"Asia/Tehran"],["قم",34.6416,50.8746,"Asia/Tehran"],
    ["اهواز",31.3183,48.6706,"Asia/Tehran"],["کرج",35.8327,50.9915,"Asia/Tehran"],["کرمانشاه",34.3277,47.0778,"Asia/Tehran"],
    ["ارومیه",37.5527,45.076,"Asia/Tehran"],["رشت",37.2808,49.5832,"Asia/Tehran"],["زاهدان",29.4963,60.8629,"Asia/Tehran"],
    ["کرمان",30.2839,57.0834,"Asia/Tehran"],["همدان",34.7989,48.515,"Asia/Tehran"],["یزد",31.8974,54.3569,"Asia/Tehran"],
    ["اردبیل",38.2498,48.2933,"Asia/Tehran"],["بندرعباس",27.1865,56.2808,"Asia/Tehran"],["اراک",34.0954,49.6892,"Asia/Tehran"],
    ["سنندج",35.3219,46.9862,"Asia/Tehran"],["قزوین",36.2688,50.0041,"Asia/Tehran"],["زنجان",36.6765,48.4963,"Asia/Tehran"],
    ["گرگان",36.8427,54.4439,"Asia/Tehran"],["ساری",36.5633,53.0601,"Asia/Tehran"],["بوشهر",28.9234,50.8203,"Asia/Tehran"],
    ["خرم‌آباد",33.4878,48.3558,"Asia/Tehran"],["بیرجند",32.8649,59.2262,"Asia/Tehran"],["سمنان",35.5769,53.392,"Asia/Tehran"],
    ["ایلام",33.6374,46.4227,"Asia/Tehran"],["یاسوج",30.6682,51.5879,"Asia/Tehran"],["شهرکرد",32.3256,50.8644,"Asia/Tehran"],
    ["بجنورد",37.4747,57.329,"Asia/Tehran"],
    ["مکه",21.4225,39.8262,"Asia/Riyadh"],["مدینه",24.4672,39.6112,"Asia/Riyadh"],["کربلا",32.616,44.0249,"Asia/Baghdad"],
    ["نجف",31.996,44.315,"Asia/Baghdad"],["بغداد",33.3152,44.3661,"Asia/Baghdad"],["دمشق",33.5138,36.2765,"Asia/Damascus"],
    ["بیروت",33.8938,35.5018,"Asia/Beirut"],["قاهره",30.0444,31.2357,"Africa/Cairo"],["استانبول",41.0082,28.9784,"Europe/Istanbul"],
    ["دبی",25.2048,55.2708,"Asia/Dubai"],["دوحه",25.2854,51.531,"Asia/Qatar"],["کویت",29.3759,47.9774,"Asia/Kuwait"],
    ["مسقط",23.588,58.3829,"Asia/Muscat"],["باکو",40.4093,49.8671,"Asia/Baku"],["ایروان",40.1792,44.4991,"Asia/Yerevan"],
    ["عشق‌آباد",37.9601,58.3261,"Asia/Ashgabat"],["دوشنبه",38.5598,68.787,"Asia/Dushanbe"],["تاشکند",41.2995,69.2401,"Asia/Tashkent"],
    ["کابل",34.5553,69.2075,"Asia/Kabul"],["هرات",34.3529,62.204,"Asia/Kabul"],["کراچی",24.8607,67.0011,"Asia/Karachi"],
    ["لاهور",31.5204,74.3587,"Asia/Karachi"],["دهلی",28.6139,77.209,"Asia/Kolkata"],["داکا",23.8103,90.4125,"Asia/Dhaka"],
    ["کوالالامپور",3.139,101.6869,"Asia/Kuala_Lumpur"],["جاکارتا",-6.2088,106.8456,"Asia/Jakarta"],
    ["لندن",51.5074,-0.1278,"Europe/London"],["پاریس",48.8566,2.3522,"Europe/Paris"],["برلین",52.52,13.405,"Europe/Berlin"],
    ["استکهلم",59.3293,18.0686,"Europe/Stockholm"],["تورنتو",43.6532,-79.3832,"America/Toronto"],
    ["نیویورک",40.7128,-74.006,"America/New_York"],["لس‌آنجلس",34.0522,-118.2437,"America/Los_Angeles"],
    ["سیدنی",-33.8688,151.2093,"Australia/Sydney"]
  ];

  /* ================= وضعیت و تنظیمات ================= */
  var PN = { fajr: "صبح", zuhr: "ظهر", asr: "عصر", maghrib: "مغرب", isha: "عشا" };
  var P = [
    { k: "fajr", n: "صبح", r: 2, loud: [1, 2] },
    { k: "zuhr", n: "ظهر", r: 4, loud: [] },
    { k: "asr", n: "عصر", r: 4, loud: [] },
    { k: "maghrib", n: "مغرب", r: 3, loud: [1, 2] },
    { k: "isha", n: "عشا", r: 4, loud: [1, 2] }
  ];
  function pr(k) { return P.filter(function (p) { return p.k === k; })[0]; }
  var zero5 = function () { return { fajr: 0, zuhr: 0, asr: 0, maghrib: 0, isha: 0 }; };
  var cfg = Object.assign({ sky: "auto", tap: "step", tq: "on", notif: "off", pre: "0", sun: "off", vib: "on",
    fs: 26, method: "auto", asr: "1", adj: zero5(), qaza: zero5(), imgs: {} }, load("rk-cfg", {}));
  cfg.adj = Object.assign(zero5(), cfg.adj); cfg.qaza = Object.assign(zero5(), cfg.qaza);
  var loc = load("rk-loc", { label: "تهران", lat: 35.6892, lng: 51.389, tz: "Asia/Tehran" });
  var scheme = load("rk-scheme", "shia");
  var sess = load("rk-sess", null);
  var log = load("rk-log", {});
  var C = null, heading = null, wake = null, lastKey = "";
  function saveCfg() { save("rk-cfg", cfg); }
  function buzz(p) { if (cfg.vib !== "on") return; try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

  /* ================= محاسبهٔ اوقات ================= */
  function zoneNow(tz, date) {
    var o = {};
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" })
        .formatToParts(date).forEach(function (p) { o[p.type] = +p.value; });
    } catch (e) { o = { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate(), hour: date.getHours(), minute: date.getMinutes(), second: date.getSeconds() }; }
    var asUtc = Date.UTC(o.year, o.month - 1, o.day, o.hour % 24, o.minute, o.second);
    return { y: o.year, m: o.month, d: o.day, h: (o.hour % 24) + o.minute / 60 + o.second / 3600,
             off: (asUtc - Math.floor(date.getTime() / 1000) * 1000) / 3600000 };
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
    var t = { fajr: noon - H(-M.fajr), sunrise: noon - H(-0.833), zuhr: noon + 0.02, asr: noon + H(asrAlt),
              sunset: noon + H(-0.833), maghrib: noon + H(-M.mag), isha: noon + H(-(M.isha || 0)) };
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

  /* ================= مراحل نماز ================= */
  var T = {
    takbir: "اللَّهُ أَكْبَر",
    fatiha: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ۝ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمَنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ…",
    arba: "سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ",
    qunut: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    ruku: "سُبْحَانَ رَبِّيَ الْعَظِيمِ وَبِحَمْدِهِ",
    sajdah: "سُبْحَانَ رَبِّيَ الْأَعْلَى وَبِحَمْدِهِ",
    tashShia: "أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ ۝ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ ۝ اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ",
    tashSunni: "التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ ۝ السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ ۝ السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ ۝ أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ",
    salawat: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ…",
    salamShia: "السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ ۝ السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ ۝ السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ",
    salamSunni: "السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ"
  };
  function buildSteps(p, r, sch) {
    var shia = sch === "shia", total = p.r, last = r === total;
    var tash = last || (r === 2 && total > 2), loud = p.loud.indexOf(r) >= 0, S = [];
    if (r === 1) S.push({ name: "تکبیرة‌الاحرام", ar: T.takbir, fa: "نیت کن، دست‌ها را تا بناگوش بالا ببر و بگو", pose: "stand" });
    var q = { name: "قیام", pose: "stand", tags: [loud ? "بلند" : "آهسته"] };
    if (r <= 2) { q.ar = T.fatiha; q.fa = "سورهٔ حمد، سپس یک سوره (مثلاً توحید)"; }
    else if (shia) { q.ar = T.arba; q.fa = "یک بار حمد، یا تسبیحات اربعه (۳ بار)"; q.tags = ["آهسته", "۳ بار"]; }
    else { q.ar = T.fatiha; q.fa = "فقط سورهٔ حمد"; q.tags = ["آهسته"]; }
    S.push(q);
    if (shia && r === 2) S.push({ name: "قنوت (مستحب)", ar: T.qunut, fa: "دست‌ها را مقابل صورت بگیر و دعا کن", pose: "stand", tags: ["اختیاری"] });
    S.push({ name: "رکوع", ar: T.ruku, fa: "با «الله اکبر» به رکوع برو؛ دست‌ها روی زانو", pose: "ruku", tags: ["۳ بار"] });
    S.push({ name: "برخاستن از رکوع", ar: shia ? "سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ" : "سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ ۝ رَبَّنَا وَلَكَ الْحَمْدُ", fa: "صاف بایست و آرام بگیر", pose: "stand" });
    S.push({ name: "سجدهٔ اول", ar: T.sajdah, fa: "با «الله اکبر» به سجده برو؛ پیشانی، دو کف، دو زانو و دو شست پا روی زمین", pose: "sajdah", tags: ["۳ بار"] });
    S.push({ name: "نشستن بین دو سجده", ar: shia ? "أَسْتَغْفِرُ اللَّهَ رَبِّي وَأَتُوبُ إِلَيْهِ" : "رَبِّ اغْفِرْ لِي", fa: "با «الله اکبر» بنشین و آرام بگیر", pose: "sit" });
    S.push({ name: "سجدهٔ دوم", ar: T.sajdah, fa: "دوباره با «الله اکبر» به سجده برو", pose: "sajdah", tags: ["۳ بار"], rk: true });
    if (tash) {
      var ts = shia ? T.tashShia : T.tashSunni;
      if (!shia && last) ts += " ۝ " + T.salawat;
      S.push({ name: last ? "تشهد آخر" : "تشهد", ar: ts, fa: last ? "بنشین و تشهد را بخوان" : "بنشین و تشهد را بخوان، سپس برای رکعت بعد برخیز", pose: "sit", rk: true });
    } else {
      S.push({ name: "برخاستن", ar: shia ? "بِحَوْلِ اللَّهِ وَقُوَّتِهِ أَقُومُ وَأَقْعُدُ" : T.takbir, fa: "برای رکعت بعد برخیز", pose: "stand", rk: true });
    }
    if (last) S.push({ name: "سلام نماز", ar: shia ? T.salamShia : T.salamSunni, fa: shia ? "به راست و چپ نگاه کن و سلام بده" : "اول به راست، بعد به چپ سلام بده", pose: "sit", rk: true });
    return S;
  }

  /* ================= تعقیبات ================= */
  var AYAT_KURSI = "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ";
  var TAWHID = "قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ";
  var ISTIGHFAR = "أَسْتَغْفِرُ اللَّهَ رَبِّي وَأَتُوبُ إِلَيْهِ";
  var HELAL = "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، يُحْيِي وَيُمِيتُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ";
  function tqItems(k, sch) {
    var shia = sch === "shia", L = [], helal = (k === "fajr" || k === "maghrib");
    if (shia) {
      L.push({ n: "تکبیر", ar: "اللَّهُ أَكْبَرُ", fa: "پس از سلام، دست‌ها را تا نزدیک گوش بالا ببر و سه بار بگو", c: 3 });
      L.push({ n: "استغفار", ar: ISTIGHFAR, fa: "از خدا آمرزش بخواه", c: 3 });
      L.push({ n: "تسبیح حضرت زهرا (س) · ۱", ar: "اللَّهُ أَكْبَرُ", fa: "۳۴ بار «الله اکبر»", c: 34 });
      L.push({ n: "تسبیح حضرت زهرا (س) · ۲", ar: "الْحَمْدُ لِلَّهِ", fa: "۳۳ بار «الحمد لله»", c: 33 });
      L.push({ n: "تسبیح حضرت زهرا (س) · ۳", ar: "سُبْحَانَ اللَّهِ", fa: "۳۳ بار «سبحان الله»", c: 33 });
    } else {
      L.push({ n: "استغفار", ar: ISTIGHFAR, fa: "سه بار از خدا آمرزش بخواه", c: 3 });
      L.push({ n: "ذکر پس از سلام", ar: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ", fa: "یک بار", c: 1 });
      L.push({ n: "تسبیحات · ۱", ar: "سُبْحَانَ اللَّهِ", fa: "۳۳ بار «سبحان الله»", c: 33 });
      L.push({ n: "تسبیحات · ۲", ar: "الْحَمْدُ لِلَّهِ", fa: "۳۳ بار «الحمد لله»", c: 33 });
      L.push({ n: "تسبیحات · ۳", ar: "اللَّهُ أَكْبَرُ", fa: "۳۴ بار «الله اکبر»", c: 34 });
    }
    if (helal) L.push({ n: "تهلیل (" + (k === "fajr" ? "پس از صبح" : "پس از مغرب") + ")", ar: HELAL, fa: "۱۰ بار", c: 10 });
    L.push({ n: "آیة‌الکرسی", ar: AYAT_KURSI, fa: "سورهٔ بقره، آیهٔ ۲۵۵", c: 1 });
    L.push({ n: "سورهٔ توحید", ar: TAWHID, fa: "سورهٔ اخلاص", c: 1 });
    L.push({ n: "حوقله", ar: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ", fa: "هیچ نیرو و توانی جز از خدا نیست", c: 3 });
    L.push({ n: "صلوات", ar: shia ? "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ وَعَجِّلْ فَرَجَهُمْ" : "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ", fa: "سه بار صلوات بفرست", c: 3 });
    if (shia) L.push({ n: "سجدهٔ شکر", ar: "شُكْرًا لِلَّهِ", fa: "پیشانی را بر زمین بگذار و سه بار بگو؛ سپس خواسته‌ات را از خدا بخواه", c: 3 });
    return L;
  }

  /* ================= آسمان و وضعیت لحظه‌ای ================= */
  function compute() {
    var now = new Date(), z = zoneNow(loc.tz, now), t = times(z, loc.lat, loc.lng);
    var order = ["fajr", "zuhr", "asr", "maghrib", "isha"];
    var end = { fajr: t.sunrise, zuhr: t.asr, asr: t.maghrib, maghrib: t.isha, isha: t.fajr + 24 };
    var n = z.h < t.fajr ? z.h + 24 : z.h, cur = null, i;
    for (i = 0; i < order.length; i++) if (n >= t[order[i]] && n < end[order[i]]) cur = order[i];
    var res = { z: z, t: t, cur: cur };
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
  function setPhase() {
    document.body.dataset.phase = cfg.sky === "night" ? "night" : cfg.sky === "day" ? "noon" : phaseOf(C);
  }

  /* ================= خانه ================= */
  function dayKey(z) { return z.y + "-" + z.m + "-" + z.d; }
  var ZDAY = {
    shia: [["یا ذا الجلال و الاکرام", "يَا ذَا الْجَلَالِ وَالْإِكْرَامِ"], ["یا قاضی الحاجات", "يَا قَاضِيَ الْحَاجَاتِ"], ["یا ارحم الراحمین", "يَا أَرْحَمَ الرَّاحِمِينَ"], ["یا حی یا قیوم", "يَا حَيُّ يَا قَيُّومُ"], ["صلوات", "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ"], ["دعای فرج", "اللَّهُمَّ عَجِّلْ لِوَلِيِّكَ الْفَرَجَ"], ["یا رب العالمین", "يَا رَبَّ الْعَالَمِينَ"]],
    sunni: [["سبحان الله و بحمده", "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ"]]
  };
  function zdayOf(z) {
    var wd = new Date(Date.UTC(z.y, z.m - 1, z.d)).getUTCDay();
    return scheme === "shia" ? ZDAY.shia[wd] : ZDAY.sunni[0];
  }
  function lastDays(n) {
    var out = [];
    for (var i = n - 1; i >= 0; i--) {
      var d = new Date(Date.now() - i * 86400000), z = zoneNow(loc.tz, d), key = dayKey(z);
      var lbl = ""; try { lbl = new Intl.DateTimeFormat("fa-IR", { weekday: "short", timeZone: loc.tz }).format(d); } catch (e) {}
      out.push({ key: key, n: (log[key] || []).length, lbl: lbl, today: i === 0 });
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
    try {
      var d = new Date();
      $("dates").textContent = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { timeZone: loc.tz, weekday: "long", day: "numeric", month: "long" }).format(d) + " · " +
        new Intl.DateTimeFormat("fa-IR-u-ca-islamic", { timeZone: loc.tz, day: "numeric", month: "long" }).format(d);
    } catch (e) { $("dates").textContent = ""; }
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
    all("#home [data-s]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.s === scheme); });
    lastKey = (C.cur || C.next) + ":" + !!C.cur;
    tick(true);
  }

  var CIRC = 2 * Math.PI * 90;
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
      $("nowText").textContent = "وقت نماز " + pr(C.cur).n;
      $("subText").textContent = C.cur === "isha" ? "تا اذان صبح" : "تا پایان وقت";
    } else {
      secs = C.wait * 3600; prog = 1 - C.wait / C.span;
      $("nowText").textContent = "نماز بعدی: " + pr(C.next).n;
      $("subText").textContent = "ساعت " + hhmm(t[C.next]);
    }
    $("count").textContent = hms(secs);
    $("clock").textContent = hhmm(z.h);
    $("rprog").style.strokeDashoffset = CIRC * (1 - Math.max(0, Math.min(1, prog)));
    $("startBtn").textContent = "شروع نماز " + pr(C.chosen).n;
    drawArc();
    renderTL();
  }


  /* ================= چقدر وقت داری؟ ================= */
  var PRAY_MIN = { 2: 5, 3: 7, 4: 9 };   // مدت تقریبی نماز به دقیقه
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
    card.className = "glass card tl " + (cls === "ok" ? "" : cls);
    $("tlBadge").textContent = badge; $("tlBig").textContent = big;
    $("tlFill").style.width = (frac * 100).toFixed(1) + "%";
    $("tlA").textContent = a; $("tlB").textContent = b; $("tlMsg").textContent = msg;
  }

  function drawArc() {
    var t = C.t, h = C.z.h, W = 320;
    function pt(u) { var a = 1 - u; return [a * a * 20 + 2 * a * u * 160 + u * u * 300, a * a * 84 + 2 * a * u * -56 + u * u * 84]; }
    var s = '<path d="M20 84 Q160 -56 300 84" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="2" stroke-dasharray="3 5"/>' +
            '<line x1="8" x2="312" y1="84" y2="84" stroke="rgba(255,255,255,.25)"/>';
    var day = h >= t.sunrise && h <= t.sunset, u, p;
    if (day) {
      u = (h - t.sunrise) / (t.sunset - t.sunrise); p = pt(u);
      s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="16" fill="rgba(244,194,91,.25)"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="8" fill="#f4c25b"/>';
    } else {
      var hh = h < t.sunrise ? h + 24 : h; u = (hh - t.sunset) / (t.sunrise + 24 - t.sunset); p = pt(Math.max(0, Math.min(1, u)));
      s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="14" fill="rgba(200,215,255,.22)"/><text x="' + p[0] + '" y="' + (p[1] + 6) + '" style="font-size:18px;fill:#e8eefc">☾</text>';
    }
    s += '<text x="6" y="94" style="text-anchor:start">طلوع ' + hhmm(t.sunrise) + '</text><text x="314" y="94" style="text-anchor:end">غروب ' + hhmm(t.sunset) + "</text>";
    $("arc").innerHTML = s;
  }

  /* ================= قبله ================= */
  var rose = $("rose"), lastAlign = false, roseAngle = 0, qRaf = 0;
  function drawQibla() {
    var b = qiblaBearing(loc.lat, loc.lng);
    $("qDeg").textContent = f(Math.round(b)) + "° " + compassWord(b);
    $("qDist").textContent = f(Math.round(qiblaDist(loc.lat, loc.lng)).toLocaleString("en-US").replace(/,/g, "٬")) + " کیلومتر";
    $("kaaba").style.transform = "rotate(" + b + "deg)";
    var comp = $("compass");
    if (heading == null) {
      roseAngle = 0; rose.style.transform = "rotate(0deg)"; $("cdeg").textContent = ""; $("qState").textContent = "قطب‌نما غیرفعال"; comp.classList.remove("aligned");
      $("compassBtn").hidden = false; return;
    }
    $("compassBtn").hidden = true;
    var tgt = -heading;
    roseAngle += fix(tgt - roseAngle + 180, 360) - 180;   // کوتاه‌ترین مسیر، بدون چرخش کامل
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
  var PRESETS = [["سبحان الله", "سُبْحَانَ اللَّهِ"], ["الحمد لله", "الْحَمْدُ لِلَّهِ"], ["الله اکبر", "اللَّهُ أَكْبَرُ"], ["لا اله الا الله", "لَا إِلَهَ إِلَّا اللَّهُ"],
    ["استغفر الله", "أَسْتَغْفِرُ اللَّهَ"], ["صلوات", "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ"], ["لا حول", "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ"]];
  var TARGETS = [33, 100, 313, 1000, 0];
  var tb = Object.assign({ ar: PRESETS[0][1], fa: PRESETS[0][0], c: 0, t: 33, rounds: 0, day: "", tot: 0 }, load("rk-tb", {}));
  function drawTb(pulse) {
    var z = zoneNow(loc.tz, new Date()), key = dayKey(z);
    if (tb.day !== key) { tb.day = key; tb.tot = 0; }
    var h = ""; PRESETS.forEach(function (p, i) { h += '<button type="button" data-i="' + i + '" aria-pressed="' + (tb.fa === p[0]) + '">' + p[0] + "</button>"; });
    if (!PRESETS.some(function (p) { return p[0] === tb.fa; })) h = '<button type="button" aria-pressed="true">' + tb.fa + "</button>" + h;
    $("tbChips").innerHTML = h;
    var th = ""; TARGETS.forEach(function (n) { th += '<button type="button" data-t="' + n + '" aria-pressed="' + (tb.t === n) + '">' + (n ? f(n) : "∞") + "</button>"; });
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

  /* ================= ناوبری ================= */
  var SCREENS = ["home", "qibla", "tasbih", "settings", "creator", "loc", "pray", "taqib", "end"];
  function show(id) {
    SCREENS.forEach(function (s) { $(s).hidden = s !== id; });
    var tab = $(id).dataset.tab;
    all("#tabs button").forEach(function (b) { b.setAttribute("aria-current", b.dataset.go === tab); });
    var praying = id === "pray" || id === "taqib";
    document.body.classList.toggle("praying", praying);
    document.body.classList.toggle("sub", id === "loc" || id === "end");
    if (praying && sess) document.body.dataset.prayer = sess.k; else document.body.removeAttribute("data-prayer");
    window.scrollTo(0, 0);
    setWake(praying || id === "tasbih");
  }
  function setWake(on) {
    try {
      if (on && "wakeLock" in navigator) navigator.wakeLock.request("screen").then(function (l) { wake = l; }).catch(function () {});
      else if (!on && wake) { wake.release(); wake = null; }
    } catch (e) {}
  }
  function go(tab) {
    show(tab);
    if (tab === "home") renderHome();
    if (tab === "qibla") { drawQibla(); var D = window.DeviceOrientationEvent; if (!(D && typeof D.requestPermission === "function")) startCompass(); }
    if (tab === "tasbih") drawTb();
    if (tab === "settings") { applyCfg(); buildAdj(); renderStats(); }
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
    var tbAll = load("rk-tb-all", 0); $("cs3").textContent = f(tbAll);
  }
  var taps = 0;
  $("clogo").onclick = function () { taps++; if (taps >= 5) { taps = 0; confetti(); buzz([40, 30, 40]); toast("ساخته‌شده با عشق توسط " + CREATOR.name); } };

  /* ================= نماز ================= */
  var steps = [];
  function start(k) { sess = { t: "p", k: k, r: 1, s: 0 }; save("rk-sess", sess); renderPray(); }
  function renderPray() {
    var p = pr(sess.k);
    steps = buildSteps(p, sess.r, scheme);
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
    $("stepName").textContent = st.name; $("arText").textContent = st.ar; $("faText").textContent = st.fa;
    $("badges").innerHTML = (st.tags || []).map(function (t) { return '<span class="' + (t === "بلند" ? "loud" : "") + '">' + t + "</span>"; }).join("");
    var dh = ""; steps.forEach(function (_, j) { dh += '<i class="' + (j === sess.s ? "on" : "") + '"></i>'; });
    $("dots").innerHTML = dh;
    $("tapNote").textContent = cfg.tap === "rakat" ? "هر لمس = یک رکعت" : "هر جای صفحه را لمس کن";
    var zk = $("zikr"); zk.classList.remove("slide"); void zk.offsetWidth; zk.classList.add("slide");
    save("rk-sess", sess);
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
      sess.r--; sess.s = cfg.tap === "rakat" ? 0 : buildSteps(pr(sess.k), sess.r, scheme).length - 1; renderPray();
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
    items = tqItems(sess.k, scheme);
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
    var cv = $("fx"), cx = cv.getContext("2d"), W = cv.width = innerWidth, H = cv.height = innerHeight, ps = [], i;
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

  /* ================= اعلان‌ها ================= */
  var schedTimer = null;
  function reschedule() { clearTimeout(schedTimer); schedTimer = setTimeout(scheduleAll, 700); }

  function buildList() {
    var list = [], now = Date.now(), pre = +cfg.pre || 0;
    for (var d = 0; d < 7; d++) {
      var z = zoneNow(loc.tz, new Date(now + d * 86400000)), t = times(z, loc.lat, loc.lng);
      P.forEach(function (p, i) {
        var at = absTime(z, t[p.k]);
        list.push({ id: d * 20 + i + 1, at: at, title: "وقت نماز " + p.n, body: "حی علی الصلاة · " + hhmm(t[p.k]) + " · " + loc.label });
        if (pre) list.push({ id: d * 20 + i + 11, at: at - pre * 60000, title: f(pre) + " دقیقه تا نماز " + p.n, body: "آمادهٔ نماز شو · " + hhmm(t[p.k]) });
      });
      if (cfg.sun === "on") list.push({ id: d * 20 + 6, at: absTime(z, t.sunrise), title: "طلوع آفتاب", body: "وقت نماز صبح به پایان رسید · " + hhmm(t.sunrise) });
    }
    return list.filter(function (n) { return n.at > now + 3000; });
  }
  function ensurePerm() {
    var ln = LN(); if (!ln) return Promise.resolve(false);
    return ln.checkPermissions().then(function (p) {
      if (p.display === "granted") return true;
      return ln.requestPermissions().then(function (r) { return r.display === "granted"; });
    });
  }
  function scheduleAll() {
    var ln = LN(); if (!ln) return Promise.resolve();
    return ln.getPending().then(function (pd) {
      var ids = (pd.notifications || []).map(function (n) { return { id: n.id }; });
      return ids.length ? ln.cancel({ notifications: ids }) : null;
    }).then(function () {
      if (cfg.notif !== "on") return null;
      return ensurePerm().then(function (ok) {
        if (!ok) { toast("اجازهٔ اعلان داده نشد؛ از تنظیمات گوشی فعالش کن."); return null; }
        return ln.createChannel({ id: "prayer", name: "اوقات نماز", description: "اعلان وقت نمازها", importance: 5, visibility: 1, vibration: true, lights: true })
          .catch(function () {}).then(function () {
            var list = buildList().map(function (n) {
              return { id: n.id, title: n.title, body: n.body, channelId: "prayer", schedule: { at: new Date(n.at), allowWhileIdle: true } };
            });
            return list.length ? ln.schedule({ notifications: list }) : null;
          });
      });
    }).catch(function () { toast("زمان‌بندی اعلان‌ها انجام نشد."); });
  }
  function enableNotif() {
    if (NATIVE) {
      var ln = LN();
      ensurePerm().then(function (ok) {
        if (!ok) { cfg.notif = "off"; saveCfg(); applyCfg(); toast("اجازهٔ اعلان داده نشد."); return; }
        if (ln.checkExactNotificationSetting) {
          ln.checkExactNotificationSetting().then(function (s) {
            if (s.exact_alarm !== "granted" && ln.changeExactNotificationSetting) { toast("اجازهٔ «آلارم دقیق» را روشن کن تا اعلان سر وقت برسد."); ln.changeExactNotificationSetting(); }
          }).catch(function () {});
        }
        scheduleAll().then(function () { toast("اعلان‌ها برای ۷ روز آینده تنظیم شد."); });
      });
    } else {
      try { if (window.Notification && Notification.permission === "default") Notification.requestPermission(); } catch (e) {}
      toast("در مرورگر فقط وقتی صفحه باز است اعلان می‌آید.");
    }
  }
  function testNotif() {
    var ln = LN();
    if (ln) {
      ensurePerm().then(function (ok) {
        if (!ok) { toast("اجازهٔ اعلان داده نشد."); return; }
        ln.createChannel({ id: "prayer", name: "اوقات نماز", description: "اعلان وقت نمازها", importance: 5, visibility: 1, vibration: true }).catch(function () {}).then(function () {
          return ln.schedule({ notifications: [{ id: 99999, title: "نیاز · اعلان آزمایشی", body: "اگر این را می‌بینی، اعلان‌ها درست کار می‌کنند.", channelId: "prayer", schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true } }] });
        }).then(function () { toast("تا ۵ ثانیه دیگر اعلان می‌آید. می‌توانی برنامه را ببندی."); });
      });
    } else {
      toast("تا ۵ ثانیه دیگر…");
      setTimeout(function () {
        beep(); buzz([200, 100, 200]); toast("اعلان آزمایشی ✓");
        try { if (window.Notification && Notification.permission === "granted") new Notification("نیاز · اعلان آزمایشی"); } catch (e) {}
      }, 5000);
    }
  }
  var lastAlert = load("rk-alerted", "");
  function checkAlert() {
    if (cfg.notif !== "on" || NATIVE || !C) return;
    P.forEach(function (p) {
      var d = C.z.h - C.t[p.k], key = dayKey(C.z) + p.k;
      if (d >= 0 && d < 0.05 && lastAlert !== key) {
        lastAlert = key; save("rk-alerted", key);
        toast("وقت نماز " + p.n + " شد"); beep(); buzz([200, 100, 200]);
        try { if (window.Notification && Notification.permission === "granted") new Notification("وقت نماز " + p.n); } catch (e) {}
      }
    });
  }

  /* ================= تنظیمات ================= */
  function applyCfg() {
    document.documentElement.style.setProperty("--arfs", cfg.fs + "px");
    [["skySeg", "sky"], ["tapSeg", "tap"], ["tqSeg", "tq"], ["notifSeg", "notif"], ["preSeg", "pre"], ["sunSeg", "sun"], ["vibSeg", "vib"], ["asrSeg", "asr"]].forEach(function (x) {
      all("#" + x[0] + " button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.v === String(cfg[x[1]])); });
    });
    $("methodSel").value = cfg.method;
    all(".field.img").forEach(function (i) { i.value = (cfg.imgs && cfg.imgs[i.dataset.p]) || ""; });
    $("notifNote").textContent = NATIVE ? "اعلان‌ها با آلارم سیستم برای ۷ روز آینده زمان‌بندی می‌شوند و با بسته بودن برنامه هم می‌آیند." : "در مرورگر فقط وقتی صفحه باز است اعلان می‌آید؛ برای اعلان پس‌زمینه برنامه را نصب کن.";
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

  /* ================= رویدادها ================= */
  $("startBtn").onclick = function () { start(C.chosen); };
  $("list").onclick = function (e) { var b = e.target.closest("button[data-k]"); if (b) start(b.dataset.k); };
  all("#home [data-s]").forEach(function (b) { b.onclick = function () { scheme = b.dataset.s; save("rk-scheme", scheme); renderHome(); reschedule(); }; });
  all("#tabs button").forEach(function (b) { b.onclick = function () { go(b.dataset.go); }; });
  $("homeBtn").onclick = function () { go("home"); };
  $("exitBtn").onclick = function () { sess = null; save("rk-sess", null); go("home"); };
  $("skipBtn").onclick = function () { endAll("نمازت ثبت شد."); };
  $("prevBtn").onclick = function (e) { e.stopPropagation(); prayPrev(); };
  $("tqPrev").onclick = function (e) { e.stopPropagation(); tqPrev(); };
  $("compassBtn").onclick = startCompass;
  $("zdGo").onclick = function () { var zd = zdayOf(C.z); tb = Object.assign(tb, { ar: zd[1], fa: zd[0], c: 0, t: 100, rounds: 0 }); go("tasbih"); };

  // لمس هر جای صفحه
  document.addEventListener("click", function (e) {
    if (e.target.closest("button,input,a,select,label,textarea")) return;
    if (!$("pray").hidden) prayNext();
    else if (!$("taqib").hidden) tqNext();
    else if (!$("tasbih").hidden) tbTap();
  });

  // تسبیح
  $("tbChips").onclick = function (e) { var b = e.target.closest("button[data-i]"); if (!b) return; var p = PRESETS[+b.dataset.i]; tb.fa = p[0]; tb.ar = p[1]; tb.c = 0; tb.rounds = 0; drawTb(); };
  $("tbTargets").onclick = function (e) { var b = e.target.closest("button[data-t]"); if (!b) return; tb.t = +b.dataset.t; tb.c = 0; tb.rounds = 0; drawTb(); };
  $("tbReset").onclick = function () { tb.c = 0; tb.rounds = 0; drawTb(); };
  $("tbUndo").onclick = function () { if (tb.c > 0) { tb.c--; tb.tot = Math.max(0, tb.tot - 1); drawTb(); } };

  // موقعیت
  $("locChip").onclick = function () { renderCities(""); $("citySearch").value = ""; $("gpsMsg").textContent = ""; show("loc"); };
  $("citySearch").oninput = function () { renderCities(this.value); };
  $("cityList").onclick = function (e) { var b = e.target.closest("button[data-i]"); if (!b) return; var c = CITIES[+b.dataset.i]; setLoc({ label: c[0], lat: c[1], lng: c[2], tz: c[3] }); };
  $("gpsBtn").onclick = function () {
    if (!navigator.geolocation) { $("gpsMsg").textContent = "این دستگاه موقعیت‌یابی ندارد."; return; }
    $("gpsMsg").textContent = "در حال یافتن موقعیت…";
    navigator.geolocation.getCurrentPosition(function (pos) {
      var tz = "UTC"; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch (e) {}
      setLoc({ label: "موقعیت من", lat: pos.coords.latitude, lng: pos.coords.longitude, tz: tz });
    }, function () { $("gpsMsg").textContent = "اجازهٔ موقعیت داده نشد؛ شهر را از فهرست انتخاب کن."; }, { timeout: 12000, enableHighAccuracy: true });
  };
  all(".back").forEach(function (b) { b.onclick = function () { go("home"); }; });

  // تنظیمات
  seg("skySeg", "sky", function () { if (C) setPhase(); });
  seg("tapSeg", "tap"); seg("tqSeg", "tq"); seg("vibSeg", "vib");
  seg("notifSeg", "notif", function () { if (cfg.notif === "on") enableNotif(); else { scheduleAll(); } });
  seg("preSeg", "pre", reschedule); seg("sunSeg", "sun", reschedule);
  seg("asrSeg", "asr", function () { renderHome(); reschedule(); });
  $("methodSel").onchange = function () { cfg.method = this.value; saveCfg(); renderHome(); reschedule(); };
  $("testNotif").onclick = testNotif;
  $("fsPlus").onclick = function () { cfg.fs = Math.min(40, cfg.fs + 2); saveCfg(); applyCfg(); };
  $("fsMinus").onclick = function () { cfg.fs = Math.max(18, cfg.fs - 2); saveCfg(); applyCfg(); };
  all(".field.img").forEach(function (i) { i.oninput = function () { cfg.imgs = cfg.imgs || {}; cfg.imgs[i.dataset.p] = i.value.trim(); saveCfg(); }; });
  $("resetStats").onclick = function () { log = {}; save("rk-log", log); renderStats(); toast("آمار پاک شد."); };

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) return;
    if (!$("home").hidden) renderHome();
    if (!$("pray").hidden || !$("taqib").hidden || !$("tasbih").hidden) setWake(true);
    if (NATIVE && cfg.notif === "on") reschedule();
  });
  setInterval(function () { if (!$("home").hidden) tick(); else C = compute(); checkAlert(); }, 1000);

  /* ================= شروع ================= */
  applyCfg();
  setTimeout(function () { $("splash").classList.add("hide"); }, 1900);
  $("splash").onclick = function () { $("splash").classList.add("hide"); };
  C = compute();
  if (sess && sess.t === "q" && sess.k && pr(sess.k)) renderTq();
  else if (sess && sess.k && pr(sess.k)) renderPray();
  else go("home");
  if (NATIVE && cfg.notif === "on") reschedule();
})();
