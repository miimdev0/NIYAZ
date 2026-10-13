/* اجرای همهٔ آزمون‌های نیاز · `npm test`
   هر آزمون یک پروندهٔ مستقل است؛ همه باید سبز شوند. */
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const here = path.dirname(fileURLToPath(import.meta.url));
const SUITES = [
  ["۱۵ · گرافیک زنده (کمان، آدمک، ویژوالایزر، پارالاکس)", "t15-graphics.mjs"],
  ["۱۶ · نماز، قضا، اذان‌ها، ویجت‌ها و حریم خصوصی", "t16-prayer.mjs"],
  ["۱۷ · تمرکز و تنفس، صدای هر نماز، کارت تصویری", "t17-focus.mjs"],
  ["۱۸ · سوپر گرافیک (قبله‌نما، شهاب، هاله، اودومتر، سه‌بعدی)", "t18-super.mjs"]
];

function run(file) {
  return new Promise(resolve => {
    const p = spawn(process.execPath, [path.join(here, file)], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    p.stdout.on("data", d => { out += d; });
    p.stderr.on("data", d => { out += d; });
    p.on("close", code => resolve({ code, out }));
  });
}

let bad = 0;
for (const [title, file] of SUITES) {
  process.stdout.write("\n▶ " + title + "\n");
  const { code, out } = await run(file);
  const fails = out.split("\n").filter(l => l.trim().startsWith("XX"));
  const oks = out.split("\n").filter(l => l.trim().startsWith("OK")).length;
  fails.forEach(l => process.stdout.write("   " + l.trim() + "\n"));
  if (code === 0) process.stdout.write("   ✓ " + oks + " بررسی سبز\n");
  else {
    bad++;
    process.stdout.write("   ✗ " + file + " شکست خورد (کد " + code + ")\n");
    /* این خط‌ها مستقیم به «حاشیه‌نویسی» گیت‌هاب می‌روند تا از بیرون هم دیده شوند */
    const lines = out.split("\n").map(l => l.trim()).filter(Boolean);
    lines.filter(l => l.startsWith("XX")).slice(0, 5).forEach(l => process.stdout.write("::error::" + file + " " + l + "\n"));
    if (!lines.some(l => l.startsWith("XX"))) lines.slice(-6).forEach(l => process.stdout.write("::error::" + file + " " + l.slice(0, 300) + "\n"));
    else process.stdout.write("::error::" + file + " بریده‌ای از خروجی: " + lines.slice(-3).join(" | ").slice(0, 300) + "\n");
  }
}
process.stdout.write(bad ? "\n✗ " + bad + " مجموعه ناموفق\n" : "\n✓ همهٔ مجموعه‌های آزمون سبز\n");
process.exit(bad ? 1 : 0);
