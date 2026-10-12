package com.mojtabameidani.niyaz;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import org.json.JSONObject;

/**
 * نیاز · گیرندهٔ آلارم‌ها
 * © Mojtaba Meidani — مجتبی میدانی
 */
public class AlarmReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context c, Intent i) {
        if (i == null) return;
        try {
            if (i.getBooleanExtra("refresh", false)) {
                AlarmScheduler.schedule(c);           // نگه‌داشت زمان‌بندی‌ها
                WidgetUpdate.redrawAll(c);
                return;
            }
            String kind = i.getStringExtra("kind");
            String n = i.getStringExtra("n");
            String k = i.getStringExtra("k");
            String title = i.getStringExtra("title");
            String body = i.getStringExtra("body");
            int id = i.getIntExtra("id", 1);
            long at = System.currentTimeMillis();

            JSONObject cfg = AlarmScheduler.readJson(c, AlarmScheduler.KEY_SCHEDULE);
            String sound = cfg != null ? cfg.optString("sound", "azan") : "azan";
            boolean playAdhan = cfg == null || cfg.optBoolean("playAdhan", true);
            boolean azanScreen = cfg == null || cfg.optBoolean("azanScreen", true);
            boolean notifyDate = cfg == null || cfg.optBoolean("notifyDate", true);

            if ("test".equals(kind)) {
                Notifier.show(c, Notifier.ID_TEST, Notifier.infoNotification(c,
                        title != null ? title : "نیاز · آزمایش",
                        body != null ? body : "اگر این پیام را می‌بینی، اعلان‌ها درست کار می‌کنند."));
                return;
            }

            if ("main".equals(kind)) {
                /* حالت پخش این نماز را خودِ برنامه تعیین می‌کند:
                   azan = صدای اذان از سرویس · notif = اعلان با صدای پیش‌فرض گوشی ·
                   silent = اعلان بی‌صدا (کاربر اذان این نماز را خاموش کرده). */
                String itemSound = i.getStringExtra("sound");
                if (itemSound != null && itemSound.length() > 0) sound = itemSound;
                String mode = i.getStringExtra("mode");
                if (mode == null || mode.length() == 0) {
                    mode = "none".equals(sound) ? "silent"
                            : ((playAdhan && ("azan".equals(sound) || "soft".equals(sound))) ? "azan" : "notif");
                }
                boolean wantsAzan = "azan".equals(mode) || "azan_snd".equals(mode);
                boolean screen = wantsAzan && i.getBooleanExtra("screen", azanScreen);
                if (!wantsAzan) {
                    /* هیچ صدای اذانی پخش نمی‌شود؛ فقط اعلان (با صدا یا بی‌صدا) */
                    JSONObject payload = new JSONObject();
                    try {
                        payload.put("k", k); payload.put("n", n);
                        payload.put("title", title); payload.put("body", body); payload.put("at", at);
                    } catch (Throwable ignored) { }
                    Notifier.show(c, Notifier.ID_ADHAN, Notifier.prayerNotification(c,
                            title, body, payload, null, mode, false));
                    NiyazWidgetProvider.redraw(c);
                    return;
                }
                boolean nativeAudio = true;
                Intent svc = new Intent(c, AzanService.class);
                svc.setAction(AzanService.ACTION_PLAY);
                svc.putExtra("k", k);
                svc.putExtra("n", n);
                svc.putExtra("title", title);
                svc.putExtra("body", body);
                svc.putExtra("at", at);
                svc.putExtra("sound", "soft".equals(sound) ? "soft" : "azan");
                svc.putExtra("screen", screen);
                svc.putExtra("audio", nativeAudio);
                svc.putExtra("mode", mode);
                boolean started = false;
                try {
                    if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(svc);
                    else c.startService(svc);
                    started = true;
                } catch (Throwable t) {
                    started = false;
                }
                if (!started) {
                    // پشتیبان: خود اعلان صدا دارد و با لمس، صفحهٔ اذان باز می‌شود
                    JSONObject payload = new JSONObject();
                    payload.put("k", k); payload.put("n", n); payload.put("title", title);
                    payload.put("body", body); payload.put("at", at);
                    Notifier.show(c, Notifier.ID_ADHAN, Notifier.prayerNotification(c,
                            title, body, payload, null, mode, false));
                }
                NiyazWidgetProvider.redraw(c);
                return;
            }

            // یادآوری‌های کوچک: پیش از وقت، اقامه، طلوع آفتاب
            Notifier.show(c, Notifier.ID_MINOR + id, Notifier.minorNotification(c,
                    title, body, "soft", Notifier.openApp(c)));
        } catch (Throwable t) {
            try {
                Notifier.show(c, Notifier.ID_TEST, Notifier.infoNotification(c, "نیاز", "اعلان زمان‌بندی‌شده اجرا شد."));
            } catch (Throwable ignored) { }
        }
    }
}
