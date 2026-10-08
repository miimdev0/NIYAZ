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
 * نیاز · ویجت هفتگی: هفت روز آینده با تاریخ شمسی و مناسبت‌ها
 * © Mojtaba Meidani — مجتبی میدانی
 */
public class NiyazWidgetWeek extends AppWidgetProvider {

    private static final int GOLD = 0xFFF4C25B;
    private static final int LIGHT = 0xFFEAF1FF;
    private static final int DIM = 0xFF9FB4D8;
    private static final int HOLIDAY = 0xFFFF8A8A;

    private static final int[] DAY_IDS = { R.id.w4_d1, R.id.w4_d2, R.id.w4_d3, R.id.w4_d4, R.id.w4_d5, R.id.w4_d6, R.id.w4_d7 };
    private static final int[] WD_IDS = { R.id.w4_w1, R.id.w4_w2, R.id.w4_w3, R.id.w4_w4, R.id.w4_w5, R.id.w4_w6, R.id.w4_w7 };

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
            int[] ids = m.getAppWidgetIds(new ComponentName(c, NiyazWidgetWeek.class));
            if (ids == null || ids.length == 0) return;
            RemoteViews v = build(c);
            for (int id : ids) m.updateAppWidget(id, v);
        } catch (Throwable ignored) { }
    }

    private static RemoteViews build(Context c) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.niyaz_widget_week);
        v.setOnClickPendingIntent(R.id.w4_root, WidgetKit.open(c, null, 41));

        JSONObject data = WidgetKit.data(c);
        long now = System.currentTimeMillis();
        JSONObject day = WidgetKit.dayAt(data, now);
        JSONObject next = WidgetKit.nextPrayer(data, now);
        if (day == null) {
            v.setTextViewText(R.id.w4_title, "نیاز");
            v.setTextViewText(R.id.w4_next, "برنامه را یک‌بار باز کن تا تقویم پر شود.");
            for (int i = 0; i < DAY_IDS.length; i++) {
                v.setTextViewText(DAY_IDS[i], "—");
                v.setTextViewText(WD_IDS[i], "");
            }
            return v;
        }

        v.setTextViewText(R.id.w4_title, "هفتهٔ پیشِ رو · " + (next != null ? "اذان " + next.optString("n") + " " + next.optString("t") : data.optString("loc")));

        JSONArray week = data.optJSONArray("week");
        for (int i = 0; i < DAY_IDS.length; i++) {
            JSONObject d = week != null && i < week.length() ? week.optJSONObject(i) : null;
            if (d == null) {
                v.setTextViewText(DAY_IDS[i], "—");
                v.setTextViewText(WD_IDS[i], "");
                continue;
            }
            v.setTextViewText(DAY_IDS[i], d.optString("dn"));
            v.setTextViewText(WD_IDS[i], d.optString("wd"));
            boolean today = i == 0;
            v.setTextColor(DAY_IDS[i], today ? GOLD : (d.optBoolean("off") ? HOLIDAY : LIGHT));
            v.setTextColor(WD_IDS[i], today ? GOLD : DIM);
        }
        String occ = day.optString("occ", "");
        v.setTextViewText(R.id.w4_next, occ.length() > 0 ? occ : WidgetKit.timesLine(day, " · "));
        return v;
    }
}
