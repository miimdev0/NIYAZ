#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""بررسی سبک منابع جاوا پیش از ساخت APK (بدون نیاز به Android SDK).

۱) توازن آکولاد و پرانتز در همهٔ فایل‌های جاوا
۲) فراخوانی متدهای استاتیکِ کلاس‌های خودی (مثل WidgetKit.data) — اگر متد نباشد، همان‌جا می‌شکند
۳) ارجاع‌های R.id / R.layout / R.xml / R.string به منابعی که واقعاً وجود دارند
"""
import glob, io, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
JAVA = os.path.join(HERE, "..", "android", "java", "com", "mojtabameidani", "niyaz")
RES = os.path.join(HERE, "..", "android", "res")


def read(p):
    return io.open(p, encoding="utf-8").read()


def strip_noise(s):
    s = re.sub(r'"(?:\\.|[^"\\])*"', '""', s)
    s = re.sub(r"'\\?.'", "''", s)
    s = re.sub(r"//[^\n]*", "", s)
    s = re.sub(r"/\*.*?\*/", "", s, flags=re.S)
    return s


def main():
    files = sorted(glob.glob(os.path.join(JAVA, "*.java")))
    if not files:
        print("XX هیچ فایل جاوایی پیدا نشد")
        return 1
    src = {os.path.basename(f)[:-5]: read(f) for f in files}
    errs = []

    for name, s in src.items():
        t = strip_noise(s)
        for op, cl in (("{", "}"), ("(", ")")):
            if t.count(op) != t.count(cl):
                errs.append("%s: نامتوازن %s%s (%d در برابر %d)" % (name, op, cl, t.count(op), t.count(cl)))

    clas = "|".join(re.escape(k) for k in src)
    for cls, s in src.items():
        for tgt, meth in sorted(set(re.findall(r"\b(%s)\.([A-Za-z_]\w*)\s*\(" % clas, strip_noise(s)))):
            if tgt == cls:
                continue
            if not re.search(r"\b[\w<>\[\], ]+\s+%s\s*\(" % re.escape(meth), src[tgt]):
                errs.append("%s: %s.%s() در %s.java وجود ندارد" % (cls, tgt, meth, tgt))

    avail = {"id": set(), "layout": set(), "xml": set(), "string": set()}
    for p in glob.glob(os.path.join(RES, "*", "*")):
        if not os.path.isfile(p):
            continue
        t = read(p)
        dirn = os.path.basename(os.path.dirname(p))
        name = os.path.basename(p)
        avail["id"] |= set(re.findall(r"@\+?id/(\w+)", t))
        avail["string"] |= set(re.findall(r'<string name="(\w+)"', t))
        for kind in ("layout", "xml"):
            avail[kind] |= set(re.findall(r"@%s/(\w+)" % kind, t))
        if dirn in ("layout", "xml") and name.endswith(".xml"):
            avail[dirn].add(name[:-4])
    for cls, s in src.items():
        for kind, name in sorted(set(re.findall(r"\bR\.(\w+)\.(\w+)", strip_noise(s)))):
            if kind in avail and name not in avail[kind]:
                errs.append("%s: R.%s.%s در منابع نیست" % (cls, kind, name))

    print("فایل‌های جاوا: %d · منابع: %d شناسه، %d چیدمان، %d xml، %d رشته"
          % (len(files), len(avail["id"]), len(avail["layout"]), len(avail["xml"]), len(avail["string"])))
    if errs:
        print("XX %d اشکال:" % len(errs))
        for e in errs:
            print("   - " + e)
        return 1
    print("OK همهٔ ارجاع‌های جاوا به منابع سالم است")
    return 0


if __name__ == "__main__":
    sys.exit(main())
