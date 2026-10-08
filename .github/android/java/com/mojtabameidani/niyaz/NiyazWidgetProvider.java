package com.mojtabameidani.niyaz;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * نیاز · ویجت صفحهٔ اصلی
 * تاریخ شمسی، میلادی و قمری + نماز بعدی و مناسبت امروز.
 * © Mojtaba Meidani — مجتبی میدانی
 */
public class NiyazWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context c, AppWidgetManager manager, int[] ids) {
        RemoteViews views = build(c);
        for (int id : ids) {
            try { manager.updateAppWidget(id, views); } catch (Throwable ignored) { }
        }
    }

    public static void redraw(Context c) {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(c);
            int[] ids = m.getAppWidgetIds(new ComponentName(c, NiyazWidgetProvider.class));
            if (ids == null || ids.length == 0) return;
            RemoteViews v = build(c);
            for (int id : ids) m.updateAppWidget(id, v);
        } catch (Throwable ignored) { }
    }

    private static PendingIntent open(Context c, String action) {
        return WidgetKit.open(c, action, action == null ? 10 : 11);
    }

    private static RemoteViews build(Context c) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.niyaz_widget);
        v.setOnClickPendingIntent(R.id.w_root, open(c, null));
        v.setOnClickPendingIntent(R.id.w_logo, open(c, null));

        JSONObject data = WidgetKit.data(c);
        if (data == null) {
            v.setTextViewText(R.id.w_j, "نیاز");
            v.setTextViewText(R.id.w_h, "برای فعال‌شدن، برنامه را باز کن");
            v.setTextViewText(R.id.w_g, "");
            v.setViewVisibility(R.id.w_occ, View.GONE);
            v.setTextViewText(R.id.w_pn, "");
            v.setTextViewText(R.id.w_pt, "");
            v.setTextViewText(R.id.w_loc, "");
            return v;
        }

        long now = System.currentTimeMillis();
        JSONArray days = data.optJSONArray("days");
        JSONObject day = null;
        if (days != null) {
            for (int i = 0; i < days.length(); i++) {
                JSONObject d = days.optJSONObject(i);
                if (d == null) continue;
                if (d.optLong("start", 0) <= now) day = d;
            }
            if (day == null && days.length() > 0) day = days.optJSONObject(0);
        }

        v.setTextViewText(R.id.w_j, data.optString("brand", "نیاز") + " · " + (day != null ? day.optString("j") : ""));
        v.setTextViewText(R.id.w_h, day != null ? day.optString("h") : "");
        v.setTextViewText(R.id.w_g, day != null ? day.optString("g") : "");
        String occ = day != null ? day.optString("occ", "") : "";
        if (occ == null || occ.length() == 0) v.setViewVisibility(R.id.w_occ, View.GONE);
        else { v.setViewVisibility(R.id.w_occ, View.VISIBLE); v.setTextViewText(R.id.w_occ, occ); }

        String pn = "—", pt = "";
        if (day != null) {
            JSONArray times = day.optJSONArray("times");
            if (times != null) {
                for (int i = 0; i < times.length(); i++) {
                    JSONObject t = times.optJSONObject(i);
                    if (t == null) continue;
                    if (t.optLong("ms", 0) > now) { pn = t.optString("n"); pt = t.optString("t"); break; }
                }
                if (pt.length() == 0 && days != null && days.length() > 0) {
                    JSONObject nd = null;
                    for (int i = 0; i < days.length(); i++) {
                        JSONObject d = days.optJSONObject(i);
                        if (d != null && d.optLong("start", 0) > now) { nd = d; break; }
                    }
                    if (nd == null) nd = days.optJSONObject(0);
                    JSONArray t2 = nd != null ? nd.optJSONArray("times") : null;
                    if (t2 != null && t2.length() > 0) {
                        JSONObject t = t2.optJSONObject(0);
                        if (t != null) { pn = t.optString("n"); pt = t.optString("t"); }
                    }
                }
            }
        }
        v.setTextViewText(R.id.w_pn, pt.length() > 0 ? "اذان " + pn : pn);
        v.setTextViewText(R.id.w_pt, pt);
        v.setTextViewText(R.id.w_loc, data.optString("loc", "") + (data.optString("moon", "").length() > 0 ? " · " + data.optString("moon") : ""));
        return v;
    }
}
