package com.mojtabameidani.niyaz;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

import org.json.JSONObject;

/**
 * نیاز · سرویس پیش‌زمینه
 * © Mojtaba Meidani — مجتبی میدانی
 *
 * دو کار انجام می‌دهد و بس:
 *   ۱) اعلان دائمی تاریخ (شمسی/میلادی/قمری) و اوقات نماز را نشان می‌دهد.
 *      شمارش معکوس با Chronometer خود سیستم انجام می‌شود؛ پس هیچ بیدارباش یا
 *      محاسبهٔ پیوسته‌ای لازم نیست و مصرف باتری ناچیز است.
 *   ۲) در وقت نماز، صفحهٔ اذان را باز می‌کند و صدای اذان را پخش می‌کند.
 * بقیهٔ محاسبات زمان‌بندی در AlarmManager انجام شده است.
 */
public class AzanService extends Service {

    public static final String ACTION_TICK = "com.mojtabameidani.niyaz.TICK";
    public static final String ACTION_PLAY = "com.mojtabameidani.niyaz.PLAY";
    public static final String ACTION_STOP = "com.mojtabameidani.niyaz.STOP";
    public static final String ACTION_STOP_ALL = "com.mojtabameidani.niyaz.STOP_ALL";
    public static final String ACTION_DATE = "com.mojtabameidani.niyaz.DATE";
    public static final String ACTION_START = "com.mojtabameidani.niyaz.START";

    /** وضعیت پخش برای صفحهٔ اذان (هم‌فرایند است) */
    public static volatile boolean isPlaying = false;

    private MediaPlayer mp;
    private boolean playing = false;
    private long lastNotifUpdate = 0L;
    private String cachedNext = "";
    private Handler handler;
    private JSONObject sessionInfo;
    private boolean sessionActive = false;

    private final Runnable ticker = new Runnable() {
        @Override
        public void run() {
            tick();
            handler.postDelayed(this, 60000L);   // هر دقیقه یک بررسی سبک
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        handler = new Handler(Looper.getMainLooper());
        Notifier.ensureChannels(this);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        boolean startDate = isDateEnabled();

        if (ACTION_PLAY.equals(action)) {
            sessionActive = true;
            sessionInfo = buildSession(intent);
            if (sessionInfo.optBoolean("screen", true)) openScreen();
            postPrayerNotification(sessionInfo);
            boolean onlyIfSilent = intent != null && intent.getBooleanExtra("onlyIfSilent", false);
            if (sessionInfo.optBoolean("audio", true) && !(onlyIfSilent && playing)) {
                play(sessionInfo.optString("sound", "azan"));
            }
        } else if (ACTION_STOP.equals(action)) {
            stopAudio();
            Notifier.cancel(this, Notifier.ID_ADHAN);
            sessionActive = false;
        } else if (ACTION_STOP_ALL.equals(action)) {
            stopAudio();
            Notifier.cancel(this, Notifier.ID_ADHAN);
            sessionActive = false;
        }

        if (startDate || sessionActive) {
            goForeground();
        } else {
            // باید سریع startForeground صدا زده شود؛ بعد خودمان را می‌بندیم
            startForeground(Notifier.ID_DATE, Notifier.dateNotification(this, dateInfo()));
            stopSelf();
            return START_NOT_STICKY;
        }

        handler.removeCallbacks(ticker);
        handler.post(ticker);
        return START_STICKY;
    }

    private boolean isDateEnabled() {
        JSONObject cfg = AlarmScheduler.readJson(this, AlarmScheduler.KEY_SCHEDULE);
        return cfg == null || cfg.optBoolean("notifyDate", true);
    }

    private JSONObject dateInfo() {
        JSONObject o = AlarmScheduler.readJson(this, AlarmScheduler.KEY_DATEINFO);
        return o != null ? o : new JSONObject();
    }

    private JSONObject buildSession(Intent intent) {
        JSONObject o = new JSONObject();
        try {
            o.put("k", intent.getStringExtra("k"));
            o.put("n", intent.getStringExtra("n"));
            o.put("title", intent.getStringExtra("title"));
            o.put("body", intent.getStringExtra("body"));
            o.put("at", intent.getLongExtra("at", System.currentTimeMillis()));
            o.put("sound", intent.getStringExtra("sound") != null ? intent.getStringExtra("sound") : "azan");
            o.put("screen", intent.getBooleanExtra("screen", true));
            o.put("audio", intent.getBooleanExtra("audio", true));
        } catch (Throwable ignored) { }
        return o;
    }

    private void goForeground() {
        try {
            if (isDateEnabled()) {
                startForeground(Notifier.ID_DATE, Notifier.dateNotification(this, dateInfo()));
            } else if (sessionInfo != null) {
                startForeground(Notifier.ID_ADHAN, Notifier.prayerNotification(this,
                        sessionInfo.optString("title"), sessionInfo.optString("body"), sessionInfo,
                        !sessionInfo.optBoolean("audio", true), stopPending()));
            } else {
                startForeground(Notifier.ID_DATE, Notifier.dateNotification(this, dateInfo()));
            }
        } catch (Throwable t) {
            try {
                startForeground(Notifier.ID_DATE, Notifier.dateNotification(this, dateInfo()));
            } catch (Throwable ignored) { }
        }
    }

    private android.app.PendingIntent stopPending() {
        Intent i = new Intent(this, AzanService.class);
        i.setAction(ACTION_STOP_ALL);
        int f = android.app.PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) f |= android.app.PendingIntent.FLAG_IMMUTABLE;
        return android.app.PendingIntent.getService(this, 300, i, f);
    }

    private void openScreen() {
        try {
            Intent i = new Intent(this, AzanActivity.class);
            i.putExtra("k", sessionInfo.optString("k"));
            i.putExtra("n", sessionInfo.optString("n"));
            i.putExtra("title", sessionInfo.optString("title"));
            i.putExtra("body", sessionInfo.optString("body"));
            i.putExtra("at", sessionInfo.optLong("at"));
            i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS);
            startActivity(i);
        } catch (Throwable ignored) { }
    }

    private void postPrayerNotification(JSONObject info) {
        boolean silent = info.optBoolean("audio", true);
        android.app.Notification n = Notifier.prayerNotification(this,
                info.optString("title"), info.optString("body"), info, !silent, stopPending());
        if (isDateEnabled()) {
            Notifier.show(this, Notifier.ID_ADHAN, n);
        } else {
            // اعلان اصلی سرویس همین است
            try { startForeground(Notifier.ID_ADHAN, n); } catch (Throwable ignored) { }
        }
    }

    private void tick() {
        if (isDateEnabled()) {
            String[] nx = AlarmScheduler.nextPrayer(this);
            String key = nx == null ? "" : nx[1] + ":" + nx[2];
            boolean stale = (System.currentTimeMillis() - lastNotifUpdate) > 15L * 60L * 1000L;
            if (!key.equals(cachedNext) || stale) {
                cachedNext = key;
                lastNotifUpdate = System.currentTimeMillis();
                try {
                    startForeground(Notifier.ID_DATE, Notifier.dateNotification(this, dateInfo()));
                } catch (Throwable ignored) { }
            }
        }
        if (!playing && !sessionActive && !isDateEnabled()) {
            stopSelf();
        }
    }

    /* ---------------- پخش صدای اذان ---------------- */
    private boolean play(String which) {
        stopAudio();
        String name = "azan".equals(which) ? "azan" : "soft";
        String[] exts = { ".mp3", ".ogg", ".wav" };
        for (int i = 0; i < exts.length; i++) {
            if (playAsset(name + exts[i])) return true;
        }
        playing = false;
        isPlaying = false;
        fallbackSound();
        return false;
    }

    private boolean playAsset(String file) {
        try {
            AssetFileDescriptor afd = getAssets().openFd("public/audio/" + file);
            MediaPlayer p = new MediaPlayer();
            if (Build.VERSION.SDK_INT >= 21) {
                p.setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build());
            }
            p.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            afd.close();
            p.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
                @Override
                public void onCompletion(MediaPlayer m) {
                    playing = false;
                    isPlaying = false;
                    sessionActive = false;
                    Notifier.cancel(AzanService.this, Notifier.ID_ADHAN);
                }
            });
            p.setOnErrorListener(new MediaPlayer.OnErrorListener() {
                @Override
                public boolean onError(MediaPlayer m, int what, int extra) {
                    playing = false;
                    isPlaying = false;
                    fallbackSound();
                    return true;
                }
            });
            p.prepare();
            p.start();
            mp = p;
            playing = true;
            isPlaying = true;
            return true;
        } catch (Throwable t) {
            playing = false;
            isPlaying = false;
            return false;
        }
    }

    /** اگر پخش نشد، اعلان با صدای خودش بیاید */
    private void fallbackSound() {
        if (sessionInfo == null) return;
        try {
            android.app.Notification n = Notifier.prayerNotification(this,
                    sessionInfo.optString("title"), sessionInfo.optString("body"), sessionInfo, true, stopPending());
            Notifier.show(this, Notifier.ID_ADHAN, n);
        } catch (Throwable ignored) { }
    }

    private void stopAudio() {
        if (mp != null) {
            try { if (mp.isPlaying()) mp.stop(); } catch (Throwable ignored) { }
            try { mp.release(); } catch (Throwable ignored) { }
            mp = null;
        }
        playing = false;
        isPlaying = false;
    }

    @Override
    public void onDestroy() {
        if (handler != null) handler.removeCallbacks(ticker);
        stopAudio();
        super.onDestroy();
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // با بسته‌شدن برنامه از فهرست کارها، اعلان دائمی باید بماند
        if (!isDateEnabled()) stopSelf();
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    public static void startDate(Context c) {
        try {
            Intent i = new Intent(c, AzanService.class);
            i.setAction(ACTION_START);
            if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(i);
            else c.startService(i);
        } catch (Throwable ignored) { }
    }

    public static void stop(Context c) {
        try {
            Intent i = new Intent(c, AzanService.class);
            i.setAction(ACTION_STOP_ALL);
            c.startService(i);
            c.stopService(i);
        } catch (Throwable ignored) { }
        Notifier.cancel(c, Notifier.ID_DATE);
        Notifier.cancel(c, Notifier.ID_ADHAN);
    }
}
