#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
نیاز · آماده‌سازی پروژهٔ اندروید پیش از ساخت APK
© Mojtaba Meidani — مجتبی میدانی

این اسکریپت بعد از «npx cap add android» و «npx cap sync android» اجرا می‌شود و:
  ۱) کدهای بومی نیاز (سرویس اذان، اعلان دائمی تاریخ، ویجت، پل Capacitor) را کپی می‌کند
  ۲) AndroidManifest را با دسترسی‌ها و اجزا تکمیل می‌کند
  ۳) MainActivity را می‌نویسد تا پلاگین بومی ثبت شود
  ۴) صداهای اذان و یادآوری را به res/raw می‌برد تا صدای اعلان‌ها باشد
  ۵) compileSdk/targetSdk/minSdk و رمزگذاری UTF-8 را تنظیم می‌کند
"""
import os
import re
import shutil
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, ".github", "android")
APP = os.path.join(ROOT, "android", "app")
MAIN = os.path.join(APP, "src", "main")
PKG_DIR = os.path.join(MAIN, "java", "com", "mojtabameidani", "niyaz")

COMPILE_SDK = "34"
TARGET_SDK = "33"
MIN_SDK = "23"

MANIFEST_COMPONENTS = """
        <!-- ===== نیاز · اجزای بومی (ساختهٔ مجتبی میدانی) ===== -->
        <service
            android:name="com.mojtabameidani.niyaz.AzanService"
            android:exported="false"
            android:foregroundServiceType="specialUse"
            android:stopWithTask="false">
            <property
                android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
                android:value="نمایش دائمی تاریخ شمسی/میلادی/قمری و پخش اذان در وقت نماز" />
        </service>

        <activity
            android:name="com.mojtabameidani.niyaz.AzanActivity"
            android:configChanges="orientation|screenSize|keyboardHidden|uiMode"
            android:excludeFromRecents="true"
            android:exported="false"
            android:launchMode="singleInstance"
            android:showWhenLocked="true"
            android:theme="@style/NiyazAzanTheme"
            android:turnScreenOn="true" />

        <receiver
            android:name="com.mojtabameidani.niyaz.AlarmReceiver"
            android:exported="false" />

        <receiver
            android:name="com.mojtabameidani.niyaz.BootReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.LOCKED_BOOT_COMPLETED" />
                <action android:name="android.intent.action.QUICKBOOT_POWERON" />
                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
                <action android:name="android.intent.action.TIME_SET" />
                <action android:name="android.intent.action.TIMEZONE_CHANGED" />
                <action android:name="android.intent.action.DATE_CHANGED" />
            </intent-filter>
        </receiver>

        <receiver
            android:name="com.mojtabameidani.niyaz.NiyazWidgetProvider"
            android:exported="true">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
                <action android:name="android.intent.action.DATE_CHANGED" />
                <action android:name="android.intent.action.TIME_SET" />
                <action android:name="android.intent.action.TIMEZONE_CHANGED" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/niyaz_widget_info" />
        </receiver>
"""

MANIFEST_PERMISSIONS = """
    <!-- ===== نیاز · دسترسی‌ها ===== -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.USE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
"""

MAIN_ACTIVITY = """package com.mojtabameidani.niyaz;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

/**
 * نیاز · نقطهٔ ورود برنامه
 * © Mojtaba Meidani — مجتبی میدانی
 *
 * پلاگین بومی «AlarmModule» این‌جا ثبت می‌شود تا زمان‌بندی اعلان‌ها، اعلان دائمی
 * تاریخ، صفحهٔ اذان و ویجت صفحهٔ اصلی کار کنند. بقیهٔ محاسبات همان برنامهٔ وب است.
 */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AlarmModule.class);
        super.onCreate(savedInstanceState);
    }
}
"""


def log(msg):
    print("[patch] " + msg)


def read(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def copy_tree(src, dst):
    for base, _dirs, files in os.walk(src):
        rel = os.path.relpath(base, src)
        target = os.path.join(dst, rel) if rel != "." else dst
        os.makedirs(target, exist_ok=True)
        for name in files:
            shutil.copy2(os.path.join(base, name), os.path.join(target, name))


def patch_manifest():
    path = os.path.join(MAIN, "AndroidManifest.xml")
    xml = read(path)
    if "AlarmModule" in xml or "AzanService" in xml:
        log("manifest already patched")
    else:
        if "</application>" not in xml:
            log("!! </application> not found in manifest")
            sys.exit(1)
        xml = xml.replace("</application>", MANIFEST_COMPONENTS + "    </application>")
        xml = xml.replace("</manifest>", MANIFEST_PERMISSIONS + "</manifest>")
    # اجازهٔ بارگذاری روی شبکهٔ داخلی Capacitor (برای پرونده‌های محلی)
    if "android:usesCleartextTraffic" not in xml:
        xml = xml.replace("<application", '<application\n        android:usesCleartextTraffic="true"', 1)
    write(path, xml)
    log("manifest patched")


def patch_gradle():
    path = os.path.join(APP, "build.gradle")
    if not os.path.exists(path):
        log("!! app/build.gradle not found")
        sys.exit(1)
    g = read(path)

    # نسخه‌های SDK — هم شکل rootProject.ext و هم شکل مستقیم
    g = g.replace("compileSdk rootProject.ext.compileSdkVersion", "compileSdk " + COMPILE_SDK)
    g = g.replace("targetSdkVersion rootProject.ext.targetSdkVersion", "targetSdkVersion " + TARGET_SDK)
    g = g.replace("minSdkVersion rootProject.ext.minSdkVersion", "minSdkVersion " + MIN_SDK)
    g = re.sub(r"compileSdk\s+(rootProject\.ext\.\w+|\d+)", "compileSdk " + COMPILE_SDK, g)
    g = re.sub(r"targetSdkVersion\s+(rootProject\.ext\.\w+|\d+)", "targetSdkVersion " + TARGET_SDK, g)
    g = re.sub(r"minSdkVersion\s+(rootProject\.ext\.\w+|\d+)", "minSdkVersion " + MIN_SDK, g)
    g = g.replace("versionCode 1", "versionCode 3")
    g = g.replace('versionName "1.0"', 'versionName "3.0"')

    # صداهای اذان نباید فشرده شوند تا هم به‌عنوان asset و هم resource خوانده شوند
    if "noCompress" not in g:
        g = g.replace("aaptOptions {", 'aaptOptions {\n            noCompress "mp3", "ogg", "wav"', 1)

    if "options.encoding" not in g:
        g += """

// نیاز · رمزگذاری UTF-8 برای متن‌های فارسی
tasks.withType(JavaCompile) {
    options.encoding = "UTF-8"
}
"""
    write(path, g)

    vpath = os.path.join(ROOT, "android", "variables.gradle")
    if os.path.exists(vpath):
        v = read(vpath)
        v = re.sub(r"minSdkVersion\s*=\s*\d+", "minSdkVersion = " + MIN_SDK, v)
        v = re.sub(r"compileSdkVersion\s*=\s*\d+", "compileSdkVersion = " + COMPILE_SDK, v)
        v = re.sub(r"targetSdkVersion\s*=\s*\d+", "targetSdkVersion = " + TARGET_SDK, v)
        v = re.sub(r"versionCode\s*=\s*\d+", "versionCode = 3", v)
        write(vpath, v)
    log("gradle patched (compileSdk %s / targetSdk %s / minSdk %s)" % (COMPILE_SDK, TARGET_SDK, MIN_SDK))


def clean_template():
    """پوشهٔ نمونهٔ Capacitor (com/getcapacitor/myapp) که دیگر لازم نیست را پاک می‌کند
       تا اگر cap add آن را جا گذاشت، دو MainActivity هم‌نام در بیلد نباشد."""
    stale = os.path.join(MAIN, "java", "com", "getcapacitor")
    if os.path.isdir(stale):
        shutil.rmtree(stale, ignore_errors=True)
        log("template java removed (com/getcapacitor)")


def copy_native():
    copy_tree(os.path.join(SRC, "java"), os.path.join(MAIN, "java"))
    for folder in ("layout", "xml", "drawable", "values"):
        src = os.path.join(SRC, "res", folder)
        if os.path.isdir(src):
            copy_tree(src, os.path.join(MAIN, "res", folder))
    # آیکون‌ها را از پوشهٔ assets هم می‌بریم (اگر بود)
    log("native sources + resources copied")


def copy_sounds():
    raw = os.path.join(MAIN, "res", "raw")
    os.makedirs(raw, exist_ok=True)
    src = os.path.join(ROOT, "www", "audio")
    copied = []
    for name in ("azan", "soft"):
        for ext in (".mp3", ".ogg", ".wav"):
            p = os.path.join(src, name + ext)
            if os.path.exists(p):
                shutil.copy2(p, os.path.join(raw, name + ext))
                copied.append(name + ext)
                break
    log("sounds -> res/raw: " + (", ".join(copied) if copied else "none"))


def write_main_activity():
    write(os.path.join(PKG_DIR, "MainActivity.java"), MAIN_ACTIVITY)
    log("MainActivity rewritten (AlarmModule registered)")


def check_result():
    """بررسی سریع اینکه وصله‌ها واقعاً اعمال شده‌اند"""
    xml = read(os.path.join(MAIN, "AndroidManifest.xml"))
    gradle = read(os.path.join(APP, "build.gradle"))
    problems = []
    for token in ("AzanService", "AzanActivity", "NiyazWidgetProvider", "BootReceiver", "USE_EXACT_ALARM", "POST_NOTIFICATIONS"):
        if token not in xml:
            problems.append("manifest: " + token)
    for token in ("compileSdk " + COMPILE_SDK, "targetSdkVersion " + TARGET_SDK, "minSdkVersion " + MIN_SDK):
        if token not in gradle:
            problems.append("gradle: " + token)
    if problems:
        log("!! وصله ناقص است: " + ", ".join(problems))
        sys.exit(1)
    log("verified: manifest + gradle ✔")


def main():
    if not os.path.isdir(APP):
        log("!! android project not found — did 'npx cap add android' run?")
        sys.exit(1)
    copy_native()
    write_main_activity()
    copy_sounds()
    clean_template()
    patch_manifest()
    patch_gradle()
    check_result()
    log("done ✔")


if __name__ == "__main__":
    main()
