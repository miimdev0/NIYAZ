package com.mojtabameidani.niyaz;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * نیاز · ویجت «قضای من»
 * © Mojtaba Meidani — مجتبی میدانی
 *
 * تعداد نمازهای قضا و اولین قضاها را نشان می‌دهد. داده را خودِ برنامهٔ وب
 * در payload ویجت می‌گذارد (کلید qaza) و این ویجت فقط نمایش می‌دهد.
 */
public class NiyazWidgetQaza extends AppWidgetProvider {

    private static final int[] NAME_IDS = { R.id.w5_n1, R.id.w5_n2, R.id.w5_n3 };
    private static final int[] WHEN_IDS = { R.id.w5_t1, R.id.w5_t2, R.id.w5_t3 };
    private static final int GOLD = Color.parseColor("#FFF4C25B");
    private static final int DIM = Color.parseColor("#FF9FB4D8");
    private static final int LIGHT = Color.parseColor("#FFEAF1FF");
    private static final int TEAL = Color.parseColor("#FF5FD3D0");

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        for (int i = 0; i < ids.length; i++) {
            try {
                m.updateAppWidget(ids[i], render(c, ids[i]));
            } catch (Throwable ignored) { }
        }
    }

    public static void redraw(Context c) {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(c);
            int[] ids = m.getAppWidgetIds(new android.content.ComponentName(c, NiyazWidgetQaza.class));
            for (int i = 0; i < ids.length; i++) m.updateAppWidget(ids[i], render(c, ids[i]));
        } catch (Throwable ignored) { }
    }

    public static RemoteViews render(Context c, int widgetId) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.niyaz_widget_qaza);
        JSONObject data = WidgetKit.data(c);
        JSONObject q = data != null ? data.optJSONObject("qaza") : null;

        int count = q != null ? q.optInt("count", 0) : 0;
        String first = q != null ? q.optString("first", "") : "";
        String when = q != null ? q.optString("when", "") : "";

        if (count <= 0) {
            v.setTextViewText(R.id.w5_title, "قضای نماز");
            v.setTextViewText(R.id.w5_count, "نداری 🌱");
            v.setTextColor(R.id.w5_count, TEAL);
        } else {
            v.setTextViewText(R.id.w5_title, "قضای نماز · " + toFa(count) + " نماز");
            v.setTextViewText(R.id.w5_count, first.length() > 0 ? "اول: قضای " + first + (when.length() > 0 ? " · " + when : "") : "در اولین فرصت بخوان");
            v.setTextColor(R.id.w5_count, GOLD);
        }

        JSONArray list = q != null ? q.optJSONArray("list") : null;
        for (int i = 0; i < NAME_IDS.length; i++) {
            JSONObject it = list != null && i < list.length() ? list.optJSONObject(i) : null;
            if (it == null) {
                v.setTextViewText(NAME_IDS[i], i == 0 && count > 0 ? first : "");
                v.setTextViewText(WHEN_IDS[i], "");
                continue;
            }
            v.setTextViewText(NAME_IDS[i], "قضای " + it.optString("n"));
            v.setTextViewText(WHEN_IDS[i], it.optString("w"));
            v.setTextColor(NAME_IDS[i], i == 0 ? GOLD : LIGHT);
            v.setTextColor(WHEN_IDS[i], DIM);
        }

        Intent go = new Intent(c, MainActivity.class);
        go.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int f = PendingIntent.FLAG_UPDATE_CURRENT;
        if (android.os.Build.VERSION.SDK_INT >= 23) f |= PendingIntent.FLAG_IMMUTABLE;
        v.setOnClickPendingIntent(R.id.w5_root, PendingIntent.getActivity(c, 25, go, f));
        return v;
    }

    /** عدد را با رقم‌های فارسی می‌نویسد: ۶ → «۶» */
    private static String toFa(int n) {
        char[] fa = { '۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹' };
        String s = String.valueOf(n);
        StringBuilder b = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            b.append(ch >= '0' && ch <= '9' ? fa[ch - '0'] : ch);
        }
        return b.toString();
    }
}
