package com.mojtabameidani.niyaz;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.graphics.Color;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * نیاز · ویجت اوقات امروز: پنج وقت نماز، وقت فعلی برجسته
 * © Mojtaba Meidani — مجتبی میدانی
 */
public class NiyazWidgetTimes extends AppWidgetProvider {

    private static final int GOLD = 0xFFF4C25B;
    private static final int LIGHT = 0xFFEAF1FF;
    private static final int NAME = 0xFF9FB4D8;

    private static final int[] NAME_IDS = { R.id.w3_n1, R.id.w3_n2, R.id.w3_n3, R.id.w3_n4, R.id.w3_n5 };
    private static final int[] TIME_IDS = { R.id.w3_t1, R.id.w3_t2, R.id.w3_t3, R.id.w3_t4, R.id.w3_t5 };

    @Override
    public void onUpdate(Context c, AppWidgetManager manager, int[] ids) {
        RemoteViews v = build(c);
        for (int id : ids) {
            try { manager.updateAppWidget(id, v); } catch (Throwable ignored) { }
        }
    }

    public static void redraw(Context c) {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(c);
            int[] ids = m.getAppWidgetIds(new ComponentName(c, NiyazWidgetTimes.class));
            if (ids == null || ids.length == 0) return;
            RemoteViews v = build(c);
            for (int id : ids) m.updateAppWidget(id, v);
        } catch (Throwable ignored) { }
    }

    private static RemoteViews build(Context c) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.niyaz_widget_times);
        v.setOnClickPendingIntent(R.id.w3_root, WidgetKit.open(c, null, 31));

        JSONObject data = WidgetKit.data(c);
        long now = System.currentTimeMillis();
        JSONObject day = WidgetKit.dayAt(data, now);
        if (day == null) {
            v.setTextViewText(R.id.w3_title, "نیاز");
            v.setTextViewText(R.id.w3_moon, "");
            v.setTextViewText(R.id.w3_occ, "برنامه را یک‌بار باز کن تا اوقات به‌روز شود.");
            for (int i = 0; i < NAME_IDS.length; i++) {
                v.setTextViewText(NAME_IDS[i], "");
                v.setTextViewText(TIME_IDS[i], "--:--");
            }
            return v;
        }

        v.setTextViewText(R.id.w3_title, day.optString("wdf") + " · " + day.optString("js"));
        v.setTextViewText(R.id.w3_moon, data.optString("moon"));

        String curKey = WidgetKit.currentKey(day, now);
        JSONArray times = day.optJSONArray("times");
        int n = times != null ? times.length() : 0;
        for (int i = 0; i < NAME_IDS.length; i++) {
            if (i < n) {
                JSONObject t = times.optJSONObject(i);
                String k = t != null ? t.optString("k") : "";
                v.setTextViewText(NAME_IDS[i], t != null ? t.optString("n") : "");
                v.setTextViewText(TIME_IDS[i], t != null ? t.optString("t") : "--:--");
                v.setTextColor(TIME_IDS[i], k.equals(curKey) ? GOLD : LIGHT);
                v.setTextColor(NAME_IDS[i], k.equals(curKey) ? GOLD : NAME);
            } else {
                v.setTextViewText(NAME_IDS[i], "");
                v.setTextViewText(TIME_IDS[i], "");
            }
        }

        String occ = day.optString("occ", "");
        v.setTextViewText(R.id.w3_occ, occ != null && occ.length() > 0 ? occ : WidgetKit.timesLine(day, " · "));
        return v;
    }
}
