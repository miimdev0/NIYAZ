package com.mojtabameidani.niyaz;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * نیاز · پس از روشن‌شدن گوشی، تغییر ساعت/منطقه و به‌روزرسانی برنامه
 * زمان‌بندی‌ها را بازمی‌سازد و سرویس اعلان دائمی را روشن می‌کند.
 * © Mojtaba Meidani — مجتبی میدانی
 */
public class BootReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context c, Intent intent) {
        try {
            AlarmScheduler.schedule(c);
            NiyazWidgetProvider.redraw(c);
            AzanService.startDate(c);
        } catch (Throwable ignored) { }
    }
}
