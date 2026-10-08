package com.mojtabameidani.niyaz;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import org.json.JSONObject;

/**
 * نیاز · ساخت اعلان‌ها و کانال‌ها
 * © Mojtaba Meidani — مجتبی میدانی
 */
public final class Notifier {

    public static final String C_DATE = "niyaz_date_v1";
    public static final String C_ADHAN = "niyaz_adhan_v3";
    public static final String C_ADHAN_SND = "niyaz_adhan_snd_v1";
    public static final String C_SOFT = "niyaz_soft_v3";
    public static final String C_DEFAULT = "niyaz_default_v1";
    public static final String C_INFO = "niyaz_info_v1";

    public static final int ID_DATE = 1001;
    public static final int ID_ADHAN = 1002;
    public static final int ID_TEST = 1003;
    public static final int ID_MINOR = 1200;

    private Notifier() { }

    private static int rawId(Context c, String name) {
        try {
            return c.getResources().getIdentifier(name, "raw", c.getPackageName());
        } catch (Throwable t) {
            return 0;
        }
    }

    public static Uri sortedUri(Context c, String raw, Uri fallback) {
        int id = rawId(c, raw);
        if (id != 0) return Uri.parse("android.resource://" + c.getPackageName() + "/raw/" + raw);
        return fallback;
    }

    public static void ensureChannels(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        AudioAttributes attrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();

        // اعلان دائمی تاریخ — بی‌صدا و کم‌اهمیت تا باتری و حواس را نگیرد
        NotificationChannel date = new NotificationChannel(C_DATE, "تاریخ و اوقات (دائمی)", NotificationManager.IMPORTANCE_LOW);
        date.setDescription("نمایش همیشگی تاریخ شمسی، میلادی و قمری و اوقات نماز");
        date.setShowBadge(false);
        date.setSound(null, null);
        date.enableVibration(false);
        date.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(date);

        // صفحهٔ اذان — خودِ برنامه صدا را پخش می‌کند، پس کانال بی‌صدا است
        NotificationChannel adhan = new NotificationChannel(C_ADHAN, "اذان (صفحهٔ تمام‌صفحه)", NotificationManager.IMPORTANCE_HIGH);
        adhan.setDescription("باز شدن صفحهٔ اذان در وقت نماز");
        adhan.setSound(null, null);
        adhan.enableVibration(true);
        adhan.setVibrationPattern(new long[] { 0, 400, 200, 400 });
        adhan.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(adhan);

        // پشتیبان: اگر پخش صدا در پس‌زمینه ممکن نبود، صدا روی خود اعلان می‌نشیند
        NotificationChannel adhanSnd = new NotificationChannel(C_ADHAN_SND, "اذان با صدای اعلان", NotificationManager.IMPORTANCE_HIGH);
        adhanSnd.setDescription("پخش صدای اذان از روی اعلان");
        adhanSnd.setSound(sortedUri(c, "azan", RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)), attrs);
        adhanSnd.enableVibration(true);
        adhanSnd.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(adhanSnd);

        NotificationChannel soft = new NotificationChannel(C_SOFT, "یادآوری ملایم", NotificationManager.IMPORTANCE_DEFAULT);
        soft.setDescription("یادآوری پیش از وقت، اقامه و طلوع آفتاب");
        soft.setSound(sortedUri(c, "soft", RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)), attrs);
        nm.createNotificationChannel(soft);

        NotificationChannel def = new NotificationChannel(C_DEFAULT, "اعلان‌های نیاز", NotificationManager.IMPORTANCE_HIGH);
        def.setDescription("اعلان‌های عمومی برنامه");
        def.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION), attrs);
        nm.createNotificationChannel(def);

        NotificationChannel info = new NotificationChannel(C_INFO, "پیام‌های برنامه", NotificationManager.IMPORTANCE_DEFAULT);
        info.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION), attrs);
        nm.createNotificationChannel(info);
    }

    public static PendingIntent openApp(Context c) {
        Intent i = new Intent(c, MainActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int f = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) f |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(c, 100, i, f);
    }

    public static Intent actionIntent(Context c, String action, String extraKey, String extraVal) {
        Intent i = new Intent(c, AzanService.class);
        i.setAction(action);
        if (extraKey != null) i.putExtra(extraKey, extraVal);
        return i;
    }

    private static PendingIntent servicePi(Context c, int code, String action) {
        Intent i = new Intent(c, AzanService.class);
        i.setAction(action);
        int f = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) f |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getService(c, code, i, f);
    }

    public static PendingIntent azanScreen(Context c, JSONObject payload) {
        Intent i = new Intent(c, AzanActivity.class);
        if (payload != null) {
            i.putExtra("k", payload.optString("k"));
            i.putExtra("n", payload.optString("n"));
            i.putExtra("title", payload.optString("title"));
            i.putExtra("body", payload.optString("body"));
            i.putExtra("at", payload.optLong("at", System.currentTimeMillis()));
        }
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS);
        int f = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) f |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(c, 200, i, f);
    }

    /** اعلان دائمی تاریخ (SERVICE) */
    public static Notification dateNotification(Context c, JSONObject info) {
        ensureChannels(c);
        String j = info != null ? info.optString("j", "") : "";
        String h = info != null ? info.optString("h", "") : "";
        String g = info != null ? info.optString("g", "") : "";
        String occ = info != null ? info.optString("occ", "") : "";
        String loc = info != null ? info.optString("loc", "") : "";

        NotificationCompat.Builder b = new NotificationCompat.Builder(c, C_DATE)
                .setSmallIcon(R.drawable.ic_stat_niyaz)
                .setContentTitle("نیاز · " + j)
                .setContentText(h + (g.length() > 0 ? " · " + g : ""))
                .setStyle(new NotificationCompat.BigTextStyle().bigText(
                        (h.length() > 0 ? h : "") + "\n" + (g.length() > 0 ? g : "") +
                        (occ.length() > 0 ? "\n" + occ : "") +
                        (loc.length() > 0 ? "\n" + loc : "")))
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setShowWhen(false)
                .setContentIntent(openApp(c))
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC);

        String[] nx = AlarmScheduler.nextPrayer(c);
        if (nx != null) {
            long at = 0;
            try { at = Long.parseLong(nx[2]); } catch (Throwable ignored) { }
            b.setSubText("تا اذان " + nx[0]);
            if (Build.VERSION.SDK_INT >= 24 && at > System.currentTimeMillis()) {
                b.setWhen(at);
                b.setUsesChronometer(true);
                b.setChronometerCountDown(true);
            }
        } else {
            b.setSubText(loc.length() > 0 ? loc : "نیاز");
        }
        return b.build();
    }

    /** اعلان وقت نماز با صفحهٔ تمام‌صفحه */
    public static Notification prayerNotification(Context c, String title, String body, JSONObject payload, boolean playSound, PendingIntent stopAction) {
        ensureChannels(c);
        String channel = playSound ? C_ADHAN_SND : C_ADHAN;
        NotificationCompat.Builder b = new NotificationCompat.Builder(c, channel)
                .setSmallIcon(R.drawable.ic_stat_niyaz)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setShowWhen(true)
                .setWhen(payload != null ? payload.optLong("at", System.currentTimeMillis()) : System.currentTimeMillis())
                .setContentIntent(azanScreen(c, payload))
                .setFullScreenIntent(azanScreen(c, payload), true);
        if (stopAction != null) {
            b.addAction(android.R.drawable.ic_media_pause, "قطع اذان", stopAction);
        }
        b.setDeleteIntent(stopAction);
        return b.build();
    }

    /** اعلان‌های کوچک: یادآوری قبل از وقت، اقامه، طلوع */
    public static Notification minorNotification(Context c, String title, String body, String sound, PendingIntent pi) {
        ensureChannels(c);
        String channel = sound != null && sound.equals("azan") ? C_ADHAN_SND
                : (sound != null && sound.equals("default") ? C_DEFAULT : C_SOFT);
        NotificationCompat.Builder b = new NotificationCompat.Builder(c, channel)
                .setSmallIcon(R.drawable.ic_stat_niyaz)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setContentIntent(openApp(c));
        if (pi != null) b.setContentIntent(pi);
        return b.build();
    }

    public static Notification infoNotification(Context c, String title, String body) {
        ensureChannels(c);
        return new NotificationCompat.Builder(c, C_INFO)
                .setSmallIcon(R.drawable.ic_stat_niyaz)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setAutoCancel(true)
                .setContentIntent(openApp(c))
                .build();
    }

    public static void show(Context c, int id, Notification n) {
        try {
            NotificationManagerCompat.from(c).notify(id, n);
        } catch (Throwable ignored) { }
    }

    public static void cancel(Context c, int id) {
        try {
            NotificationManagerCompat.from(c).cancel(id);
        } catch (Throwable ignored) { }
    }

    public static boolean notificationsAllowed(Context c) {
        try {
            return NotificationManagerCompat.from(c).areNotificationsEnabled();
        } catch (Throwable t) {
            return true;
        }
    }

    public static boolean canUseFullScreen(Context c) {
        if (Build.VERSION.SDK_INT >= 34) {
            try {
                NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
                return nm != null && nm.canUseFullScreenIntent();
            } catch (Throwable t) {
                return true;
            }
        }
        return true;
    }
}
