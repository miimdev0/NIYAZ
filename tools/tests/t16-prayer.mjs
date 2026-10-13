/* بازبینی جامع آپدیت‌های ۳٫۰ تا ۳٫۲ (بعد از پاک‌شدن آزمون‌های قبلی) */
import { JSDOM, VirtualConsole } from "jsdom";
import fs from "fs";
const dir = new URL("../../www/", import.meta.url).pathname.replace(/\/$/, "");
const FILES = ["cal.js", "content.js", "nat.js", "script.js"];
let sent = [];
function boot(seed, native) {
  sent = [];
  const vc = new VirtualConsole(); const errors = [];
  vc.on("jsdomError", e => { const m = e.detail ? (e.detail.stack || e.detail.message) : e.message; if (!/Not implemented|Could not load|fonts|ERR_/.test(m)) errors.push("JSDOM: " + m); });
  vc.on("error", (...a) => errors.push("console.error: " + a.join(" ")));
  const dom = new JSDOM(fs.readFileSync(dir + "/index.html", "utf8"), { url: "https://localhost/", runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window;
  if (native) w.Capacitor = { isNativePlatform: () => true, Plugins: { AlarmModule: new Proxy({}, { get: (t, n) => (a) => { sent.push({ m: n, a: a || {} }); return Promise.resolve({ ok: true, notif: true, exact: true, fullscreen: true }); } }) } };
  const Real = w.Date, shift = Date.UTC(2026, 9, 13, 9, 30, 0) - Real.now();
  class FakeDate extends Real { constructor(...a) { if (a.length === 0) super(Real.now() + shift); else super(...a); } static now() { return Real.now() + shift; } }
  w.Date = FakeDate;
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

const mainsOf = key => { const p = sent.filter(x => x.m === "setConfig").pop(); return p ? JSON.parse(p.a.json).items.filter(i => i.kind === "main" && i.k === key) : []; };

/* ---- ۱: انتخاب اذان، جمع‌خوانی، شمارش، ویجت‌ها، سازنده، سلامت (بومی) ---- */
{
  const { w, d, errors } = boot({ "rk-cfg3": { jam: "auto", notif: "off", playAdhan: "on", azanScreen: "on",
    azanOn: { fajr: "off", zuhr: "on", asr: "on", maghrib: "on", isha: "on" } } }, true);
  await wait(700);
  ok(mainsOf("fajr").every(x => x.mode === "silent" && x.screen === false), "اذان صبح خاموش → آلارم بی‌صدا و بدون صفحه");
  ok(mainsOf("asr").every(x => x.mode === "azan"), "اذان عصر روشن → با صدای اذان");
  ok(d.querySelector("#list li.cur button").dataset.k === "zuhr", "ساعت ۱۳ → وقت ظهر");
  ok(d.querySelector("#list li.cur2 button").dataset.k === "asr", "جمع‌خوانی: عصر هم در همین وقت");
  click(w, d.querySelector('#jamSeg button[data-v="off"]')); await wait(150);
  ok(!d.querySelector("#list li.cur2"), "«جدا می‌خوانم» فقط یک نماز در وقت");
  ok(ids(d, "tlTitle").includes("چقدر وقت داری"), "کارت وقت فعال", ids(d, "tlTitle"));
  ok(ids(d, "count").includes(":"), "شمارش معکوس", ids(d, "count"));
  click(w, Array.from(d.querySelectorAll("#tabs button")).find(x => x.textContent.includes("تنظیمات")));
  await wait(400);
  ok(d.querySelectorAll("#widgetBox .wpcard").length === 5, "پنج ویجت با پیش‌نمایش", String(d.querySelectorAll("#widgetBox .wpcard").length));
  ok(Array.from(d.querySelectorAll("#widgetBox .wpcard b")).some(x => x.textContent.includes("قضای من")), "ویجت «قضای من» هم هست");
  ok(d.querySelectorAll("#healthBox .hrow").length >= 8, "کارت سلامت برنامه", String(d.querySelectorAll("#healthBox .hrow").length));
  ok(d.querySelector("#azanSummary").textContent.includes("صبح"), "خلاصهٔ وضعیت اذان‌ها", strip(d.querySelector("#azanSummary").textContent));
  click(w, d.querySelector('#privSeg button[data-v="hide"]')); await wait(300);
  ok(JSON.parse(sent.filter(x => x.m === "setConfig").pop().a.json).privHide === true, "حریم خصوصی به بومی می‌رود");
  click(w, Array.from(d.querySelectorAll("[data-go]")).find(x => x.textContent.includes("سازنده")));
  await wait(250);
  ok(d.querySelectorAll("#clinks a.clink").length === 4, "چهار لینک گرافیکی سازنده");
  ok(d.querySelector("#clinks a.clink.wide .cli-copy") !== null, "دکمهٔ رونوشت شماره");
  console.log("  خطاها:", errors.length, errors.slice(0, 2).join(" | "));
  ok(errors.length === 0, "بدون خطا (بومی)");
}

/* ---- ۲: قضای خودکار + ثبت نماز → «تا نماز بعدی» ---- */
{
  const b = boot({}); const w = b.w, d = b.d;
  await ready(d);
  const CAL = w.NZ.cal, j0 = CAL.jdnFromDate(new w.Date(), "Asia/Tehran");
  const key = j => { const i = CAL.dayInfo(j).j; return i.y + "-" + i.m + "-" + i.d; };
  const today = key(j0), yest = key(j0 - 1);
  const b2 = boot({ "rk-cfg3": { jam: "auto", notif: "off" }, "rk-log": { [today]: ["fajr"] }, "rk-since": yest });
  const w2 = b2.w, d2 = b2.d;
  await wait(700);
  ok(!d2.getElementById("qazaCard").hidden, "کارت قضا با ۵ قضای دیروز باز شد");
  ok(ids(d2, "qzCount").includes("۵"), "شمار قضا ۵", ids(d2, "qzCount"));
  ok(d2.querySelectorAll("#list .qz").length >= 4, "نشان قضا روی ردیف‌ها", String(d2.querySelectorAll("#list .qz").length));
  click(w2, d2.getElementById("startBtn")); await wait(200);
  for (let i = 0; i < 80; i++) { d2.querySelector("#pray").dispatchEvent(new w2.MouseEvent("click", { bubbles: true })); await wait(12); if (!d2.getElementById("taqib").hidden) break; }
  click(w2, d2.getElementById("homeBtn")); await wait(300);
  ok(ids(d2, "tlTitle").includes("تا نماز بعدی"), "بعد از ثبت نماز: شمارش تا نماز بعدی", ids(d2, "tlTitle"));
  ok(strip(ids(d2, "nowText")).includes("خوانده شد"), "پیام ثبت", strip(ids(d2, "nowText")));
  ok(JSON.parse(w2.localStorage.getItem("rk-log"))[today].includes("zuhr"), "ظهر در سابقه ثبت شد");
  /* خلاصهٔ هفته */
  click(w2, d2.getElementById("shareWeek")); await wait(200);
  ok(ids(d2, "toast").length > 0, "خلاصهٔ هفته پیام/رونوشت می‌دهد", strip(ids(d2, "toast")));
  console.log("  خطاها:", b2.errors.length, b2.errors.slice(0, 2).join(" | "));
  ok(b2.errors.length === 0, "بدون خطا (قضا و شمارش)");
}
console.log(fails ? "\n" + fails + " مورد ناموفق" : "\nهمهٔ بازبینی‌ها موفق");
process.exit(fails ? 1 : 0);
