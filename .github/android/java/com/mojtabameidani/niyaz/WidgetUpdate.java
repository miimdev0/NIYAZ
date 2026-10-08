package com.mojtabameidani.niyaz;

import android.content.Context;

import org.json.JSONObject;

/**
 * نیاز · به‌روزرسانی ویجت صفحهٔ اصلی
 * © Mojtaba Meidani — مجتبی میدانی
 */
public final class WidgetUpdate {

    private WidgetUpdate() { }

    public static void push(Context c, JSONObject payload) {
        if (payload == null) return;
        AlarmScheduler.writeJson(c, AlarmScheduler.KEY_WIDGET, payload.toString());
        redrawAll(c);
    }

    /** هر چهار ویجت نیاز را تازه می‌کند */
    public static void redrawAll(Context c) {
        NiyazWidgetProvider.redraw(c);
        NiyazWidgetMini.redraw(c);
        NiyazWidgetTimes.redraw(c);
        NiyazWidgetWeek.redraw(c);
    }

    public static void push(Context c, String payload) {
        if (payload == null || payload.length() < 2) return;
        try {
            push(c, new JSONObject(payload));
        } catch (Throwable ignored) { }
    }
}
