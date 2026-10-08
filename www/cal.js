/*  نیاز · همراه هوشمند نماز
    تقویم شمسی / میلادی / قمری + مناسبت‌ها + فاز ماه
    © Mojtaba Meidani — مجتبی میدانی  */
window.NZ = window.NZ || {};

NZ.cal = (function () {
  "use strict";

  var FA = "۰۱۲۳۴۵۶۷۸۹";
  function toFa(x) { return String(x).replace(/\d/g, function (d) { return FA[+d]; }); }
  function div(a, b) { return ~~(a / b); }
  function mod(a, b) { return a - ~~(a / b) * b; }

  /* ---------------- تبدیل‌های پایه (روز ژولیوسی) ---------------- */
  function jdnFromGreg(y, m, d) {
    var a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }
  function gregFromJdn(jdn) {
    var a = jdn + 32044, b = Math.floor((4 * a + 3) / 146097), c = a - Math.floor(146097 * b / 4),
      d = Math.floor((4 * c + 3) / 1461), e = c - Math.floor(1461 * d / 4), m = Math.floor((5 * e + 2) / 153);
    return { y: 100 * b + d - 4800 + Math.floor(m / 10), m: m + 3 - 12 * Math.floor(m / 10), d: e - Math.floor((153 * m + 2) / 5) + 1 };
  }
  function jdnToDate(jdn) { return new Date(Date.UTC(1970, 0, 1) + (jdn - 2440588) * 86400000); }
  function jdnFromDate(date, tz) {
    if (!tz) return jdnFromGreg(date.getFullYear(), date.getMonth() + 1, date.getDate());
    try {
      var o = {};
      new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric", hourCycle: "h23" })
        .formatToParts(date).forEach(function (p) { o[p.type] = p.value; });
      return jdnFromGreg(+o.year, +o.month, +o.day);
    } catch (e) { return jdnFromGreg(date.getFullYear(), date.getMonth() + 1, date.getDate()); }
  }

  /* ---------------- تقویم هجری شمسی ---------------- */
  var BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  function jalCal(jy) {
    var bl = BREAKS.length, gy = jy + 621, leapJ = -14, jp = BREAKS[0], jm, jump = 0, leap, n, i;
    for (i = 1; i < bl; i += 1) {
      jm = BREAKS[i]; jump = jm - jp;
      if (jy < jm) break;
      leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
      jp = jm;
    }
    n = jy - jp;
    leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
    if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
    var leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
    var march = 20 + leapJ - leapG;
    if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
    leap = mod(mod(n + 1, 33) - 1, 4);
    if (leap === -1) leap = 4;
    return { leap: leap, gy: gy, march: march };
  }
  function isLeapJalali(jy) { return jalCal(jy).leap === 0; }
  function jalDays(jy, jm) { return jm <= 6 ? 31 : (jm <= 11 ? 30 : (isLeapJalali(jy) ? 30 : 29)); }
  function jdnFromJalali(jy, jm, jd) {
    var r = jalCal(jy);
    return jdnFromGreg(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
  }
  function jalaliFromJdn(jdn) {
    var gy = gregFromJdn(jdn).y, jy = gy - 621, r = jalCal(jy), jdn1f = jdnFromGreg(gy, 3, r.march), k = jdn - jdn1f, jm, jd;
    if (k >= 0) {
      if (k <= 185) return { y: jy, m: 1 + div(k, 31), d: mod(k, 31) + 1 };
      k -= 186;
    } else { jy -= 1; k += 179; if (r.leap === 1) k += 1; }
    jm = 7 + div(k, 30); jd = mod(k, 30) + 1;
    return { y: jy, m: jm, d: jd };
  }
  function addJalaliMonths(jy, jm, n) {
    var m = (jy * 12 + (jm - 1)) + n;
    return { y: div(m, 12), m: mod(m, 12) + 1 };
  }

  /* ---------------- تقویم هجری قمری ---------------- */
  function tabHijri(jdn) {
    var l = jdn - 1948440 + 10632, n = Math.floor((l - 1) / 10631);
    l = l - 10631 * n + 354;
    var j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
    l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    var m = Math.floor((24 * l) / 709), d = l - Math.floor((709 * m) / 24);
    return { y: 30 * n + j - 30, m: m, d: d };
  }
  function jdnFromTabHijri(y, m, d) {
    return div(11 * y + 3, 30) + 354 * y + 30 * m - div(m - 1, 2) + d + 1948440 - 385;
  }
  var umalqura = (function () {
    try {
      var f = new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura-nu-latn", { day: "numeric", month: "numeric", year: "numeric", timeZone: "UTC" });
      var p = f.formatToParts(new Date(Date.UTC(2024, 2, 11))), o = {};
      p.forEach(function (x) { if (x.type !== "literal") o[x.type] = x.value; });
      if (o.year && o.month && o.day && +o.month === 9) return f;   // ۱ رمضان ۱۴۴۵
    } catch (e) { }
    return null;
  })();
  var HCACHE = {};
  function hijriFromJdn(jdn) {
    if (HCACHE[jdn]) return HCACHE[jdn];
    var res = null;
    if (umalqura) {
      try {
        var p = umalqura.formatToParts(jdnToDate(jdn)), o = {};
        p.forEach(function (x) { if (x.type !== "literal") o[x.type] = parseInt(x.value, 10); });
        if (o.year && o.month && o.day) res = { y: o.year, m: o.month, d: o.day, exact: true };
      } catch (e) { }
    }
    if (!res) { res = tabHijri(jdn); res.exact = false; }
    if (Object.keys(HCACHE).length > 4000) HCACHE = {};
    HCACHE[jdn] = res;
    return res;
  }
  function jdnFromHijri(y, m, d) {
    var guess = jdnFromTabHijri(y, m, d);
    if (!umalqura) return guess;
    for (var k = -4; k <= 4; k++) {
      var h = hijriFromJdn(guess + k);
      if (h.y === y && h.m === m && h.d === d) return guess + k;
    }
    return guess;
  }
  function hijriMonthDays(y, m) {
    var a = jdnFromHijri(y, m, 1), b = m === 12 ? jdnFromHijri(y + 1, 1, 1) : jdnFromHijri(y, m + 1, 1);
    return b - a;
  }

  /* ---------------- نام‌ها ---------------- */
  var J_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
  var H_MONTHS = ["محرم", "صفر", "ربیع‌الاول", "ربیع‌الثانی", "جمادی‌الاول", "جمادی‌الثانی", "رجب", "شعبان", "رمضان", "شوال", "ذی‌القعده", "ذی‌الحجه"];
  var G_MONTHS = ["ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن", "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر"];
  var WEEK = ["شنبه", "یک‌شنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];
  var WEEK_S = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
  function weekdayIdx(jdn) { return mod(jdn % 7 + 2, 7); }          // ۰ = شنبه
  function weekdayName(jdn) { return WEEK[weekdayIdx(jdn)]; }
  function isFriday(jdn) { return weekdayIdx(jdn) === 6; }

  /* ---------------- فاز ماه ---------------- */
  var SYN = 29.530588853, EPOCH = 2451550.1, PHASES = [
    "محاق", "هلال آغازین", "تربیع اول", "ماه کوژ نخست", "بدر", "ماه کوژ دوم", "تربیع آخر", "هلال پایانی"
  ];
  function moonPhase(jdn) {
    var age = mod(jdn - EPOCH, SYN); if (age < 0) age += SYN;
    var frac = age / SYN, illum = (1 - Math.cos(2 * Math.PI * frac)) / 2;
    var idx = Math.floor((frac * 8) + 0.5) % 8;
    return { age: age, illum: illum, pct: Math.round(illum * 100), idx: idx, name: PHASES[idx] };
  }

  /* ============================================================
     مناسبت‌ها
     [نوع, ماه, روز, عنوان, دسته, تعطیل, توضیح]
     نوع: j = شمسی · h = قمری · g = میلادی
     ============================================================ */
  var OCC = [
    /* ------- شمسی ------- */
    ["j", 1, 1, "جشن نوروز · آغاز سال نو", "ملی", 1, "نوروز، جشن آغاز بهار و سال نو ایرانی است. لحظهٔ تحویل سال را با دعای تحویل سال آغاز کن."],
    ["j", 1, 2, "عید نوروز", "ملی", 1],
    ["j", 1, 3, "عید نوروز", "ملی", 1],
    ["j", 1, 4, "عید نوروز", "ملی", 1],
    ["j", 1, 6, "جشن نوروز", "ملی", 0],
    ["j", 1, 12, "روز جمهوری اسلامی ایران", "ملی", 1],
    ["j", 1, 13, "جشن سیزده‌به‌در · روز طبیعت", "ملی", 1, "سیزده‌به‌در؛ پایان جشن‌های نوروز و روز آشتی با طبیعت."],
    ["j", 1, 19, "شهادت آیت‌الله سید محمدباقر صدر و سیده بنت‌الهدی", "مذهبی", 0],
    ["j", 1, 21, "شهادت امیر سپهبد علی صیاد شیرازی", "ملی", 0],
    ["j", 1, 29, "روز ارتش جمهوری اسلامی ایران", "ملی", 0],
    ["j", 2, 1, "روز بزرگداشت سعدی · آغاز هفتهٔ معلم", "فرهنگی", 0],
    ["j", 2, 2, "روز زمین پاک", "جهانی", 0],
    ["j", 2, 10, "روز ملی خلیج فارس", "ملی", 0],
    ["j", 2, 12, "شهادت استاد مرتضی مطهری · روز معلم", "ملی", 0],
    ["j", 2, 14, "روز بزرگداشت ابوالفضل بیهقی", "فرهنگی", 0],
    ["j", 2, 25, "روز بزرگداشت حکیم ابوالقاسم فردوسی · پاسداشت زبان فارسی", "فرهنگی", 0],
    ["j", 2, 28, "روز بزرگداشت حکیم عمر خیام", "فرهنگی", 0],
    ["j", 3, 1, "روز بزرگداشت ملاصدرا", "فرهنگی", 0],
    ["j", 3, 3, "فتح خرمشهر · روز مقاومت و پایداری", "ملی", 0],
    ["j", 3, 14, "رحلت حضرت امام خمینی (ره)", "ملی", 1],
    ["j", 3, 15, "قیام خونین ۱۵ خرداد", "ملی", 1],
    ["j", 4, 7, "شهادت آیت‌الله سید محمد بهشتی و ۷۲ تن از یاران امام · روز ملی مبارزه با تروریسم", "ملی", 0],
    ["j", 4, 10, "روز بزرگداشت صائب تبریزی", "فرهنگی", 0],
    ["j", 4, 14, "روز قلم", "فرهنگی", 0],
    ["j", 4, 25, "روز بهزیستی و تأمین اجتماعی", "ملی", 0],
    ["j", 5, 8, "روز بزرگداشت شیخ شهاب‌الدین سهروردی", "فرهنگی", 0],
    ["j", 5, 14, "صدور فرمان مشروطیت", "ملی", 0],
    ["j", 5, 26, "بازگشت آزادگان به میهن اسلامی · روز آزادگان", "ملی", 0],
    ["j", 6, 1, "روز بزرگداشت ابوعلی سینا · روز پزشک", "فرهنگی", 0],
    ["j", 6, 5, "روز بزرگداشت محمد بن زکریای رازی · روز داروساز", "فرهنگی", 0],
    ["j", 6, 12, "شهادت رئیس‌علی دلواری · روز مبارزه با استعمار انگلیس", "ملی", 0],
    ["j", 6, 21, "روز ملی سینما", "فرهنگی", 0],
    ["j", 6, 27, "روز شعر و ادب فارسی · بزرگداشت استاد شهریار", "فرهنگی", 0],
    ["j", 6, 31, "آغاز هفتهٔ دفاع مقدس", "ملی", 0],
    ["j", 7, 7, "روز ایمنی و آتش‌نشانی", "ملی", 0],
    ["j", 7, 8, "روز بزرگداشت مولوی", "فرهنگی", 0],
    ["j", 7, 13, "روز نیروی انتظامی", "ملی", 0],
    ["j", 7, 20, "روز بزرگداشت حافظ", "فرهنگی", 0],
    ["j", 7, 24, "روز جهانی عصای سفید", "جهانی", 0],
    ["j", 7, 26, "روز تربیت بدنی و ورزش", "ملی", 0],
    ["j", 8, 8, "روز نوجوان و بسیج دانش‌آموزی", "ملی", 0],
    ["j", 8, 13, "روز ملی مبارزه با استکبار جهانی · تسخیر لانهٔ جاسوسی", "ملی", 0],
    ["j", 8, 14, "روز فرهنگ عمومی", "فرهنگی", 0],
    ["j", 8, 24, "روز کتاب، کتابخوانی و کتابدار · بزرگداشت علامه طباطبایی", "فرهنگی", 0],
    ["j", 9, 5, "روز بسیج مستضعفان", "ملی", 0],
    ["j", 9, 7, "روز نیروی دریایی", "ملی", 0],
    ["j", 9, 9, "روز بزرگداشت شیخ مفید", "فرهنگی", 0],
    ["j", 9, 16, "روز دانشجو", "ملی", 0],
    ["j", 9, 30, "شب یلدا · جشن شب چله", "ملی", 0, "بلندترین شب سال؛ فرصتی برای دورهمی، شاهنامه‌خوانی و حافظ‌خوانی."],
    ["j", 10, 9, "روز بصیرت و میثاق امت با ولایت", "ملی", 0],
    ["j", 10, 19, "قیام خونین مردم قم", "ملی", 0],
    ["j", 11, 12, "ورود حضرت امام خمینی (ره) به میهن · آغاز دههٔ فجر", "ملی", 0],
    ["j", 11, 14, "روز فناوری فضایی", "ملی", 0],
    ["j", 11, 19, "روز نیروی هوایی", "ملی", 0],
    ["j", 11, 22, "پیروزی انقلاب اسلامی ایران", "ملی", 1],
    ["j", 11, 29, "قیام مردم تبریز", "ملی", 0],
    ["j", 12, 5, "روز بزرگداشت خواجه نصیرالدین طوسی · روز مهندس", "فرهنگی", 0],
    ["j", 12, 21, "روز بزرگداشت نظامی گنجوی", "فرهنگی", 0],
    ["j", 12, 25, "روز بزرگداشت پروین اعتصامی", "فرهنگی", 0],
    ["j", 12, 29, "روز ملی شدن صنعت نفت ایران", "ملی", 1],

    /* ------- قمری ------- */
    ["h", 1, 1, "آغاز سال هجری قمری · ماه محرم", "مذهبی", 0],
    ["h", 1, 2, "ورود امام حسین (ع) و یارانش به کربلا", "مذهبی", 0],
    ["h", 1, 7, "بستن آب بر روی امام حسین (ع) و یارانش", "مذهبی", 0],
    ["h", 1, 9, "تاسوعای حسینی", "مذهبی", 1, "تاسوعا؛ روز بزرگداشت ابوالفضل العباس (ع) و شب عاشورا."],
    ["h", 1, 10, "عاشورای حسینی · شهادت امام حسین (ع) و ۷۲ یار باوفایش", "مذهبی", 1, "عاشورا؛ روز سوگواری سیدالشهدا. زیارت عاشورا و عزاداری از اعمال این روز است."],
    ["h", 1, 11, "شام غریبان حسینی", "مذهبی", 0],
    ["h", 1, 12, "ورود اسیران کربلا به کوفه", "مذهبی", 0],
    ["h", 1, 25, "شهادت امام زین‌العابدین (ع)", "مذهبی", 0, "به روایتی"],
    ["h", 2, 5, "شهادت حضرت رقیه (س)", "مذهبی", 0, "به روایتی"],
    ["h", 2, 20, "اربعین حسینی", "مذهبی", 1, "چهلمین روز شهادت امام حسین (ع)؛ روز پیاده‌روی بزرگ اربعین."],
    ["h", 2, 28, "رحلت حضرت محمد (ص) و شهادت امام حسن مجتبی (ع)", "مذهبی", 1],
    ["h", 2, 30, "شهادت امام رضا (ع)", "مذهبی", 1],
    ["h", 3, 8, "شهادت امام حسن عسکری (ع) · آغاز امامت حضرت مهدی (عج)", "مذهبی", 1],
    ["h", 3, 12, "آغاز هفتهٔ وحدت · ولادت پیامبر به روایت اهل سنت", "مذهبی", 0],
    ["h", 3, 17, "ولادت حضرت محمد (ص) و ولادت امام جعفر صادق (ع)", "مذهبی", 1, "میلاد پیامبر اکرم (ص) به روایت شیعه؛ هفتهٔ وحدت تا این روز ادامه دارد."],
    ["h", 4, 8, "ولادت امام حسن عسکری (ع)", "مذهبی", 0],
    ["h", 5, 13, "شهادت حضرت فاطمه زهرا (س)", "مذهبی", 0, "به روایت ۹۵ روز پس از رحلت پیامبر"],
    ["h", 6, 3, "شهادت حضرت فاطمه زهرا (س)", "مذهبی", 1, "به روایت ۷۵ روز — ایام فاطمیه"],
    ["h", 6, 20, "ولادت حضرت فاطمه زهرا (س) · روز مادر و روز زن", "مذهبی", 0],
    ["h", 7, 1, "ولادت امام محمد باقر (ع) · آغاز ماه رجب", "مذهبی", 0],
    ["h", 7, 3, "شهادت امام علی النقی (هادی) (ع)", "مذهبی", 0],
    ["h", 7, 13, "ولادت امام علی (ع) · روز پدر · آغاز ایام البیض", "مذهبی", 1],
    ["h", 7, 15, "وفات حضرت زینب (س)", "مذهبی", 0, "به روایتی"],
    ["h", 7, 25, "شهادت امام موسی کاظم (ع)", "مذهبی", 1],
    ["h", 7, 27, "مبعث رسول اکرم (ص)", "مذهبی", 1, "روز بعثت پیامبر اسلام (ص)؛ عید مبعث."],
    ["h", 8, 3, "ولادت امام حسین (ع) · روز پاسدار", "مذهبی", 0],
    ["h", 8, 4, "ولادت ابوالفضل العباس (ع) · روز جانباز", "مذهبی", 0],
    ["h", 8, 5, "ولادت امام سجاد (ع)", "مذهبی", 0],
    ["h", 8, 11, "ولادت حضرت علی اکبر (ع) · روز جوان", "مذهبی", 0],
    ["h", 8, 15, "ولادت حضرت مهدی (عج) · نیمهٔ شعبان", "مذهبی", 1, "نیمهٔ شعبان؛ جشن میلاد امام زمان (عج) و شب احیای اعمال."],
    ["h", 9, 1, "آغاز ماه مبارک رمضان", "مذهبی", 0, "ماه روزه، قرآن و شب‌های قدر."],
    ["h", 9, 10, "وفات حضرت خدیجه (س)", "مذهبی", 0, "به روایتی"],
    ["h", 9, 15, "ولادت امام حسن مجتبی (ع)", "مذهبی", 0],
    ["h", 9, 19, "شب قدر · ضربت خوردن امام علی (ع)", "مذهبی", 0, "شب نوزدهم رمضان؛ شب قدر اول و شب ضربت خوردن امیرالمؤمنین (ع)."],
    ["h", 9, 21, "شهادت امام علی (ع) · شب قدر", "مذهبی", 1, "شب بیست‌ویکم رمضان؛ شهادت امیرالمؤمنین علی (ع)."],
    ["h", 9, 23, "شب قدر (لیلةالقدر)", "مذهبی", 0, "شب بیست‌وسوم رمضان؛ مهم‌ترین شب سال، شب احیا و دعا."],
    ["h", 9, 27, "شب قدر به روایتی · روز جهانی قدس", "مذهبی", 0, "روز جهانی قدس، آخرین جمعهٔ ماه رمضان است."],
    ["h", 10, 1, "عید سعید فطر", "مذهبی", 1, "نماز عید فطر و پرداخت زکات فطره."],
    ["h", 10, 2, "تعطیلات عید فطر", "مذهبی", 1],
    ["h", 10, 25, "شهادت امام جعفر صادق (ع)", "مذهبی", 1],
    ["h", 11, 1, "ولادت حضرت معصومه (س) · روز دختر", "مذهبی", 0],
    ["h", 11, 11, "ولادت امام رضا (ع)", "مذهبی", 1],
    ["h", 11, 25, "روز دحوالارض", "مذهبی", 0],
    ["h", 11, 29, "شهادت امام محمد تقی (ع)", "مذهبی", 0, "به روایتی"],
    ["h", 12, 1, "سالروز ازدواج حضرت علی (ع) و حضرت فاطمه (س)", "مذهبی", 0, "روز ازدواج؛ پیوند آسمانی امیرالمؤمنین و حضرت زهرا (س)."],
    ["h", 12, 8, "یوم‌الترویه · روز حرکت به سوی منا", "مذهبی", 0],
    ["h", 12, 9, "روز عرفه · شهادت مسلم بن عقیل", "مذهبی", 0, "روز عرفه؛ دعای عرفه و شب عید قربان."],
    ["h", 12, 10, "عید سعید قربان (اضحی)", "مذهبی", 1],
    ["h", 12, 18, "عید سعید غدیر خم", "مذهبی", 1, "روز نصب امیرالمؤمنین علی (ع) به مقام ولایت؛ عید بزرگ مسلمانان."],
    ["h", 12, 24, "روز مباهله", "مذهبی", 0],
    ["h", 12, 25, "روز خانواده", "مذهبی", 0],

    /* ------- میلادی ------- */
    ["g", 1, 1, "آغاز سال میلادی", "جهانی", 0],
    ["g", 3, 8, "روز جهانی زن", "جهانی", 0],
    ["g", 3, 21, "روز جهانی نوروز", "جهانی", 0],
    ["g", 4, 7, "روز جهانی بهداشت", "جهانی", 0],
    ["g", 5, 1, "روز جهانی کارگر", "جهانی", 0],
    ["g", 10, 1, "روز جهانی کودک", "جهانی", 0],
    ["g", 12, 10, "روز جهانی حقوق بشر", "جهانی", 0]
  ];

  /* ---------------- ایندکس‌ها ---------------- */
  var IDX = { j: {}, h: {}, g: {} };
  var CATS = { "ملی": 1, "مذهبی": 1, "جهانی": 1, "فرهنگی": 1 };
  OCC.forEach(function (o) {
    var key = o[1] + "-" + o[2];
    (IDX[o[0]][key] = IDX[o[0]][key] || []).push(o);
  });

  function occOfJdn(jdn) {
    var j = jalaliFromJdn(jdn), h = hijriFromJdn(jdn), g = gregFromJdn(jdn);
    var out = [].concat(
      IDX.j[j.m + "-" + j.d] || [],
      IDX.h[h.m + "-" + h.d] || [],
      IDX.g[g.m + "-" + g.d] || []
    );
    return out.map(function (o) {
      return { title: o[3], cat: o[4], off: !!o[5], note: o[6] || "", kind: o[0], j: j, h: h, g: g,
        cal: o[0] === "j" ? "شمسی" : (o[0] === "h" ? "قمری" : "میلادی") };
    });
  }
  function dayInfo(jdn) {
    var j = jalaliFromJdn(jdn), h = hijriFromJdn(jdn), g = gregFromJdn(jdn), occ = occOfJdn(jdn);
    return {
      jdn: jdn, j: j, h: h, g: g, occ: occ,
      weekday: weekdayName(jdn), wd: weekdayIdx(jdn), friday: isFriday(jdn),
      off: occ.some(function (o) { return o.off; }),
      moon: moonPhase(jdn)
    };
  }
  function upcoming(jdn, days, cats) {
    var out = [];
    cats = cats || {};
    var hasCat = Object.keys(cats).some(function (k) { return cats[k]; });
    for (var i = 0; i <= days; i++) {
      var info = dayInfo(jdn + i);
      if (!info.occ.length) continue;
      var list = info.occ.filter(function (o) { return !hasCat || cats[o.cat]; });
      if (!list.length) continue;
      out.push({ jdn: jdn + i, inDays: i, j: info.j, h: info.h, g: info.g, wd: info.weekday, off: info.off, occ: list });
    }
    return out;
  }
  function monthGridJalali(jy, jm) {
    var first = jdnFromJalali(jy, jm, 1), days = jalDays(jy, jm);
    var lead = weekdayIdx(first);
    var cells = [], i;
    for (i = lead; i > 0; i--) cells.push(first - i);
    for (i = 0; i < days; i++) cells.push(first + i);
    while (cells.length % 7 !== 0 || cells.length < 35) cells.push(cells[cells.length - 1] + 1);
    return cells;
  }
  function monthGridHijri(hy, hm) {
    var first = jdnFromHijri(hy, hm, 1), days = hijriMonthDays(hy, hm);
    var lead = weekdayIdx(first), cells = [], i;
    for (i = lead; i > 0; i--) cells.push(first - i);
    for (i = 0; i < days; i++) cells.push(first + i);
    while (cells.length % 7 !== 0 || cells.length < 35) cells.push(cells[cells.length - 1] + 1);
    return cells;
  }
  function monthGridGreg(gy, gm) {
    var first = jdnFromGreg(gy, gm, 1), days = gregFromJdn(jdnFromGreg(gm === 12 ? gy + 1 : gy, gm === 12 ? 1 : gm + 1, 1) - 1).d;
    var lead = weekdayIdx(first), cells = [], i;
    for (i = lead; i > 0; i--) cells.push(first - i);
    for (i = 0; i < days; i++) cells.push(first + i);
    while (cells.length % 7 !== 0 || cells.length < 35) cells.push(cells[cells.length - 1] + 1);
    return cells;
  }

  /* ---------------- قالب‌بندی ---------------- */
  function fmtJalali(jdn, withWeekday) {
    var j = jalaliFromJdn(jdn);
    return (withWeekday ? weekdayName(jdn) + " " : "") + toFa(j.d) + " " + J_MONTHS[j.m - 1] + " " + toFa(j.y);
  }
  function fmtHijri(jdn, withWeekday) {
    var h = hijriFromJdn(jdn);
    return (withWeekday ? weekdayName(jdn) + " " : "") + toFa(h.d) + " " + H_MONTHS[h.m - 1] + " " + toFa(h.y) + " ق";
  }
  function fmtGreg(jdn, withWeekday) {
    var g = gregFromJdn(jdn);
    return (withWeekday ? weekdayName(jdn) + " " : "") + toFa(g.d) + " " + G_MONTHS[g.m - 1] + " " + toFa(g.y);
  }
  function shortJalali(jdn) { var j = jalaliFromJdn(jdn); return toFa(j.d) + " " + J_MONTHS[j.m - 1]; }
  function shortHijri(jdn) { var h = hijriFromJdn(jdn); return toFa(h.d) + " " + H_MONTHS[h.m - 1]; }
  function shortGreg(jdn) { var g = gregFromJdn(jdn); return toFa(g.d) + " " + G_MONTHS[g.m - 1]; }
  function isoJdn(jdn) { var g = gregFromJdn(jdn); return g.y + "-" + (g.m < 10 ? "0" : "") + g.m + "-" + (g.d < 10 ? "0" : "") + g.d; }

  return {
    toFa: toFa, jdnFromGreg: jdnFromGreg, gregFromJdn: gregFromJdn, jdnToDate: jdnToDate, jdnFromDate: jdnFromDate,
    jalaliFromJdn: jalaliFromJdn, jdnFromJalali: jdnFromJalali, jalDays: jalDays, isLeapJalali: isLeapJalali, addJalaliMonths: addJalaliMonths,
    hijriFromJdn: hijriFromJdn, jdnFromHijri: jdnFromHijri, hijriMonthDays: hijriMonthDays, hijriExact: !!umalqura,
    J_MONTHS: J_MONTHS, H_MONTHS: H_MONTHS, G_MONTHS: G_MONTHS, WEEK: WEEK, WEEK_S: WEEK_S, CATS: CATS,
    weekdayIdx: weekdayIdx, weekdayName: weekdayName, isFriday: isFriday, moonPhase: moonPhase,
    OCC: OCC, occOfJdn: occOfJdn, dayInfo: dayInfo, upcoming: upcoming,
    monthGridJalali: monthGridJalali, monthGridHijri: monthGridHijri, monthGridGreg: monthGridGreg,
    fmtJalali: fmtJalali, fmtHijri: fmtHijri, fmtGreg: fmtGreg,
    shortJalali: shortJalali, shortHijri: shortHijri, shortGreg: shortGreg, isoJdn: isoJdn
  };
})();
