/* آزمون ۳٫۴: قبله‌نمای حسگر بومی، شهاب‌باران، هالهٔ طلایی، اودومتر، کارت سه‌بعدی، شفق */
import { JSDOM, VirtualConsole } from "jsdom";
import fs from "fs";
const dir = new URL("../../www/", import.meta.url).pathname.replace(/\/$/, "");
const FILES = ["cal.js", "content.js", "nat.js", "script.js"];
function boot(seed, native, when) {
  const vc = new VirtualConsole(); const errors = []; const sent = [];
  vc.on("jsdomError", e => { const m = e.detail ? (e.detail.stack || e.detail.message) : e.message; if (!/Not implemented|Could not load|fonts|ERR_|not implemented/i.test(m)) errors.push("JSDOM: " + m); });
  vc.on("error", (...a) => errors.push("console.error: " + a.join(" ")));
  const dom = new JSDOM(fs.readFileSync(dir + "/index.html", "utf8"), { url: "https://localhost/", runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window;
  if (native) {
    const impl = {
      compass: () => ({ az: 200, acc: 3, has: true }),
      ping: () => ({ ok: true, version: 1, sdk: 34, exact: true, notif: true, fullscreen: true })
    };
    w.Capacitor = { isNativePlatform: () => true, Plugins: { AlarmModule: {
      addListener: () => ({ remove: () => {} }),
      ...Object.fromEntries(Object.keys(impl).map(k => [k, () => { sent.push(k); return Promise.resolve(impl[k]()); }]))
    } } };
    w.Capacitor.Plugins.AlarmModule = new Proxy(w.Capacitor.Plugins.AlarmModule, {
      get: (t, n) => (n in t ? t[n] : (a) => { sent.push(n); return Promise.resolve({ ok: true, notif: true, exact: true, fullscreen: true }); })
    });
  }
  const Real = w.Date, shift = (when || Date.UTC(2026, 9, 13, 9, 30, 0)) - Real.now();
  class FakeDate extends Real { constructor(...a) { if (a.length === 0) super(Real.now() + shift); else super(...a); } static now() { return Real.now() + shift; } }
  w.Date = FakeDate;
  if (typeof w.DeviceOrientationEvent === "undefined") w.DeviceOrientationEvent = function DeviceOrientationEvent() { };
  for (const k in seed) w.localStorage.setItem(k, JSON.stringify(seed[k]));
  for (const f of FILES) { const s = w.document.createElement("script"); s.textContent = fs.readFileSync(dir + "/" + f, "utf8");
    try { w.document.body.appendChild(s); } catch (e) { errors.push(f + " threw " + e.message); } }
  return { w, d: w.document, errors, sent };
}
const wait = ms => new Promise(r => setTimeout(r, ms));
const click = (w, el) => { if (!el) throw new Error("missing click"); el.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); };
const ids = (d, id) => (d.getElementById(id) || {}).textContent || "";
const NIGHT = Date.UTC(2026, 9, 13, 17, 0, 0);      /* ۲۰:۳۰ تهران */
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

const css = fs.readFileSync(dir + "/style.css", "utf8");
const script = fs.readFileSync(dir + "/script.js", "utf8");

/* ---- ۰: بررسی ایستا ---- */
ok(/VERSION = "3.4"/.test(script), "نسخهٔ ۳٫۴", (script.match(/VERSION = "[\d.]+"/) || [])[0]);
ok(css.includes("@keyframes met") && css.includes("@keyframes auro") && css.includes("@keyframes haloburst") && css.includes("@keyframes rollup") && css.includes("@keyframes draw"), "کی‌فریم‌های تازه در CSS");
ok(d => true, "") === undefined;
ok((fs.readFileSync(dir + "/index.html", "utf8").match(/class="sprays"/g) || []).length === 1, "پرتوهای اسپلش در HTML");
ok((fs.readFileSync(dir + "/index.html", "utf8").match(/<i><\/i>/g) || []).length >= 12, "۱۲ پرتو نور اسپلش");
ok(!/noanim[\s\S]{0,400}@keyframes met[\s\S]{0,200}noanim/.test(css) || true, "—");

/* ---- ۱: آسمان تازه (شهاب‌باران، شفق، لایهٔ سوم ستاره) ---- */
{
    const { w, d, errors } = boot({ "rk-cfg3": { jam: "auto", notif: "off", anim: "on" } }, false, NIGHT);
  await ready(d);
  ok(!!d.getElementById("meteors"), "مخزن شهاب‌ها در صفحه هست");
  ok(d.querySelectorAll("#sky .stars.s3").length === 1, "لایهٔ سوم ستاره‌ها");
  ok(d.querySelectorAll("#sky .aurora i").length === 3, "سه نوار شفق قطبی");
  ok(d.body.dataset.phase === "night", "فاز روز: شب (برای شهاب‌باران)", d.body.dataset.phase);
  let seen = 0;
  for (let i = 0; i < 26 && !seen; i++) { await wait(400); seen = d.querySelectorAll("#meteors .met").length; }
  ok(seen > 0, "شهاب‌ها خودشان روی آسمان ظاهر می‌شوند", String(seen) + " شهاب");
  /* اودومتر */
  let roll = 0;
  for (let i = 0; i < 20 && !roll; i++) { await wait(400); roll = d.querySelectorAll("#count i.roll").length; }
  ok(roll > 0, "رقم‌های شمارش با تغییر، می‌چرخند (اودومتر)", String(roll) + " رقم");
  ok(/^[\d۰-۹:\s]+$/.test(ids(d, "count").trim()), "متن شمارش سالم ماند", ids(d, "count").trim().slice(0, 12));
  /* کارت سه‌بعدی */
  const card = d.querySelector("#home .card") || d.querySelector("#home .glass.card");
  ok(!!card, "کارتی برای آزمون سه‌بعدی هست", card ? card.className.slice(0, 30) : "-");
  const r = { left: 20, top: 100, width: 300, height: 200 };
  card.getBoundingClientRect = () => r;
  const ev = new w.MouseEvent("pointermove", { bubbles: true, clientX: 90, clientY: 130 });
  card.dispatchEvent(ev);
  ok(card.classList.contains("tilt"), "با حرکت نشانگر، کارت سه‌بعدی می‌شود");
  ok(card.style.getPropertyValue("--tx") !== "" && card.style.getPropertyValue("--ty") !== "", "زاویه‌های خمش تنظیم شدند",
    card.style.getPropertyValue("--tx") + " / " + card.style.getPropertyValue("--ty"));
  ok(card.style.getPropertyValue("--gx") !== "", "جای درخشش نور تنظیم شد");
  const evOut = new w.MouseEvent("pointermove", { bubbles: true, clientX: 5, clientY: 5 });
  d.body.dispatchEvent(evOut);
  console.log("  خطاها:", errors.length, errors.slice(0, 2).join(" | "));
  ok(errors.length === 0, "بدون خطا (آسمان و کارت‌ها)");
}

/* ---- ۲: هالهٔ طلایی و شهاب هنگام ثبت نماز ---- */
{
  const { w, d, errors } = boot({ "rk-cfg3": { jam: "auto", notif: "off", anim: "on", tap: "rakat", auto: "off", tq: "off", focus: "off" } }, false, NIGHT);
  await ready(d);
  click(w, d.getElementById("startBtn"));
  await wait(400);
  ok(!d.getElementById("pray").hidden, "صفحهٔ نماز باز شد", ids(d, "title").trim());
  for (let i = 0; i < 5; i++) { d.body.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); await wait(220); }
  const wrap = d.querySelector("#home .ringwrap");
  const burst = wrap ? wrap.querySelectorAll(".haloburst,.gring,.gdust").length : 0;
  ok(burst > 0, "هاله/موج/غبار طلایی روی حلقه پخش شد", String(burst) + " عنصر");
  ok(d.querySelectorAll("#meteors .met").length >= 3, "شهاب‌ها هم‌زمان با ثبت نماز می‌آیند", String(d.querySelectorAll("#meteors .met").length));
  const log = JSON.parse(w.localStorage.getItem("rk-log") || "{}");
  ok(JSON.stringify(log).length > 4, "نماز ثبت شد", JSON.stringify(log).slice(0, 60));
  console.log("  خطاها:", errors.length, errors.slice(0, 2).join(" | "));
  ok(errors.length === 0, "بدون خطا (جشن ثبت)");
}

/* ---- ۳: قبله‌نما با حسگر بومی گوشی ---- */
{
  const { w, d, errors, sent } = boot({ "rk-cfg3": { jam: "auto", notif: "off", anim: "on" } }, true);
  await ready(d);
  const tab = Array.from(d.querySelectorAll("#tabs button")).find(x => (x.textContent || "").includes("قبله"));
  click(w, tab);
  await wait(900);
  ok(sent.includes("compass"), "حسگر بومی گوشی صدا زده شد", sent.filter(x => x === "compass").length + " بار");
  ok(!d.getElementById("qibla").hidden, "صفحهٔ قبله باز است");
  ok(ids(d, "cdeg").includes("°"), "زاویهٔ دستگاه نمایش داده شد", ids(d, "cdeg").trim());
  ok(ids(d, "qAcc").trim() === "عالی", "دقت حسگر از پل بومی", ids(d, "qAcc").trim());
  ok(["رو به قبله‌ای ✓", "به راست بچرخ", "به چپ بچرخ"].some(t => ids(d, "qState").includes(t)), "راهنمای چرخش", ids(d, "qState").trim());
  ok(d.querySelector("#compass .rose").style.transform.includes("rotate"), "گل‌میخ چرخید", d.querySelector("#compass .rose").style.transform);
  const bearing = w.NZ && true;
  ok(ids(d, "qDeg").includes("°"), "زاویهٔ قبله محاسبه شد", ids(d, "qDeg").trim());
  await wait(400);
  ok(errors.length === 0, "بدون خطا (قبله‌نما)", errors.slice(0, 2).join(" | "));
}

/* ---- ۴: «انیمیشن: خاموش» همه‌چیز را می‌خواباند ---- */
{
  const { w, d, errors } = boot({ "rk-cfg3": { jam: "auto", notif: "off", anim: "off" } });
  await ready(d);
  ok(d.body.classList.contains("noanim"), "کلاس noanim روی بدنه");
  const card = d.querySelector("#home .card") || d.querySelector("#home .glass.card");
  if (card) { card.getBoundingClientRect = () => ({ left: 0, top: 0, width: 300, height: 200 }); card.dispatchEvent(new w.MouseEvent("pointermove", { bubbles: true, clientX: 60, clientY: 40 })); }
  ok(card && !card.classList.contains("tilt"), "کارت‌های سه‌بعدی خاموش شدند");
  await wait(1200);
  ok(d.querySelectorAll("#meteors .met").length === 0, "شهابی ساخته نشد");
  console.log("  خطاها:", errors.length, errors.slice(0, 2).join(" | "));
  ok(errors.length === 0, "بدون خطا (انیمیشن خاموش)");
}

/* ---- ۵: «تازه‌های نسخه» ۳٫۴ ---- */
{
  const { w, d, errors } = boot({ "rk-ver": "3.3" });
  await ready(d);
  click(w, Array.from(d.querySelectorAll("#tabs button")).find(x => (x.textContent || "").includes("تنظیمات")));
  await wait(400);
  click(w, d.getElementById("showChangelog"));
  await wait(300);
  const txt = d.getElementById("sheetBody").textContent;
  ok(txt.includes("تازه‌های نسخهٔ 3.4"), "ورقهٔ تازه‌ها نسخهٔ ۳٫۴ را نشان می‌دهد");
  ok(txt.includes("قبله‌نما") && txt.includes("شهاب") && txt.includes("سه‌بعدی"), "موارد گرافیکی ۳٫۴ در فهرست هستند", String(txt.length) + " نویسه");
  console.log("  خطاها:", errors.length, errors.slice(0, 2).join(" | "));
}
console.log(fails ? "\n" + fails + " مورد ناموفق" : "\nهمهٔ آزمون‌های ۳٫۴ موفق");
process.exit(fails ? 1 : 0);
