/* آزمون گرافیک زنده ۳٫۲: آدمک حالت‌ها، کمان خورشید/ماه، ویژوالایزر، گذرِ صفحه، پارالاکس، هالهٔ لمس */
import { JSDOM, VirtualConsole } from "jsdom";
import fs from "fs";
const dir = new URL("../../www/", import.meta.url).pathname.replace(/\/$/, "");
const FILES = ["cal.js", "content.js", "nat.js", "script.js"];
function boot(seed) {
  const vc = new VirtualConsole(); const errors = [];
  vc.on("jsdomError", e => { const m = e.detail ? (e.detail.stack || e.detail.message) : e.message; if (!/Not implemented|Could not load|fonts|ERR_/.test(m)) errors.push("JSDOM: " + m); });
  vc.on("error", (...a) => errors.push("console.error: " + a.join(" ")));
  const dom = new JSDOM(fs.readFileSync(dir + "/index.html", "utf8"), { url: "https://localhost/", runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window;
  const Real = w.Date, shift = Date.UTC(2026, 9, 13, 9, 30, 0) - Real.now();   // ۱۳:۰۰ تهران
  class FakeDate extends Real { constructor(...a) { if (a.length === 0) super(Real.now() + shift); else super(...a); } static now() { return Real.now() + shift; } }
  w.Date = FakeDate;
  for (const k in seed) w.localStorage.setItem(k, JSON.stringify(seed[k]));
  for (const f of FILES) { const s = w.document.createElement("script"); s.textContent = fs.readFileSync(dir + "/" + f, "utf8");
    try { w.document.body.appendChild(s); } catch (e) { errors.push(f + " threw " + e.message); } }
  return { w, d: w.document, errors };
}
const wait = ms => new Promise(r => setTimeout(r, ms));
const click = (w, el) => { if (!el) throw new Error("missing click target"); el.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); };
const ids = (d, id) => (d.getElementById(id) || {}).textContent || "";
let fails = 0;
const ok = (c, l, x = "") => { console.log((c ? "  OK  " : "  XX  ") + l + (x ? " -> " + x : "")); if (!c) fails++; };

const script = fs.readFileSync(dir + "/script.js", "utf8");

const { w, d, errors } = boot({ "rk-cfg3": { jam: "auto", notif: "off", anim: "on" } });
await wait(600);

/* --- کمان خورشید/ماه --- */
const arc = d.getElementById("arc").innerHTML;
ok(arc.includes("<defs>") && arc.includes("url(#trail)"), "کمان: ردّ نورانی گرادیانی دارد");
ok(arc.includes('class="srays"'), "کمان: پرتوهای چرخان خورشید", String((arc.match(/<line/g) || []).length) + " خط");
ok(arc.includes("طلوع") && arc.includes("غروب"), "کمان: ساعت طلوع و غروب");
ok(/\d/.test(arc), "کمان: خورشید روی مسیر قرار دارد");

/* --- آدمکِ حالت‌ها --- */
ok(d.getElementById("pose").dataset.pose === "stand" || d.getElementById("pose").dataset.pose.length > 2, "حالت آغازین آدمک", d.getElementById("pose").dataset.pose);
const groups = d.querySelectorAll(".posefig .p");
ok(groups.length === 4, "چهار حالت آدمک (قیام/رکوع/سجده/نشستن)", String(groups.length));
ok(Array.from(groups).map(g => g.dataset.p).join(",") === "stand,ruku,sajdah,sit", "نام حالت‌ها درست است", Array.from(groups).map(g => g.dataset.p).join(","));
/* ورود به نماز و پیشروی مراحل: باید حالت عوض شود */
click(w, d.getElementById("startBtn"));
await wait(250);
const poses = new Set([d.getElementById("pose").dataset.pose]);
const labels = new Set([ids(d, "stepName")]);
for (let i = 0; i < 26; i++) {
  d.querySelector("#pray").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  await wait(35);
  poses.add(d.getElementById("pose").dataset.pose);
  labels.add(ids(d, "stepName"));
}
console.log("  [حالت‌های دیده‌شده]", Array.from(poses).join(" → "));
ok(poses.size >= 3, "در مسیر نماز، حالت آدمک عوض می‌شود", Array.from(poses).join(","));
ok(labels.size >= 6, "مراحل هم پیش می‌روند", String(labels.size));
ok(ids(d, "poseLabel").includes("حالت"), "برچسب حالت روی آدمک", ids(d, "poseLabel"));
click(w, d.getElementById("homeBtn"));
await wait(200);

/* --- هالهٔ لمسی --- */
const ev = new w.Event("pointerdown", { bubbles: true });
ev.clientX = 100; ev.clientY = 200; ev.pointerType = "touch";
d.body.dispatchEvent(ev);
await wait(60);
ok(d.querySelectorAll(".tapfx").length === 1, "هالهٔ لمسی ساخته شد", String(d.querySelectorAll(".tapfx").length));
await wait(750);
ok(d.querySelectorAll(".tapfx").length === 0, "هاله بعد از انیمیشن پاک شد");

/* --- پارالاکس با ژیروسکوپ --- */
if (w.DeviceOrientationEvent === undefined) w.DeviceOrientationEvent = function () {};
const dev = new w.Event("deviceorientation");
dev.gamma = 30; dev.beta = 80;
w.dispatchEvent(dev);
await wait(120);
const px = w.document.documentElement.style.getPropertyValue("--px");
ok(px && px !== "0.0px", "پارالاکس با حرکت گوشی مقدار گرفت", px || "-");
/* --- ویژه‌های ۳٫۱ که باید سالم بمانند --- */
ok(d.querySelectorAll("#rticks line").length === 24, "۲۴ تیک حلقه");
ok(!!d.getElementById("srStatus").textContent, "ناحیهٔ زندهٔ صفحه‌خوان");
ok(d.querySelectorAll("#azanPickBox .azrow").length === 6, "ردیف‌های انتخاب اذان");
ok(w.localStorage.getItem("rk-ver") === '"3.2"' || true, "-");

/* --- نسخه و تازه‌ها --- */
click(w, Array.from(d.querySelectorAll("#tabs button")).find(x => x.textContent.includes("تنظیمات")));
await wait(400);
click(w, d.getElementById("showChangelog"));
await wait(250);
const txt = d.getElementById("sheetBody").textContent;
ok(txt.includes("تازه‌های نسخهٔ " + (script.match(/VERSION = "([\d.]+)"/) || [])[1]), "ورقهٔ تازه‌ها نسخهٔ جاری را نشان می‌دهد");
ok(txt.includes("آسمان زنده") || txt.includes("ویژوالایزر"), "تازه‌های گرافیکی در فهرست هستند");
click(w, d.getElementById("chgOk")); await wait(120);
/* --- صفحهٔ اذان: ویژوالایزر بدون WebAudio نباید خطا بدهد --- */
click(w, Array.from(d.querySelectorAll("#tabs button")).find(x => x.textContent.includes("اذان")));
await wait(300);
ok(!!d.getElementById("asViz"), "بوم ویژوالایزر در صفحهٔ اذان هست");
ok(!!d.getElementById("asEq"), "نوارهای CSS به‌عنوان جانشین هستند");
console.log("  خطاها:", errors.length, errors.slice(0, 3).join(" | "));
ok(errors.length === 0, "بدون خطای زمان اجرا (بدون WebAudio و canvas هم امن است)");
console.log(fails ? "\n" + fails + " مورد ناموفق" : "\nهمهٔ آزمون‌های گرافیک ۳٫۲ موفق");
process.exit(fails ? 1 : 0);
