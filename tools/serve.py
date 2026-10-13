#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
نیاز · سرور پیش‌نمایش وب (سریع و سبک)
© Mojtaba Meidani — مجتبی میدانی

این سرور فقط برای دیدن و آزمایش برنامه در مرورگر است (نصب برنامه ربطی به آن ندارد).
کارهایی که برای سرعت انجام می‌دهد:
  • فشرده‌سازی gzip/deflate برای HTML/CSS/JS/SVG  (حدود ۴ برابر کوچک‌تر)
  • اتصال پایدار HTTP/1.1 (keep-alive) — به‌جای ساختن یک اتصال برای هر فایل
  • ETag و کش هوشمند: فونت و صدا یک سال، متن‌ها با اعتبارسنجی (304)
  • پشتیبانی از Range برای فایل صوتی (جابه‌جایی در اذان)

اجرا:
    python3 tools/serve.py            # روی پورت ۸۰۸۰
    python3 tools/serve.py 8000       # روی پورت دلخواه
"""
import gzip
import io
import os
import re
import sys
import zlib
from email.utils import parsedate_to_datetime
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "www")

TEXT_TYPES = (
    "text/",
    "application/javascript",
    "application/json",
    "application/manifest+json",
    "image/svg+xml",
    "application/xml",
)
IMMUTABLE = (".woff2", ".woff", ".ttf", ".otf", ".mp3", ".ogg", ".wav", ".png", ".jpg", ".webp", ".ico")
COMPRESS_MIN = 1024          # زیر یک کیلوبایت فشرده‌کردن فایده ندارد
CHUNK = 64 * 1024


class FastHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"          # keep-alive
    server_version = "NiyazPreview/1.0"
    sys_version = ""

    # ---------- لاگ کوتاه ----------
    def log_message(self, fmt, *args):
        sys.stderr.write("  %s\n" % (fmt % args))

    # ---------- ابزارها ----------
    def _etag(self, path, st):
        return '"%x-%x"' % (int(st.st_mtime), st.st_size)

    def _compress(self, body, encoding):
        if encoding == "gzip":
            buf = io.BytesIO()
            with gzip.GzipFile(fileobj=buf, mode="wb", compresslevel=6, mtime=0) as g:
                g.write(body)
            return buf.getvalue()
        return zlib.compress(body, 6)

    def _send_headers(self, code, path, st, extra=None, ctype=None):
        self.send_response(code)
        self.send_header("Content-Type", ctype or self.guess_type(path))
        self.send_header("ETag", self._etag(path, st))
        self.send_header("Last-Modified", self.date_time_string(int(st.st_mtime)))
        self.send_header("X-Content-Type-Options", "nosniff")
        if path.endswith(IMMUTABLE):
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        else:
            self.send_header("Cache-Control", "no-cache")
        for k, v in (extra or {}).items():
            self.send_header(k, v)

    # ---------- GET / HEAD ----------
    def do_GET(self):
        self._serve(False)

    def do_HEAD(self):
        self._serve(True)

    def _serve(self, head_only):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            path = os.path.join(path, "index.html")
        if not os.path.isfile(path):
            self.send_error(HTTPStatus.NOT_FOUND, "File not found")
            return

        st = os.stat(path)
        etag = self._etag(path, st)
        inm = self.headers.get("If-None-Match")
        if inm and etag in inm:
            self.send_response(HTTPStatus.NOT_MODIFIED)
            self.send_header("ETag", etag)
            self.send_header("Cache-Control", "no-cache" if not path.endswith(IMMUTABLE) else "public, max-age=31536000, immutable")
            self.end_headers()
            return

        ctype = self.guess_type(path)
        size = st.st_size
        body = None
        want_body = (not head_only) or (ctype.startswith(TEXT_TYPES) and size >= COMPRESS_MIN)
        if want_body and size <= 3 * 1024 * 1024:
            with open(path, "rb") as fh:
                body = fh.read()

        # --- Range (برای پخش صدا) ---
        rng = self.headers.get("Range")
        if body is not None and rng:
            m = re.match(r"bytes=(\d*)-(\d*)$", rng.strip())
            if m:
                start = int(m.group(1)) if m.group(1) else 0
                end = int(m.group(2)) if m.group(2) else size - 1
                end = min(end, size - 1)
                if start <= end:
                    part = body[start:end + 1]
                    self.send_response(HTTPStatus.PARTIAL_CONTENT)
                    self.send_header("Content-Type", ctype)
                    self.send_header("Accept-Ranges", "bytes")
                    self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, size))
                    self.send_header("Content-Length", str(len(part)))
                    self.send_header("Cache-Control", "public, max-age=31536000, immutable" if path.endswith(IMMUTABLE) else "no-cache")
                    self.end_headers()
                    if not head_only:
                        self.wfile.write(part)
                    return
                self.send_error(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                return

        # --- فشرده‌سازی متن‌ها ---
        enc, payload = None, body if not head_only else None
        if body is not None and size >= COMPRESS_MIN and ctype.startswith(TEXT_TYPES):
            accept = self.headers.get("Accept-Encoding", "")
            if "gzip" in accept:
                payload, enc = self._compress(body, "gzip"), "gzip"
            elif "deflate" in accept:
                payload, enc = self._compress(body, "deflate"), "deflate"

        extra = {}
        if enc:
            extra["Content-Encoding"] = enc
            extra["Vary"] = "Accept-Encoding"
        length = len(payload) if payload is not None else size
        extra["Content-Length"] = str(length)
        if ctype == "text/html":
            extra["Cache-Control"] = "no-cache"

        self._send_headers(HTTPStatus.OK, path, st, extra, ctype)
        self.end_headers()
        if not head_only:
            if payload is not None:
                self.wfile.write(payload)
            else:
                with open(path, "rb") as fh:
                    while True:
                        chunk = fh.read(CHUNK)
                        if not chunk:
                            break
                        self.wfile.write(chunk)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    root = os.path.abspath(sys.argv[2] if len(sys.argv) > 2 else ROOT)
    handler = partial(FastHandler, directory=root)
    httpd = ThreadingHTTPServer(("0.0.0.0", port), handler)
    print("نیاز · پیش‌نمایش روی http://0.0.0.0:%d  (ریشه: %s)" % (port, root), flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
