package com.mojtabameidani.niyaz;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Niyaz · زمان‌بندی اعلان‌ها، ویجت و اطلاعات دائمی
 * © Mojtaba Meidani — مجتبی میدانی
 *
 * همهٔ زمان‌ها را برنامهٔ وب (script.js) محاسبه می‌کند و به‌صورت JSON در حافظهٔ
 * برنامه ذخیره می‌شود. این کلاس فقط آن‌ها را به AlarmManager می‌سپارد.
 * هیچ محاسبهٔ سنگین یا حلقهٔ بیدارباشی در پس‌زمینه اجرا نمی‌شود؛ به همین دلیل
 * مصرف باتری و رم ناچیز است.
 */
public final class AlarmScheduler {

    public static final String PREFS = "niyaz_store";
    public static final String KEY_SCHEDULE = "schedule";   // JSON کامل زمان‌بندی
    public static final String KEY_DATEINFO = "dateinfo";   // JSON تاریخ‌های نمایشی
    public static final String KEY_WIDGET = "widget";       // JSON ویجت
    public static final String KEY_ACTION = "pending_action";
    public static final String KEY_LAST_REFRESH = "last_refresh";

    public static final int MAX_ALARMS = 400;               // اندیس‌های ۱ تا ۴۰۰
    public static final int REFRESH_ID = 9090;              // بیدارباش نگه‌داشت
    public static final String ACTION_ALARM = "com.mojtabameidani.niyaz.ALARM";

    private AlarmScheduler() { }

    public static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static JSONObject readJson(Context c, String key) {
        try {
            String s = prefs(c).getString(key, null);
            if (s == null || s.length() < 2) return null;
            return new JSONObject(s);
        } catch (Throwable t) {
            return null;
        }
    }

    public static void writeJson(Context c, String key, String json) {
        prefs(c).edit().putString(key, json).apply();
    }

    public static boolean canExact(Context c) {
        if (Build.VERSION.SDK_INT >= 31) {
            try {
                AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
                return am != null && am.canScheduleExactAlarms();
            } catch (Throwable t) {
                return false;
            }
        }
        return true;
    }

    private static PendingIntent alarmPi(Context c, int id, JSONObject item) {
        Intent i = new Intent(c, AlarmReceiver.class);
        i.setAction(ACTION_ALARM);
        i.putExtra("id", id);
        i.putExtra("k", item.optString("k"));
        i.putExtra("n", item.optString("n"));
        i.putExtra("kind", item.optString("kind", "main"));
        i.putExtra("title", item.optString("title"));
        i.putExtra("body", item.optString("body"));
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(c, id, i, flags);
    }

    public static void cancelAll(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        for (int id = 1; id <= MAX_ALARMS + 1; id++) {
            try {
                PendingIntent pi = alarmPi(c, id, new JSONObject());
                am.cancel(pi);
                pi.cancel();
            } catch (Throwable ignored) { }
        }
        try {
            Intent ri = new Intent(c, AlarmReceiver.class);
            ri.setAction(ACTION_ALARM);
            ri.putExtra("refresh", true);
            int f = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= 23) f |= PendingIntent.FLAG_IMMUTABLE;
            PendingIntent rpi = PendingIntent.getBroadcast(c, REFRESH_ID, ri, f);
            am.cancel(rpi);
            rpi.cancel();
        } catch (Throwable ignored) { }
    }

    /** زمان‌بندی همهٔ اعلان‌های ذخیره‌شده. تعداد زمان‌بندی‌شده را برمی‌گرداند. */
    public static int schedule(Context c) {
        JSONObject cfg = readJson(c, KEY_SCHEDULE);
        cancelAll(c);
        if (cfg == null || !cfg.optBoolean("enabled", true)) return 0;

        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return 0;
        JSONArray items = cfg.optJSONArray("items");
        if (items == null) return 0;

        long now = System.currentTimeMillis();
        boolean exact = canExact(c);
        int count = 0;

        for (int idx = 0; idx < items.length() && idx < MAX_ALARMS; idx++) {
            JSONObject item = items.optJSONObject(idx);
            if (item == null) continue;
            long at = item.optLong("at", 0);
            if (at <= now + 2000L) continue;
            int id = idx + 1;
            String kind = item.optString("kind", "main");
            PendingIntent pi = alarmPi(c, id, item);
            boolean ok = false;
            try {
                if ("main".equals(kind) && Build.VERSION.SDK_INT >= 21) {
                    Intent show = new Intent(c, MainActivity.class);
                    show.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    int f = PendingIntent.FLAG_UPDATE_CURRENT;
                    if (Build.VERSION.SDK_INT >= 23) f |= PendingIntent.FLAG_IMMUTABLE;
                    PendingIntent showPi = PendingIntent.getActivity(c, 5000 + id, show, f);
                    am.setAlarmClock(new AlarmManager.AlarmClockInfo(at, showPi), pi);
                    ok = true;
                } else if (exact && Build.VERSION.SDK_INT >= 23) {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
                    ok = true;
                } else if (Build.VERSION.SDK_INT >= 19) {
                    am.setExact(AlarmManager.RTC_WAKEUP, at, pi);
                    ok = true;
                } else {
                    am.set(AlarmManager.RTC_WAKEUP, at, pi);
                    ok = true;
                }
            } catch (Throwable t) {
                ok = false;
            }
            if (!ok) {
                try {
                    am.set(AlarmManager.RTC_WAKEUP, at, pi);
                    ok = true;
                } catch (Throwable ignored) { }
            }
            if (ok) count++;
        }

        /* بیدارباش نگه‌داشت: هر ۶ ساعت خودش را دوباره زمان‌بندی می‌کند تا اگر
           گوشی ری‌استارت شد یا سیستم آلارمی را حذف کرد، دوباره برقرار شود. */
        try {
            Intent ri = new Intent(c, AlarmReceiver.class);
            ri.setAction(ACTION_ALARM);
            ri.putExtra("refresh", true);
            int f = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= 23) f |= PendingIntent.FLAG_IMMUTABLE;
            PendingIntent rpi = PendingIntent.getBroadcast(c, REFRESH_ID, ri, f);
            long next = now + 6L * 60L * 60L * 1000L;
            if (exact && Build.VERSION.SDK_INT >= 23) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, rpi);
            else am.set(AlarmManager.RTC_WAKEUP, next, rpi);
        } catch (Throwable ignored) { }

        prefs(c).edit().putLong(KEY_LAST_REFRESH, now).apply();
        return count;
    }

    /** اولین اذان پیشِ رو از میان زمان‌بندی ذخیره‌شده */
    public static String[] nextPrayer(Context c) {
        JSONObject cfg = readJson(c, KEY_SCHEDULE);
        if (cfg == null) return null;
        JSONArray items = cfg.optJSONArray("items");
        if (items == null) return null;
        long now = System.currentTimeMillis();
        for (int i = 0; i < items.length(); i++) {
            JSONObject it = items.optJSONObject(i);
            if (it == null) continue;
            if (!"main".equals(it.optString("kind", "main"))) continue;
            if (it.optLong("at", 0) > now) {
                return new String[] { it.optString("n"), it.optString("k"), String.valueOf(it.optLong("at", 0)) };
            }
        }
        return null;
    }

    /** اگر بیش از نیم ساعت از آخرین زمان‌بندی گذشته باشد، دوباره می‌سازد
        (تا هر بار باز شدن برنامه، همهٔ آلارم‌ها بی‌دلیل بازنویسی نشوند). */
    public static void reloadAndReschedule(Context c) {
        long last = prefs(c).getLong(KEY_LAST_REFRESH, 0L);
        if (System.currentTimeMillis() - last < 30L * 60L * 1000L) return;
        schedule(c);
        WidgetUpdate.push(c, readJson(c, KEY_WIDGET));
    }
}
