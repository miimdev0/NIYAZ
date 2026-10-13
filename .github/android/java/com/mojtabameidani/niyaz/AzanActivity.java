package com.mojtabameidani.niyaz;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * نیاز · صفحهٔ اذان (به‌جای اعلان ساده)
 * © Mojtaba Meidani — مجتبی میدانی
 *
 * در وقت نماز این صفحه روی قفل گوشی باز می‌شود: عنوان نماز، تاریخ شمسی/میلادی/قمری،
 * مناسبت امروز و دکمه‌های پخش/قطع اذان، ورود به نماز و بستن.
 */
public class AzanActivity extends Activity {

    private TextView clock;
    private Button playBtn;
    private Handler handler;
    private Typeface bold, normal;
    private long openedAt = 0L;
    private String k = "", n = "نماز";

    private final Runnable ticker = new Runnable() {
        @Override
        public void run() {
            updateClock();
            if (System.currentTimeMillis() - openedAt > 6L * 60L * 1000L) finishQuietly();
            else handler.postDelayed(this, 1000L);
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Intent it = getIntent();
        if (it != null) {
            k = it.getStringExtra("k") != null ? it.getStringExtra("k") : "";
            n = it.getStringExtra("n") != null ? it.getStringExtra("n") : "نماز";
        }
        openedAt = System.currentTimeMillis();
        handler = new Handler(Looper.getMainLooper());

        keyguard();
        try { bold = Typeface.createFromAsset(getAssets(), "public/fonts/Doran-Bold.ttf"); } catch (Throwable t) { bold = Typeface.DEFAULT_BOLD; }
        try { normal = Typeface.createFromAsset(getAssets(), "public/fonts/Doran.ttf"); } catch (Throwable t) { normal = Typeface.DEFAULT; }

        setContentView(build());
        updateClock();
        handler.postDelayed(ticker, 1000L);
    }

    private void keyguard() {
        try {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                    | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                    | WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                    | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);
            if (Build.VERSION.SDK_INT >= 27) {
                setShowWhenLocked(true);
                setTurnScreenOn(true);
                KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
                if (km != null && km.isKeyguardLocked()) km.requestDismissKeyguard(this, null);
            }
        } catch (Throwable ignored) { }
    }

    private static String fa(String s) {
        char[] fa = { '۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹' };
        StringBuilder b = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (ch >= '0' && ch <= '9') b.append(fa[ch - '0']);
            else b.append(ch);
        }
        return b.toString();
    }

    private int dp(float v) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics());
    }

    private TextView text(String s, float size, int color, boolean b) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(size);
        t.setTextColor(color);
        t.setTypeface(b ? bold : normal);
        t.setGravity(Gravity.CENTER);
        t.setTextAlignment(View.TEXT_ALIGNMENT_CENTER);
        t.setLineSpacing(dp(6), 1f);
        return t;
    }

    private View card() {
        LinearLayout c = new LinearLayout(this);
        c.setOrientation(LinearLayout.VERTICAL);
        c.setGravity(Gravity.CENTER_HORIZONTAL);
        c.setPadding(dp(18), dp(16), dp(18), dp(16));
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(0x99102A4A);
        bg.setCornerRadius(dp(24));
        bg.setStroke(dp(1), 0x33FFFFFF);
        c.setBackground(bg);
        return c;
    }

    private Button button(String label, int bg, int fg) {
        Button b = new Button(this);
        b.setText(label);
        b.setTypeface(bold);
        b.setTextSize(16);
        b.setTextColor(fg);
        b.setAllCaps(false);
        GradientDrawable g = new GradientDrawable();
        g.setColor(bg);
        g.setCornerRadius(dp(16));
        b.setBackground(g);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(52));
        lp.topMargin = dp(10);
        b.setLayoutParams(lp);
        return b;
    }

    private View build() {
        ScrollView scroll = new ScrollView(this);
        GradientDrawable bg = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                new int[] { 0xFF050B1F, 0xFF0C2A44, 0xFF123A55 });
        scroll.setBackground(bg);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER_HORIZONTAL);
        root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        root.setPadding(dp(18), dp(28), dp(18), dp(28));
        scroll.addView(root, new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        ImageView logo = new ImageView(this);
        try { logo.setImageDrawable(getPackageManager().getApplicationIcon(getPackageName())); } catch (Throwable ignored) { }
        LinearLayout.LayoutParams llp = new LinearLayout.LayoutParams(dp(78), dp(78));
        llp.bottomMargin = dp(10);
        root.addView(logo, llp);

        TextView brand = text("نیاز · همراه هوشمند نماز", 15, 0xFFF4C25B, true);
        root.addView(brand);

        clock = text("۰۰:۰۰", 46, 0xFFF4C25B, true);
        clock.setShadowLayer(16, 0, 0, 0x88F4C25B);
        root.addView(clock, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        LinearLayout body = (LinearLayout) card();
        LinearLayout.LayoutParams blp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        blp.topMargin = dp(14);
        root.addView(body, blp);

        body.addView(text("وقت اذان " + n, 26, Color.WHITE, true));

        JSONObject info = AlarmScheduler.readJson(this, AlarmScheduler.KEY_DATEINFO);
        if (info != null) {
            body.addView(text(info.optString("j", ""), 17, 0xFFFFE29A, false));
            body.addView(text(info.optString("h", ""), 15, 0xFFBFD3F0, false));
            body.addView(text(info.optString("g", ""), 13, 0xFF8FA6C8, false));
            String occ = info.optString("occ", "");
            if (occ.length() > 0) {
                TextView o = text("مناسبت امروز: " + occ, 13, 0xFF5FD3D0, false);
                o.setPadding(0, dp(8), 0, 0);
                body.addView(o);
            }
        }
        body.addView(text("گوشی را رها نکن؛ اذان پخش می‌شود و می‌توانی همین‌جا نماز را شروع کنی.", 12, 0xFF9FB4D8, false));

        playBtn = button("قطع اذان", 0x33FFFFFF, Color.WHITE);
        playBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (AzanService.isPlaying) {
                    send(AzanService.ACTION_STOP);
                } else {
                    Intent i = new Intent(AzanActivity.this, AzanService.class);
                    i.setAction(AzanService.ACTION_PLAY);
                    i.putExtra("k", k);
                    i.putExtra("n", n);
                    i.putExtra("title", "وقت اذان " + n);
                    i.putExtra("body", "اذان " + n);
                    i.putExtra("at", System.currentTimeMillis());
                    i.putExtra("sound", "azan");
                    i.putExtra("screen", false);
                    i.putExtra("audio", true);
                    i.putExtra("onlyIfSilent", true);
                    try {
                        if (Build.VERSION.SDK_INT >= 26) startForegroundService(i);
                        else startService(i);
                    } catch (Throwable ignored) { }
                }
                handler.postDelayed(new Runnable() { public void run() { refreshPlayBtn(); } }, 500L);
            }
        });
        root.addView(playBtn);

        Button pray = button("نماز می‌خوانم", 0xFFF4C25B, 0xFF1C1400);
        pray.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) { openApp("prayer"); }
        });
        root.addView(pray);

        Button txt = button("متن اذان و آموزش نماز", 0x33FFFFFF, Color.WHITE);
        txt.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) { openApp("azanText"); }
        });
        root.addView(txt);

        Button close = button("بستن", 0x22FFFFFF, 0xFFCFE0F5);
        close.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) { finishQuietly(); }
        });
        root.addView(close);

        return scroll;
    }

    private void refreshPlayBtn() {
        if (playBtn == null) return;
        playBtn.setText(AzanService.isPlaying ? "قطع اذان" : "پخش اذان");
    }

    private void send(String action) {
        try {
            Intent i = new Intent(this, AzanService.class);
            i.setAction(action);
            startService(i);
        } catch (Throwable ignored) { }
    }

    private void updateClock() {
        try {
            String t = new SimpleDateFormat("HH:mm", Locale.US).format(new Date());
            if (clock != null) clock.setText(fa(t));
            refreshPlayBtn();
        } catch (Throwable ignored) { }
    }

    private void openApp(String action) {
        try {
            Intent i = new Intent(this, MainActivity.class);
            i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            i.putExtra("niyazAction", "{\"action\":\"" + action + "\",\"k\":\"" + k + "\"}");
            startActivity(i);
        } catch (Throwable ignored) { }
        finishQuietly();
    }

    private void finishQuietly() {
        try {
            send(AzanService.ACTION_STOP);
        } catch (Throwable ignored) { }
        try { handler.removeCallbacks(ticker); } catch (Throwable ignored) { }
        finish();
    }

    @Override
    protected void onDestroy() {
        try { handler.removeCallbacks(ticker); } catch (Throwable ignored) { }
        super.onDestroy();
    }
}
