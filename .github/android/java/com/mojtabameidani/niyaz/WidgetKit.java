package com.mojtabameidani.niyaz;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * نیاز · ابزار مشترک ویجت‌های صفحهٔ اصلی
 * © Mojtaba Meidani — مجتبی میدانی
 *
 * چهار ویجت مختلف (کلاسیک، کوچک، اوقات امروز، هفته) این توابع را به اشتراک می‌گذارند.
 */
public final class WidgetKit {

    private WidgetKit() { }

    /** داده‌ای که برنامهٔ وب می‌فرستد */
    public static JSONObject data(Context c) {
        return AlarmScheduler.readJson(c, AlarmScheduler.KEY_WIDGET);
    }

    /** روزی که الان داخلش هستیم */
    public static JSONObject dayAt(JSONObject data, long now) {
        if (data == null) return null;
        JSONArray days = data.optJSONArray("days");
        if (days == null || days.length() == 0) return null;
        JSONObject found = null;
        for (int i = 0; i < days.length(); i++) {
            JSONObject d = days.optJSONObject(i);
            if (d == null) continue;
            if (d.optLong("start", 0L) <= now) found = d;
            else break;
        }
        return found != null ? found : days.optJSONObject(0);
    }

    /** اذان بعدی: {n نام، t ساعت، ms زمان دقیق} */
    public static JSONObject nextPrayer(JSONObject data, long now) {
        JSONArray days = data != null ? data.optJSONArray("days") : null;
        if (days == null) return null;
        for (int i = 0; i < days.length(); i++) {
            JSONObject d = days.optJSONObject(i);
            JSONArray times = d != null ? d.optJSONArray("times") : null;
            if (times == null) continue;
            for (int j = 0; j < times.length(); j++) {
                JSONObject t = times.optJSONObject(j);
                if (t != null && t.optLong("ms", 0L) > now) return t;
            }
        }
        return null;
    }

    /** نام نمازی که همین حالا وقتش است (از میان اوقات امروز) */
    public static String currentKey(JSONObject day, long now) {
        if (day == null) return "";
        JSONArray times = day.optJSONArray("times");
        if (times == null) return "";
        String cur = "";
        for (int i = 0; i < times.length(); i++) {
            JSONObject t = times.optJSONObject(i);
            if (t != null && t.optLong("ms", 0L) <= now) cur = t.optString("k", "");
        }
        return cur;
    }

    /** «صبح ۰۴:۴۲ · ظهر ۱۲:۰۷ · …» */
    public static String timesLine(JSONObject day, String sep) {
        if (day == null) return "";
        JSONArray times = day.optJSONArray("times");
        if (times == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < times.length(); i++) {
            JSONObject t = times.optJSONObject(i);
            if (t == null) continue;
            if (sb.length() > 0) sb.append(sep);
            sb.append(t.optString("n")).append(" ").append(t.optString("t"));
        }
        return sb.toString();
    }

    /** بازکردن برنامه (یا صفحهٔ اذان) با لمس ویجت */
    public static PendingIntent open(Context c, String action, int req) {
        Intent i = new Intent(c, MainActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        if (action != null) i.putExtra("niyazAction", "{\"action\":\"" + action + "\"}");
        int f = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) f |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(c, req, i, f);
    }

    /** متن «مانده تا اذان» را با کرنومتر خود اندروید زنده نگه می‌دارد */
    public static void chronoDown(android.widget.RemoteViews v, int viewId, long at) {
        try {
            if (Build.VERSION.SDK_INT >= 24) {
                v.setChronometerCountDown(viewId, true);
                v.setChronometer(viewId, at, null, true);
            } else {
                v.setViewVisibility(viewId, android.view.View.GONE);
            }
        } catch (Throwable ignored) { }
    }

    public static String safe(String s) {
        return s == null ? "" : s;
    }
}
