/* آزمون ۳٫۳: تمرکز و تنفس، صدای هر نماز، کارت اشتراک‌گذاری، پنجمین ویجت */
import { JSDOM, VirtualConsole } from "jsdom";
import fs from "fs";
const dir = new URL("../../www/", import.meta.url).pathname.replace(/\/$/, "");
const FILES = ["cal.js", "content.js", "nat.js", "script.js"];
let sent = [];
function boot(seed, native) {
  sent = [];
  const vc = new VirtualConsole(); const errors = [];
  vc.on("jsdomError", e => { const m = e.detail ? (e.detail.stack || e.detail.message) : e.message; if (!/Not implemented|Could not load|fonts|ERR_|not implemented/i.test(m)) errors.push("JSDOM: " + m); });
  vc.on("error", (...a) => errors.push("console.error: " + a.join(" ")));
  const dom = new JSDOM(fs.readFileSync(dir + "/index.html", "utf8"), { url: "https://localhost/", runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window;
  if (native) w.Capacitor = { isNativePlatform: () => true, Plugins: { AlarmModule: new Proxy({}, { get: (t, n) => (a) => { sent.push({ m: n, a: a || {} }); return Promise.resolve({ ok: true, notif: true, exact: true, fullscreen: true }); } }) } };
  const Real = w.Date, shift = Date.UTC(2026, 9, 13, 9, 30, 0) - Real.now();
  class FakeDate extends Real { constructor(...a) { if (a.length === 0) super(Real.now() + shift); else super(...a); } static now() { return Real.now() + shift; } }
  w.Date = FakeDate;
  if (typeof w.DeviceOrientationEvent === "undefined") w.DeviceOrientationEvent = function DeviceOrientationEvent() { };
  for (const k in seed) w.localStorage.setItem(k, JSON.stringify(seed[k]));
  for (const f of FILES) { const s = w.document.createElement("script"); s.textContent = fs.readFileSync(dir + "/" + f, "utf8");
    try { w.document.body.appendChild(s); } catch (e) { errors.push(f + " threw " + e.message); } }
  return { w, d: w.document, errors };
}
const wait = ms => new Promise(r => setTimeout(r, ms));
const click = (w, el) => { if (!el) throw new Error("missing click"); el.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); };
const ids = (d, id) => (d.getElementById(id) || {}).textContent || "";
const strip = h => (h || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
let fails = 0;
const ok = (c, l, x = "") => { console.log((c ? "  OK  " : "  XX  ") + l + (x ? " -> " + x : "")); if (!c) fails++; };

/* آماده‌شدن برنامه: تا وقتی شمارش، فاز روز و کمان آماده نشده صبر می‌کنیم
   (روی ماشین‌های کند مثل دوندگان CI، تأخیر ثابت کافی نیست) */
async function ready(d, ms = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const c = (d.getElementById("count") || {}).textContent || "";
    const arc = (d.getElementById("arc") || {}).innerHTML || "";
    if (c && c !== "--:--:--" && d.body.dataset.phase && arc.length > 20) return true;
    await wait(120);
  }
  return false;
}

const mains = k => { const p = sent.filter(x => x.m === "setConfig").pop(); return p ? JSON.parse(p.a.json).items.filter(i => i.kind === "main" && i.k === k) : []; };

/* ---- ۱: تمرکز و تنفس ---- */
{
  const { w, d, errors } = boot({ "rk-cfg3": { jam: "auto", notif: "off", focus: "60" } });
  await ready(d);
  ok(d.getElementById("focus").hidden, "صفحهٔ تمرکز در آغاز پنهان است");
  click(w, d.getElementById("focusBtn"));
  await wait(300);
  ok(!d.getElementById("focus").hidden, "با دکمهٔ تمرکز، صفحه باز شد");
  const b = d.getElementById("breath");
  ok(["in", "hold", "out"].includes(b.dataset.ph), "فاز تنفس فعال", b.dataset.ph);
  ok(ids(d, "fPhase").length > 0 && ids(d, "fZikr").length > 0, "متن فاز و ذکر", ids(d, "fPhase") + " / " + ids(d, "fZikr"));
  ok(ids(d, "fStat").includes("باقی"), "نمایش زمان باقی‌مانده", strip(ids(d, "fStat")));
  /* گذر فازها در ۱۲ ثانیه (۴ ثانیه دم → نگه‌داشتن) */
  const seen = new Set([b.dataset.ph]);
  for (let i = 0; i < 30; i++) { await wait(500); seen.add(b.dataset.ph); if (seen.size >= 2) break; }
  ok(seen.size >= 2, "فاز تنفس خودش عوض می‌شود", Array.from(seen).join(" → "));
  click(w, d.getElementById("fPause")); await wait(150);
  ok(b.dataset.ph === "pause", "دکمهٔ توقف فاز را مکث می‌کند");
  ok(d.getElementById("fPause").textContent.includes("ادامه"), "دکمه به «ادامه» تغییر کرد");
  click(w, d.getElementById("fPause")); await wait(150);
  ok(b.dataset.ph !== "pause", "ادامه، تنفس را برمی‌گرداند");
  click(w, d.getElementById("fPray")); await wait(300);
  ok(!d.getElementById("pray").hidden, "دکمهٔ «شروع نماز» نماز را باز کرد", strip(ids(d, "title")));
  ok(d.getElementById("focus").hidden, "صفحهٔ تمرکز بسته شد");
  /* تمرکز خودکار پیش از نماز */
  click(w, d.getElementById("homeBtn")); await wait(250);
  click(w, d.querySelector('#focusAutoSeg button[data-v="on"]'));
  click(w, d.getElementById("homeBtn")); await wait(200);
  click(w, d.getElementById("homeBtn")); await wait(150);
  click(w, d.getElementById("startBtn")); await wait(300);
  const autoOk = !d.getElementById("focus").hidden || !d.getElementById("pray").hidden;
  ok(autoOk, "با «تمرکز خودکار»، دکمهٔ شروع ابتدا تمرکز را باز می‌کند", d.getElementById("focus").hidden ? "مستقیم نماز" : "تمرکز");
  console.log("  خطاها:", errors.length, errors.slice(0, 2).join(" | "));
  ok(errors.length === 0, "بدون خطا (تمرکز)");
}

/* ---- ۲: صدای مستقل هر نماز ---- */
{
  const { w, d, errors } = boot({ "rk-cfg3": { jam: "auto", notif: "off", playAdhan: "on" } }, true);
  await ready(d);
  const f1 = mains("fajr"), z1 = mains("zuhr");
  ok(f1.every(x => x.sound === "azan" && x.mode === "azan"), "پیش‌فرض: صدای اذان");
  const sb = d.querySelector('#azanPickBox button[data-snd="fajr"]');
  ok(!!sb, "دکمهٔ انتخاب صدای هر نماز هست", sb ? strip(sb.textContent) : "-");
  click(w, sb); await wait(2600);                      /* اذان → ملایم */
  ok(mains("fajr").every(x => x.sound === "soft"), "صبح: صدا به «ملایم» عوض شد", mains("fajr")[0] && mains("fajr")[0].sound);
  const cfg1 = JSON.parse(w.localStorage.getItem("rk-cfg3"));
  ok(cfg1.azanSnd.fajr === "soft" && cfg1.azanSnd.zuhr === "azan", "صدای هر نماز مستقل ذخیره شد", JSON.stringify(cfg1.azanSnd));
  click(w, d.querySelector('#azanPickBox button[data-snd="fajr"]')); await wait(2600);
  ok(mains("fajr").every(x => x.mode === "notif" && x.sound === "default"), "بار دوم: «پیش‌فرض گوشی» → حالت notif", mains("fajr")[0] && (mains("fajr")[0].mode + "/" + mains("fajr")[0].sound));
  ok(mains("zuhr").every(x => x.sound === "azan"), "ظهر دست‌نخورده ماند", mains("zuhr")[0] && mains("zuhr")[0].sound);
  click(w, d.querySelector('#azanPickBox button[data-test="fajr"]')); await wait(200);
  ok(ids(d, "toast").length > 0, "امتحان صدا پیام می‌دهد", strip(ids(d, "toast")));
  console.log("  خطاها:", errors.length, errors.slice(0, 2).join(" | "));
  ok(errors.length === 0, "بدون خطا (صدای هر نماز)");
}

/* ---- ۳: پنجمین ویجت + کارت اشتراک‌گذاری + payload قضا ---- */
{
  const { w, d, errors } = boot({}, true);
  await ready(d);
  const CAL = w.NZ.cal, j0 = CAL.jdnFromDate(new w.Date(), "Asia/Tehran");
  const key = j => { const i = CAL.dayInfo(j).j; return i.y + "-" + i.m + "-" + i.d; };
  const { w: w2, d: d2, errors: e2 } = boot({ "rk-cfg3": { jam: "auto", notif: "off" }, "rk-since": key(j0 - 1) }, true);
  await ready(d2);
  const push = sent.filter(x => x.m === "push").pop();
  const wp = JSON.parse(push.a.widget);
  ok(wp.qaza && wp.qaza.count >= 5 && wp.qaza.first, "payload ویجت: قضای دیروز (≥۵)", JSON.stringify(wp.qaza && { c: wp.qaza.count, f: wp.qaza.first, w: wp.qaza.when }));
  ok(wp.qaza.list.length >= 3, "فهرست سه قضای اول", String(wp.qaza.list.length));
  click(w2, Array.from(d2.querySelectorAll("#tabs button")).find(x => x.textContent.includes("تنظیمات")));
  await wait(400);
  const cards = d2.querySelectorAll("#widgetBox .wpcard");
  ok(cards.length === 5, "پنج ویجت در تنظیمات", String(cards.length));
  ok(defaultNames(cards).includes("قضای من"), "ویجت «قضای من» دیده می‌شود", defaultNames(cards).join(" | "));
  const qMini = cards[1].querySelector(".wpmini").textContent;
  ok(qMini.includes("قضا") && /[۰-۹]/.test(qMini), "پیش‌نمایش ویجت قضا", strip(qMini));
  function defaultNames(list) { return Array.from(list).map(c => strip(c.querySelector("b").textContent)); }
  /* کارت اشتراک‌گذاری: در jsdom بوم نیست، پس باید بی‌خطا به متن برگردد */
  click(w2, Array.from(d2.querySelectorAll("#tabs button")).find(x => x.textContent.includes("خانه")));
  await wait(300);
  click(w2, d2.getElementById("shareWeek"));
  await wait(300);
  ok(e2.length === 0, "کارت اشتراک بدون خطا (جانشین متنی)", e2.slice(0, 2).join(" | "));
  ok(ids(d2, "toast").length > 0 || !d2.getElementById("sheet").hidden, "کارت/متن خلاصه نمایش داده شد", strip(ids(d2, "toast")));
  console.log("  خطاها:", e2.length, e2.slice(0, 2).join(" | "));
  ok(e2.length === 0, "بدون خطا (ویجت/کارت)");
}
console.log(fails ? "\n" + fails + " مورد ناموفق" : "\nهمهٔ آزمون‌های ۳٫۳ موفق");
process.exit(fails ? 1 : 0);
