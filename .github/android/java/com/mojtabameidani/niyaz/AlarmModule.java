package com.mojtabameidani.niyaz;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * نیاز · پل بومی (Capacitor Plugin)
 * © Mojtaba Meidani — مجتبی میدانی
 *
 * همهٔ محاسبه‌های اوقات در جاوااسکریپت انجام می‌شود و این‌جا فقط:
 *   • زمان‌بندی آلارم‌ها به AlarmManager سپرده می‌شود،
 *   • اعلان دائمی تاریخ بالای صفحه روشن می‌ماند،
 *   • صفحهٔ اذان و پخش صدا در وقت نماز مدیریت می‌شود،
 *   • ویجت صفحهٔ اصلی به‌روز می‌شود.
 * به همین دلیل برنامه در پس‌زمینه هیچ پردازش پیوسته‌ای ندارد.
 */
@CapacitorPlugin(
        name = "AlarmModule",
        permissions = {
                @Permission(strings = { "android.permission.POST_NOTIFICATIONS" }, alias = "notifications")
        }
)
public class AlarmModule extends Plugin {

    public static final int VERSION = 1;

    @PluginMethod
    public void ping(PluginCall call) {
        call.resolve(status());
    }

    private JSObject status() {
        JSObject o = new JSObject();
        Context c = getContext();
        o.put("ok", true);
        o.put("version", VERSION);
        o.put("sdk", Build.VERSION.SDK_INT);
        o.put("exact", AlarmScheduler.canExact(c));
        o.put("notif", Notifier.notificationsAllowed(c));
        o.put("fullscreen", Notifier.canUseFullScreen(c));
        String[] nx = AlarmScheduler.nextPrayer(c);
        if (nx != null) {
            o.put("nextName", nx[0]);
            o.put("nextKey", nx[1]);
            o.put("nextAt", Long.parseLong(nx[2]));
        }
        return o;
    }

    /** ذخیرهٔ زمان‌بندی (زمان‌ها را برنامهٔ وب حساب کرده است) */
    @PluginMethod
    public void setConfig(PluginCall call) {
        Context c = getContext();
        String json = call.getString("json");
        if (json == null || json.length() < 2) {
            call.reject("json لازم است");
            return;
        }
        AlarmScheduler.writeJson(c, AlarmScheduler.KEY_SCHEDULE, json);
        int n = AlarmScheduler.schedule(c);
        boolean dateOn = true;
        try {
            org.json.JSONObject o = new org.json.JSONObject(json);
            dateOn = o.optBoolean("notifyDate", true);
        } catch (Throwable ignored) { }
        if (dateOn) AzanService.startDate(c);
        else AzanService.stop(c);
        JSObject res = status();
        res.put("scheduled", n);
        call.resolve(res);
    }

    /** به‌روزرسانی اطلاعات نمایشی: تاریخ‌ها و ویجت */
    @PluginMethod
    public void push(PluginCall call) {
        Context c = getContext();
        String schedule = call.getString("schedule");
        if (schedule != null && schedule.length() > 2) {
            AlarmScheduler.writeJson(c, AlarmScheduler.KEY_SCHEDULE, schedule);
            AlarmScheduler.schedule(c);
        }
        String dateinfo = call.getString("dateinfo");
        if (dateinfo != null && dateinfo.length() > 2) {
            AlarmScheduler.writeJson(c, AlarmScheduler.KEY_DATEINFO, dateinfo);
            boolean dateOn = true;
            org.json.JSONObject cfg = AlarmScheduler.readJson(c, AlarmScheduler.KEY_SCHEDULE);
            if (cfg != null) dateOn = cfg.optBoolean("notifyDate", true);
            if (dateOn) AzanService.startDate(c);
        }
        String widget = call.getString("widget");
        if (widget != null && widget.length() > 2) WidgetUpdate.push(c, widget);
        call.resolve(status());
    }

    @PluginMethod
    public void requestNotif(PluginCall call) {
        Context c = getContext();
        if (Build.VERSION.SDK_INT < 33) {
            JSObject o = new JSObject();
            o.put("granted", Notifier.notificationsAllowed(c));
            call.resolve(o);
            return;
        }
        requestPermissionForAlias("notifications", call, "notifCallback");
    }

    @PermissionCallback
    private void notifCallback(PluginCall call) {
        JSObject o = new JSObject();
        o.put("granted", Notifier.notificationsAllowed(getContext()));
        call.resolve(o);
    }

    /** آزمایش: mode = "notif" یا "azan" */
    @PluginMethod
    public void testAlarm(PluginCall call) {
        Context c = getContext();
        String mode = call.getString("mode", "notif");
        Intent i = new Intent(c, AlarmReceiver.class);
        i.setAction(AlarmScheduler.ACTION_ALARM);
        i.putExtra("id", 8888);
        if ("azan".equals(mode)) {
            i.putExtra("kind", "main");
            i.putExtra("k", "fajr");
            i.putExtra("n", "صبح");
            i.putExtra("title", "وقت اذان صبح (آزمایشی)");
            i.putExtra("body", "این یک آزمایش است؛ صفحهٔ اذان و پخش صدا را می‌آزماید.");
        } else if ("date".equals(mode)) {
            AzanService.startDate(c);
            call.resolve(status());
            return;
        } else {
            i.putExtra("kind", "test");
            i.putExtra("title", "نیاز · اعلان آزمایشی");
            i.putExtra("body", "اگر این پیام را می‌بینی، اعلان‌ها درست کار می‌کنند.");
        }
        long at = System.currentTimeMillis() + ("azan".equals(mode) ? 8000L : 5000L);
        int f = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) f |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pi = PendingIntent.getBroadcast(c, 8888, i, f);
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        try {
            if (AlarmScheduler.canExact(c) && Build.VERSION.SDK_INT >= 23) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            } else if (Build.VERSION.SDK_INT >= 19) {
                am.setExact(AlarmManager.RTC_WAKEUP, at, pi);
            } else {
                am.set(AlarmManager.RTC_WAKEUP, at, pi);
            }
        } catch (Throwable t) {
            try { am.set(AlarmManager.RTC_WAKEUP, at, pi); } catch (Throwable ignored) { }
        }
        JSObject o = status();
        o.put("delay", "azan".equals(mode) ? 8 : 5);
        call.resolve(o);
    }

    /** عملی که از صفحهٔ اذان آمده (نماز بخوان / متن اذان) */
    @PluginMethod
    public void consumeAction(PluginCall call) {
        Context c = getContext();
        String action = null;
        try {
            android.app.Activity a = getActivity();
            if (a != null && a.getIntent() != null) {
                action = a.getIntent().getStringExtra("niyazAction");
                if (action != null) a.getIntent().removeExtra("niyazAction");
            }
        } catch (Throwable ignored) { }
        if (action == null) {
            action = AlarmScheduler.prefs(c).getString(AlarmScheduler.KEY_ACTION, null);
            AlarmScheduler.prefs(c).edit().remove(AlarmScheduler.KEY_ACTION).apply();
        }
        JSObject o = new JSObject();
        o.put("action", action == null ? "" : action);
        call.resolve(o);
    }

    @PluginMethod
    public void clear(PluginCall call) {
        Context c = getContext();
        AlarmScheduler.cancelAll(c);
        AzanService.stop(c);
        call.resolve(status());
    }

    @PluginMethod
    public void startDate(PluginCall call) {
        AzanService.startDate(getContext());
        call.resolve(status());
    }

    @PluginMethod
    public void stopDate(PluginCall call) {
        AzanService.stop(getContext());
        call.resolve(status());
    }

    @PluginMethod
    public void stopAdhan(PluginCall call) {
        try {
            Intent i = new Intent(getContext(), AzanService.class);
            i.setAction(AzanService.ACTION_STOP_ALL);
            getContext().startService(i);
        } catch (Throwable ignored) { }
        call.resolve(status());
    }

    @PluginMethod
    public void refreshWidget(PluginCall call) {
        WidgetUpdate.redrawAll(getContext());
        call.resolve(status());
    }

    /** افزودن یکی از ویجت‌های نیاز به صفحهٔ اصلی (کلاسیک/کوچک/اوقات/هفته) */
    @PluginMethod
    public void addWidget(PluginCall call) {
        pin(call.getString("which", "classic"), call);
    }

    /** همان کار با نام تازه؛ برنامهٔ وب این را صدا می‌زند */
    @PluginMethod
    public void pinWidget(PluginCall call) {
        pin(call.getString("which", "classic"), call);
    }

    private void pin(String which, PluginCall call) {
        Context c = getContext();
        JSObject o = new JSObject();
        o.put("pinned", false);
        o.put("which", which);
        Class<?> cls = providerFor(which);
        try {
            if (Build.VERSION.SDK_INT >= 26) {
                AppWidgetManager m = AppWidgetManager.getInstance(c);
                if (m.isRequestPinAppWidgetSupported()) {
                    m.requestPinAppWidget(new ComponentName(c, cls), null, null);
                    o.put("pinned", true);
                }
            }
        } catch (Throwable ignored) { }
        call.resolve(o);
    }

    private static Class<?> providerFor(String which) {
        if ("mini".equals(which)) return NiyazWidgetMini.class;
        if ("times".equals(which)) return NiyazWidgetTimes.class;
        if ("week".equals(which)) return NiyazWidgetWeek.class;
        return NiyazWidgetProvider.class;
    }

    private void open(Intent i) {
        try {
            i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        } catch (Throwable ignored) { }
    }

    /** راهنمای دسترسی آلارم دقیق (اندروید ۱۲+) */
    @PluginMethod
    public void openExactSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 31) {
            open(new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + getContext().getPackageName())));
        }
        call.resolve(status());
    }

    /** راهنمای دسترسی صفحهٔ تمام‌صفحه (اندروید ۱۴+) */
    @PluginMethod
    public void openFullScreenSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 34) {
            open(new Intent("android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT", Uri.parse("package:" + getContext().getPackageName())));
        }
        call.resolve(status());
    }

    /** جلوگیری از بسته‌شدن برنامه توسط مدیریت باتری گوشی */
    @PluginMethod
    public void openBatterySettings(PluginCall call) {
        try {
            Intent i = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + getContext().getPackageName()));
            open(i);
        } catch (Throwable t) {
            try { open(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)); } catch (Throwable ignored) { }
        }
        call.resolve(status());
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        try {
            Intent i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
            i.putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
            open(i);
        } catch (Throwable t) {
            try {
                Intent i2 = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getContext().getPackageName()));
                open(i2);
            } catch (Throwable ignored) { }
        }
        call.resolve(status());
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        try {
            if (intent == null) return;
            String action = intent.getStringExtra("niyazAction");
            if (action != null) {
                intent.removeExtra("niyazAction");
                AlarmScheduler.prefs(getContext()).edit().putString(AlarmScheduler.KEY_ACTION, action).apply();
                JSObject o = new JSObject();
                o.put("action", action);
                notifyListeners("action", o, true);
            }
        } catch (Throwable ignored) { }
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        try {
            AlarmScheduler.reloadAndReschedule(getContext());
        } catch (Throwable ignored) { }
    }
}
