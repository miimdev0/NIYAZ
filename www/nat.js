/*  نیاز · پل بومی (اندروید)
    © Mojtaba Meidani — مجتبی میدانی
    اگر برنامه در مرورگر اجرا شود، همهٔ این توابع بی‌صدا و بی‌خطر برمی‌گردند. */
window.NZ = window.NZ || {};

NZ.nat = (function () {
  "use strict";

  function plugin() {
    try {
      if (window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform() && Capacitor.Plugins) {
        return Capacitor.Plugins.AlarmModule || null;
      }
    } catch (e) { }
    return null;
  }

  function call(method, args) {
    var p = plugin();
    if (!p || typeof p[method] !== "function") return Promise.resolve(null);
    try {
      return p[method](args || {}).catch(function () { return null; });
    } catch (e) {
      return Promise.resolve(null);
    }
  }

  return {
    has: function () { return !!plugin(); },
    native: function () {
      try { return !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()); } catch (e) { return false; }
    },
    ping: function () { return call("ping"); },
    setConfig: function (json) { return call("setConfig", { json: typeof json === "string" ? json : JSON.stringify(json) }); },
    push: function (o) { return call("push", o || {}); },
    requestNotif: function () { return call("requestNotif"); },
    testAlarm: function (mode) { return call("testAlarm", { mode: mode || "notif" }); },
    consumeAction: function () { return call("consumeAction"); },
    clear: function () { return call("clear"); },
    startDate: function () { return call("startDate"); },
    stopDate: function () { return call("stopDate"); },
    stopAdhan: function () { return call("stopAdhan"); },
    refreshWidget: function () { return call("refreshWidget"); },
    addWidget: function () { return call("addWidget"); },
    openExactSettings: function () { return call("openExactSettings"); },
    openFullScreenSettings: function () { return call("openFullScreenSettings"); },
    openBatterySettings: function () { return call("openBatterySettings"); },
    openAppSettings: function () { return call("openAppSettings"); },
    onAction: function (cb) {
      var p = plugin();
      if (!p || typeof p.addListener !== "function") return;
      try {
        p.addListener("action", function (d) {
          var raw = d && d.action ? d.action : "";
          var obj = null;
          try { obj = JSON.parse(raw); } catch (e) { obj = null; }
          cb(obj || { action: raw });
        });
      } catch (e) { }
    }
  };
})();
