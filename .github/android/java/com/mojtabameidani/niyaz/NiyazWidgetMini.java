package com.mojtabameidani.niyaz;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * نیاز · ویجت کوچک: اذان بعدی + شمارش معکوس زنده
 * © Mojtaba Meidani — مجتبی میدانی
 */
public class NiyazWidgetMini extends AppWidgetProvider {

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
            int[] ids = m.getAppWidgetIds(new ComponentName(c, NiyazWidgetMini.class));
            if (ids == null || ids.length == 0) return;
            RemoteViews v = build(c);
            for (int id : ids) m.updateAppWidget(id, v);
        } catch (Throwable ignored) { }
    }

    private static RemoteViews build(Context c) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.niyaz_widget_mini);
        v.setOnClickPendingIntent(R.id.w2_root, WidgetKit.open(c, null, 21));

        JSONObject data = WidgetKit.data(c);
        long now = System.currentTimeMillis();
        JSONObject day = WidgetKit.dayAt(data, now);
        JSONObject next = WidgetKit.nextPrayer(data, now);
        if (next == null) {
            v.setTextViewText(R.id.w2_k, "نیاز");
            v.setTextViewText(R.id.w2_t, "--:--");
            v.setTextViewText(R.id.w2_d, "برنامه را باز کن");
            v.setViewVisibility(R.id.w2_c, View.GONE);
            return v;
        }
        v.setTextViewText(R.id.w2_k, "اذان " + next.optString("n"));
        v.setTextViewText(R.id.w2_t, next.optString("t"));
        v.setTextViewText(R.id.w2_d, day != null ? day.optString("hs") : "");
        WidgetKit.chronoDown(v, R.id.w2_c, next.optLong("ms", now));
        return v;
    }
}
